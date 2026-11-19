// "Any color" for a profile: a hue from the color strip plus a tone. Every
// color it returns is light enough for the dark text and icons drawn on a
// profile circle (WCAG AA, 4.5:1), so no choice ever makes the letter unreadable.

import { DARK } from '@/theme/tokens';

const hex2 = (n: number) => Math.round(n * 255).toString(16).padStart(2, '0');

/** HSL (h 0–360, s and l 0–1) to "#rrggbb". */
export function hsl(h: number, s: number, l: number): string {
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
  return `#${hex2(f(0))}${hex2(f(8))}${hex2(f(4))}`;
}

const lin = (v: number) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
function lum(c: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => lin(parseInt(c.slice(i, i + 2), 16) / 255));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
export function contrast(a: string, b: string): number {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

/** The color, made lighter step by step until dark text on it reaches 4.5:1. */
export function readable(h: number, s: number, l: number): string {
  let c = hsl(h, s, l);
  for (let x = l; contrast(DARK.onPlate, c) < 4.5 && x < 1; x += 0.02) c = hsl(h, s, Math.min(1, x + 0.02));
  return c;
}

/** Tones offered for one hue: strong to soft. */
export const TONES: [number, number][] = [
  [0.9, 0.5],
  [0.85, 0.62],
  [0.7, 0.72],
  [0.6, 0.82],
  [0.35, 0.88],
];

export const toneColors = (h: number) => TONES.map(([s, l]) => readable(h, s, l));

/** Hue of a "#rrggbb" color (0 for grays), to put the strip's marker where the current color is. */
export function hueOf(c: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16) / 255);
  const max = Math.max(r, g, b);
  const d = max - Math.min(r, g, b);
  if (d === 0) return 0;
  const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return (h * 60 + 360) % 360;
}
