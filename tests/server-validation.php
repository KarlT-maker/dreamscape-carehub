<?php
require dirname(__DIR__).'/server/validation.php';
$horse = ['id'=>'h1','name'=>'Test horse','location'=>'Test field','status'=>'Active','sex'=>'','breed'=>'','colour'=>'','birthDate'=>'','arrivalDate'=>'','owner'=>['id'=>'o1','name'=>''],'specialInstructions'=>''];
$s = ['schema'=>1,'revision'=>1,'savedAt'=>'','mode'=>'roster','data'=>['horses'=>[$horse],'care'=>[],'tasks'=>[],'events'=>[],'history'=>[],'helpers'=>[],'shifts'=>[],'daysOff'=>[]],'completions'=>(object)[]];
$count=0;
function check($name, callable $fn): void { global $count; $fn(); $count++; echo "ok $count - $name\n"; }
function rejects(callable $fn): void { try { $fn(); } catch (InvalidArgumentException | JsonException $e) { return; } throw new Exception('Expected rejection'); }
check('blank details and JSON object completion map survive a round trip', function() use ($s) { bh_require(bh_decode(json_encode($s)) == $s); });
check('duplicate horses rejected', function() use ($s,$horse) { $s['data']['horses'][]=$horse; rejects(fn()=>bh_validate($s)); });
check('invalid date rejected', function() use ($s) { $s['data']['horses'][0]['birthDate']='2026-02-30'; rejects(fn()=>bh_validate($s)); });
check('orphan care rejected', function() use ($s) { $s['data']['care'][]=['id'=>'c1','horseId'=>'missing']; rejects(fn()=>bh_validate($s)); });
check('invalid record type rejected', function() use ($s) { $s['data']['horses'][0]['name']=[]; rejects(fn()=>bh_validate($s)); });
check('oversized fields rejected', function() use ($s) { $s['data']['horses'][0]['name']=str_repeat('x',10001); rejects(fn()=>bh_validate($s)); });
check('testers can edit a horse', function() use ($s) { $next=$s; $next['data']['horses'][0]['name']='Changed'; bh_authorize_change($s,bh_validate($next),false,false); });
check('testers cannot replace records', function() use ($s) { rejects(fn()=>bh_authorize_change($s,$s,false,true)); });
check('testers cannot remove horses through a normal save', function() use ($s) { $next=$s; $next['data']['horses']=[]; rejects(fn()=>bh_authorize_change($s,$next,false,false)); });
check('testers cannot alter unimplemented sections', function() use ($s) { $next=$s; $next['data']['helpers'][]=['id'=>'test','name'=>'test','initials'=>'T']; rejects(fn()=>bh_authorize_change($s,$next,false,false)); });
check('administrators can explicitly restore an empty backup', function() use ($s) { $next=$s; $next['data']['horses']=[]; bh_authorize_change($s,bh_validate($next),true,true); });
check('scheduled care can be cancelled before it starts', function() use ($s) { $s['data']['care'][]=['id'=>'c1','horseId'=>'h1','name'=>'Test feed','kind'=>'feed','quantity'=>'1 scoop','schedule'=>'AM','instructions'=>'','effectiveStart'=>'2026-10-27','effectiveEnd'=>'2026-10-26']; bh_validate($s); });
check('malformed completion values rejected', function() use ($s) { $s['completions']=(object)['task'=>(object)['completedBy'=>[],'completedAt'=>'now']]; rejects(fn()=>bh_validate($s)); });
check('malformed JSON rejected', function() { rejects(fn()=>bh_decode('{broken')); });
echo "$count server validation checks passed\n";
