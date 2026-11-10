// Weekly plan rules ported from schedule / mkPlan / routineMeta / setWeekly /
// toggleDay / addRoutine in the prototype.

import { PATTERNS, exercise, routinesDefault } from '@/data/catalog';

import { plural } from './format';
import type { Plan, Routine, RoutineKey, StrengthItem } from './types';

export const MIN_WEEKLY = 2;
export const MAX_WEEKLY = 6;
const MAX_ROUTINES = 8;

/** Assigns routine keys round-robin to the weekdays in PATTERNS[n]. */
export function schedule(n: number, keys: RoutineKey[]): (RoutineKey | null)[] {
  const days: (RoutineKey | null)[] = [null, null, null, null, null, null, null];
  if (keys.length) PATTERNS[n].forEach((x, i) => (days[x] = keys[i % keys.length]));
  return days;
}

/** Plan generated during onboarding for `n` workouts a week. */
export function mkPlan(n: number): Plan {
  const routines = routinesDefault();
  const keys = n <= 3 ? ['A', 'B', 'C'] : n === 4 ? ['A', 'B', 'C', 'D'] : ['A', 'B', 'C', 'D', 'E'];
  if (n <= 3) delete routines.D;
  return { weekly: n, days: schedule(n, keys), routines };
}

export const sortedKeys = (plan: Plan) => Object.keys(plan.routines).sort();

/** Changing workouts per week rebuilds the schedule from all routines. */
export function withWeekly(plan: Plan, n: number): Plan {
  return { ...plan, weekly: n, days: schedule(n, sortedKeys(plan)) };
}

/** Tapping a day cycles A → B → … → rest → A. */
export function withDayCycled(plan: Plan, i: number): Plan {
  const keys: (RoutineKey | null)[] = [...sortedKeys(plan), null];
  const days = [...plan.days];
  days[i] = keys[(keys.indexOf(days[i]) + 1) % keys.length];
  return { ...plan, days };
}

/** First free key A–H, or null when all 8 are taken. */
export function nextRoutineKey(plan: Plan): RoutineKey | null {
  for (let i = 0; i < MAX_ROUTINES; i++) {
    const k = String.fromCharCode(65 + i);
    if (!(k in plan.routines)) return k;
  }
  return null;
}

export function newRoutine(type: 'strength' | 'cardio'): Routine {
  return type === 'cardio' ? { name: 'New cardio', type: 'cardio', items: [] } : { name: 'New routine', items: [] };
}

export type RoutineMeta = {
  /** Number of exercises / activities. */
  n: number;
  /** "4 exercises, 16 sets" or "3 activities, 45 min". */
  text: string;
  /** Estimated or planned minutes. */
  min: number;
  /** Home hero / day detail line: "…, about 60 min". */
  long: string;
  /** Workout list and plan list line. */
  list: string;
};

export function routineMeta(r: Routine): RoutineMeta {
  const n = r.items.length;
  if (r.type === 'cardio') {
    const t = r.items.reduce((a, b) => a + b.min, 0);
    const text = `${n} ${n === 1 ? 'activity' : 'activities'}, ${t} min`;
    const pre = /cardio/i.test(r.name) ? '' : 'Cardio, ';
    return { n, text, min: t, long: pre + text, list: pre + text };
  }
  const s = r.items.reduce((a, b) => a + b.sets, 0);
  const text = `${plural(n, 'exercise')}, ${plural(s, 'set')}`;
  const min = Math.max(10, Math.round((s * 3.6) / 5) * 5);
  return { n, text, min, long: `${text}, about ${min} min`, list: text };
}

/** Number of days in the schedule that have a routine. */
export const assignedDays = (plan: Plan) => plan.days.filter(Boolean).length;

// ── Building your own plan ──────────────────────────────────────────────────

/** Workouts a week = the days that have a routine (chosen by tapping days, not set separately). */
export const workoutsPerWeek = assignedDays;

/** "3 workouts a week" / "1 workout a week". */
export const workoutsText = (plan: Plan) => `${plural(workoutsPerWeek(plan), 'workout')} a week`;

/**
 * The stored `weekly` value follows the schedule. The database keeps it within
 * 2–6 (its original range), so 0, 1 or 7 training days are stored as 2 or 6;
 * screens always show `workoutsPerWeek`, never this number.
 */
