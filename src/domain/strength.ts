// Strength logging rules ported from setVal / adj / logSet / goEx / addSet /
// press / finish in the prototype. All functions return a new session.

import { r2 } from './format';
import type { LoggedSet, StrengthSession } from './types';

const clone = (s: StrengthSession): StrengthSession => JSON.parse(JSON.stringify(s));

export type Field = 'w' | 'r';

/** The selected set of the current exercise, or null when every set is done. */
export function currentSet(s: StrengthSession) {
  return s.sel >= 0 ? (s.ex[s.cur]?.sets[s.sel] ?? null) : null;
}

/** Sets a value on the selected set. A new weight is copied to the undone sets after it. */
export function setValue(s: StrengthSession, f: Field, v: number): StrengthSession {
  const n = clone(s);
  const e = n.ex[n.cur];
  const set = e?.sets[n.sel];
  if (!set) return s;
  set[f] = v;
  if (f === 'w') e.sets.forEach((x, i) => i > n.sel && !x.done && (x.w = v));
  return n;
}

/** Stepper / ruler change: reps stay ≥ 1, weight ≥ 0. */
export function adjust(s: StrengthSession, f: Field, delta: number): StrengthSession {
  const set = currentSet(s);
  if (!set) return s;
  const v = f === 'r' ? Math.max(1, set.r + delta) : Math.max(0, r2(set.w + delta));
  return setValue(s, f, v);
}

/**
 * Logs the selected set: marks it done, flags a PR when the weight beats the best
 * before it (history and this session's other done sets; only when there is
 * history), selects the next undone set and starts the rest timer.
 */
export function logSet(s: StrengthSession, now: number, restSeconds: number): StrengthSession {
  const n = clone(s);
  const e = n.ex[n.cur];
  const set = e?.sets[n.sel];
  if (!set) return s;
  const best = e.best ?? 0;
  const prev = Math.max(best, ...e.sets.filter((x) => x.done && x !== set).map((x) => x.w));
  set.pr = best > 0 && set.w > prev;
  set.done = true;
  n.sel = e.sets.findIndex((x) => !x.done);
  n.rest = { end: now + restSeconds * 1000, total: restSeconds * 1000 };
  return n;
}

/** Previous / next exercise (`d` = −1 / +1), selecting its first undone set. */
export function goExercise(s: StrengthSession, d: number): StrengthSession {
  const n = clone(s);
  n.cur = Math.max(0, Math.min(n.ex.length - 1, n.cur + d));
  n.sel = n.ex[n.cur].sets.findIndex((x) => !x.done);
  return n;
}

export function selectSet(s: StrengthSession, i: number): StrengthSession {
  return { ...s, sel: i };
}

/** Adds a set copying the last one (or 0 kg × target reps) and selects it. */
export function addSet(s: StrengthSession): StrengthSession {
  const n = clone(s);
  const e = n.ex[n.cur];
  const last = e.sets[e.sets.length - 1];
  e.sets.push({ w: last ? last.w : 0, r: last ? last.r : e.reps, done: false, pr: false });
  n.sel = e.sets.length - 1;
  return n;
}

/** +30 s on the rest timer. */
export function addRest(s: StrengthSession, ms: number): StrengthSession {
  return s.rest ? { ...s, rest: { end: s.rest.end + ms, total: s.rest.total + ms } } : s;
}

export const skipRest = (s: StrengthSession): StrengthSession => ({ ...s, rest: null });

/** True when every set of exercise `i` is done (progress segment turns ink). */
export const exerciseDone = (s: StrengthSession, i: number) => {
  const sets = s.ex[i]?.sets ?? [];
  return sets.length > 0 && sets.every((x) => x.done);
};

// ── Keypad ──────────────────────────────────────────────────────────────────

/**
 * Keypad typing (`press` in the prototype). `text` is what has been typed into
 * the focused field so far (null = nothing yet). Returns the new text and value,
 * or null when the key is ignored.
 */
export function keypad(text: string | null, key: string, f: Field): { text: string; value: number } | null {
  let t = text ?? '';
  if (key === 'del') t = t.slice(0, -1);
  else if (key === '.') {
    if (f === 'r' || t.includes('.')) return null;
    t = (t || '0') + '.';
  } else {
    if (t.replace('.', '').length >= 4) return null;
    t = t === '0' ? key : t + key;
  }
  const v = parseFloat(t || '0') || 0;
  return { text: t, value: f === 'r' ? Math.round(v) : v };
}

// ── Finishing ───────────────────────────────────────────────────────────────

/** Done sets to store, numbered per exercise. */
export function loggedSets(s: StrengthSession): LoggedSet[] {
  const out: LoggedSet[] = [];
  for (const e of s.ex) {
    let no = 0;
    for (const x of e.sets) if (x.done) out.push({ exId: e.id, setNo: ++no, kg: x.w, reps: x.r, pr: x.pr });
  }
  return out;
}

/** Volume = Σ kg × reps over logged sets. */
export const volume = (sets: { kg: number; reps: number }[]) => sets.reduce((a, x) => a + x.kg * x.reps, 0);
