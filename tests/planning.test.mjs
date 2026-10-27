import test from 'node:test';
import assert from 'node:assert/strict';
import {emptySnapshot, validateSnapshot, dailyTasks} from '../src/lib/data/workspace.ts';
import {savePlanningRecord} from '../src/lib/data/planning.ts';
import {SCHEDULES, ROUNDS, includesRound} from '../src/lib/schedules.ts';

const event={id:'e1',horseId:'h1',type:'Farrier',date:'2026-10-27',time:'12:30',provider:'Test farrier',reason:'Trim',notes:''};
const fixture=()=>({...emptySnapshot().data,
  horses:[{id:'h1',name:'Test horse',location:'Test field',status:'Active',sex:'',breed:'',colour:'',birthDate:'',arrivalDate:'',owner:{id:'o1',name:''},specialInstructions:''}],
  helpers:[{id:'helper1',name:'Test helper',initials:'TH'}],events:[{...event}]});

test('new records and edited records preserve unrelated care and fresh changes',()=>{
  const data=fixture();data.horses[0].specialInstructions='Changed by another helper';
  const next=savePlanningRecord(data,'events',{...event,reason:'New reason'},event);
  assert.equal(next.horses,data.horses);assert.equal(next.care,data.care);
  assert.equal(next.events[0].reason,'New reason');assert.equal(data.events[0].reason,'Trim');
  const record={id:'history1',horseId:'h1',date:'2026-10-27',type:'Vet',title:'Test',detail:'Test record',author:'Test helper'};
  const withHistory=savePlanningRecord(next,'history',record);
  assert.equal(withHistory.events,next.events);assert.equal(withHistory.history.length,1);
});

test('stale form is rejected rather than overwriting a changed record',()=>{
  const data=fixture();data.events[0].notes='Newer note';
  assert.throws(()=>savePlanningRecord(data,'events',{...event,reason:'Old form edit'},event),/changed while/);
  assert.equal(data.events[0].notes,'Newer note');
});

test('stable new IDs make repeated adds idempotent and reject conflicting collisions',()=>{
  const data=fixture();assert.equal(savePlanningRecord(data,'events',{...event}),data);
  assert.throws(()=>savePlanningRecord(data,'events',{...event,notes:'Different'}),/already exists/);
});

test('duplicate active shifts and days off are rejected; cancelled slots can be reused',()=>{
  let data=fixture();const shift={id:'s1',date:'2026-10-27',paddock:'Test field',period:'Lunch',helperId:'helper1'};
  data=savePlanningRecord(data,'shifts',shift);
  assert.throws(()=>savePlanningRecord(data,'shifts',{...shift,id:'s2'}),/already have an assignment/);
  data=savePlanningRecord(data,'shifts',{...shift,cancelled:true},shift);
  data=savePlanningRecord(data,'shifts',{...shift,id:'s2'});
  assert.equal(data.shifts.length,2);assert.equal(data.shifts.filter(s=>!s.cancelled).length,1);
  const off={id:'o1',date:'2026-10-28',helperId:'helper1'};data=savePlanningRecord(data,'daysOff',off);
  assert.throws(()=>savePlanningRecord(data,'daysOff',{...off,id:'o2'}),/already has a day off/);
});

test('all feeding combinations produce exactly their selected rounds without changing old AM and PM plans',()=>{
  for(const schedule of SCHEDULES){
    const data=fixture();data.care=[{id:'c1',horseId:'h1',kind:'supplement',name:'Test',quantity:'Test amount',instructions:'',effectiveStart:'2026-10-27',effectiveEnd:'2026-10-28',schedule}];
    assert.deepEqual(dailyTasks(data,'2026-10-27').map(t=>t.period),ROUNDS.filter(r=>includesRound(schedule,r)));
    assert.equal(dailyTasks(data,'2026-10-26').length,0);assert.equal(dailyTasks(data,'2026-10-29').length,0);
    validateSnapshot({...emptySnapshot(),data});
  }
  assert.equal(includesRound('AM & PM','Lunch'),false);
  assert.equal(includesRound('Lunch','All'),true);
});

test('malformed appointment, history, or cancellation cannot be restored',()=>{
  const base={...emptySnapshot(),data:fixture()};validateSnapshot(base);
  for(const invalid of [{time:'25:00'},{type:'Invalid'},{cancelled:'false'}]){
    const next=structuredClone(base);Object.assign(next.data.events[0],invalid);assert.throws(()=>validateSnapshot(next));
  }
  const next=structuredClone(base);next.data.history=[{id:'x',horseId:'h1',date:'2026-10-27',title:'Test',detail:'Test',author:'Test',type:'Invalid'}];
  assert.throws(()=>validateSnapshot(next));
});
