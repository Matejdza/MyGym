// Starting a workout (`makeSession` in the prototype), using real history
// instead of the prototype's demo weights.

import type { Plan, Session } from './types';

/** What history a new session needs per exercise: last working weight and best weight (absent = never logged). */
export type SessionHistory = { lastKg: Record<string, number>; bestKg: Record<string, number> };

export function makeSession(plan: Plan, day: number, weekStart: string, now: number, hist: SessionHistory): Session | null {
  const key = plan.days[day];
  const r = key ? plan.routines[key] : null;
  if (!key || !r) return null;
  const base = { routineKey: key, routineName: r.name, day, weekStart, startedAt: now, cur: 0 };

  if (r.type === 'cardio') {
    return {
      ...base,
      type: 'cardio',
      ex: r.items.map((it) => ({ id: it.ex, target: it.min, zone: it.zone, min: it.min, v: 0, done: false })),
      accumulatedMs: 0,
      runningSince: null,
    };
  }

  const ex = r.items.map((it) => {
    const w = hist.lastKg[it.ex] ?? 0;
    return {
      id: it.ex,
      target: it.sets,
      reps: it.reps,
      best: hist.bestKg[it.ex] ?? 0,
      ...(it.repsMax != null && it.repsMax > it.reps ? { repsMax: it.repsMax } : {}),
      ...(it.rest != null ? { rest: it.rest } : {}),
      sets: Array.from({ length: it.sets }, () => ({ w, r: it.reps, done: false, pr: false })),
    };
  });
  return { ...base, type: 'strength', sel: ex.length && ex[0].sets.length ? 0 : -1, ex, rest: null };
}

/** Exercise ids a routine needs history for. */
export const routineExercises = (plan: Plan, day: number): string[] => {
  const key = plan.days[day];
  return key && plan.routines[key] ? plan.routines[key].items.map((it) => it.ex) : [];
};

/** A routine with no exercises can't be started. */
export const canStart = (plan: Plan, day: number) => routineExercises(plan, day).length > 0;
