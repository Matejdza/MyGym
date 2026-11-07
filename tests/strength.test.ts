import assert from 'node:assert/strict';
import { test } from 'node:test';

import { makeSession } from '@/domain/session';
import {
  addRest,
  addSet,
  adjust,
  currentSet,
  exerciseDone,
  goExercise,
  keypad,
  logSet,
  loggedSets,
  selectSet,
  setValue,
  volume,
} from '@/domain/strength';
import { mkPlan } from '@/domain/plan';
import type { StrengthSession } from '@/domain/types';

const start = (best: Record<string, number> = {}, last: Record<string, number> = {}) =>
  makeSession(mkPlan(3), 0, '2026-11-02', 0, { lastKg: last, bestKg: best }) as StrengthSession; // Chest & triceps

test('changing weight copies to the remaining undone sets', () => {
  let s = start({}, { bench: 60 });
  s = logSet(s, 0, 120); // set 1 done at 60
  s = setValue(s, 'w', 65); // set 2 selected
  assert.deepEqual(s.ex[0].sets.map((x) => x.w), [60, 65, 65, 65]);
  s = adjust(s, 'r', -10);
  assert.equal(currentSet(s)?.r, 1, 'reps stay ≥ 1');
  s = adjust(s, 'w', -100);
  assert.equal(currentSet(s)?.w, 0, 'weight stays ≥ 0');
  s = adjust(s, 'w', 2.5);
  assert.equal(currentSet(s)?.w, 2.5);
});

test('logging moves to the next undone set and starts rest', () => {
  let s = start();
  s = logSet(s, 1000, 120);
  assert.equal(s.sel, 1);
  assert.deepEqual(s.rest, { end: 121000, total: 120000 });
  s = selectSet(s, 3);
  s = logSet(s, 2000, 90);
  assert.equal(s.sel, 1, 'back to the first undone set');
  s = logSet(logSet(s, 0, 1), 0, 1);
  assert.equal(s.sel, -1);
  assert.equal(currentSet(s), null);
  assert.equal(exerciseDone(s, 0), true);
  assert.equal(exerciseDone(s, 1), false);
  assert.deepEqual(addRest(s, 30000).rest, { end: 30000 + s.rest!.end, total: 31000 });
});

test('PR: only with history, beating history and earlier sets', () => {
  // No history: never a PR.
  let s = start({}, {});
  s = setValue(s, 'w', 100);
  s = logSet(s, 0, 1);
  assert.equal(s.ex[0].sets[0].pr, false);

  // History best 90.
  s = start({ bench: 90 }, { bench: 85 });
  s = logSet(s, 0, 1); // 85: no
  s = setValue(s, 'w', 92.5);
  s = logSet(s, 0, 1); // 92.5 > 90: PR
  s = logSet(s, 0, 1); // 92.5 again: not above 92.5
  s = setValue(s, 'w', 95);
  s = logSet(s, 0, 1); // 95: PR
  assert.deepEqual(s.ex[0].sets.map((x) => x.pr), [false, true, false, true]);
});

test('exercise switching and adding sets', () => {
  let s = start({}, { incline: 24 });
  s = goExercise(s, -1);
  assert.equal(s.cur, 0);
  s = goExercise(s, 1);
  assert.equal(s.cur, 1);
  assert.equal(s.sel, 0);
  s = goExercise(s, 9);
  assert.equal(s.cur, 3, 'clamped to the last exercise');
  s = goExercise(s, -2);
  s = addSet(s);
  assert.equal(s.ex[1].sets.length, 4);
  assert.equal(s.sel, 3);
  assert.deepEqual(s.ex[1].sets[3], { w: 24, r: 10, done: false, pr: false });
});

test('keypad typing', () => {
  assert.deepEqual(keypad(null, '8', 'w'), { text: '8', value: 8 });
  assert.deepEqual(keypad('8', '2', 'w'), { text: '82', value: 82 });
  assert.deepEqual(keypad('82', '.', 'w'), { text: '82.', value: 82 });
  assert.deepEqual(keypad('82.', '5', 'w'), { text: '82.5', value: 82.5 });
  assert.equal(keypad('82.5', '.', 'w'), null, 'one decimal point');
  assert.equal(keypad('1', '.', 'r'), null, 'no decimals for reps');
  assert.equal(keypad('1234', '5', 'w'), null, 'max 4 digits');
  assert.deepEqual(keypad('0', '7', 'r'), { text: '7', value: 7 });
  assert.deepEqual(keypad('12', 'del', 'r'), { text: '1', value: 1 });
  assert.deepEqual(keypad('1', 'del', 'r'), { text: '', value: 0 });
});

test('logged sets and volume', () => {
  let s = start({}, { bench: 60, incline: 20 });
  s = logSet(s, 0, 1);
  s = logSet(s, 0, 1);
  s = goExercise(s, 1);
  s = logSet(s, 0, 1);
  const sets = loggedSets(s);
  assert.deepEqual(sets, [
    { exId: 'bench', setNo: 1, kg: 60, reps: 6, pr: false },
    { exId: 'bench', setNo: 2, kg: 60, reps: 6, pr: false },
    { exId: 'incline', setNo: 1, kg: 20, reps: 10, pr: false },
  ]);
  assert.equal(volume(sets), 60 * 6 * 2 + 200);
  assert.deepEqual(loggedSets(start()), []);
});
