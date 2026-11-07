import assert from 'node:assert/strict';
import { test } from 'node:test';

import { migrate } from '@/data/db';
import * as repo from '@/data/repo';
import { mkPlan } from '@/domain/plan';
import { bodyProgress, cardioProgress, chart, lastWeeks, liftProgress } from '@/domain/progress';

import { memoryDb } from './nodeDb';

const NOW = new Date(2026, 10, 6, 12); // Friday, Nov 6
const at = (y: number, m: number, d: number) => new Date(y, m - 1, d, 18).getTime();

test('last 12 weeks end with this week', () => {
  const w = lastWeeks(NOW);
  assert.equal(w.length, 12);
  assert.equal(w[11], '2026-11-02');
  assert.equal(w[0], '2026-08-17');
});

test('lift progress: best set per week, weeks without data skipped', () => {
  const weeks = lastWeeks(NOW);
  assert.equal(liftProgress('bench', [], weeks), null);
  const p = liftProgress(
    'bench',
    [
      { workoutId: 1, finishedAt: at(2026, 10, 19), kg: 80, reps: 6 },
      { workoutId: 1, finishedAt: at(2026, 10, 19), kg: 80, reps: 6 },
      { workoutId: 2, finishedAt: at(2026, 10, 21), kg: 82.5, reps: 5 },
      { workoutId: 3, finishedAt: at(2026, 11, 2), kg: 85, reps: 6 },
      { workoutId: 3, finishedAt: at(2026, 11, 2), kg: 85, reps: 6 },
      { workoutId: 3, finishedAt: at(2026, 11, 2), kg: 85, reps: 5 },
      { workoutId: 0, finishedAt: at(2026, 1, 5), kg: 200, reps: 1 }, // older than 12 weeks
    ],
    weeks,
  )!;
  assert.deepEqual(p.vals, [82.5, 85]);
  assert.deepEqual(p.labels, ['Oct 19', 'Nov 2']);
  assert.equal(p.title, 'Bench press, best set');
  assert.equal(p.big, '85');
  assert.equal(p.delta, '+2.5 kg in 12 weeks');
  assert.deepEqual(p.rows, [
    { k: 'Estimated 1RM', v: '102 kg' },
    { k: 'Nov 2', v: '3 × 6 × 85 kg' },
    { k: 'Oct 19', v: '1 × 5 × 82.5 kg' },
  ]);
});

test('cardio progress: minutes per week from the first cardio week', () => {
  const weeks = lastWeeks(NOW);
  assert.equal(cardioProgress([], weeks), null);
  const p = cardioProgress(
    [
      { finishedAt: at(2026, 10, 20), exId: 'treadmill', minutes: 20, value: 3.4 },
      { finishedAt: at(2026, 10, 20), exId: 'stairs', minutes: 10, value: 40 },
      { finishedAt: at(2026, 11, 3), exId: 'bike', minutes: 45, value: 12.1 },
    ],
    weeks,
  )!;
  assert.deepEqual(p.vals, [30, 0, 45]);
  assert.deepEqual(p.labels, ['Oct 19', 'Oct 26', 'Nov 2']);
  assert.equal(p.big, '45');
  assert.equal(p.delta, '+15 min a week since Oct 19');
  assert.deepEqual(p.rows[0], { k: 'Week of Nov 2', v: '45 min, 12.1 km' });
  assert.deepEqual(p.rows[2], { k: 'Week of Oct 19', v: '30 min, 3.4 km' });
});

test('body progress against the goal', () => {
  assert.equal(bodyProgress([], 78, '2026-08-17'), null);
  const p = bodyProgress(
    [
      { date: '2026-01-01', kg: 90 },
      { date: '2026-10-01', kg: 82 },
      { date: '2026-11-06', kg: 80.4 },
    ],
    78,
    '2026-08-17',
  )!;
  assert.deepEqual(p.vals, [82, 80.4]);
  assert.equal(p.delta, '2.4 kg to your goal of 78 kg');
  assert.deepEqual(p.rows, [
    { k: 'Nov 6', v: '80.4 kg' },
    { k: 'Oct 1', v: '82 kg' },
  ]);
});

test('chart geometry matches the prototype formula', () => {
  const g = chart([1, 2, 3], ['a', 'b', 'c'], 280);
  assert.deepEqual(g.pts.map((p) => p.x), [0, 140, 280]);
  assert.equal(g.pts[0].y, 145.9);
  assert.equal(g.pts[2].y, 28.1);
  assert.deepEqual(g.grid.map((x) => x.label), ['1', '2', '3']);
  assert.deepEqual(g.xl.map((x) => x.align), ['start', 'middle', 'end']);
  const one = chart([80], ['Nov 6'], 280, 78);
  assert.equal(one.pts[0].x, 140);
  assert.equal(one.target?.label, 'goal 78');
  assert.equal(one.grid.length, 1);
});

test('history queries', async () => {
  const db = memoryDb();
  await migrate(db);
  await repo.createProfile(db, { id: 'p1', name: 'A', color: '#fff', height: 1, weight: 80, goal: 'fat', target: 78, photoUri: null, plan: mkPlan(3), createdAt: 0 }, '2026-11-01');
  const base = { profileId: 'p1', routineKey: 'A', routineName: 'A', weekStart: '2026-11-02', day: 0, startedAt: 0 };
  await repo.recordWorkout(db, { ...base, type: 'strength', finishedAt: 100, cardio: [], sets: [{ exId: 'bench', setNo: 1, kg: 60, reps: 5, pr: false }] });
  await repo.recordWorkout(db, { ...base, type: 'cardio', finishedAt: 200, sets: [], cardio: [{ exId: 'bike', minutes: 15, value: 6, zone: 2, target: 15 }] });
  assert.deepEqual(await repo.liftSets(db, 'p1', 'bench', 0), [{ workoutId: 1, finishedAt: 100, kg: 60, reps: 5 }]);
  assert.deepEqual(await repo.liftSets(db, 'p1', 'bench', 101), []);
  assert.deepEqual(await repo.cardioEntries(db, 'p1', 0), [{ finishedAt: 200, exId: 'bike', minutes: 15, value: 6 }]);
});
