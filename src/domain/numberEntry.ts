// Typed number entry (tap a stepper's number and type it): parsing, limits and
// the short messages shown under the field.

import { r2 } from './format';
import { restText } from './plan';
import { t as tr } from '@/i18n';

export type NumberSpec = {
  min: number;
  max: number;
  /** Allows a fractional part (kg, km). Whole numbers otherwise. */
  decimals?: boolean;
  /** "duration": seconds, typed as m:ss (also m.ss / m,ss), plain seconds, or 1–10 minutes. */
  kind?: 'number' | 'duration';
};

export type Entry = { empty: true } | { value: number } | { error: string };

/** The allowed range as shown to the user: "100–250", "0–500", "15 s–10:00". */
export function rangeText(spec: NumberSpec): string {
  if (spec.kind === 'duration') return `${restText(spec.min)}–${restText(spec.max)}`;
  return `${spec.min}–${spec.max}`;
}

const outOfRange = (spec: NumberSpec): Entry => ({ error: tr('Enter {range}', { range: rangeText(spec) }) });

/** Reads what the user typed. Commas count as decimal points (Serbian keyboards). */
export function parseEntry(text: string, spec: NumberSpec): Entry {
  const t = text.trim().replace(',', '.');
  if (!t) return { empty: true };

  if (spec.kind === 'duration') {
    let seconds: number;
    const ms = /^(\d{1,2})[:.](\d{2})$/.exec(t);
    if (ms) {
      if (Number(ms[2]) > 59) return { error: tr('Use m:ss, e.g. 2:30') };
      seconds = Number(ms[1]) * 60 + Number(ms[2]);
    } else if (/^\d+$/.test(t)) {
      const n = Number(t);
      // Small plain numbers are minutes ("2" = 2:00); larger ones are seconds ("90").
      seconds = n <= 10 ? n * 60 : n;
    } else return { error: tr('Use m:ss, e.g. 2:30') };
    return seconds < spec.min || seconds > spec.max ? outOfRange(spec) : { value: seconds };
  }

  if (!/^\d+(\.\d*)?$|^\.\d+$/.test(t)) return { error: tr('Numbers only') };
  const n = Number(t);
  if (!spec.decimals && !Number.isInteger(n)) return { error: tr('Whole numbers only') };
  if (n < spec.min || n > spec.max) return outOfRange(spec);
  return { value: r2(n) };
}

/** Text placed in the field when editing starts. */
export function editText(value: number, spec: NumberSpec): string {
  if (spec.kind === 'duration') return `${Math.floor(value / 60)}:${String(value % 60).padStart(2, '0')}`;
  return String(r2(value));
}

/** Limits for typed body numbers (profile, onboarding, Progress). */
export const BODY_LIMITS = {
  height: { min: 100, max: 250 },
  weight: { min: 30, max: 300, decimals: true },
  target: { min: 30, max: 300, decimals: true },
} satisfies Record<string, NumberSpec>;
