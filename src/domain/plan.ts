// Weekly plan rules ported from schedule / mkPlan / routineMeta / setWeekly /
// toggleDay / addRoutine in the prototype.

import { PATTERNS, routinesDefault } from '@/data/catalog';

import { plural } from './format';
import type { Plan, Routine, RoutineKey } from './types';

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
