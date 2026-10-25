<?php
declare(strict_types=1);
// Installed as /carehub/api/index.php beside the existing WordPress website.
define('DONOTCACHEPAGE', true);
define('WP_USE_THEMES', false);
require dirname(__DIR__, 2) . '/wp-load.php';
require __DIR__ . '/validation.php';
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: private, no-store, max-age=0');
header('X-Content-Type-Options: nosniff');
header('X-Robots-Tag: noindex, nofollow');
function bh_reply(array $value, int $status = 200): never { http_response_code($status); echo wp_json_encode($value); exit; }
function bh_user(): array {
    $u = wp_get_current_user();
    return ['name'=>$u->display_name, 'admin'=>current_user_can('manage_options')];
}
function bh_allowed(): bool { return current_user_can('manage_options') || current_user_can('barncarehub_edit'); }
global $wpdb;
$wpdb->suppress_errors(true);
$table = $wpdb->prefix . 'barncarehub_workspace';
$audit = $wpdb->prefix . 'barncarehub_revisions';
$method = $_SERVER['REQUEST_METHOD'];
$action = (string)($_GET['action'] ?? 'session');
$ready = (bool)get_option('barncarehub_installed_v1', false);
$login = wp_login_url(home_url('/carehub/'));
if (!in_array($method, ['GET','POST'], true)) bh_reply(['error'=>'Method not allowed.'], 405);
if ($method === 'GET' && $action === 'session') {
    bh_reply(['user'=>bh_allowed() ? bh_user() : null, 'nonce'=>bh_allowed() ? wp_create_nonce('barncarehub') : null, 'ready'=>$ready, 'loginUrl'=>$login]);
}
if (!bh_allowed()) bh_reply(['error'=>'Please sign in with a BarnCareHub account.', 'loginUrl'=>$login], 401);
if ($method === 'POST') {
    $expectedOrigin = (is_ssl() ? 'https' : 'http') . '://' . ($_SERVER['HTTP_HOST'] ?? '');
    if (($_SERVER['HTTP_ORIGIN'] ?? '') !== $expectedOrigin || !wp_verify_nonce($_SERVER['HTTP_X_BARN_NONCE'] ?? '', 'barncarehub')) bh_reply(['error'=>'Your sign-in needs refreshing. Reload before saving.'], 403);
    if (!str_starts_with($_SERVER['CONTENT_TYPE'] ?? '', 'application/json')) bh_reply(['error'=>'JSON required.'], 415);
    if ((int)($_SERVER['CONTENT_LENGTH'] ?? 0) > 10000000) bh_reply(['error'=>'This backup is too large.'], 413);
}
function bh_db_ok($value): void { if ($value === false) throw new RuntimeException('The online store could not complete this save. Please try again.'); }
function bh_current(string $table, bool $lock = false): ?array {
    global $wpdb;
    $row = $wpdb->get_row("SELECT snapshot, undo_snapshot FROM `$table` WHERE id=1" . ($lock ? ' FOR UPDATE' : ''), ARRAY_A);
    if (!$row) return null;
    return ['snapshot'=>bh_decode($row['snapshot']), 'canUndoReset'=>!empty($row['undo_snapshot']), 'undo'=>$row['undo_snapshot']];
}
function bh_public(array $row): array { unset($row['undo']); return $row; }
try {
    if ($method === 'POST' && $action === 'initialize') {
        if (!current_user_can('manage_options')) bh_reply(['error'=>'An administrator must open the shared beta first.'], 403);
        if (!$ready) {
            $charset = $wpdb->get_charset_collate();
            bh_db_ok($wpdb->query("CREATE TABLE IF NOT EXISTS `$table` (id tinyint unsigned NOT NULL PRIMARY KEY, snapshot longtext NOT NULL, undo_snapshot longtext NULL) ENGINE=InnoDB $charset"));
            bh_db_ok($wpdb->query("CREATE TABLE IF NOT EXISTS `$audit` (revision bigint unsigned NOT NULL PRIMARY KEY, request_id varchar(80) NOT NULL UNIQUE, user_id bigint unsigned NOT NULL, action varchar(20) NOT NULL, saved_at datetime NOT NULL, snapshot longtext NOT NULL, payload_hash varchar(64) NOT NULL) ENGINE=InnoDB $charset"));
            $seed = bh_decode(file_get_contents(__DIR__.'/seed.json'));
            $seed['revision'] = 1; $seed['savedAt'] = gmdate('c');
            bh_db_ok($wpdb->query($wpdb->prepare("INSERT IGNORE INTO `$table` (id,snapshot) VALUES (1,%s)", wp_json_encode($seed))));
            add_role('barncarehub_tester', 'BarnCareHub tester', ['read'=>true, 'barncarehub_edit'=>true]);
            update_option('barncarehub_installed_v1', 1, false);
        }
        bh_reply(bh_public(bh_current($table)));
    }
    if (!$ready) bh_reply(['error'=>'The shared beta needs its first administrator setup.'], 503);
    if ($method === 'GET' && $action === 'workspace') bh_reply(bh_public(bh_current($table)));
    if ($method !== 'POST' || !in_array($action, ['save','replace','undo','logout'], true)) bh_reply(['error'=>'Unknown action.'], 404);
    if ($action === 'logout') { wp_logout(); bh_reply(['ok'=>true]); }
    $raw = file_get_contents('php://input', false, null, 0, 10000001);
    if (strlen($raw) > 10000000) bh_reply(['error'=>'This backup is too large.'], 413);
    $body = json_decode($raw, true, 64, JSON_THROW_ON_ERROR);
    bh_require(is_array($body) && is_int($body['revision'] ?? null));
    bh_require(is_string($body['requestId'] ?? null) && preg_match('/^[a-zA-Z0-9-]{20,80}$/D', $body['requestId']) === 1);
    $admin = current_user_can('manage_options');
    if ($action !== 'save' && !$admin) bh_reply(['error'=>'Only the barn administrator can replace the shared records.'], 403);
    $hash = hash('sha256', $action . $raw);
    bh_db_ok($wpdb->query('START TRANSACTION'));
    $row = bh_current($table, true);
    if (!$row) throw new RuntimeException('The shared workspace could not be opened.');
    $prior = $wpdb->get_row($wpdb->prepare("SELECT user_id,payload_hash FROM `$audit` WHERE request_id=%s", $body['requestId']), ARRAY_A);
    if ($prior) {
        if ((int)$prior['user_id'] !== get_current_user_id() || $prior['payload_hash'] !== $hash) throw new InvalidArgumentException('This save request has already been used.');
        bh_db_ok($wpdb->query('COMMIT')); bh_reply(bh_public($row));
    }
    $old = $row['snapshot'];
    if ($body['revision'] !== $old['revision']) { $wpdb->query('ROLLBACK'); bh_reply(['error'=>'Someone saved another change. The latest records are now shown. Review them before trying again.'] + bh_public($row), 409); }
    if ($action === 'undo') {
        if (!$row['undo']) throw new InvalidArgumentException('There is no previous reset to undo.');
        $next = bh_decode($row['undo']);
    } else $next = bh_decode(wp_json_encode(json_decode($raw, false, 64, JSON_THROW_ON_ERROR)->snapshot ?? null));
    bh_authorize_change($old, $next, $admin, $action !== 'save');
    $next['revision'] = $old['revision'] + 1; $next['savedAt'] = gmdate('c');
    if ($action === 'save') foreach ($next['completions'] as $id=>$completion) {
        if (!isset($old['completions']->$id) || $old['completions']->$id != $completion) {
            $completion->completedBy = wp_get_current_user()->display_name; $completion->completedAt = gmdate('c');
        }
    }
    $undo = $action === 'save' ? $row['undo'] : wp_json_encode($old);
    bh_db_ok($wpdb->insert($audit, ['revision'=>$next['revision'], 'request_id'=>$body['requestId'], 'user_id'=>get_current_user_id(), 'action'=>$action, 'saved_at'=>gmdate('Y-m-d H:i:s'), 'snapshot'=>wp_json_encode($old), 'payload_hash'=>$hash]));
    bh_db_ok($wpdb->update($table, ['snapshot'=>wp_json_encode($next),'undo_snapshot'=>$undo], ['id'=>1]));
    bh_db_ok($wpdb->query('COMMIT'));
    bh_reply(['snapshot'=>$next,'canUndoReset'=>!empty($undo)]);
} catch (InvalidArgumentException | JsonException $e) { $wpdb->query('ROLLBACK'); bh_reply(['error'=>$e->getMessage()], 422); }
catch (Throwable $e) { $wpdb->query('ROLLBACK'); error_log('BarnCareHub: '.$e->getMessage()); bh_reply(['error'=>'The online store could not complete this request. Your last saved records are kept. Please try again.'], 500); }
