import assert from 'node:assert/strict';
import { test } from 'node:test';

import { editText, parseEntry, rangeText, type NumberSpec } from '@/domain/numberEntry';

const kg: NumberSpec = { min: 0, max: 500, decimals: true };
const height: NumberSpec = { min: 100, max: 250 };
const rest: NumberSpec = { min: 15, max: 600, kind: 'duration' };

test('numbers: decimals, commas, ranges and junk', () => {
  assert.deepEqual(parseEntry('82.5', kg), { value: 82.5 });
  assert.deepEqual(parseEntry('82,5', kg), { value: 82.5 }, 'comma works as a decimal point');
  assert.deepEqual(parseEntry(' 140 ', kg), { value: 140 });
  assert.deepEqual(parseEntry('82.', kg), { value: 82 });
  assert.deepEqual(parseEntry('', kg), { empty: true });
  assert.deepEqual(parseEntry('   ', kg), { empty: true });
  assert.deepEqual(parseEntry('501', kg), { error: 'Enter 0–500' });
  assert.deepEqual(parseEntry('12a', kg), { error: 'Numbers only' });
  assert.deepEqual(parseEntry('-5', kg), { error: 'Numbers only' });
  assert.deepEqual(parseEntry('180', height), { value: 180 });
  assert.deepEqual(parseEntry('18', height), { error: 'Enter 100–250' });
  assert.deepEqual(parseEntry('180.5', height), { error: 'Whole numbers only' });
});

test('durations: m:ss, m.ss, seconds and small numbers as minutes', () => {
  assert.deepEqual(parseEntry('2:30', rest), { value: 150 });
  assert.deepEqual(parseEntry('2.30', rest), { value: 150 }, 'phone number pads have no colon');
  assert.deepEqual(parseEntry('2,30', rest), { value: 150 });
  assert.deepEqual(parseEntry('90', rest), { value: 90 });
  assert.deepEqual(parseEntry('2', rest), { value: 120 });
  assert.deepEqual(parseEntry('10', rest), { value: 600 });
  assert.deepEqual(parseEntry('12', rest), { error: 'Enter 15 s–10:00' });
  assert.deepEqual(parseEntry('2:75', rest), { error: 'Use m:ss, e.g. 2:30' });
  assert.deepEqual(parseEntry('2.5', rest), { error: 'Use m:ss, e.g. 2:30' });
  assert.deepEqual(parseEntry('11:00', rest), { error: 'Enter 15 s–10:00' });
  assert.equal(rangeText(rest), '15 s–10:00');
});

test('text placed in the field when editing starts', () => {
  assert.equal(editText(82.5, kg), '82.5');
  assert.equal(editText(90, rest), '1:30');
  assert.equal(editText(600, rest), '10:00');
});
