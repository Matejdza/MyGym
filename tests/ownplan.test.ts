import assert from 'node:assert/strict';
import { test } from 'node:test';

import { DAYS_FULL } from '@/data/catalog';
import { migrate } from '@/data/db';
import * as repo from '@/data/repo';
import {
  defaultReps,
  isTimed,
  mkPlan,
  ownPlan,
  repsStep,
  repsText,
  repsUnit,
  restText,
  schemeText,
  withDayCycled,
  withItemMoved,
  withStrengthChange,
  withWeeklyFromDays,
  withoutRoutine,
  workoutsPerWeek,
  workoutsText,
} from '@/domain/plan';
import { makeSession } from '@/domain/session';
import { logSet } from '@/domain/strength';
import type { Profile, StrengthItem, StrengthSession } from '@/domain/types';

import { memoryDb } from './nodeDb';

test('build my own: one empty routine per chosen day, named after it', () => {
  const p = ownPlan([3, 0, 2, 0], DAYS_FULL); // Thu, Mon, Wed (duplicate Mon ignored)
  assert.deepEqual(p.days, ['A', null, 'B', 'C', null, null, null]);
  assert.deepEqual(p.routines, {
    A: { name: 'Monday', items: [] },
    B: { name: 'Wednesday', items: [] },
    C: { name: 'Thursday', items: [] },
  });
  assert.equal(workoutsPerWeek(p), 3);
  assert.equal(p.weekly, 3);
  assert.equal(workoutsText(p), '3 workouts a week');
});

test('workouts a week follow the days, stored within the old 2–6 range', () => {
  const one = ownPlan([4], DAYS_FULL);
  assert.equal(workoutsPerWeek(one), 1);
  assert.equal(one.weekly, 2, 'stored value stays valid for the database');
  assert.equal(workoutsText(one), '1 workout a week');
  const all = ownPlan([0, 1, 2, 3, 4, 5, 6], DAYS_FULL);
  assert.equal(workoutsPerWeek(all), 7);
  assert.equal(all.weekly, 6);
  const cycled = withWeeklyFromDays(withDayCycled(mkPlan(3), 1)); // Tue becomes A
  assert.equal(cycled.weekly, 4);
});

test('deleting a routine frees its days', () => {
  const p = withoutRoutine(mkPlan(6), 'A'); // A was Mon and Sat
  assert.equal('A' in p.routines, false);
  assert.deepEqual(p.days, [null, 'B', 'C', 'D', 'E', null, null]);
  assert.equal(workoutsPerWeek(p), 4);
});

test('moving exercises up and down', () => {
  const r = mkPlan(3).routines.A; // bench, incline, fly, pushdown
  const down = withItemMoved(r, 0, 1);
  assert.deepEqual(down.items.map((i) => i.ex), ['incline', 'bench', 'fly', 'pushdown']);
  const up = withItemMoved(r, 3, -1);
  assert.deepEqual(up.items.map((i) => i.ex), ['bench', 'incline', 'pushdown', 'fly']);
  assert.equal(withItemMoved(r, 0, -1), r, 'first item cannot move up');
  assert.equal(withItemMoved(r, 3, 1), r, 'last item cannot move down');
});

