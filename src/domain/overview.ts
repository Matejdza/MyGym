// Progress overview (top of the Progress tab): a week, month or year at a glance.
// Only numbers the app really records: workouts, sets, volume and time.

import { MONTHS_FULL, dayIndex, longDate, mondayOf } from './dates';
import { thou } from './format';
import type { Plan } from './types';

export type Period = 'week' | 'month' | 'year';

export type Range = { from: Date; to: Date; label: string };

/** The calendar week (Mon–Sun), month or year containing `now`; `to` is exclusive. */
export function periodRange(period: Period, now: Date): Range {
  if (period === 'week') {
    const from = mondayOf(now);
    const to = new Date(from);
    to.setDate(to.getDate() + 7);
    const last = new Date(to);
    last.setDate(last.getDate() - 1);
    const label =
      from.getMonth() === last.getMonth()
        ? `${longDate(from)} – ${last.getDate()}, ${last.getFullYear()}`
        : `${longDate(from)} – ${longDate(last)}, ${last.getFullYear()}`;
    return { from, to, label };
  }
  if (period === 'month') {
    const from = new Date(now.getFullYear(), now.getMonth(), 1);
    return { from, to: new Date(now.getFullYear(), now.getMonth() + 1, 1), label: `${MONTHS_FULL[now.getMonth()]} ${now.getFullYear()}` };
  }
  const from = new Date(now.getFullYear(), 0, 1);
  return { from, to: new Date(now.getFullYear() + 1, 0, 1), label: String(now.getFullYear()) };
}

/** Workouts the plan schedules in the range (every day that has a routine). */
export function plannedWorkouts(plan: Plan, range: Range): number {
  let n = 0;
  for (const d = new Date(range.from); d < range.to; d.setDate(d.getDate() + 1)) if (plan.days[dayIndex(d)]) n++;
  return n;
}

/** Volume as shown on a card: "2,740 kg" under 10 t, then "12.4 t". */
export const volumeText = (kg: number) => (kg < 10000 ? `${thou(kg)} kg` : `${(Math.round(kg / 100) / 10).toFixed(1)} t`);

/** Time trained: "45 min", "3 h 20 min", "12 h". */
export function timeText(minutes: number): string {
  const m = Math.round(minutes);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const rest = m % 60;
  return rest ? `${h} h ${rest} min` : `${h} h`;
}
