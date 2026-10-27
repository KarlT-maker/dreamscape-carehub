import test from 'node:test';
import assert from 'node:assert/strict';
import {isoWeek,isoWeekStart,isoWeeksInYear} from '../src/lib/dates.ts';
import {farrierWeekRecords,farrierTotals} from '../src/lib/farrier.ts';
import {emptySnapshot,validateSnapshot} from '../src/lib/data/workspace.ts';

test('billing week numbers use ISO Monday-Sunday weeks across year boundaries',()=>{
  assert.deepEqual(isoWeek('2027-01-01'),{year:2026,week:53,start:'2026-12-28',end:'2027-01-03'});
  assert.deepEqual(isoWeek('2027-02-10'),{year:2027,week:6,start:'2027-02-08',end:'2027-02-14'});
  assert.equal(isoWeekStart(2027,15),'2027-04-12');
  assert.equal(isoWeeksInYear(2026),53);assert.equal(isoWeeksInYear(2027),52);
  assert.equal(isoWeek('2024-12-30').year,2025);
  for(const year of [2024,2025,2026,2027,2028])for(let week=1;week<=isoWeeksInYear(year);week++){
    const value=isoWeek(isoWeekStart(year,week));assert.equal(value.year,year);assert.equal(value.week,week);
  }
});

test('weekly farrier totals preserve legacy entries and exclude voids, other weeks and other record types',()=>{
  const base={id:'a',horseId:'horse1',date:'2027-02-08',type:'Farrier',provider:'Shelly',title:'Visit',detail:'',author:'Helper'};
  const history=[{...base,farrierWork:'Trim'},{...base,id:'b',date:'2027-02-14',farrierWork:'Shoeing'},
    {...base,id:'legacy',horseId:'horse2'},{...base,id:'void',farrierWork:'Trim',voided:true},
    {...base,id:'next',date:'2027-02-15'},{...base,id:'before',date:'2027-02-07'},
    {...base,id:'vet',type:'Vet'},{...base,id:'other',provider:'Other farrier',farrierWork:'Trim'}];
  const original=structuredClone(history);
  const rows=farrierWeekRecords(history,'2027-02-08','2027-02-14',' shelly ');
  assert.equal(rows.length,4);
  const totals=farrierTotals(rows);assert.equal(totals.horses,2);assert.equal(totals.records,3);
  assert.equal(totals.work.find(w=>w.label==='Trim').count,1);
  assert.equal(totals.work.find(w=>w.label==='Shoeing').count,1);
  assert.equal(totals.work.find(w=>w.label==='Not categorised').count,1);
  assert.deepEqual(history,original);
});

test('farrier details round-trip in backups; legacy history remains valid; malformed fields are rejected',()=>{
  const s=emptySnapshot();s.data.horses=[{id:'h',name:'Horse',location:'Barn',status:'Active',sex:'',breed:'',colour:'',birthDate:'',arrivalDate:'',owner:{id:'o',name:''},specialInstructions:''}];
  const base={id:'r',horseId:'h',date:'2026-10-27',type:'Farrier',provider:'Shelly',title:'Trim',detail:'',author:'Helper'};
  s.data.history=[base];validateSnapshot(s);
  s.data.history=[{...base,farrierWork:'Shoeing',farrierFeet:'Front feet',voided:false}];
  assert.deepEqual(validateSnapshot(JSON.parse(JSON.stringify(s))),s);
  for(const fields of [{farrierWork:'Invalid'},{farrierFeet:[]},{voided:'false'},{type:'Vet',farrierWork:'Trim'}]){
    const invalid=structuredClone(s);Object.assign(invalid.data.history[0],fields);assert.throws(()=>validateSnapshot(invalid));
  }
});
