import assert from 'node:assert/strict';
import { test } from 'node:test';

import { EX, EXERCISE_IDS, GOALS, ZONES, routinesDefault } from '@/data/catalog';
import { dayIndex, fullDate, shortDate, weekStartOf, addDays, dateInWeek } from '@/domain/dates';
import { estimated1RM, fmt, mmss, plural, thou } from '@/domain/format';
import { makeSession, canStart } from '@/domain/session';
import type { CardioSession, StrengthSession } from '@/domain/types';
import { weekCells } from '@/domain/week';
import { colors } from '@/theme/tokens';
import { mkPlan, nextRoutineKey, routineMeta, schedule, withDayCycled, withWeekly } from '@/domain/plan';

test('catalog matches the prototype', () => {
  assert.equal(EXERCISE_IDS.length, 26);
  assert.equal(EXERCISE_IDS.filter((id) => EX[id].group === 'cardio').length, 5);
  assert.equal(EX.bench.steps[1], 'Grip slightly wider than your shoulders. Lower the bar to the lower chest, elbows at about 45°.');
  assert.equal(EX.stairs.unit, 'floors');
  assert.equal(EX.stairs.step, 1);
  assert.deepEqual(
    EXERCISE_IDS.filter((id) => 'bodyweight' in EX[id]),
    ['legraise', 'abwheel'],
  );
  assert.equal(ZONES[2], 'Easy, you can hold a conversation');
  assert.equal(GOALS[1].description, 'Heavier lifts on the main exercises');
});

test('mkPlan matches prototype schedules', () => {
  assert.deepEqual(mkPlan(2).days, ['A', null, null, 'B', null, null, null]);
  assert.deepEqual(mkPlan(3).days, ['A', null, 'B', null, 'C', null, null]);
  assert.deepEqual(mkPlan(4).days, ['A', 'B', null, 'C', 'D', null, null]);
  assert.deepEqual(mkPlan(5).days, ['A', 'B', 'C', null, 'D', 'E', null]);
  assert.deepEqual(mkPlan(6).days, ['A', 'B', 'C', 'D', 'E', 'A', null]);
  assert.deepEqual(Object.keys(mkPlan(3).routines).sort(), ['A', 'B', 'C', 'E']);
  assert.deepEqual(Object.keys(mkPlan(4).routines).sort(), ['A', 'B', 'C', 'D', 'E']);
  assert.deepEqual(schedule(3, []), [null, null, null, null, null, null, null]);
});

test('routineMeta copy', () => {
  const r = routinesDefault();
  assert.equal(routineMeta(r.D).long, '5 exercises, 16 sets, about 60 min');
  assert.equal(routineMeta(r.A).list, '4 exercises, 13 sets');
  assert.equal(routineMeta(r.E).long, '3 activities, 45 min');
  assert.equal(routineMeta({ name: 'Easy day', type: 'cardio', items: [{ ex: 'bike', min: 15, zone: 2 }] }).list, 'Cardio, 1 activity, 15 min');
  assert.equal(routineMeta({ name: 'New routine', items: [] }).long, '0 exercises, 0 sets, about 10 min');
});

test('plan editing', () => {
  const p = mkPlan(3);
  assert.deepEqual(withWeekly(p, 4).days, ['A', 'B', null, 'C', 'E', null, null]);
  // Monday cycles A → B → C → E → rest → A
  let q = p;
  const seen = [];
  for (let i = 0; i < 5; i++) {
    q = withDayCycled(q, 0);
    seen.push(q.days[0]);
  }
  assert.deepEqual(seen, ['B', 'C', 'E', null, 'A']);
  assert.equal(nextRoutineKey(p), 'D');
  assert.equal(nextRoutineKey(mkPlan(5)), 'F');
});

test('dates use a Monday-first week', () => {
  const fri = new Date(2026, 10, 6);
  assert.equal(dayIndex(fri), 4);
  assert.equal(weekStartOf(fri), '2026-11-02');
  assert.equal(weekStartOf(new Date(2026, 10, 8)), '2026-11-02'); // Sunday
  assert.equal(weekStartOf(new Date(2026, 10, 9)), '2026-11-09'); // Monday
  assert.equal(fullDate(fri), 'Friday, November 6');
  assert.equal(shortDate(dateInWeek('2026-11-02', 5)), 'Nov 7');
  assert.equal(addDays('2026-12-28', 7), '2027-01-04');
});

