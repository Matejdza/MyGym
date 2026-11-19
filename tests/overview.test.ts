import assert from 'node:assert/strict';
import { test } from 'node:test';

import { migrate } from '@/data/db';
import * as repo from '@/data/repo';
import { periodRange, plannedWorkouts, timeText, volumeText } from '@/domain/overview';
import { mkPlan } from '@/domain/plan';
import type { Profile } from '@/domain/types';

import { memoryDb } from './nodeDb';

const now = new Date(2026, 10, 18, 15, 0); // Wednesday, November 18, 2026

test('periods: calendar week (Mon–Sun), month and year', () => {
  const w = periodRange('week', now);
  assert.equal(w.from.toDateString(), new Date(2026, 10, 16).toDateString());
  assert.equal(w.to.toDateString(), new Date(2026, 10, 23).toDateString());
  assert.equal(w.label, 'November 16 – 22, 2026');
  assert.equal(periodRange('week', new Date(2026, 10, 30)).label, 'November 30 – December 6, 2026');
  assert.equal(periodRange('month', now).label, 'November 2026');
  assert.equal(periodRange('month', now).to.toDateString(), new Date(2026, 11, 1).toDateString());
  assert.equal(periodRange('year', now).label, '2026');
});

test('planned workouts follow the plan days', () => {
  const plan = mkPlan(4); // Mon, Tue, Thu, Fri
  assert.equal(plannedWorkouts(plan, periodRange('week', now)), 4);
  // November 2026: 5 Mondays, 4 Tuesdays, 4 Thursdays, 4 Fridays.
  assert.equal(plannedWorkouts(plan, periodRange('month', now)), 17);
  assert.equal(plannedWorkouts({ ...plan, days: [null, null, null, null, null, null, null] }, periodRange('week', now)), 0);
});

test('card texts', () => {
  assert.equal(volumeText(2740), '2,740 kg');
  assert.equal(volumeText(12440), '12.4 t');
  assert.equal(timeText(45), '45 min');
  assert.equal(timeText(200), '3 h 20 min');
  assert.equal(timeText(120), '2 h');
});

test('period totals count only that profile and period', async () => {
  const db = memoryDb();
  await migrate(db);
  const p = (id: string): Profile => ({ id, name: id, color: '#fff', height: 180, weight: 80, goal: 'muscle', target: 80, photoUri: null, plan: mkPlan(3), createdAt: 0 });
  await repo.createProfile(db, p('p1'), '2026-11-01');
  await repo.createProfile(db, p('p2'), '2026-11-01');
  const at = (d: number, h: number) => new Date(2026, 10, d, h).getTime();
  const base = { routineKey: 'A', routineName: 'Push', type: 'strength' as const, weekStart: '2026-11-16', day: 0, cardio: [] };
  await repo.recordWorkout(db, { ...base, profileId: 'p1', startedAt: at(16, 18), finishedAt: at(16, 19), sets: [{ exId: 'bench', setNo: 1, kg: 60, reps: 5, pr: false }, { exId: 'bench', setNo: 2, kg: 60, reps: 5, pr: false }] });
  await repo.recordWorkout(db, { ...base, profileId: 'p1', startedAt: at(18, 7), finishedAt: at(18, 7) + 30 * 60000, sets: [{ exId: 'squat', setNo: 1, kg: 100, reps: 3, pr: false }] });
  await repo.recordWorkout(db, { ...base, profileId: 'p1', startedAt: at(9, 18), finishedAt: at(9, 19), sets: [{ exId: 'bench', setNo: 1, kg: 50, reps: 5, pr: false }] }); // last week
  await repo.recordWorkout(db, { ...base, profileId: 'p2', startedAt: at(17, 18), finishedAt: at(17, 19), sets: [{ exId: 'bench', setNo: 1, kg: 99, reps: 9, pr: false }] });

  const week = periodRange('week', now);
  const s = await repo.periodStats(db, 'p1', week.from.getTime(), week.to.getTime());
  assert.deepEqual(s, { workouts: 2, sets: 3, volume: 900, minutes: 90, days: ['2026-11-16', '2026-11-18'] });

  const empty = await repo.periodStats(db, 'p1', at(1, 0), at(2, 0));
  assert.deepEqual(empty, { workouts: 0, sets: 0, volume: 0, minutes: 0, days: [] });
});

test('a profile made mid-week: days before it are not planned or missed', async () => {
  const { firstPlanDay, plannedFrom } = await import('@/domain/week');
  const { plannedWorkouts, periodRange } = await import('@/domain/overview');
  const plan = { ...emptyPlanForTest(), days: ['A', null, 'B', null, 'C', 'D', null] } as never;
  // Week of Monday 2026-11-16; profile made on Friday the 20th.
  const made = new Date(2026, 10, 20, 9).getTime();
  assert.equal(firstPlanDay(made, '2026-11-16'), 4);
  assert.equal(plannedFrom(plan, 4), 2);
  assert.equal(firstPlanDay(made, '2026-11-23'), 0);
  assert.equal(firstPlanDay(made, '2026-11-09'), 7);
  const week = periodRange('week', new Date(2026, 10, 20));
  assert.equal(plannedWorkouts(plan, week), 4);
  assert.equal(plannedWorkouts(plan, week, '2026-11-20'), 2);
});

function emptyPlanForTest() {
  return { routines: {}, days: [null, null, null, null, null, null, null], weekly: 3 };
}
