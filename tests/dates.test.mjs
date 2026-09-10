import test from 'node:test';
import assert from 'node:assert/strict';
import { ranchDate, offsetDate, age, instructionState } from '../src/lib/dates.ts';

test('ranch dates use Pacific time rather than UTC', () => {
  assert.equal(ranchDate(new Date('2026-09-10T02:00:00Z')), '2026-09-09');
});
test('date offsets cross month and year boundaries', () => {
  assert.equal(offsetDate('2026-12-31', 1), '2027-01-01');
  assert.equal(offsetDate('2024-03-01', -1), '2024-02-29');
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
