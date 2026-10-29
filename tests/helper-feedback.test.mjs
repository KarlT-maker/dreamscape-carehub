import test from 'node:test';
import assert from 'node:assert/strict';
import {emptySnapshot,validateSnapshot,dailyTasks} from '../src/lib/data/workspace.ts';
import {eventOccursOn,nextEventDate} from '../src/lib/chores.ts';
import {currentSpecialCare,endingCareToday,sortSummaryCare} from '../src/lib/care-summary.ts';
import {crewForDay} from '../src/lib/crew-calendar.ts';
import {changeCrewAssignments,savePlanningRecord} from '../src/lib/data/planning.ts';
const horse={id:'h1',name:'Test horse',location:'Test field',status:'Active',sex:'',breed:'',colour:'',birthDate:'',arrivalDate:'',owner:{id:'o1',name:''},specialInstructions:'Check blanket'};
const chore={id:'chore1',horseId:'',date:'2026-10-28',time:'',type:'Chore',provider:'',reason:'Check troughs',notes:'Test only',repeat:'weekly',repeatDays:[3]};
const fixture=()=>({...emptySnapshot(),data:{...emptySnapshot().data,horses:[{...horse}],events:[{...chore}]}});

test('weekly chores appear on the chosen days across month and year boundaries, never before start or after last day',()=>{
  assert.equal(eventOccursOn(chore,'2026-10-28'),true);
  assert.equal(eventOccursOn(chore,'2026-10-29'),false);
  assert.equal(eventOccursOn(chore,'2026-10-21'),false);
  assert.equal(nextEventDate(chore,'2026-10-29'),'2026-11-04');
  const ended={...chore,repeatUntil:'2026-11-04'};
  assert.equal(eventOccursOn(ended,'2026-11-04'),true);
  assert.equal(nextEventDate(ended,'2026-11-05'),null);
  assert.equal(eventOccursOn({...chore,cancelled:true},'2026-10-28'),false);
  assert.equal(nextEventDate({...chore,date:'2026-12-31',repeatDays:[1,3]},'2026-12-31'),'2027-01-04');
});
test('daily and one-time chores respect dates and leap days while week-only farrier visits remain separate',()=>{
  const daily={...chore,date:'2028-02-28',repeat:'daily',repeatDays:undefined,repeatUntil:'2028-03-01'};
  for(const date of ['2028-02-28','2028-02-29','2028-03-01'])assert.equal(eventOccursOn(daily,date),true);
  assert.equal(eventOccursOn(daily,'2028-03-02'),false);
  const once={...chore,repeat:undefined,repeatDays:undefined};
  assert.equal(nextEventDate(once,'2026-10-27'),'2026-10-28');assert.equal(nextEventDate(once,'2026-10-29'),null);
  const farrier={...once,type:'Farrier',date:'2026-10-26',farrierWeekOnly:true};
  assert.equal(nextEventDate(farrier,'2026-10-29'),'2026-10-26');assert.equal(eventOccursOn(farrier,'2026-10-26'),false);
});
test('new care dates, characteristics, archived names and chores round-trip; malformed repeats are rejected',()=>{
  const data=fixture();Object.assign(data.data.horses[0],{specialCareStart:'2026-10-28',specialCareEnd:'2026-10-30',specialCharacteristics:'Old scar'});
  data.data.helpers=[{id:'helper',name:'Past helper',initials:'PH',archived:true}];
  assert.deepEqual(validateSnapshot(JSON.parse(JSON.stringify(data))),data);
  for(const changes of [{repeat:'monthly'},{repeatDays:[]},{repeatDays:[0]},{repeatDays:[3,3]},{repeatDays:['3']},{repeatUntil:'2026-10-27'},{horseId:'missing'},{type:'Vet'},{reason:''}]){
    const bad=structuredClone(data);Object.assign(bad.data.events[0],changes);assert.throws(()=>validateSnapshot(bad));
  }
  const bad=structuredClone(data);bad.data.horses[0].specialCareEnd='2026-10-27';assert.throws(()=>validateSnapshot(bad));
  const cleared=structuredClone(data);cleared.data.horses[0].specialCareStart='';cleared.data.horses[0].specialCareEnd='';validateSnapshot(cleared);
});
test('medication and special care show an alert on their inclusive last day and disappear from current care afterward',()=>{
  const h={...horse,specialCareStart:'2026-10-28',specialCareEnd:'2026-10-30'};
  const med={id:'m1',horseId:'h1',kind:'medication',name:'Test medication',dose:'Test',schedule:'AM',instructions:'',effectiveStart:'2026-10-28',effectiveEnd:'2026-10-30'};
  assert.equal(endingCareToday([h],[med],'2026-10-29').length,0);
  assert.deepEqual(endingCareToday([h],[med],'2026-10-30').map(x=>x.kind),['Medication','Special care']);
  assert.equal(endingCareToday([h],[med],'2026-10-31').length,0);
  assert.equal(currentSpecialCare(h,'2026-10-30'),'Check blanket');assert.equal(currentSpecialCare(h,'2026-10-31'),'');
  assert.equal(currentSpecialCare(h,'2026-10-27'),'');assert.equal(currentSpecialCare(horse,'2026-10-29'),'Check blanket');
  assert.equal(endingCareToday([{...h,status:'Archived'}],[med],'2026-10-30').length,0);
  const data={...emptySnapshot().data,horses:[h]};assert.equal(dailyTasks(data,'2026-10-31').length,0);
});
test('mash amounts stay first after edits without changing quantities or the source order',()=>{
  const items=[{id:'s',name:'Supplement',kind:'supplement',quantity:'30 g'},{id:'m',name:'Medicine',kind:'medication',dose:'Test'},{id:'f',name:'Senior feed',kind:'feed',quantity:'2 scoops'},{id:'mash',name:'Mash',kind:'feed',quantity:'8 - 6 - 8'}];
  assert.deepEqual(sortSummaryCare(items).map(c=>c.id),['mash','f','s','m']);assert.equal(items[0].id,'s');assert.equal(sortSummaryCare(items)[0].quantity,'8 - 6 - 8');
});
test('full-day teams merge legacy rounds and retain archived helpers without allowing new assignments',()=>{
  const helper={id:'helper',name:'Past helper',initials:'PH'};
  const s={id:'s1',helperId:'helper',date:'2026-10-29',paddock:'Test field',period:'AM'};
  const data={...emptySnapshot().data,helpers:[helper],shifts:[s,{...s,id:'s2',period:'PM'}]};
  const archived=savePlanningRecord(data,'helpers',{...helper,archived:true},helper);
  assert.equal(archived.shifts,data.shifts);assert.equal(archived.history,data.history);
  const day=crewForDay(archived.shifts,archived.helpers,'2026-10-29');assert.equal(day[0].people.length,1);assert.deepEqual(day[0].people[0],{id:'helper',name:'Past helper',archived:true});
  const change={dates:['2026-10-29'],paddock:'Test field',helperIds:['helper'],action:'assign',beforeShifts:archived.shifts,beforeDaysOff:[]};
  assert.throws(()=>changeCrewAssignments(archived,change),/Restore the archived/);
  const removed=changeCrewAssignments(archived,{...change,action:'remove'});assert.equal(removed.shifts.filter(s=>!s.cancelled).length,0);
  const restored=savePlanningRecord(archived,'helpers',{...helper,archived:false},archived.helpers[0]);assert.equal(changeCrewAssignments(restored,change).shifts.length,3);
});
