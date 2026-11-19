// Warm-up and stretching for a routine: 1–3 warm-up moves before the first
// exercise and 2–4 stretches after the last, picked from the muscles the
// routine works. A routine can also carry its own lists (routine.warmup /
// routine.stretch, e.g. edited by the user); those win.

import { MUSCLES, routineMuscles, type MuscleKey } from './muscles';
import type { Routine, TimedItem } from './types';

const UPPER: MuscleKey[] = ['chest', 'shoulders', 'biceps', 'triceps', 'forearms', 'lats', 'traps'];
const LOWER: MuscleKey[] = ['quads', 'hamstrings', 'glutes', 'calves'];

/** Stretch for each muscle, in order of preference. */
const STRETCH_FOR: Record<MuscleKey, string> = {
  chest: 'chestStretch',
  shoulders: 'shoulderStretch',
  biceps: 'bicepsStretch',
  triceps: 'tricepsStretch',
  forearms: 'bicepsStretch',
  lats: 'latStretch',
  traps: 'childsPose',
  lowerBack: 'childsPose',
  abs: 'cobra',
  obliques: 'spinalTwist',
  quads: 'quadStretch',
  hamstrings: 'hamStretch',
  glutes: 'glutStretch',
  calves: 'calfStretch',
};

/** How many warm-up moves: 1 for short or cardio sessions, up to 3 for long ones. */
export function warmupFor(r: Routine, minutes = 60): TimedItem[] {
  const m = routineMuscles(r).primary;
  const upper = m.some((x) => UPPER.includes(x));
  const lower = m.some((x) => LOWER.includes(x));
  const count = r.type === 'cardio' || minutes <= 45 ? 1 : minutes >= 90 ? 3 : 2;
  const list: TimedItem[] = [{ ex: r.type === 'cardio' ? 'legswings' : 'jumpingjack', sec: 60 }];
  if (upper) list.push({ ex: 'armcircles', sec: 30 });
  if (lower) list.push({ ex: 'airsquat', sec: 45 }, { ex: 'legswings', sec: 30 });
  if (!upper && !lower) list.push({ ex: 'catcow', sec: 45 });
  list.push({ ex: 'greateststretch', sec: 45 });
  return dedupe(list).slice(0, count);
}

/** Stretches for the routine's main muscles (2–4), 30 s each. */
export function stretchFor(r: Routine, minutes = 60): TimedItem[] {
  const m = routineMuscles(r).primary;
  const ids = m.map((x) => STRETCH_FOR[x]);
  if (r.type === 'cardio') ids.push('calfStretch', 'quadStretch', 'hamStretch');
  ids.push('childsPose');
  const count = minutes <= 45 ? 2 : minutes >= 90 ? 4 : 3;
  return dedupe(ids.map((ex) => ({ ex, sec: 30 }))).slice(0, count);
}

const dedupe = (l: TimedItem[]) => l.filter((x, i) => l.findIndex((y) => y.ex === x.ex) === i && MUSCLES[x.ex] != null);

/** The lists a workout uses: the routine's own, else the picked ones. */
export const routineWarmup = (r: Routine) => r.warmup ?? warmupFor(r);
export const routineStretch = (r: Routine) => r.stretch ?? stretchFor(r);
