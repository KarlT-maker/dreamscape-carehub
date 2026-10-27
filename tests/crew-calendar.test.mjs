import test from 'node:test';
import assert from 'node:assert/strict';
import {crewForDate} from '../src/lib/crew-calendar.ts';

test('daily and calendar views retain every teammate and round, excluding cancelled and other-day assignments',()=>{
  const helpers=[{id:'h1',name:'One',initials:'O'},{id:'h2',name:'Two',initials:'T'}];
  const s={id:'s1',date:'2026-10-27',paddock:'Minis',period:'AM',helperId:'h1'};
  const shifts=[s,{...s,id:'s2',helperId:'h2'},{...s,id:'s3',period:'PM'},{...s,id:'s4',period:'Lunch'},
    {...s,id:'s5',paddock:'Other field'},{...s,id:'s6',date:'2026-10-28'},
    {...s,id:'s7',paddock:'Cancelled field',cancelled:true}];
  const original=structuredClone(shifts);
  const groups=crewForDate(shifts,helpers,'2026-10-27');
  assert.deepEqual(groups.filter(g=>g.paddock==='Minis').map(g=>g.period),['AM','Lunch','PM']);
  assert.deepEqual(groups[0].people.map(p=>p.name),['One','Two']);
  assert.equal(groups.length,4);
  assert.deepEqual(shifts,original);
  assert.equal(crewForDate(shifts,helpers,'2026-10-29').length,0);
});

test('assignments to former paddocks remain visible and unknown helpers are not silently dropped',()=>{
  const rows=[{id:'s1',date:'2026-10-27',paddock:'Former field',period:'PM',helperId:'missing'}];
  assert.deepEqual(crewForDate(rows,[],'2026-10-27'),[{paddock:'Former field',period:'PM',people:[{id:'missing',name:'Unknown helper'}]}]);
});
