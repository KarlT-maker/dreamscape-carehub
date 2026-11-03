import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const guide = readFileSync(new URL('../mobile/install/guide.js', import.meta.url), 'utf8');
const worker = readFileSync(new URL('../mobile/phone-sw.js', import.meta.url), 'utf8');
const address = 'https://dreamscaperanch.com/carehub/install/';

function openGuide(userAgent, standalone = false) {
  const listeners = new Map(), nodes = new Map();
  const location = {href:address, replace(url) {this.href = url;}};
  function element(id) {
    if (!nodes.has(id)) nodes.set(id, {hidden:id === 'native', addEventListener(type, fn) {this[type] = fn;}});
    return nodes.get(id);
  }
  runInNewContext(guide, {document:{getElementById:element}, navigator:{userAgent}, location, URL,
    matchMedia:()=>({matches:standalone}), window:{addEventListener:(name,fn)=>listeners.set(name,fn)}});
  return {element, listeners, location};
}
test('Android offers native installation only when available and restores manual steps after dismissal',async()=>{
  const {element,listeners} = openGuide('Android');
  assert.equal(element('scan').hidden,true);
  assert.equal(element('iphone').hidden,true);
  assert.equal(element('android').hidden,false);
  let prompts = 0;
  listeners.get('beforeinstallprompt')({preventDefault(){},prompt(){prompts++;},userChoice:Promise.resolve({outcome:'dismissed'})});
  assert.equal(element('native').hidden,false);
  await element('install').click();
  await element('install').click();
  assert.equal(prompts,1);
  assert.equal(element('android').hidden,false);
});
test('iPhone instructions, desktop handoff and installed launch lead to the correct barn',()=>{
  assert.equal(openGuide('iPhone').element('android').hidden,true);
  assert.equal(openGuide('desktop').element('scan').hidden,false);
  assert.equal(openGuide('iPhone',true).location.href,new URL('../',address).href);
  const manifest = JSON.parse(readFileSync(new URL('../mobile/manifest.webmanifest',import.meta.url)));
  const manifestURL = new URL('../manifest.webmanifest',address);
  for (const key of ['start_url','scope','id']) assert.equal(new URL(manifest[key],manifestURL).href,new URL('../',address).href);
  for (const icon of manifest.icons) {
    const png = readFileSync(new URL('../mobile/'+icon.src, import.meta.url));
    assert.equal(icon.sizes,png.readUInt32BE(16)+'x'+png.readUInt32BE(20));
  }
});
test('offline handling never intercepts API reads, saves, sign-in, or other website pages',async()=>{
  let handle;
  const scope = new URL('../',address).href;
  runInNewContext(worker,{URL,Response,self:{registration:{scope},addEventListener:(_,fn)=>{handle=fn;}},fetch:()=>Promise.reject(new Error('offline'))});
  function request(path,mode='navigate',method='GET') {
    let result;
    handle({request:{url:new URL(path,scope).href,method,mode},respondWith(promise){result=promise;}});
    return result;
  }
  for (const path of ['api/index.php?action=workspace','api/index.php?action=session','/wp-login.php','/']) assert.equal(request(path),undefined);
  assert.equal(request('api/index.php?action=save','cors','POST'),undefined);
  const offline = await request('boards/full/');
  assert.equal(offline.status,503);
  assert.equal(offline.headers.get('cache-control'),'no-store');
  assert.match(await offline.text(),/CareHub is offline/);
});
