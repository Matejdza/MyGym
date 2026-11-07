// Number and text helpers ported from the prototype (fmt, thou, s_, mmss, r2).

/** Rounds to 2 decimals and drops trailing zeros: 82.50 → "82.5". */
export const fmt = (n: number) => String(Math.round(n * 100) / 100);

/** Thousands separator: 6885 → "6,885". */
export const thou = (n: number) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

/** Simple plural: s_(1,'set') → "1 set", s_(3,'set') → "3 sets". */
export const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

/** Milliseconds → "m:ss". */
export function mmss(ms: number): string {
  const t = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
}

/** Rounds to 2 decimals (avoids 0.1 + 0.2 drift on steppers). */
export const r2 = (v: number) => Math.round(v * 100) / 100;

/** Estimated 1RM = weight × (1 + reps / 30), rounded to 0.5 kg. */
export const estimated1RM = (kg: number, reps: number) => Math.round(kg * (1 + reps / 30) * 2) / 2;
