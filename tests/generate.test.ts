import assert from 'node:assert/strict';
import { test } from 'node:test';

import { exercise } from '@/data/catalog';
import { SUGGESTED_FOCUS, generatePlan, needs, split, weekDays } from '@/domain/generate';
import * as M from '@/domain/mobilitySession';
import { routineMuscles } from '@/domain/muscles';
import { makeSession } from '@/domain/session';
import type { Setup } from '@/domain/types';

const base: Setup = {
  sex: 'female',
  goal: 'tone',
  goal2: null,
  focus: SUGGESTED_FOCUS.female,
  experience: 'beginner',
  equipment: 'gym',
  minutes: 60,
  strengthDays: 3,
  cardioDays: 2,
};

test('week: strength days spread out, cardio in the gaps, never more than 7', () => {
  assert.deepEqual(weekDays(3, 2), { strength: [0, 2, 4], cardio: [5, 6] });
  assert.deepEqual(weekDays(1, 0), { strength: [0], cardio: [] });
  const full = weekDays(6, 4);
  assert.equal(full.strength.length + full.cardio.length, 7);
});

test('split follows days, experience and focus', () => {
  assert.deepEqual(split(3, 'beginner', []), ['full', 'full', 'full']);
  assert.deepEqual(split(3, 'intermediate', ['chest']), ['push', 'pull', 'legs']);
  assert.deepEqual(split(3, 'intermediate', ['glutes']), ['lower', 'upper', 'lower']);
  assert.deepEqual(split(4, 'advanced', []), ['upper', 'lower', 'upper', 'lower']);
});

test('a generated plan: days, routines, warm-up and stretching', () => {
  const plan = generatePlan(base);
  const strengthKeys = Object.entries(plan.routines).filter(([, r]) => r.type !== 'cardio').map(([k]) => k);
  assert.equal(strengthKeys.length, 3);
  assert.equal(plan.days.filter((d) => d && plan.routines[d].type === 'cardio').length, 2);
  for (const r of Object.values(plan.routines)) {
    assert.ok(r.items.length > 0, `${r.name} has exercises`);
    assert.ok(r.warmup && r.warmup.length >= 1 && r.warmup.length <= 3, `${r.name} warm-up 1–3`);
    assert.ok(r.stretch && r.stretch.length >= 2, `${r.name} stretching`);
    for (const w of [...r.warmup!, ...r.stretch!]) assert.ok(exercise(w.ex).mobility, `${w.ex} is a warm-up or stretch move`);
  }
  // Glutes focus shows up in the lower-body work.
  const worked = Object.values(plan.routines).flatMap((r) => routineMuscles(r).primary);
  assert.ok(worked.includes('glutes'));
});

test('equipment and experience limit the exercises', () => {
  const home = generatePlan({ ...base, equipment: 'none', cardioDays: 0 });
  for (const r of Object.values(home.routines)) for (const it of r.items) assert.equal(needs(it.ex), 'none', `${it.ex} needs no equipment`);
  const dumbbells = generatePlan({ ...base, equipment: 'dumbbells', experience: 'intermediate', cardioDays: 0 });
  for (const r of Object.values(dumbbells.routines)) for (const it of r.items) assert.notEqual(needs(it.ex), 'gym', `${it.ex} works at home`);
  const beginner = generatePlan({ ...base, cardioDays: 0 });
  for (const r of Object.values(beginner.routines)) for (const it of r.items) assert.notEqual(it.ex, 'deadlift');
});

test('goals set the dose; more minutes means more exercises', () => {
  const strength = generatePlan({ ...base, goal: 'strength', experience: 'intermediate', focus: [], cardioDays: 0 });
  const first = Object.values(strength.routines)[0];
  assert.ok(first.type !== 'cardio' && first.items[0].reps <= 6);
  const short = Object.values(generatePlan({ ...base, minutes: 45, cardioDays: 0 }).routines)[0].items.length;
  const long = Object.values(generatePlan({ ...base, minutes: 90, cardioDays: 0, experience: 'intermediate' }).routines)[0].items.length;
  assert.ok(long > short);
});

test('a workout starts with the warm-up, which runs on a timer and leads to the exercises', () => {
  const plan = generatePlan(base);
  const s = makeSession(plan, 0, '2026-11-16', 1000, { lastKg: {}, bestKg: {} })!;
  assert.equal(M.phaseOf(s), 'warmup');
  const n = s.warmup!.length;
  let x = M.startTimer(s, 1000);
  assert.equal(M.timeLeft(x, 1000 + 10_000), s.warmup![0].sec * 1000 - 10_000);
  for (let i = 0; i < n; i++) x = M.completeMove(x, 'warmup', 2000, true);
  assert.ok(M.phaseDone(x, 'warmup'));
  x = M.enterPhase(x, 'main');
  assert.equal(M.phaseOf(x), 'main');
  x = M.enterPhase(x, 'stretch');
  assert.equal(x.mob?.cur, 0);
  assert.equal(M.mobilityList(x, 'stretch').length, plan.routines[plan.days[0]!].stretch!.length);
});

test('the suggested focus follows sex first, then the main goal', async () => {
  const { suggestFocus } = await import('@/domain/generate');
  assert.deepEqual(suggestFocus('male', 'muscle'), ['chest', 'back', 'arms']);
  assert.deepEqual(suggestFocus('female', 'muscle'), ['glutes', 'legs']);
  assert.deepEqual(suggestFocus('male', 'fat'), ['full']);
  assert.deepEqual(suggestFocus('female', 'fitness'), ['full']);
  assert.deepEqual(suggestFocus('male', 'strength'), ['legs', 'back', 'chest']);
  assert.deepEqual(suggestFocus('female', 'tone'), ['glutes', 'legs', 'core']);
  assert.ok(!suggestFocus('male', 'tone').includes('glutes'), 'no glutes suggested to men by default');
});
