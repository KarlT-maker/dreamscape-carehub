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
check('task data remains unchanged while check-offs are hidden', function() use ($s) { $next=$s; $next['data']['tasks'][]=['id'=>'test']; rejects(fn()=>bh_authorize_change($s,$next,false,false)); });
check('administrators can explicitly restore an empty backup', function() use ($s) { $next=$s; $next['data']['horses']=[]; bh_authorize_change($s,bh_validate($next),true,true); });
check('scheduled care can be cancelled before it starts', function() use ($s) { $s['data']['care'][]=['id'=>'c1','horseId'=>'h1','name'=>'Test feed','kind'=>'feed','quantity'=>'1 scoop','schedule'=>'AM','instructions'=>'','effectiveStart'=>'2026-10-27','effectiveEnd'=>'2026-10-26']; bh_validate($s); });
check('malformed completion values rejected', function() use ($s) { $s['completions']=(object)['task'=>(object)['completedBy'=>[],'completedAt'=>'now']]; rejects(fn()=>bh_validate($s)); });
check('malformed JSON rejected', function() { rejects(fn()=>bh_decode('{broken')); });
$plan=$s;
$plan['data']['helpers'][]=['id'=>'helper1','name'=>'Test helper','initials'=>'TH'];
$plan['data']['events'][]=['id'=>'event1','horseId'=>'h1','date'=>'2026-10-27','time'=>'12:30','type'=>'Farrier','provider'=>'Test provider','reason'=>'Trim','notes'=>''];
$plan['data']['history'][]=['id'=>'history1','horseId'=>'h1','date'=>'2026-10-26','type'=>'Vet','provider'=>'Test vet','title'=>'Visit','detail'=>'Test record','author'=>'Helper'];
$plan['data']['shifts'][]=['id'=>'shift1','date'=>'2026-10-27','paddock'=>'Test field','period'=>'Lunch','helperId'=>'helper1'];
$plan['data']['daysOff'][]=['id'=>'off1','date'=>'2026-10-28','helperId'=>'helper1','note'=>''];
check('testers can add valid planning and history records', function() use ($s,$plan) { bh_authorize_change($s,bh_validate($plan),false,false); });
check('existing planning records cannot be deleted', function() use ($plan) { foreach (['events','history','helpers','shifts','daysOff'] as $section) { $next=$plan; $next['data'][$section]=[]; rejects(fn()=>bh_authorize_change($plan,$next,false,false)); } });
check('duplicate active assignments rejected', function() use ($plan) { $next=$plan; $next['data']['shifts'][]=[...$next['data']['shifts'][0],'id'=>'shift2']; rejects(fn()=>bh_authorize_change($plan,bh_validate($next),false,false)); });
check('multiple helpers can share a paddock and each can cover other paddocks', function() use ($plan) { $next=$plan; $next['data']['helpers'][]=['id'=>'helper2','name'=>'Second helper','initials'=>'SH']; $next['data']['shifts'][]=[...$next['data']['shifts'][0],'id'=>'shift2','helperId'=>'helper2']; $next['data']['shifts'][]=[...$next['data']['shifts'][0],'id'=>'shift3','paddock'=>'Other field']; bh_authorize_change($plan,bh_validate($next),false,false); $removed=$next; $removed['data']['shifts'][0]['cancelled']=true; bh_authorize_change($next,bh_validate($removed),false,false); bh_require($removed['data']['shifts'][1]===$next['data']['shifts'][1]); });
check('duplicate active days off rejected', function() use ($plan) { $next=$plan; $next['data']['daysOff'][]=[...$next['data']['daysOff'][0],'id'=>'off2']; rejects(fn()=>bh_authorize_change($plan,bh_validate($next),false,false)); });
check('cancellation preserves records and frees the assignment', function() use ($plan) { $next=$plan; $next['data']['shifts'][0]['cancelled']=true; $next['data']['shifts'][]=[...$plan['data']['shifts'][0],'id'=>'shift2']; bh_authorize_change($plan,bh_validate($next),false,false); });
check('invalid appointment time and type rejected', function() use ($plan) { $next=$plan; $next['data']['events'][0]['time']='25:00'; rejects(fn()=>bh_validate($next)); $next=$plan; $next['data']['events'][0]['type']='Invalid'; rejects(fn()=>bh_validate($next)); });
check('invalid cancellation and history type rejected', function() use ($plan) { $next=$plan; $next['data']['events'][0]['cancelled']='false'; rejects(fn()=>bh_validate($next)); $next=$plan; $next['data']['history'][0]['type']='Invalid'; rejects(fn()=>bh_validate($next)); });
check('all seven feeding schedules are accepted', function() use ($s) { foreach (['AM','Lunch','PM','AM & PM','AM & Lunch','Lunch & PM','AM & Lunch & PM'] as $schedule) { $s['data']['care']=[['id'=>'c1','horseId'=>'h1','name'=>'Feed','kind'=>'feed','quantity'=>'1 scoop','schedule'=>$schedule,'instructions'=>'','effectiveStart'=>'2026-10-27']]; bh_validate($s); } });
echo "$count server validation checks passed\n";
