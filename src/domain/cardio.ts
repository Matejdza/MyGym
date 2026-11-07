// Cardio logging rules ported from cElapsed / cToggle / cGo / cAdj / cLog /
// finish in the prototype. All functions return a new session.

import { exercise } from '@/data/catalog';

import { fmt, mmss, r2, thou } from './format';
import type { CardioSession, LoggedCardio, LoggedSet } from './types';

const clone = (s: CardioSession): CardioSession => JSON.parse(JSON.stringify(s));

/** Activity timer: banked time plus the running stretch. */
export const elapsed = (s: CardioSession, now: number) => s.accumulatedMs + (s.runningSince != null ? now - s.runningSince : 0);

/** Start / Pause / Resume. */
export function toggleTimer(s: CardioSession, now: number): CardioSession {
  if (s.runningSince != null) return { ...s, accumulatedMs: s.accumulatedMs + now - s.runningSince, runningSince: null };
  return { ...s, runningSince: now };
}

export const resetTimer = (s: CardioSession): CardioSession => ({ ...s, accumulatedMs: 0, runningSince: null });

export const timerLabel = (s: CardioSession) => (s.runningSince != null ? 'Pause' : s.accumulatedMs > 0 ? 'Resume' : 'Start timer');

/** Switches to activity `i`; the timer starts over for it. */
export function goActivity(s: CardioSession, i: number): CardioSession {
  if (i < 0 || i >= s.ex.length || i === s.cur) return s;
  return { ...s, cur: i, accumulatedMs: 0, runningSince: null };
}

/** Minutes stay ≥ 1, distance / floors ≥ 0. */
export function adjustActivity(s: CardioSession, f: 'min' | 'v', d: number): CardioSession {
  const n = clone(s);
  const a = n.ex[n.cur];
  if (f === 'min') a.min = Math.max(1, a.min + d);
  else a.v = Math.max(0, r2(a.v + d));
  return n;
}

/** Stores the current activity and jumps to the next undone one. */
export function logActivity(s: CardioSession): CardioSession {
  const n = clone(s);
  n.ex[n.cur].done = true;
  const next = n.ex.findIndex((x) => !x.done);
  if (next >= 0) {
    n.cur = next;
    n.accumulatedMs = 0;
    n.runningSince = null;
  }
  return n;
}

export const allDone = (s: CardioSession) => s.ex.every((x) => x.done);

/** Logged activities to store. */
export const loggedCardio = (s: CardioSession): LoggedCardio[] =>
  s.ex.filter((x) => x.done).map((x) => ({ exId: x.id, minutes: x.min, value: x.v, zone: x.zone, target: x.target }));

// ── Workout done ────────────────────────────────────────────────────────────

export type Summary = {
  /** Three stat tiles. */
  rows: { k: string; v: string }[];
  /** "New records" or "Activities". */
  listTitle: string;
  list: { n: string; v: string }[];
};

/** Strength: Time / Sets / Volume and the new records. */
export function strengthSummary(sets: LoggedSet[], durationMs: number): Summary {
  const vol = sets.reduce((a, x) => a + x.kg * x.reps, 0);
  return {
    rows: [
      { k: 'Time', v: mmss(durationMs) },
      { k: 'Sets', v: String(sets.length) },
      { k: 'Volume', v: `${thou(vol)} kg` },
    ],
    listTitle: 'New records',
    list: sets.filter((x) => x.pr).map((x) => ({ n: exercise(x.exId)?.name ?? x.exId, v: `${fmt(x.kg)} kg × ${x.reps}` })),
  };
}

/** Cardio: Time / Distance / Activities and each logged activity. */
export function cardioSummary(entries: LoggedCardio[], planned: number): Summary {
  const mins = entries.reduce((a, x) => a + x.minutes, 0);
  const km = entries.filter((x) => exercise(x.exId)?.unit === 'km').reduce((a, x) => a + x.value, 0);
  return {
    rows: [
      { k: 'Time', v: `${mins} min` },
      { k: 'Distance', v: `${fmt(r2(km))} km` },
      { k: 'Activities', v: `${entries.length} of ${planned}` },
    ],
    listTitle: 'Activities',
    list: entries.map((x) => ({ n: exercise(x.exId)?.name ?? x.exId, v: `${x.minutes} min, ${fmt(x.value)} ${exercise(x.exId)?.unit ?? ''}` })),
  };
}