test('format helpers', () => {
  assert.equal(fmt(82.5), '82.5');
  assert.equal(fmt(84.60000001), '84.6');
  assert.equal(thou(6885), '6,885');
  assert.equal(plural(1, 'set'), '1 set');
  assert.equal(mmss(87000), '1:27');
  assert.equal(estimated1RM(90, 6), 108);
});

test('weekCells: done, planned, today', () => {
  const plan = mkPlan(5); // A B C · D E ·
  const cells = weekCells(plan, [0, 1, 4], 4);
  assert.deepEqual(cells.map((c) => c.day), ['M', 'T', 'W', 'Th', 'F', 'Sa', 'Su']);
  assert.equal(cells[0].fill, '#ff5a3c'); // A done
  assert.deepEqual(cells[2].ring, { kind: 'inset', width: 1.5, color: '#ffc531' }); // C planned
  assert.equal(cells[3].letter, '·');
  assert.deepEqual(cells[4].ring, { kind: 'outer', width: 2, gap: 2, color: colors.accent }); // today, done
  assert.deepEqual(weekCells(plan, [], 4)[4].ring, { kind: 'inset', width: 2, color: colors.accent });
  assert.equal(cells[4].dayColor, colors.accent);
});

test('makeSession uses history, 0 kg without it', () => {
  const plan = mkPlan(5);
  const s = makeSession(plan, 0, '2026-11-02', 100, { lastKg: { bench: 62.5 }, bestKg: {} }) as StrengthSession;
  assert.equal(s.type, 'strength');
  assert.equal(s.routineName, 'Chest & triceps');
  assert.deepEqual(s.ex[0].sets[0], { w: 62.5, r: 6, done: false, pr: false });
  assert.equal(s.ex[0].sets.length, 4);
  assert.equal(s.ex[1].sets[0].w, 0);
  assert.equal(s.sel, 0);
  const c = makeSession(plan, 5, '2026-11-02', 100, { lastKg: {}, bestKg: {} }) as CardioSession;
  assert.deepEqual(c.ex[0], { id: 'treadmill', target: 20, zone: 2, min: 20, v: 0, done: false });
  assert.equal(makeSession(plan, 3, '2026-11-02', 100, { lastKg: {}, bestKg: {} }), null); // rest day
  const empty = { ...plan, routines: { ...plan.routines, A: { name: 'New routine', items: [] } } };
  assert.equal(canStart(empty, 0), false);
  assert.equal(canStart(plan, 0), true);
});

test('exercise stats from history', async () => {
  const { exerciseStats } = await import('@/domain/stats');
  const none = { best: null, last: [], lastCardio: null, bestCardio: 0 };
  assert.equal(exerciseStats(EX.bench, none), null);
  assert.equal(exerciseStats(EX.treadmill, none), null);
  assert.equal(exerciseStats(EX.legraise, { ...none, best: { kg: 0, reps: 12 }, last: [{ kg: 0, reps: 12 }] }), null);
  assert.deepEqual(
    exerciseStats(EX.bench, { ...none, best: { kg: 90, reps: 6 }, last: [{ kg: 85, reps: 6 }, { kg: 85, reps: 6 }, { kg: 85, reps: 5 }] }),
    [
      { k: 'Best set', v: '90 kg × 6' },
      { k: 'Last time', v: '3 × 6 × 85 kg' },
      { k: 'Estimated 1RM', v: '108 kg' },
    ],
  );
  assert.deepEqual(exerciseStats(EX.treadmill, { ...none, lastCardio: { minutes: 20, value: 3.4 }, bestCardio: 4.6 }), [
    { k: 'Last time', v: '20 min, 3.4 km' },
    { k: 'Best distance', v: '4.6 km' },
    { k: 'Average pace', v: '5:53 per km' },
  ]);
  assert.deepEqual(exerciseStats(EX.stairs, { ...none, lastCardio: { minutes: 15, value: 48 }, bestCardio: 62 })?.[2], {
    k: 'Average rate',
    v: '3.2 floors per min',
  });
  assert.equal(exerciseStats(EX.treadmill, { ...none, lastCardio: { minutes: 20, value: 0 }, bestCardio: 0 })?.length, 2);
});