export function withWeeklyFromDays(plan: Plan): Plan {
  return { ...plan, weekly: Math.min(MAX_WEEKLY, Math.max(MIN_WEEKLY, workoutsPerWeek(plan))) };
}

/**
 * "Build my own" from onboarding: one empty strength routine per chosen day,
 * named after the day, in weekday order (Monday → A, Wednesday → B…).
 */
export function ownPlan(days: number[], dayNames: readonly string[]): Plan {
  const sorted = [...new Set(days)].filter((d) => d >= 0 && d < 7).sort((a, b) => a - b);
  const plan: Plan = { weekly: MIN_WEEKLY, days: [null, null, null, null, null, null, null], routines: {} };
  sorted.slice(0, MAX_ROUTINES).forEach((d, i) => {
    const k = String.fromCharCode(65 + i);
    plan.routines[k] = { name: dayNames[d], items: [] };
    plan.days[d] = k;
  });
  return withWeeklyFromDays(plan);
}

/** Removes a routine and turns the days it had into rest days. */
export function withoutRoutine(plan: Plan, key: RoutineKey): Plan {
  const routines = { ...plan.routines };
  delete routines[key];
  return withWeeklyFromDays({ ...plan, routines, days: plan.days.map((k) => (k === key ? null : k)) });
}

/** Moves item `i` of a routine one place up (−1) or down (+1). */
export function withItemMoved(r: Routine, i: number, dir: -1 | 1): Routine {
  const j = i + dir;
  if (i < 0 || i >= r.items.length || j < 0 || j >= r.items.length) return r;
  const items = [...r.items] as typeof r.items;
  [items[i], items[j]] = [items[j], items[i]];
  return { ...r, items } as Routine;
}

/** Reps as written in a plan: "8", "6–8", or "30 s" for holds. */
export const repsText = (it: StrengthItem) => {
  const n = it.repsMax != null && it.repsMax > it.reps ? `${it.reps}–${it.repsMax}` : String(it.reps);
  return isTimed(it.ex) ? `${n} s` : n;
};

/** Held for time (plank): "reps" are seconds. */
export const isTimed = (exId: string) => !!exercise(exId)?.timed;

/** What the reps number counts, as a short label. */
export const repsUnit = (exId: string) => (isTimed(exId) ? 'sec' : 'reps');

/** Stepper increment for reps: 5 seconds for holds, otherwise 1 rep. */
export const repsStep = (exId: string) => (isTimed(exId) ? 5 : 1);

/** Starting reps when an exercise is added to a routine. */
export const defaultReps = (exId: string) => (isTimed(exId) ? 30 : 10);

/** Sets × reps: "4 × 6" or "3 × 6–8". */
export const schemeText = (it: StrengthItem) => `${it.sets} × ${repsText(it)}`;

/** Rest in the editor and log: "90 s", "2:00", "2:30". */
export function restText(seconds: number): string {
  if (seconds < 120) return `${seconds} s`;
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

export const REST_STEP = 15;
export const REST_MIN = 15;
export const REST_MAX = 600;

export type StrengthField = 'sets' | 'reps' | 'repsMax' | 'rest';

/**
 * Routine editor steppers for a strength exercise. Sets and reps stay ≥ 1, the
 * top of the range never drops below the bottom (a range equal at both ends is a
 * single number), and rest moves within 15 s – 10 min starting from `defaultRest`.
 */
export function withStrengthChange(it: StrengthItem, f: StrengthField, d: number, defaultRest: number): StrengthItem {
  const { repsMax: _max, ...rest } = it;
  const top = it.repsMax ?? it.reps;
  const withRange = (min: number, max: number): StrengthItem => (max > min ? { ...rest, reps: min, repsMax: max } : { ...rest, reps: min });
  switch (f) {
    case 'sets':
      return { ...it, sets: Math.max(1, it.sets + d) };
    case 'reps': {
      const min = Math.max(1, it.reps + d);
      return withRange(min, Math.max(min, top));
    }
    case 'repsMax':
      return withRange(it.reps, Math.max(it.reps, top + d));
    case 'rest':
      return { ...it, rest: Math.min(REST_MAX, Math.max(REST_MIN, (it.rest ?? defaultRest) + d)) };
  }
}
