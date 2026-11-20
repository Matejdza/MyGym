import { onLang } from '@/i18n';
import { colors, plate } from '@/theme/tokens';

import { dateInWeek, isoDate } from './dates';
import type { Plan, RoutineKey } from './types';

/** Week-strip day labels from the prototype: M T W Th F Sa Su. */
export const DAY_LETTERS = ['M', 'T', 'W', 'Th', 'F', 'Sa', 'Su'];
const LETTERS = { en: [...DAY_LETTERS], sr: ['Po', 'Ut', 'Sr', 'Če', 'Pe', 'Su', 'Ne'] };
onLang((l) => LETTERS[l].forEach((x, i) => (DAY_LETTERS[i] = x)));

/** One-letter day names for the week strips on Home and Progress (owner, 2026-11-20). */
export const DAY_INITIALS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const INITIALS = { en: [...DAY_INITIALS], sr: ['P', 'U', 'S', 'Č', 'P', 'S', 'N'] };
onLang((l) => INITIALS[l].forEach((x, i) => (DAY_INITIALS[i] = x)));

/** How a day circle is outlined (CSS box-shadow equivalents). */
export type CellRing =
  | { kind: 'none' }
  | { kind: 'inset'; width: number; color: string }
  /** Today and done: `0 0 0 2px bg, 0 0 0 4px accent` — a ring outside the circle. */
  | { kind: 'outer'; width: number; gap: number; color: string };

export type WeekCell = {
  day: string;
  letter: string;
  key: RoutineKey | null;
  fill: string;
  text: string;
  dayColor: string;
  ring: CellRing;
  /** Done: a check mark instead of the text. */
  check?: boolean;
};

/**
 * Home "This week" strip (`weekCells` in the prototype): filled with the accent
 * when done, a neutral ring when planned, accent ring on today.
 */
export function weekCells(plan: Plan, done: number[], today: number | null): WeekCell[] {
  return DAY_LETTERS.map((day, i) => {
    const k = plan.days[i];
    const isDone = !!k && done.includes(i);
    const isToday = today === i;
    let ring: CellRing = { kind: 'none' };
    // Today done: just the green check, no second color around it (owner, 2026-11-20).
    if (isToday) ring = isDone ? { kind: 'none' } : { kind: 'inset', width: 2, color: colors.accent };
    else if (k && !isDone) ring = { kind: 'inset', width: 1.5, color: colors.border };
    return {
      day,
      letter: k ?? '·',
      key: k,
      // Done = green with a check (owner, 2026-11-20); planned = a neutral outline.
      fill: isDone ? colors.green : 'transparent',
      text: isDone ? colors.accentInk : k ? colors.ink : colors.muted,
      check: isDone,
      dayColor: isToday ? colors.accent : colors.muted,
      ring,
    };
  });
}

/**
 * Home "This week": same colors and rings as `weekCells`; the day's initial
 * (M, T, W…) above, the date of the month in the circle (owner, 2026-11-20).
 */
export function homeWeekCells(plan: Plan, done: number[], today: number, weekStart: string, from = 0): WeekCell[] {
  // Days before the profile existed are not part of its plan yet.
  const shown = { ...plan, days: plan.days.map((k, i) => (i < from && !done.includes(i) ? null : k)) };
  return weekCells(shown, done, today).map((c, i) => ({
    ...c,
    day: DAY_INITIALS[i],
    letter: String(dateInWeek(weekStart, i).getDate()),
  }));
}

/**
 * First weekday (0 = Monday) of the week starting `weekStart` on which the
 * profile existed: 0 for later weeks, 7 when it was made after that week.
 * Days before it are neither "missed" nor counted as planned.
 */
export function firstPlanDay(createdAt: number, weekStart: string): number {
  const made = isoDate(new Date(createdAt));
  for (let i = 0; i < 7; i++) if (isoDate(dateInWeek(weekStart, i)) >= made) return i;
  return 7;
}

/** Workouts the plan schedules this week from day `from` on. */
export const plannedFrom = (plan: Plan, from: number) => plan.days.filter((k, i) => k && i >= from).length;

/**
 * Plan preview strip (onboarding, profile): every planned day filled with its
 * plate, rest days outlined.
 */
export function planCells(plan: Plan): WeekCell[] {
  return DAY_LETTERS.map((day, i) => {
    const k = plan.days[i];
    return {
      day,
      letter: k ?? '·',
      key: k,
      fill: k ? plate(k) : 'transparent',
      text: k ? colors.onPlate : colors.muted,
      dayColor: colors.muted,
      ring: k ? { kind: 'none' } : { kind: 'inset', width: 1, color: colors.line },
    };
  });
}
