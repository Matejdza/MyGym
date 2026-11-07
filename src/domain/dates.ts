// Calendar helpers. The prototype hard-codes "today" as Friday, November 6;
// the app uses the real date, with weeks running Monday → Sunday.

import { DAYS_FULL, MONTHS } from '@/data/catalog';

const MONTHS_FULL = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const pad = (n: number) => String(n).padStart(2, '0');

/** Local calendar date as YYYY-MM-DD. */
export const isoDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** Parses YYYY-MM-DD as a local date at midnight. */
export function parseIso(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Weekday index with Monday = 0 … Sunday = 6. */
export const dayIndex = (d: Date) => (d.getDay() + 6) % 7;

/** Monday of the week containing `d`, at local midnight. */
export function mondayOf(d: Date): Date {
  const m = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  m.setDate(m.getDate() - dayIndex(m));
  return m;
}

/** YYYY-MM-DD of the Monday of the week containing `d`. */
export const weekStartOf = (d: Date) => isoDate(mondayOf(d));

/** Date of weekday `i` (0 = Monday) in the week starting `weekStart`. */
export function dateInWeek(weekStart: string, i: number): Date {
  const d = parseIso(weekStart);
  d.setDate(d.getDate() + i);
  return d;
}

/** "Nov 6" */
export const shortDate = (d: Date) => `${MONTHS[d.getMonth()]} ${d.getDate()}`;

/** "November 2" */
export const longDate = (d: Date) => `${MONTHS_FULL[d.getMonth()]} ${d.getDate()}`;

/** "Friday, November 6" */
export const fullDate = (d: Date) => `${DAYS_FULL[dayIndex(d)]}, ${longDate(d)}`;

/** Moves an ISO date by `days`. */
export function addDays(iso: string, days: number): string {
  const d = parseIso(iso);
  d.setDate(d.getDate() + days);
  return isoDate(d);
}