test('rep range and rest steppers', () => {
  let it: StrengthItem = { ex: 'squat', sets: 3, reps: 6 };
  assert.equal(schemeText(it), '3 × 6');
  it = withStrengthChange(it, 'repsMax', 1, 120);
  it = withStrengthChange(it, 'repsMax', 1, 120);
  assert.deepEqual(it, { ex: 'squat', sets: 3, reps: 6, repsMax: 8 });
  assert.equal(schemeText(it), '3 × 6–8');
  // Raising the bottom past the top drags the top along.
  it = withStrengthChange(withStrengthChange(withStrengthChange(it, 'reps', 1, 120), 'reps', 1, 120), 'reps', 1, 120);
  assert.deepEqual(it, { ex: 'squat', sets: 3, reps: 9 });
  assert.equal(repsText(it), '9');
  // The top never goes below the bottom.
  assert.deepEqual(withStrengthChange(it, 'repsMax', -1, 120), { ex: 'squat', sets: 3, reps: 9 });
  assert.deepEqual(withStrengthChange({ ex: 'x', sets: 1, reps: 1 }, 'reps', -1, 120), { ex: 'x', sets: 1, reps: 1 });
  // Rest starts from the profile setting and moves in 15 s steps, 15 s – 10 min.
  assert.equal(withStrengthChange(it, 'rest', 15, 120).rest, 135);
  assert.equal(withStrengthChange({ ...it, rest: 15 }, 'rest', -15, 120).rest, 15);
  assert.equal(withStrengthChange({ ...it, rest: 600 }, 'rest', 15, 120).rest, 600);
  assert.equal(restText(60), '60 s');
  assert.equal(restText(90), '90 s');
  assert.equal(restText(120), '2:00');
  assert.equal(restText(150), '2:30');
});

test('a session uses the bottom of the range and the exercise rest', () => {
  const plan = mkPlan(3);
  plan.routines.A = {
    name: 'Push',
    items: [
      { ex: 'bench', sets: 3, reps: 6, repsMax: 8, rest: 150 },
      { ex: 'lateral', sets: 3, reps: 12 },
    ],
  };
  let s = makeSession(plan, 0, '2026-11-09', 0, { lastKg: {}, bestKg: {} }) as StrengthSession;
  assert.equal(s.ex[0].sets[0].r, 6);
  assert.equal(s.ex[0].repsMax, 8);
  assert.equal(s.ex[0].rest, 150);
  assert.equal(s.ex[1].rest, undefined);
  s = logSet(s, 1000, s.ex[0].rest ?? 120);
  assert.deepEqual(s.rest, { end: 151000, total: 150000 });
});

test('own plans, ranges and rest survive the database', async () => {
  const db = memoryDb();
  await migrate(db);
  const plan = ownPlan([4], DAYS_FULL); // one training day
  plan.routines.A = { name: 'Friday', items: [{ ex: 'squat', sets: 3, reps: 6, repsMax: 8, rest: 180 }] };
  const p: Profile = { id: 'p1', name: 'M', color: '#fff', height: 181, weight: 74, goal: 'muscle', target: 80, photoUri: null, plan, createdAt: 0 };
  await repo.createProfile(db, p, '2026-11-09');
  let [loaded] = await repo.loadProfiles(db);
  assert.deepEqual(loaded.profile.plan.routines.A.items[0], { ex: 'squat', sets: 3, reps: 6, repsMax: 8, rest: 180 });
  assert.equal(workoutsPerWeek(loaded.profile.plan), 1);

  // Deleting the only routine leaves no training days; still a valid save.
  await repo.savePlan(db, 'p1', withoutRoutine(loaded.profile.plan, 'A'));
  [loaded] = await repo.loadProfiles(db);
  assert.deepEqual(loaded.profile.plan.routines, {});
  assert.equal(workoutsPerWeek(loaded.profile.plan), 0);
});

test('plank is held in seconds; other exercises count reps', () => {
  assert.equal(isTimed('plank'), true);
  assert.equal(isTimed('bench'), false);
  assert.equal(repsUnit('plank'), 'sec');
  assert.equal(repsUnit('squat'), 'reps');
  assert.equal(repsStep('plank'), 5);
  assert.equal(repsStep('squat'), 1);
  assert.equal(defaultReps('plank'), 30);
  assert.equal(defaultReps('bench'), 10);
  assert.equal(schemeText({ ex: 'plank', sets: 3, reps: 30 }), '3 × 30 s');
  assert.equal(schemeText({ ex: 'plank', sets: 3, reps: 30, repsMax: 45 }), '3 × 30–45 s');
  assert.equal(schemeText({ ex: 'bench', sets: 3, reps: 8 }), '3 × 8');
});
