import test from 'node:test';
import assert from 'node:assert/strict';
import { emptySnapshot, readWorkspace, saveWorkspace, validateSnapshot, dailyTasks, paddockNames, STORAGE_KEY, UNDO_KEY } from '../src/lib/data/workspace.ts';
const horse = { id:'h1', name:'Trial horse', location:'New field', status:'Active', sex:'', breed:'', colour:'', birthDate:'', arrivalDate:'', owner:{ id:'o1', name:'' }, specialInstructions:'' };
const fixture = () => ({ ...emptySnapshot(), data:{ ...emptySnapshot().data, horses:[{ ...horse }], care:[{ id:'c1', horseId:'h1', kind:'feed', name:'Trial feed', quantity:'1 scoop', schedule:'AM & PM', instructions:'Trial only', effectiveStart:'2026-10-25' }] } });
function storage() { const map=new Map(); return { getItem:k=>map.get(k) ?? null, setItem:(k,v)=>map.set(k,v) }; }
test('unknown profile details are preserved as unknown; entered care survives reopening', () => {
  const store=storage(); const saved=saveWorkspace(store,emptySnapshot(),fixture());
  assert.deepEqual(readWorkspace(store),saved);
  assert.equal(saved.data.horses[0].birthDate,'');
  assert.equal(saved.data.care.length,1);
});
test('invalid and orphaned records cannot replace the saved workspace', () => {
  const store=storage(); const current=saveWorkspace(store,emptySnapshot(),fixture()); const raw=store.getItem(STORAGE_KEY);
  const bad=fixture(); bad.data.care[0].horseId='missing';
  assert.throws(()=>saveWorkspace(store,current,bad,true));
  assert.equal(store.getItem(STORAGE_KEY),raw);
  bad.data.care=[]; bad.data.horses[0].birthDate='2026-02-30';
  assert.throws(()=>validateSnapshot(bad));
  store.setItem(STORAGE_KEY,'broken'); assert.throws(()=>readWorkspace(store));
  assert.equal(store.getItem(STORAGE_KEY),'broken');
});
test('reset keeps an undo copy and restoring it keeps a copy of the reset workspace', () => {
  const store=storage(); const original=saveWorkspace(store,emptySnapshot(),fixture());
  const cleared=saveWorkspace(store,original,emptySnapshot(),true);
  assert.equal(cleared.data.horses.length,0);
  const restored=saveWorkspace(store,cleared,validateSnapshot(JSON.parse(store.getItem(UNDO_KEY))),true);
  assert.deepEqual(restored.data,original.data);
  assert.equal(JSON.parse(store.getItem(UNDO_KEY)).data.horses.length,0);
});
test('a stale tab cannot silently overwrite a newer save', () => {
  const store=storage(); const old=saveWorkspace(store,emptySnapshot(),fixture());
  const newer=saveWorkspace(store,old,{...old,completions:{ task:{completedBy:'This device',completedAt:'now'} }});
  assert.throws(()=>saveWorkspace(store,old,emptySnapshot()),/Another tab/);
  assert.deepEqual(readWorkspace(store),newer);
});
test('storage failure leaves the last successful save intact', () => {
  const store=storage(); const current=saveWorkspace(store,emptySnapshot(),fixture());
  const full={getItem:store.getItem,setItem:()=>{throw new Error('Storage full');}};
  assert.throws(()=>saveWorkspace(full,current,emptySnapshot(),true));
  assert.deepEqual(readWorkspace(store),current);
});
test('daily feeds use entered plans, correct dates and rounds, without medication checkoffs', () => {
  const d=fixture().data;
  d.care.push({...d.care[0],id:'med',kind:'medication',dose:'test'});
  assert.equal(dailyTasks(d,'2026-10-24').length,0);
  assert.deepEqual(dailyTasks(d,'2026-10-25').map(t=>t.period),['AM','PM']);
  const yesterday=dailyTasks(d,'2026-10-25')[0].id;
  assert.notEqual(dailyTasks(d,'2026-10-26')[0].id,yesterday);
  d.care[0].effectiveEnd='2026-10-25';
  assert.equal(dailyTasks(d,'2026-10-26').length,0);
  d.care[0].effectiveEnd='2026-10-24';
  assert.equal(dailyTasks(d,'2026-10-25').length,0);
});
test('new paddock names are included in boards', () => {
  assert.deepEqual(paddockNames([horse],['Minis','80s']),['Minis','80s','New field']);
});

test('changing an entered feed does not retain an old completion identity', () => {
  const d=fixture().data; const old=dailyTasks(d,'2026-10-25')[0].id;
  d.care[0].quantity='changed amount';
  assert.notEqual(dailyTasks(d,'2026-10-25')[0].id,old);
});
