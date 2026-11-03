<?php
declare(strict_types=1);
defined('ABSPATH') || exit;

const BH_HELPER_ROLE = 'barncarehub_tester';
const BH_REQUESTS = 'barncarehub_pending_requests';
const BH_REVIEW_EMAIL = 'barncarehub_review_email';

function bh_staff_store(string $key, $value): void {
    if (!update_option($key, $value, false) && get_option($key) !== $value) {
        throw new RuntimeException('Could not save the access change.');
    }
}

// A site-specific lock serializes approvals, retries and rate limits without touching the barn snapshot.
function bh_staff_locked(callable $action) {
    global $wpdb;
    $lock = 'carehub-access-' . sha1(DB_NAME . ':' . $wpdb->prefix);
    if ((int)$wpdb->get_var($wpdb->prepare('SELECT GET_LOCK(%s, 3)', $lock)) !== 1) {
        throw new RuntimeException('Access management is busy.');
    }
    try {
        return $action();
    } finally {
        $wpdb->get_var($wpdb->prepare('SELECT RELEASE_LOCK(%s)', $lock));
    }
}

function bh_pending_requests(): array {
    $cutoff = time() - 30 * DAY_IN_SECONDS;
    return array_filter(get_option(BH_REQUESTS, []), fn($request) => $request['created'] >= $cutoff);
}

function bh_staff_role_is_safe(): bool {
    $role = get_role(BH_HELPER_ROLE);
    return $role && !empty($role->capabilities['barncarehub_edit'])
        && !array_diff(array_keys(array_filter($role->capabilities)), ['read','barncarehub_edit']);
}

function bh_only_helper($user): bool {
    return $user && (int)$user->ID !== get_current_user_id()
        && array_values($user->roles) === [BH_HELPER_ROLE]
        && !array_diff(array_keys(array_filter($user->caps)), [BH_HELPER_ROLE])
        && !is_super_admin($user->ID) && bh_staff_role_is_safe();
}

function bh_can_delete_login($user): bool {
    global $wpdb;
    if (!bh_only_helper($user) || is_multisite()) return false;
    // WP can delete a user's posts and links. Keep the website login if it owns any.
    $ownsContent = $wpdb->get_var($wpdb->prepare(
        "SELECT EXISTS(SELECT 1 FROM {$wpdb->posts} WHERE post_author = %d)
             OR EXISTS(SELECT 1 FROM {$wpdb->links} WHERE link_owner = %d)", $user->ID, $user->ID
    ));
    return (string)$ownsContent === '0';
}

function bh_staff_list(): array {
    $helpers = [];
    foreach (get_users(['role'=>BH_HELPER_ROLE, 'orderby'=>'display_name', 'order'=>'ASC']) as $user) {
        if (!bh_only_helper($user)) continue;
        $helpers[] = ['id'=>(int)$user->ID, 'name'=>$user->display_name, 'email'=>$user->user_email,
            'canDelete'=>bh_can_delete_login($user), 'canResend'=>(bool)get_user_meta($user->ID, 'barncarehub_application', true)];
    }
    return ['requests'=>array_values(bh_pending_requests()), 'helpers'=>$helpers,
        'reviewEmail'=>(string)get_option(BH_REVIEW_EMAIL, ''), 'myEmail'=>wp_get_current_user()->user_email,
        'nonce'=>wp_create_nonce('barncarehub')];
}

function bh_check_request_limit(): void {
    $window = intdiv(time(), HOUR_IN_SECONDS);
    $counts = get_option('barncarehub_request_limit', []);
    if (($counts['window'] ?? null) !== $window) $counts = ['window'=>$window,'total'=>0,'ips'=>[]];
    $ip = hash_hmac('sha256', $_SERVER['REMOTE_ADDR'] ?? 'unknown', wp_salt('nonce'));
    if ($counts['total'] >= 60 || ($counts['ips'][$ip] ?? 0) >= 8) {
        throw new InvalidArgumentException('Too many requests just now. Please try again in an hour.');
    }
    $counts['total']++;
    $counts['ips'][$ip] = ($counts['ips'][$ip] ?? 0) + 1;
    bh_staff_store('barncarehub_request_limit', $counts);
}

function bh_request_access(array $body): array {
    $name = is_string($body['name'] ?? null) ? trim(sanitize_text_field($body['name'])) : '';
    $email = is_string($body['email'] ?? null) ? strtolower(trim($body['email'])) : '';
    if ($name === '' || strlen($name) > 160 || strlen($email) > 100 || !is_email($email)) {
        throw new InvalidArgumentException('Enter your name and a valid email address.');
    }
    $notify = bh_staff_locked(function () use ($name, $email) {
        $recipient = (string)get_option(BH_REVIEW_EMAIL, '');
        if (!is_email($recipient)) throw new InvalidArgumentException('Access requests are closed. Please contact Karl or Lea.');
        bh_check_request_limit();
        $requests = bh_pending_requests();
        $existing = get_user_by('email', $email);
        if ($existing && (user_can($existing,'barncarehub_edit') || user_can($existing,'manage_options'))) return null;
        foreach ($requests as $request) if ($request['email'] === $email) return null;
        if (count($requests) >= 150) throw new InvalidArgumentException('Please contact Karl or Lea to request access.');
        $id = wp_generate_uuid4();
        $requests[$id] = ['id'=>$id,'name'=>$name,'email'=>$email,'created'=>time()];
        bh_staff_store(BH_REQUESTS, $requests);
        return $recipient;
    });
    if ($notify) {
        // A failed notification never loses the stored application. No request personal data or action tokens in this link.
        wp_mail($notify, 'CareHub helper access request', "A helper is waiting for your approval. Sign in to review their name and email:\n\n" . home_url('/carehub/administration/#staff-access'));
    }
    return ['ok'=>true];
}

