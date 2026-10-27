import test from 'node:test';
import assert from 'node:assert/strict';
import {emptySnapshot, validateSnapshot, dailyTasks} from '../src/lib/data/workspace.ts';
import {changeCrewAssignments,savePlanningRecord} from '../src/lib/data/planning.ts';
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
  assert.throws(()=>savePlanningRecord(data,'shifts',{...shift,id:'s2'}),/already assigned/);
  data=savePlanningRecord(data,'shifts',{...shift,cancelled:true},shift);
  data=savePlanningRecord(data,'shifts',{...shift,id:'s2'});
  assert.equal(data.shifts.length,2);assert.equal(data.shifts.filter(s=>!s.cancelled).length,1);
  const off={id:'o1',date:'2026-10-28',helperId:'helper1'};data=savePlanningRecord(data,'daysOff',off);
  assert.throws(()=>savePlanningRecord(data,'daysOff',{...off,id:'o2'}),/already has a day off/);
});

test('multiple helpers share a round; removing one preserves teammates and other paddocks',()=>{
  let data=fixture();data.helpers.push({id:'helper2',name:'Second helper',initials:'SH'},{id:'helper3',name:'Third helper',initials:'TH'});
  const first={id:'s1',date:'2026-10-27',paddock:'Test field',period:'AM',helperId:'helper1'};
  const second={...first,id:'s2',helperId:'helper2'};
  const third={...first,id:'s3',helperId:'helper3'};
  const elsewhere={...first,id:'s4',paddock:'Other field'};
  for(const shift of [first,second,third,elsewhere]) data=savePlanningRecord(data,'shifts',shift);
  validateSnapshot({...emptySnapshot(),data});
  assert.equal(data.shifts.filter(s=>s.paddock==='Test field'&&!s.cancelled).length,3);
  data=savePlanningRecord(data,'shifts',{...first,cancelled:true},first);
  assert.deepEqual(data.shifts.filter(s=>!s.cancelled).map(s=>s.id),['s2','s3','s4']);
  assert.equal(data.shifts.length,4);
  data=savePlanningRecord(data,'shifts',{...first,cancelled:false},data.shifts[0]);
  assert.equal(data.shifts.filter(s=>!s.cancelled).length,4);
  assert.throws(()=>savePlanningRecord(data,'shifts',{...second,id:'duplicate'}),/already assigned/);
  assert.throws(()=>savePlanningRecord(data,'shifts',{...first,cancelled:true},first),/changed while/);
});

const weekDates=['2026-10-26','2026-10-27','2026-10-28','2026-10-29','2026-10-30','2026-10-31','2026-11-01'];
const crewChange=(data,overrides={})=>({dates:weekDates,paddock:'Test field',helperIds:['helper1'],action:'assign',beforeShifts:data.shifts,beforeDaysOff:data.daysOff,...overrides});

test('whole-week team assignment fills all rounds, skips days off and preserves existing records',()=>{
  const data=fixture();data.helpers.push({id:'helper2',name:'Second helper',initials:'SH'});
  const partial={id:'partial',date:'2026-10-27',paddock:'Test field',period:'Lunch',helperId:'helper1'};
  const cancelled={...partial,id:'cancelled',period:'PM',cancelled:true};
  const elsewhere={...partial,id:'elsewhere',paddock:'Other field'};
  data.shifts=[partial,cancelled,elsewhere];
  data.daysOff=[{id:'off',helperId:'helper1',date:'2026-10-28'}];
  const original=structuredClone(data);
  const next=changeCrewAssignments(data,crewChange(data,{helperIds:['helper1','helper2']}));
  const active=next.shifts.filter(s=>!s.cancelled&&s.paddock==='Test field');
  assert.equal(active.length,39); // 6 full days + 7 full days, three rounds each.
  assert.equal(active.filter(s=>s.date==='2026-10-28'&&s.helperId==='helper1').length,0);
  assert.equal(next.shifts.find(s=>s.id==='partial'),partial);
  assert.equal(next.shifts.find(s=>s.id==='cancelled').cancelled,false);
  assert.equal(next.shifts.find(s=>s.id==='elsewhere'),elsewhere);
  for(const section of ['horses','care','history','events','helpers','daysOff'])assert.equal(next[section],data[section]);
  assert.deepEqual(data,original);validateSnapshot({...emptySnapshot(),data:next});
  assert.equal(changeCrewAssignments(next,crewChange(next,{helperIds:['helper1','helper2']})),next);
});

test('a daily exception removes only the selected helper for that day across all rounds',()=>{
  const data=fixture();data.helpers.push({id:'helper2',name:'Second helper',initials:'SH'});
  const next=changeCrewAssignments(data,crewChange(data,{helperIds:['helper1','helper2']}));
  const removed=changeCrewAssignments(next,crewChange(next,{dates:['2026-10-28'],action:'remove'}));
  assert.equal(removed.shifts.length,42);
  assert.equal(removed.shifts.filter(s=>s.cancelled).length,3);
  assert.equal(removed.shifts.filter(s=>!s.cancelled&&s.helperId==='helper2').length,21);
  assert.equal(removed.shifts.filter(s=>!s.cancelled&&s.helperId==='helper1').length,18);
  const reinstated=changeCrewAssignments(removed,crewChange(removed,{dates:['2026-10-28']}));
  assert.equal(reinstated.shifts.length,42);assert.equal(reinstated.shifts.filter(s=>s.cancelled).length,0);
  assert.deepEqual(reinstated.shifts.map(s=>s.id),next.shifts.map(s=>s.id));
});

test('an open weekly form rejects changed target assignments or days off but preserves unrelated edits',()=>{
  const data=fixture(),change=crewChange(data);
  const partial={id:'partial',date:'2026-10-27',paddock:'Test field',period:'Lunch',helperId:'helper1'};
  assert.throws(()=>changeCrewAssignments({...data,shifts:[partial]},change),/assignments changed/);
  assert.throws(()=>changeCrewAssignments({...data,daysOff:[{id:'off',helperId:'helper1',date:'2026-10-28'}]},change),/days off changed/);
  const other={...partial,paddock:'Other field'};
  const fresh={...data,shifts:[other],history:[{id:'new-record'}]};
  const next=changeCrewAssignments(fresh,change);
  assert.equal(next.shifts[0],other);assert.equal(next.history,fresh.history);
  const cancelled={...partial,cancelled:true};
  assert.throws(()=>changeCrewAssignments({...data,shifts:[cancelled]},change),/assignments changed/);
});

test('daily full-day assignment preserves the original partial round and cancelled days off do not block it',()=>{
  const data=fixture();
  data.shifts=[{id:'partial',date:'2026-10-27',paddock:'Test field',period:'Lunch',helperId:'helper1'}];
  data.daysOff=[{id:'off',helperId:'helper1',date:'2026-10-27',cancelled:true}];
  const next=changeCrewAssignments(data,crewChange(data,{dates:['2026-10-27']}));
  assert.equal(next.shifts.length,3);assert.equal(next.shifts[0],data.shifts[0]);
  assert.throws(()=>changeCrewAssignments(data,crewChange(data,{helperIds:['missing']})),/Choose a paddock/);
  assert.throws(()=>changeCrewAssignments(data,crewChange(data,{helperIds:[]})),/Choose a paddock/);
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
