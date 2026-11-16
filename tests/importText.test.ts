import assert from 'node:assert/strict';
import { test } from 'node:test';

import { matchExercise, parseRoutineText, withImportedRoutine } from '@/domain/importText';
import { mkPlan } from '@/domain/plan';

test('exercise names: exact, plural, aliases and unknown', () => {
  assert.equal(matchExercise('Bench press'), 'bench');
  assert.equal(matchExercise('bench presses'), 'bench');
  assert.equal(matchExercise('Seated Cable Row'), 'cablerow');
  assert.equal(matchExercise('Triceps pushdowns'), 'pushdown');
  assert.equal(matchExercise('Pull-ups'), 'pullup');
  assert.equal(matchExercise('Squat'), 'squat');
  assert.equal(matchExercise('RDL'), 'rdl');
  assert.equal(matchExercise('Calf raises'), 'calf');
  assert.equal(matchExercise('Seated dumbbell press'), 'dbpress', 'the most specific name wins');
  assert.equal(matchExercise('Leg extension'), null);
  assert.equal(matchExercise('Push day'), null);
});

test('one exercise per line, with name and days', () => {
  const r = parseRoutineText(
    [
      'Push day',
      'Monday, Thursday',
      '1. Bench press 4 x 8, 90 s rest',
      '- Incline dumbbell press 3x10-12 @ 24 kg',
      'Lateral raise 3 sets, 15 reps, rest 1:15',
      'Plank 3 x 45',
      'Leg extension 3 x 12',
      'Treadmill run 20 min',
    ].join('\n'),
  );
  assert.equal(r.name, 'Push day');
  assert.deepEqual(r.days, [0, 3]);
  assert.deepEqual(r.items, [
    { ex: 'bench', sets: 4, reps: 8, rest: 90 },
    { ex: 'incline', sets: 3, reps: 10, repsMax: 12 },
    { ex: 'lateral', sets: 3, reps: 15, rest: 75 },
    { ex: 'plank', sets: 3, reps: 45 },
  ]);
  assert.deepEqual(r.unknown.map((u) => u.reason), ['Not in the exercise library', 'Cardio: add it to a cardio routine']);
});

test('name line followed by a details line (SmartGym style), defaults and limits', () => {
  const r = parseRoutineText(
    ['Routine A', 'Mon, Thu', 'Seated Cable Row', '4 sets, 8 reps, 60lbs, 75s rest', 'Calf raise', 'Bench press 40 x 300, 20 min rest'].join('\n'),
  );
  assert.equal(r.name, 'Routine A');
  assert.deepEqual(r.days, [0, 3]);
  assert.deepEqual(r.items, [
    { ex: 'cablerow', sets: 4, reps: 8, rest: 75 },
    { ex: 'calf', sets: 3, reps: 10 },
    { ex: 'bench', sets: 20, reps: 100, rest: 600 },
  ]);
  assert.deepEqual(parseRoutineText('   \n  '), { name: null, days: [], items: [], unknown: [] });
});

test('the imported routine takes the next free key and the named days', () => {
  const plan = mkPlan(3); // A Mon, B Wed, C Fri
  const r = parseRoutineText('Push day\nMonday, Thursday\nBench press 4 x 8');
  const res = withImportedRoutine(plan, r)!;
  assert.equal(res.key, 'D');
  assert.deepEqual(res.plan.routines.D, { name: 'Push day', items: [{ ex: 'bench', sets: 4, reps: 8 }] });
  assert.equal(res.plan.days[0], 'D');
  assert.equal(res.plan.days[3], 'D');
  assert.equal(res.plan.days[2], plan.days[2], 'other days unchanged');
  const unnamed = withImportedRoutine(plan, parseRoutineText('Bench press 3x5'))!;
  assert.equal(unnamed.plan.routines.D.name, 'Imported routine');
  assert.deepEqual(unnamed.plan.days, plan.days, 'no days named: schedule unchanged');
  const full = { ...plan, routines: Object.fromEntries('ABCDEFGH'.split('').map((k) => [k, { name: k, items: [] }])) };
  assert.equal(withImportedRoutine(full, r), null);
});
