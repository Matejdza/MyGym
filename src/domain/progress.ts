// Progress screen data from real history: weekly series, chart geometry
// (`chart` in the prototype) and the copy around it.

import { exercise } from '@/data/catalog';

import { addDays, parseIso, shortDate, weekStartOf } from './dates';
import { estimated1RM, fmt, r2 } from './format';
import type { BodyEntry } from './types';

export const WEEKS = 12;

/** Monday (YYYY-MM-DD) of each of the last 12 weeks, oldest first. */
export function lastWeeks(now: Date, n = WEEKS): string[] {
  const cur = weekStartOf(now);
  return Array.from({ length: n }, (_, i) => addDays(cur, -7 * (n - 1 - i)));
}

const weekLabel = (ws: string) => shortDate(parseIso(ws));

export type Row = { k: string; v: string };

export type ProgressView = {
  title: string;
  big: string;
  unit: string;
  delta: string;
  vals: number[];
  labels: string[];
  target?: number;
  rows: Row[];
};

// ── Lifts ───────────────────────────────────────────────────────────────────

export type LiftSetRow = { workoutId: number; finishedAt: number; kg: number; reps: number };

/**
 * Best set per week for one exercise. Weeks without the exercise are left out
 * (no data, not 0 kg). Null when it was never logged in the last 12 weeks.
 */
export function liftProgress(exId: string, sets: LiftSetRow[], weeks: string[]): ProgressView | null {
  const byWeek = new Map<string, LiftSetRow[]>();
  for (const s of sets) {
    const ws = weekStartOf(new Date(s.finishedAt));
    if (!weeks.includes(ws)) continue;
    byWeek.set(ws, [...(byWeek.get(ws) ?? []), s]);
  }
  const points = weeks
    .filter((ws) => byWeek.has(ws))
    .map((ws) => {
      const all = byWeek.get(ws)!;
      const top = all.reduce((a, b) => (b.kg > a.kg || (b.kg === a.kg && b.reps > a.reps) ? b : a));
      // "3 × 6 × 85 kg": sets and reps from the workout that holds the week's best set.
      const sameWorkout = all.filter((x) => x.workoutId === top.workoutId);
      return { ws, kg: top.kg, reps: top.reps, sets: sameWorkout.length };
    });
  if (!points.length) return null;

  const vals = points.map((p) => p.kg);
  const best = points.reduce((a, b) => (b.kg > a.kg ? b : a));
  const d = r2(vals[vals.length - 1] - vals[0]);
  return {
    title: `${exercise(exId).name}, best set`,
    big: fmt(best.kg),
    unit: 'kg',
    delta: `${d < 0 ? '−' : '+'}${fmt(Math.abs(d))} kg in 12 weeks`,
    vals,
    labels: points.map((p) => weekLabel(p.ws)),
    rows: [
      { k: 'Estimated 1RM', v: `${fmt(estimated1RM(best.kg, best.reps))} kg` },
      ...points
        .slice(-4)
        .reverse()
        .map((p) => ({ k: weekLabel(p.ws), v: `${p.sets} × ${p.reps} × ${fmt(p.kg)} kg` })),
    ],
  };
}

// ── Cardio ──────────────────────────────────────────────────────────────────

export type CardioRow = { finishedAt: number; exId: string; minutes: number; value: number };

/**
 * Cardio minutes per week, from the first week with cardio to this week (weeks
 * in between count as 0 min). Null when there is no cardio in the last 12 weeks.
 */
