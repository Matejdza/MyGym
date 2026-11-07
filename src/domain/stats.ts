// "Your numbers" on the exercise page (exVals in the prototype), from real history.

import { estimated1RM, fmt, mmss } from './format';
import type { Exercise } from './types';

export type StatRow = { k: string; v: string };

export type ExerciseHistory = {
  /** Strength: heaviest set ever. */
  best: { kg: number; reps: number } | null;
  /** Strength: sets from the most recent workout. */
  last: { kg: number; reps: number }[];
  /** Cardio: most recent entry and best value. */
  lastCardio: { minutes: number; value: number } | null;
  bestCardio: number;
};

/** Rows for "Your numbers", or null when there is nothing to show yet (section hidden). */
export function exerciseStats(e: Exercise, h: ExerciseHistory): StatRow[] | null {
  if (e.kind === 'cardio') {
    const L = h.lastCardio;
    if (!L) return null;
    const km = e.unit === 'km';
    const rows: StatRow[] = [
      { k: 'Last time', v: `${L.minutes} min, ${fmt(L.value)} ${e.unit}` },
      { k: km ? 'Best distance' : 'Best session', v: `${fmt(h.bestCardio)} ${e.unit}` },
    ];
    // Pace needs a distance; rate needs minutes.
    if (km && L.value > 0) rows.push({ k: 'Average pace', v: `${mmss((L.minutes * 60000) / L.value)} per km` });
    if (!km && L.minutes > 0) rows.push({ k: 'Average rate', v: `${fmt(Math.round((L.value / L.minutes) * 10) / 10)} floors per min` });
    return rows;
  }
  if (e.bodyweight || !h.best || !h.last.length) return null;
  const lastKg = Math.max(...h.last.map((x) => x.kg));
  return [
    { k: 'Best set', v: `${fmt(h.best.kg)} kg × ${h.best.reps}` },
    { k: 'Last time', v: `${h.last.length} × ${h.last[0].reps} × ${fmt(lastKg)} kg` },
    { k: 'Estimated 1RM', v: `${fmt(estimated1RM(h.best.kg, h.best.reps))} kg` },
  ];
}
