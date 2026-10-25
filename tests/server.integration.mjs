import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtempSync,mkdirSync,copyFileSync,cpSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {resolve,dirname} from 'node:path';
const php=process.env.PHP_BINARY;
if (!php) throw new Error('Set PHP_BINARY to the PHP executable with PDO SQLite available.');
const root=resolve(import.meta.dirname,'..');
const temp=mkdtempSync(resolve(tmpdir(),'carehub-http-test-'));
mkdirSync(resolve(temp,'carehub/api'),{recursive:true});
cpSync(resolve(root,'server'),resolve(temp,'carehub/api'),{recursive:true});
copyFileSync(resolve(root,'dist/siteground/carehub/api/seed.json'),resolve(temp,'carehub/api/seed.json'));
copyFileSync(resolve(root,'tests/wordpress-fixture.php'),resolve(temp,'wp-load.php'));
const port=19131;
const host=`http://127.0.0.1:${port}`;
const server=spawn(php,['-d',`extension_dir=${resolve(dirname(php),'ext')}`,'-d','extension=pdo_sqlite','-S',`127.0.0.1:${port}`,'-t',temp],{stdio:['ignore','ignore','pipe']});
let logs='';server.stderr.on('data',x=>logs+=x);
async function call(action,{role='admin',body,nonce='test-only-nonce',origin=host}={}) {
  const r=await fetch(`${host}/carehub/api/index.php?action=${action}`,{method:body ? 'POST':'GET',headers:{'X-Test-Role':role,'Content-Type':'application/json','Origin':origin,'X-Barn-Nonce':nonce},body:body ? JSON.stringify(body):undefined});
  return {status:r.status,value:await r.json(),headers:r.headers};
}
let checks=0;
function check(ok,message){assert.ok(ok,message); console.log(`ok ${++checks} - ${message}`);}
try {
  for(let i=0;i<60;i++) {try {await call('session');break;}catch {await new Promise(r=>setTimeout(r,100));}}
  let r=await call('workspace',{role:'none'});check(r.status===401,'anonymous reads are denied');
  r=await call('initialize',{role:'tester',body:{}});check(r.status===403,'testers cannot initialize storage');
  r=await call('initialize',{body:{},nonce:'bad'});check(r.status===403,'invalid nonce is rejected');
  r=await call('initialize',{body:{},origin:'https://another-site.example'});check(r.status===403,'cross-origin writes are rejected');
  r=await call('initialize',{body:{}});check(r.status===200 && r.value.snapshot.data.horses.length===43,'administrator initializes the real 43-name roster');
  let original=r.value.snapshot;
  let next=structuredClone(original);next.data.horses[0].specialInstructions='HTTP integration test';
  let body={revision:original.revision,requestId:crypto.randomUUID(),snapshot:next};
  r=await call('save',{role:'tester',body});check(r.status===200 && r.value.snapshot.revision===2,'tester save persists with a new revision');
  let saved=r.value.snapshot;
  r=await call('save',{role:'tester',body});check(r.status===200 && r.value.snapshot.revision===2,'retrying an acknowledged request does not duplicate it');
  r=await call('save',{role:'tester',body:{...body,requestId:crypto.randomUUID()}});check(r.status===409 && r.value.snapshot.revision===2,'stale save returns current records without overwriting');
  r=await call('workspace',{role:'tester'});check(r.value.snapshot.data.horses[0].specialInstructions==='HTTP integration test','a separate HTTP read receives the saved change');
  check(r.headers.get('cache-control').includes('no-store'),'private API responses cannot be cached');
  next=structuredClone(saved);next.data.horses=[];
  r=await call('replace',{role:'tester',body:{revision:2,requestId:crypto.randomUUID(),snapshot:next}});check(r.status===403,'tester bulk replacement is denied');
  r=await call('save',{role:'tester',body:{revision:2,requestId:crypto.randomUUID(),snapshot:next}});check(r.status===422,'normal saves cannot remove existing horses');
  next=structuredClone(saved);next.data.horses[0].birthDate='2026-02-30';
  r=await call('save',{role:'tester',body:{revision:2,requestId:crypto.randomUUID(),snapshot:next}});check(r.status===422,'invalid data rolls back');
  r=await call('workspace');check(r.value.snapshot.revision===2,'rejected saves leave the previous revision unchanged');
  next=structuredClone(saved);next.completions.task={completedBy:'Spoofed actor',completedAt:'fake'};
  r=await call('save',{role:'tester',body:{revision:2,requestId:crypto.randomUUID(),snapshot:next}});check(r.status===200 && r.value.snapshot.completions.task.completedBy==='Test helper','checkmarks use the authenticated helper identity');
  r=await call('replace',{body:{revision:3,requestId:crypto.randomUUID(),snapshot:original}});check(r.status===200 && r.value.canUndoReset,'administrator replacement keeps an undo copy');
  r=await call('undo',{body:{revision:4,requestId:crypto.randomUUID()}});check(r.status===200 && r.value.snapshot.completions.task.completedBy==='Test helper','administrator undo restores prior shared records');
  console.log(`${checks} HTTP integration checks passed against the PHP API with a local WordPress/SQLite fixture.`);
}catch(e){console.error(logs.slice(-5000));throw e;}
finally{server.kill();}
