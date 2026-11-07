import { DAYS } from '@/data/catalog';
import { colors, plate } from '@/theme/tokens';

import { dateInWeek } from './dates';
import type { Plan, RoutineKey } from './types';

/** Week-strip day labels from the prototype: M T W Th F Sa Su. */
export const DAY_LETTERS = DAYS.map((d) => d[0] + (d === 'Thu' || d === 'Sun' || d === 'Sat' ? d[1] : ''));

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
};

/**
 * Home "This week" strip (`weekCells` in the prototype): filled with the plate
 * color when done, ringed in the plate color when planned, accent ring on today.
 */
export function weekCells(plan: Plan, done: number[], today: number | null): WeekCell[] {
  return DAY_LETTERS.map((day, i) => {
    const k = plan.days[i];
    const isDone = !!k && done.includes(i);
    const isToday = today === i;
    let ring: CellRing = { kind: 'none' };
    if (isToday) ring = isDone ? { kind: 'outer', width: 2, gap: 2, color: colors.accent } : { kind: 'inset', width: 2, color: colors.accent };
    else if (k && !isDone) ring = { kind: 'inset', width: 1.5, color: plate(k) };
    return {
      day,
      letter: k ?? '·',
      key: k,
      fill: isDone ? plate(k) : 'transparent',
      text: isDone ? colors.bg : k ? colors.ink : colors.muted,
      dayColor: isToday ? colors.accent : colors.muted,
      ring,
    };
  });
}

/**
 * Home "This week": same colors and rings as `weekCells`, but the circle shows
 * the day (M, T, W…) and the label above it shows the date of the month.
 */
export function homeWeekCells(plan: Plan, done: number[], today: number, weekStart: string): WeekCell[] {
  return weekCells(plan, done, today).map((c, i) => ({
    ...c,
    day: String(dateInWeek(weekStart, i).getDate()),
    letter: DAY_LETTERS[i],
  }));
}

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
      text: colors.bg,
      dayColor: colors.muted,
      ring: k ? { kind: 'none' } : { kind: 'inset', width: 1, color: colors.line },
    };
  });
}