export function cardioProgress(entries: CardioRow[], weeks: string[]): ProgressView | null {
  const mins = new Map<string, number>();
  const km = new Map<string, number>();
  for (const e of entries) {
    const ws = weekStartOf(new Date(e.finishedAt));
    if (!weeks.includes(ws)) continue;
    mins.set(ws, (mins.get(ws) ?? 0) + e.minutes);
    if (exercise(e.exId)?.unit === 'km') km.set(ws, (km.get(ws) ?? 0) + e.value);
  }
  const first = weeks.findIndex((ws) => mins.has(ws));
  if (first < 0) return null;
  const span = weeks.slice(first);
  const vals = span.map((ws) => mins.get(ws) ?? 0);
  const labels = span.map(weekLabel);
  const n = vals.length;
  const d = vals[n - 1] - vals[0];
  return {
    title: 'Cardio minutes per week',
    big: String(vals[n - 1]),
    unit: 'min',
    delta: `${d < 0 ? '−' : '+'}${Math.abs(d)} min a week since ${labels[0]}`,
    vals,
    labels,
    rows: span
      .slice(-4)
      .reverse()
      .map((ws) => ({ k: `Week of ${weekLabel(ws)}`, v: `${mins.get(ws) ?? 0} min, ${fmt(r2(km.get(ws) ?? 0))} km` })),
  };
}

// ── Body weight ─────────────────────────────────────────────────────────────

/** Body weight entries of the last 12 weeks against the goal. Null without entries. */
export function bodyProgress(entries: BodyEntry[], target: number, from: string): ProgressView | null {
  const recent = entries.filter((e) => e.date >= from);
  if (!recent.length) return null;
  const vals = recent.map((e) => e.kg);
  const labels = recent.map((e) => shortDate(parseIso(e.date)));
  const cur = vals[vals.length - 1];
  return {
    title: 'Body weight',
    big: fmt(cur),
    unit: 'kg',
    delta: `${fmt(Math.abs(r2(cur - target)))} kg to your goal of ${fmt(target)} kg`,
    vals,
    labels,
    target,
    rows: vals.map((v, i) => ({ k: labels[i], v: `${fmt(v)} kg` })).slice(-4).reverse(),
  };
}

// ── Chart geometry ──────────────────────────────────────────────────────────

export type ChartGeometry = {
  d: string;
  pts: { x: number; y: number }[];
  grid: { y: number; label: string }[];
  xl: { x: number; label: string; align: 'start' | 'middle' | 'end' }[];
  last: { x: number; y: number };
  target?: { y: number; label: string };
};

/** Line chart in a `w` × 190 box (`chart` in the prototype, w = 280 there). */
export function chart(vals: number[], labels: string[], w: number, target?: number): ChartGeometry {
  const top = 14;
  const bot = 160;
  let lo = Math.min(...vals);
  let hi = Math.max(...vals);
  if (target != null) {
    lo = Math.min(lo, target);
    hi = Math.max(hi, target);
  }
  const rg = hi - lo || 1;
  const a = lo - rg * 0.12;
  const b = hi + rg * 0.12;
  const n = vals.length;
  const X = (i: number) => (n < 2 ? w / 2 : i * (w / (n - 1)));
  const Y = (v: number) => bot - ((v - a) / (b - a)) * (bot - top);
  const round1 = (v: number) => +v.toFixed(1);

  const pts = vals.map((v, i) => ({ x: round1(X(i)), y: round1(Y(v)) }));
  const mn = Math.min(...vals);
  const mx = Math.max(...vals);
  const gridVals = mn === mx ? [mn] : [mn, (mn + mx) / 2, mx];
  const grid = gridVals.map((v) => ({ y: round1(Y(v)), label: fmt(Math.round(v * 10) / 10) }));
  const xi = n < 2 ? [0] : [0, Math.floor((n - 1) / 2), n - 1].filter((v, i, arr) => arr.indexOf(v) === i);
  const xl = xi.map((i, k) => ({
    x: round1(X(i)),
    label: labels[i],
    align: (n < 2 ? 'middle' : k === 0 ? 'start' : i === n - 1 ? 'end' : 'middle') as 'start' | 'middle' | 'end',
  }));
  const geo: ChartGeometry = {
    d: 'M' + pts.map((p) => `${p.x} ${p.y}`).join(' L'),
    pts,
    grid,
    xl,
    last: pts[n - 1],
  };
  if (target != null) geo.target = { y: round1(Y(target)), label: `goal ${fmt(target)}` };
  return geo;
}
