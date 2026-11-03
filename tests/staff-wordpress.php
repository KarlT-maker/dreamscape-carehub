<?php
// CLI only, against the disposable CI installation. Never packaged with CareHub.
if (PHP_SAPI !== 'cli' || getenv('GITHUB_ACTIONS') !== 'true') exit(2);
$root = getenv('RUNNER_TEMP') . '/wordpress';
if ($argv[1] === 'install') define('WP_INSTALLING', true);
require $root . '/wp-load.php';
if (DB_NAME !== 'carehub_access_test' || WP_HOME !== 'http://127.0.0.1:19134') exit(2);

function test_cookie(int $id): string {
    $expires = time() + 1800;
    $token = WP_Session_Tokens::get_instance($id)->create($expires);
    return LOGGED_IN_COOKIE . '=' . wp_generate_auth_cookie($id,$expires,'logged_in',$token);
}
if ($argv[1] === 'install') {
    require_once ABSPATH . 'wp-admin/includes/upgrade.php';
    $installation = wp_install('Test ranch','site-owner','site@example.invalid',false,'',wp_generate_password());
    add_role('barncarehub_admin','Barn owner',['read'=>true,'barncarehub_admin'=>true,'barncarehub_edit'=>true]);
    add_role('barncarehub_tester','Helper',['read'=>true,'barncarehub_edit'=>true]);
    $create = fn($name,$role) => wp_insert_user(['user_login'=>$name,'display_name'=>$name,'user_email'=>$name.'@example.invalid','user_pass'=>wp_generate_password(),'role'=>$role]);
    $owner = $create('barn-owner','barncarehub_admin');
    $otherOwner = $create('second-owner','barncarehub_admin');
    $legacy = $create('legacy-helper','barncarehub_tester');
    $mixed = $create('mixed-account','barncarehub_tester');
    (new WP_User($mixed))->add_role('editor');
    $contentOwner = $create('website-author','barncarehub_tester');
    wp_insert_post(['post_title'=>'Existing website content','post_status'=>'publish','post_author'=>$contentOwner]);
    echo wp_json_encode(['site'=>test_cookie($installation['user_id']), 'owner'=>test_cookie($owner),
        'other'=>test_cookie($otherOwner),'legacy'=>test_cookie($legacy),'ownerId'=>$owner,'mixedId'=>$mixed]);
} else {
    $input = json_decode(stream_get_contents(STDIN),true);
    if ($argv[1] === 'set-password') {
        $user = check_password_reset_key($input['key'],$input['login']);
        if (is_wp_error($user)) exit(3);
        reset_password($user,$input['password']);
    }
    $user = wp_authenticate($input['email'],$input['password']);
    echo wp_json_encode(is_wp_error($user) ? ['allowed'=>false] : ['allowed'=>true,'cookie'=>test_cookie($user->ID)]);
}
