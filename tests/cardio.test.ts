import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  adjustActivity,
  allDone,
  cardioSummary,
  elapsed,
  goActivity,
  logActivity,
  loggedCardio,
  resetTimer,
  strengthSummary,
  timerLabel,
  toggleTimer,
} from '@/domain/cardio';
import { mkPlan } from '@/domain/plan';
import { makeSession } from '@/domain/session';
import type { CardioSession } from '@/domain/types';

const start = () => makeSession(mkPlan(5), 5, '2026-11-02', 0, { lastKg: {}, bestKg: {} }) as CardioSession; // Saturday: Cardio

test('timer adds up paused time', () => {
  let s = start();
  assert.equal(timerLabel(s), 'Start timer');
  s = toggleTimer(s, 1000);
  assert.equal(timerLabel(s), 'Pause');
  assert.equal(elapsed(s, 61000), 60000);
  s = toggleTimer(s, 61000); // pause after 60 s
  assert.equal(timerLabel(s), 'Resume');
  assert.equal(elapsed(s, 999999), 60000, 'paused time does not count');
  s = toggleTimer(s, 100000);
  assert.equal(elapsed(s, 130000), 90000);
  s = resetTimer(s);
  assert.equal(elapsed(s, 200000), 0);
  assert.equal(timerLabel(s), 'Start timer');
});

test('switching activity restarts its timer', () => {
  let s = toggleTimer(start(), 0);
  s = goActivity(s, 1);
  assert.equal(s.cur, 1);
  assert.equal(elapsed(s, 50000), 0);
  assert.equal(goActivity(s, 1), s, 'same activity: no change');
  assert.equal(goActivity(s, 9), s, 'out of range: no change');
});

test('adjust and log activities', () => {
  let s = start();
  s = adjustActivity(s, 'min', -100);
  assert.equal(s.ex[0].min, 1);
  s = adjustActivity(s, 'min', 21);
  s = adjustActivity(s, 'v', 0.1);
  s = adjustActivity(s, 'v', 0.2);
  assert.equal(s.ex[0].v, 0.3);
  s = adjustActivity(s, 'v', -5);
  assert.equal(s.ex[0].v, 0);
  s = adjustActivity(s, 'v', 3.6);
  s = toggleTimer(s, 0);
  s = logActivity(s);
  assert.equal(s.cur, 1, 'jumps to the next undone activity');
  assert.equal(s.runningSince, null);
  s = goActivity(s, 2);
  s = logActivity(s);
  assert.equal(s.cur, 1, 'back to the first undone one');
  assert.equal(allDone(s), false);
  s = logActivity(s);
  assert.equal(allDone(s), true);
  assert.deepEqual(loggedCardio(s)[0], { exId: 'treadmill', minutes: 22, value: 3.6, zone: 2, target: 20 });
});

test('summaries match the prototype copy', () => {
  const c = cardioSummary(
    [
      { exId: 'treadmill', minutes: 20, value: 3.6, zone: 2, target: 20 },
      { exId: 'bike', minutes: 15, value: 6.4, zone: 3, target: 15 },
      { exId: 'stairs', minutes: 10, value: 30, zone: 4, target: 10 },
    ],
    3,
  );
  assert.deepEqual(c.rows, [
    { k: 'Time', v: '45 min' },
    { k: 'Distance', v: '10 km' },
    { k: 'Activities', v: '3 of 3' },
  ]);
  assert.deepEqual(c.list[2], { n: 'Stair climber', v: '10 min, 30 floors' });

  const st = strengthSummary(
    [
      { exId: 'ohp', setNo: 1, kg: 57.5, reps: 6, pr: true },
      { exId: 'ohp', setNo: 2, kg: 55, reps: 6, pr: false },
    ],
    (58 * 60 + 12) * 1000,
  );
  assert.deepEqual(st.rows, [
    { k: 'Time', v: '58:12' },
    { k: 'Sets', v: '2' },
    { k: 'Volume', v: '675 kg' },
  ]);
  assert.deepEqual(st.list, [{ n: 'Overhead press', v: '57.5 kg × 6' }]);
});
