<?php
// Local HTTP integration fixture only. Never copied into a deployment.
define('ARRAY_A', 'ARRAY_A');
class TestDatabase {
    public string $prefix = 'test_';
    public PDO $db;
    function __construct() {
        $this->db = new PDO('sqlite:'.__DIR__.'/test.sqlite');
        $this->db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $this->db->exec('CREATE TABLE IF NOT EXISTS test_barncarehub_workspace (id INTEGER PRIMARY KEY, snapshot TEXT, undo_snapshot TEXT)');
        $this->db->exec('CREATE TABLE IF NOT EXISTS test_barncarehub_revisions (revision INTEGER PRIMARY KEY,request_id TEXT UNIQUE,user_id INTEGER,action TEXT,saved_at TEXT,snapshot TEXT,payload_hash TEXT)');
        $this->db->exec('CREATE TABLE IF NOT EXISTS options (name TEXT PRIMARY KEY,value TEXT)');
    }
    function suppress_errors($v) {}
    function get_charset_collate() {return '';}
    function prepare($sql,...$values) {
        foreach ($values as $value) $sql=preg_replace('/%s/',str_replace('$','\\$', $this->db->quote((string)$value)),$sql,1);
        return $sql;
    }
    function query($sql) {
        if (str_starts_with($sql,'CREATE TABLE')) return 0;
        if ($sql==='START TRANSACTION') { $this->db->exec('BEGIN IMMEDIATE'); return 1; }
        if ($sql==='COMMIT') {$this->db->exec('COMMIT'); return 1;}
        if ($sql==='ROLLBACK') {try{$this->db->exec('ROLLBACK');}catch(Throwable $e){} return 1;}
        return $this->db->exec(str_replace('INSERT IGNORE','INSERT OR IGNORE',$sql));
    }
    function get_row($sql,$mode) {return $this->db->query(str_replace(' FOR UPDATE','',$sql))->fetch(PDO::FETCH_ASSOC) ?: null;}
    function insert($table,$values) {
        $q=$this->db->prepare('INSERT INTO '.$table.' ('.implode(',',array_keys($values)).') VALUES ('.implode(',',array_fill(0,count($values),'?')).')'); return $q->execute(array_values($values));
    }
    function update($table,$values,$where) {
        $q=$this->db->prepare('UPDATE '.$table.' SET '.implode(',',array_map(fn($k)=>$k.'=?',array_keys($values))).' WHERE id=?'); return $q->execute([...array_values($values),$where['id']]);
    }
}
$wpdb = new TestDatabase;
function wp_json_encode($v) {return json_encode($v, JSON_THROW_ON_ERROR);}
function get_option($name,$default=false) {global $wpdb; $q=$wpdb->db->prepare('SELECT value FROM options WHERE name=?');$q->execute([$name]);return $q->fetchColumn() ?: $default;}
function update_option($name,$value,$autoload=false) {global $wpdb; $q=$wpdb->db->prepare('INSERT OR REPLACE INTO options VALUES (?,?)');$q->execute([$name,$value]);}
function add_role($name,$label,$caps) {update_option($name,json_encode($caps));}
function get_role($name) { $caps=get_option($name); return $caps ? (object)['capabilities'=>json_decode($caps,true)] : null; }
function current_user_can($cap) { $role=$_SERVER['HTTP_X_TEST_ROLE'] ?? 'none'; if($role==='admin')return true; $caps=get_role($role==='owner' ? 'barncarehub_admin' : 'barncarehub_tester')?->capabilities ?? ['barncarehub_edit'=>true]; return in_array($role,['owner','tester'],true) && !empty($caps[$cap]); }
function wp_get_current_user() { return (object)['display_name'=>($_SERVER['HTTP_X_TEST_ROLE'] ?? '')==='tester' ? 'Test helper' : 'Test owner']; }
function get_current_user_id() {return match($_SERVER['HTTP_X_TEST_ROLE'] ?? '') {'tester'=>2, 'owner'=>3, default=>1};}
function wp_create_nonce($action) {return 'test-only-nonce';}
function wp_verify_nonce($v,$action) {return $v==='test-only-nonce';}
function wp_login_url($redirect) {return '/local-test-login';}
function home_url($path='') {return 'http://127.0.0.1:19131'.$path;}
function is_ssl() {return false;}
function wp_logout() {}
