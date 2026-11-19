// Warm-up and stretching in a live workout: a list of timed moves. The current
// move's timer can run or pause; when it runs out the move is done and the next
// one starts on its own. Nothing here is logged to history.

import type { MobilityItem, Session } from './types';

type Phase = 'warmup' | 'stretch';

export const phaseOf = (s: Session): 'warmup' | 'main' | 'stretch' => s.phase ?? 'main';

export const mobilityList = (s: Session, p: Phase): MobilityItem[] => (p === 'warmup' ? s.warmup : s.stretch) ?? [];

const withList = (s: Session, p: Phase, list: MobilityItem[]): Session => (p === 'warmup' ? { ...s, warmup: list } : { ...s, stretch: list });

/** Opens a phase at its first unfinished move, timer paused. */
export function enterPhase(s: Session, p: Phase | 'main'): Session {
  if (p === 'main') return { ...s, phase: 'main', mob: undefined };
  const list = mobilityList(s, p);
  const cur = Math.max(0, list.findIndex((x) => !x.done));
  return { ...s, phase: p, mob: { cur, end: null, left: (list[cur]?.sec ?? 0) * 1000 } };
}

/** Milliseconds left on the current move. */
export const timeLeft = (s: Session, now: number) => (!s.mob ? 0 : s.mob.end != null ? Math.max(0, s.mob.end - now) : s.mob.left);

export function startTimer(s: Session, now: number): Session {
  if (!s.mob || s.mob.end != null) return s;
  return { ...s, mob: { ...s.mob, end: now + s.mob.left } };
}

export function pauseTimer(s: Session, now: number): Session {
  if (!s.mob || s.mob.end == null) return s;
  return { ...s, mob: { ...s.mob, end: null, left: Math.max(0, s.mob.end - now) } };
}

/** Picks a move: its timer resets and waits. */
export function selectMove(s: Session, p: Phase, i: number): Session {
  const list = mobilityList(s, p);
  if (!list[i]) return s;
  return { ...s, mob: { cur: i, end: null, left: list[i].sec * 1000 } };
}

/**
 * Marks the current move done (time ran out, or Done / Skip was tapped) and
 * moves on: the next unfinished move starts right away when `run` is true.
 */
export function completeMove(s: Session, p: Phase, now: number, run: boolean): Session {
  if (!s.mob) return s;
  const list = mobilityList(s, p).map((x, i) => (i === s.mob!.cur ? { ...x, done: true } : x));
  const next = list.findIndex((x) => !x.done);
  const out = withList(s, p, list);
  if (next < 0) return { ...out, mob: { cur: s.mob.cur, end: null, left: 0 } };
  const left = list[next].sec * 1000;
  return { ...out, mob: { cur: next, end: run ? now + left : null, left } };
}

export const phaseDone = (s: Session, p: Phase) => mobilityList(s, p).every((x) => x.done);