function bh_send_setup($user): bool {
    $key = get_password_reset_key($user);
    if (is_wp_error($key)) return false;
    $url = network_site_url('wp-login.php', 'login') . '?action=rp&key=' . rawurlencode($key) . '&login=' . rawurlencode($user->user_login);
    return wp_mail($user->user_email, 'Your CareHub login is ready',
        "Karl or Lea approved your helper access to Dreamscape Ranch CareHub.\n\nChoose your private password:\n$url\n\nThen sign in with this email address at:\n" . home_url('/carehub/'));
}

function bh_review_request(string $choice, string $id): string {
    $requests = bh_pending_requests();
    if (!isset($requests[$id])) throw new InvalidArgumentException('This request has already been handled or expired. Refresh the list.');
    $request = $requests[$id];
    if ($choice === 'decline') {
        unset($requests[$id]);
        bh_staff_store(BH_REQUESTS, $requests);
        return 'Request declined.';
    }
    if (!bh_staff_role_is_safe()) throw new RuntimeException('The helper role is unavailable.');
    $user = get_user_by('email', $request['email']);
    if ($user && (!bh_only_helper($user) || get_user_meta($user->ID, 'barncarehub_application', true) !== $id)) {
        throw new InvalidArgumentException('This email already belongs to another website login. Ask the helper to sign in with an existing CareHub login or apply with a different email.');
    }
    if (!$user) {
        $userId = wp_insert_user([
            'user_login'=>'helper-' . wp_generate_uuid4(), 'user_pass'=>wp_generate_password(48, true, true),
            'user_email'=>$request['email'], 'display_name'=>$request['name'], 'nickname'=>$request['name'],
            'role'=>BH_HELPER_ROLE, 'meta_input'=>['barncarehub_application'=>$id],
        ]);
        if (is_wp_error($userId)) throw new InvalidArgumentException('The login could not be created. Refresh and review this request again.');
        $user = get_userdata($userId);
    }
    unset($requests[$id]);
    bh_staff_store(BH_REQUESTS, $requests);
    return bh_send_setup($user) ? 'Approved. A password setup email was sent.' : 'Approved. The setup email could not be sent. Use Send setup email below to try again.';
}

function bh_change_staff(array $body): string {
    $choice = $body['choice'] ?? '';
    if ($choice === 'set-review-email') {
        $address = is_string($body['email'] ?? null) ? trim($body['email']) : '';
        if (strlen($address) > 254 || !is_email($address)) throw new InvalidArgumentException('Enter a valid address for request alerts.');
        if (($body['beforeEmail'] ?? null) !== (string)get_option(BH_REVIEW_EMAIL, '')) {
            throw new InvalidArgumentException('The alert email has changed. Refresh the list first.');
        }
        bh_staff_store(BH_REVIEW_EMAIL, $address);
        return 'Access requests are open. New request alerts will go to ' . $address . '.';
    }
    if ($choice === 'approve' || $choice === 'decline') {
        return bh_review_request($choice, (string)($body['requestId'] ?? ''));
    }
    if (!in_array($choice, ['delete','revoke','resend'], true) || !is_int($body['userId'] ?? null)) {
        throw new InvalidArgumentException('Choose a helper from the list.');
    }
    $user = get_userdata($body['userId']);
    if (!bh_only_helper($user) || $user->user_email !== ($body['email'] ?? '')) {
        throw new InvalidArgumentException('This login cannot be managed here. Refresh the list.');
    }
    if ($choice === 'resend') {
        if (!get_user_meta($user->ID, 'barncarehub_application', true)) throw new InvalidArgumentException('Use the password reset link on the sign-in screen.');
        return bh_send_setup($user) ? 'Password setup email sent.' : 'The setup email could not be sent. Try again later.';
    }
    if ($choice === 'delete' && !bh_can_delete_login($user)) throw new InvalidArgumentException('This account also belongs to the website. Use Remove access.');
    // The barn audit uses immutable user IDs. Retain a display-name lookup after deleting credentials.
    bh_staff_store('barncarehub_former_helper_' . $user->ID, $user->display_name);
    if ($choice === 'revoke') {
        $user->remove_role(BH_HELPER_ROLE);
        if (user_can($user, 'barncarehub_edit')) throw new RuntimeException('Access removal failed.');
        if (!is_multisite()) WP_Session_Tokens::get_instance($user->ID)->destroy_all();
        return 'CareHub access removed. Past barn records are kept.';
    }
    require_once ABSPATH . 'wp-admin/includes/user.php';
    WP_Session_Tokens::get_instance($user->ID)->destroy_all();
    if (!wp_delete_user($user->ID, get_current_user_id())) throw new RuntimeException('Login deletion failed.');
    return 'Helper login deleted. Past barn records are kept.';
}

function bh_staff_dispatch(string $action, string $method): never {
    if ($action !== 'request-access' && !bh_admin()) bh_reply(['error'=>'Only a barn administrator can manage helper access.'], 403);
    if ($action === 'staff-list' && $method === 'GET') bh_reply(bh_staff_list());
    if ($method !== 'POST' || $action === 'staff-list') bh_reply(['error'=>'Method not allowed.'], 405);
    $raw = file_get_contents('php://input', false, null, 0, 4097);
    if (strlen($raw) > 4096) bh_reply(['error'=>'Request too large.'], 413);
    $body = json_decode($raw, true, 8, JSON_THROW_ON_ERROR);
    if (!is_array($body)) throw new InvalidArgumentException('Invalid access request.');
    if ($action === 'request-access') bh_reply(bh_request_access($body));
    $message = bh_staff_locked(fn() => bh_change_staff($body));
    bh_reply(['message'=>$message] + bh_staff_list());
}
