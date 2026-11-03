import assert from 'node:assert/strict';
import {spawn, execFileSync} from 'node:child_process';
import {randomBytes} from 'node:crypto';
import {cpSync, existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {join, resolve} from 'node:path';
import {emptySnapshot} from '../src/lib/data/workspace.ts';

const temp = process.env.RUNNER_TEMP;
assert.ok(temp && process.env.GITHUB_ACTIONS === 'true', 'Use an isolated CI runner');
const wp = join(temp, 'wordpress');
assert.ok(!existsSync(join(wp,'wp-config.php')), 'Requires a fresh disposable WordPress directory');
const host = 'http://127.0.0.1:19134';
const mailFile = join(temp,'carehub-intercepted-mail.jsonl');
const phpString = value => "'" + value.replaceAll('\\','\\\\').replaceAll("'","\\'") + "'";
const config = {DB_NAME:'carehub_access_test',DB_USER:'root',DB_PASSWORD:'root',DB_HOST:'127.0.0.1',
  WP_HOME:host,WP_SITEURL:host,WP_ENVIRONMENT_TYPE:'local',WP_HTTP_BLOCK_EXTERNAL:true,DISABLE_WP_CRON:true};
for (const key of ['AUTH_KEY','SECURE_AUTH_KEY','LOGGED_IN_KEY','NONCE_KEY','AUTH_SALT','SECURE_AUTH_SALT','LOGGED_IN_SALT','NONCE_SALT']) config[key] = randomBytes(36).toString('hex');
writeFileSync(join(wp,'wp-config.php'), ['<?php', ...Object.entries(config).map(([key,value])=>
  'define('+phpString(key)+','+(value === true ? 'true' : phpString(value))+');'),
  "$table_prefix='auth_test_';","if (!defined('ABSPATH')) define('ABSPATH',__DIR__.'/');","require ABSPATH.'wp-settings.php';"].join('\n'));
mkdirSync(join(wp,'wp-content/mu-plugins'),{recursive:true});
writeFileSync(join(wp,'wp-content/mu-plugins/intercept-test-mail.php'),"<?php\nadd_filter('pre_wp_mail', function($unused,$mail) { file_put_contents("+phpString(mailFile)+",json_encode($mail).PHP_EOL, FILE_APPEND | LOCK_EX); return true; },10,2);");
const api = join(wp,'carehub/api');
cpSync(resolve('server'),api,{recursive:true});
const seed = emptySnapshot();
seed.data.horses.push({id:'test-horse',name:'Test horse',location:'Test field',status:'Active',breed:'',sex:'',colour:'',birthDate:'',arrivalDate:'',owner:{id:'owner',name:''},specialInstructions:''});
writeFileSync(join(api,'seed.json'),JSON.stringify(seed));
const core = (action, input={}) => JSON.parse(execFileSync('php',['tests/staff-wordpress.php',action],{input:JSON.stringify(input),encoding:'utf8'}));
const accounts = core('install');
const server = spawn('php',['-S','127.0.0.1:19134','-t',wp],{stdio:'ignore'});
const messages = () => readFileSync(mailFile,'utf8').trim().split('\n').filter(Boolean).map(line=>JSON.parse(line));
const relevantMail = subject => messages().filter(mail=>mail.subject===subject);
async function call(action,cookie='',body,nonce='',origin=host) {
  const response = await fetch(host+'/carehub/api/index.php?action='+action,{
    method:body === undefined ? 'GET' : 'POST',
    headers:{Cookie:cookie,Origin:origin,'Content-Type':'application/json','X-Barn-Nonce':nonce},
    body:body===undefined ? undefined : JSON.stringify(body)
  });
  return {status:response.status, data:await response.json()};
}
function ok(result) {
  assert.equal(result.status,200, result.data.error);
  return result.data;
}
try {
  for (let i=0;i<40;i++) {try {await call('session');break;} catch {await new Promise(r=>setTimeout(r,100));}}
  const session = async cookie => ok(await call('session',cookie));
  const site = await session(accounts.site);
  ok(await call('initialize',accounts.site,{},site.nonce));
  const owner = await session(accounts.owner);
  const other = await session(accounts.other);
  const decide = (body,cookie=accounts.owner,nonce=owner.nonce) => call('staff-change',cookie,body,nonce);
  const helper = await session(accounts.legacy);
  assert.equal((await call('staff-list','')).status,401);
  assert.equal((await call('staff-list',accounts.legacy)).status,403);
  const configure = {choice:'set-review-email',email:'review-mailbox@example.invalid',beforeEmail:''};
  assert.equal((await decide(configure,accounts.legacy,helper.nonce)).status,403);
  assert.equal((await decide(configure,accounts.owner,'fake')).status,403);
  assert.equal((await call('staff-change',accounts.owner,configure,owner.nonce,'https://other.invalid')).status,403);
  assert.equal((await session('')).requestNonce,null);
  const opened=ok(await decide(configure));
  assert.equal(opened.reviewEmail,configure.email);
  assert.equal((await decide(configure)).status,422);
  const anonymous = await session('');
  assert.ok(anonymous.requestNonce && !anonymous.user);
  const applicant = {name:'Test applicant',email:'applicant@example.invalid'};
  const apply = body => call('request-access','',body,anonymous.requestNonce);
  assert.equal((await call('request-access','',applicant,anonymous.requestNonce,'https://other.invalid')).status,403);
  assert.equal((await call('request-access','',applicant,'wrong')).status,403);
  ok(await apply({...applicant,role:'administrator'})); ok(await apply(applicant));
  const notices = relevantMail('CareHub helper access request');
  assert.equal(notices.length,1);
  assert.ok(String(notices[0].to).includes(opened.reviewEmail));
  assert.ok(notices[0].message.includes('/carehub/administration/#staff-access'));
  assert.equal((await call('workspace','')).status,401);
  assert.equal(relevantMail('Your CareHub login is ready').length,0);
  const queue = ok(await call('staff-list',accounts.other));
  assert.equal(queue.requests.length,1);
  const requestId=queue.requests[0].id;
  assert.equal((await decide({choice:'approve',requestId},accounts.legacy,helper.nonce)).status,403);
  const approved = ok(await decide({choice:'approve',requestId},accounts.other,other.nonce));
  assert.equal(approved.requests.length,0);
  const issued = approved.helpers.find(h=>h.email===applicant.email);
  assert.ok(issued && issued.canDelete);
  assert.equal((await decide({choice:'approve',requestId})).status,422);
  const setup = relevantMail('Your CareHub login is ready');
  assert.equal(setup.length,1);
  assert.ok(String(setup[0].to).includes(applicant.email));
  const setupURL = new URL(setup[0].message.match(/http[^\s]+action=rp[^\s]+/)[0]);
  const password = randomBytes(24).toString('hex');
  const identity = {email:applicant.email,password};
  const actual = core('set-password',{...identity,key:setupURL.searchParams.get('key'),login:setupURL.searchParams.get('login')});
  const active = await session(actual.cookie);
  assert.ok(active.user && !active.user.admin && !active.user.canManageAccounts);
  let snapshot = ok(await call('workspace',actual.cookie)).snapshot;
  snapshot.data.horses[0].specialInstructions='Test instruction kept after deletion';
  snapshot.data.history.push({id:'entry',horseId:'test-horse',date:'2026-11-03',type:'Vet',title:'Test entry',detail:'Test only',author:''});
  snapshot=ok(await call('save',actual.cookie,{requestId:crypto.randomUUID(),revision:snapshot.revision,snapshot},active.nonce)).snapshot;
  assert.equal(snapshot.data.history[0].author,applicant.name);
  assert.equal((await decide({choice:'delete',userId:accounts.ownerId,email:opened.myEmail})).status,422);
  assert.equal((await decide({choice:'delete',userId:accounts.mixedId,email:'mixed-account@example.invalid'})).status,422);
  const contentOwner = approved.helpers.find(h=>h.email==='website-author@example.invalid');
  assert.equal(contentOwner.canDelete,false);
  assert.equal((await decide({choice:'delete',userId:contentOwner.id,email:contentOwner.email})).status,422);
  ok(await decide({choice:'revoke',userId:contentOwner.id,email:contentOwner.email}));
  const removed = ok(await decide({choice:'delete',userId:issued.id,email:issued.email}));
  assert.ok(!removed.helpers.some(h=>h.id===issued.id));
  assert.equal((await session(actual.cookie)).user,null);
  assert.equal((await call('workspace',actual.cookie)).status,401);
  assert.equal((await call('save',actual.cookie,{},active.nonce)).status,401);
  assert.equal(core('authenticate',identity).allowed,false);
  assert.deepEqual(ok(await call('workspace',accounts.owner)).snapshot,snapshot);
  ok(await apply({name:'Second applicant',email:'second@example.invalid'}));
  const second = ok(await call('staff-list',accounts.owner)).requests[0];
  ok(await decide({choice:'decline',requestId:second.id}));
  assert.equal(relevantMail('Your CareHub login is ready').length,1);
  for (let i=0;i<5;i++) ok(await apply(applicant));
  assert.equal((await apply(applicant)).status,422);
  console.log('WordPress access lifecycle passed: request, duplicate, permissions, both owners, email setup, editing, deletion, session invalidation, preserved history, decline and throttling.');
} finally {server.kill();}
