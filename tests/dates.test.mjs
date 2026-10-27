import test from 'node:test';
import assert from 'node:assert/strict';
import { ranchDate, offsetDate, age, instructionState, weekStart, offsetMonth, calendarMonthDates } from '../src/lib/dates.ts';

test('ranch dates use Pacific time rather than UTC', () => {
  assert.equal(ranchDate(new Date('2026-09-10T02:00:00Z')), '2026-09-09');
});
test('date offsets cross month and year boundaries', () => {
  assert.equal(offsetDate('2026-12-31', 1), '2027-01-01');
  assert.equal(offsetDate('2024-03-01', -1), '2024-02-29');
});

test('crew calendar weeks start on Monday across month and year boundaries', () => {
  assert.equal(weekStart('2026-10-27'),'2026-10-26');
  assert.equal(weekStart('2027-01-03'),'2026-12-28');
  assert.equal(weekStart('2026-11-02'),'2026-11-02');
});

test('month navigation does not skip February when starting on the 31st', () => {
  assert.equal(offsetMonth('2026-01-31',1),'2026-02-01');
  assert.equal(offsetMonth('2026-12-31',1),'2027-01-01');
  assert.equal(offsetMonth('2027-01-31',-1),'2026-12-01');
});

test('calendar grids contain full Monday-Sunday weeks and every day of the month', () => {
  for(const [date,count] of [['2024-02-29',29],['2026-02-01',28],['2026-03-31',31],['2026-11-01',30],['2026-12-31',31]]) {
    const days=calendarMonthDates(date);
    assert.equal(days.length%7,0);
    assert.equal(new Set(days).size,days.length);
    assert.equal(new Date(days[0]+'T12:00:00Z').getUTCDay(),1);
    assert.equal(new Date(days.at(-1)+'T12:00:00Z').getUTCDay(),0);
    assert.equal(days.filter(d=>d.startsWith(date.slice(0,7))).length,count);
    days.slice(1).forEach((d,i)=>assert.equal(d,offsetDate(days[i],1)));
  }
});
test('age changes on the birthday', () => {
  assert.equal(age('1999-05-14', '2026-05-13'), 26);
  assert.equal(age('1999-05-14', '2026-05-14'), 27);
});
test('effective dates are inclusive and future instructions stay scheduled', () => {
  const current = { effectiveStart: '2026-09-01', effectiveEnd: '2026-09-19' };
  const future = { effectiveStart: '2026-09-20' };
  assert.equal(instructionState(current, '2026-08-31'), 'Scheduled');
  assert.equal(instructionState(current, '2026-09-01'), 'Current');
  assert.equal(instructionState(current, '2026-09-19'), 'Current');
  assert.equal(instructionState(current, '2026-09-20'), 'Ended');
  assert.equal(instructionState(future, '2026-09-19'), 'Scheduled');
  assert.equal(instructionState(future, '2026-09-20'), 'Current');
});

test('cancelled future instructions never reappear as scheduled or current', () => {
  const cancelled = { effectiveStart:'2026-11-01', effectiveEnd:'2026-10-31' };
  assert.equal(instructionState(cancelled,'2026-10-25'),'Ended');
  assert.equal(instructionState(cancelled,'2026-11-01'),'Ended');
});
