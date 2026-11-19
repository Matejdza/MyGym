import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

import { DARK, LIGHT, cssVars, type Palette } from '@/theme/tokens';

test('the page declares exactly the token palettes', () => {
  const html = readFileSync('public/index.html', 'utf8');
  assert.ok(html.includes(`:root { ${cssVars(DARK)} }`), 'dark palette on :root');
  assert.ok(html.includes(`:root[data-theme="light"] { ${cssVars(LIGHT)} }`), 'light palette');
  assert.ok(html.includes(`:root[data-theme="auto"] { ${cssVars(LIGHT)} }`), 'auto follows the phone');
  assert.ok(html.includes(`[data-scope="dark"] { ${cssVars(DARK)} }`), 'photo sections stay dark');
});

const hex = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16) / 255);
const lin = (v: number) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
const lum = (c: string) => {
  const [r, g, b] = hex(c).map(lin);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a: string, b: string) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

for (const [name, p] of [['dark', DARK], ['light', LIGHT]] as [string, Palette][]) {
  test(`${name}: text reaches WCAG AA (4.5:1) on bg and surface`, () => {
    for (const fg of ['ink', 'muted', 'accent', 'red', 'green'] as const) {
      for (const bg of ['bg', 'surface'] as const) {
        const r = ratio(p[fg], p[bg]);
        assert.ok(r >= 4.5, `${fg} on ${bg}: ${r.toFixed(2)}`);
      }
    }
    assert.ok(ratio(p.accentInk, p.accentFill) >= 4.5, 'text on the yellow button');
    assert.ok(ratio(p.onPlate, '#3DDC84') >= 4.5, 'text on a green plate');
    for (const g of [p.plateD, p.plateH]) assert.ok(ratio(p.onPlate, g) >= 4.5, `text on gray plate ${g}`);
  });
}

test('dark text is readable on every profile color', async () => {
  const { PROFILE_COLORS } = await import('@/theme/tokens');
  for (const c of PROFILE_COLORS) assert.ok(ratio(DARK.onPlate, c) >= 4.5, `text on ${c}: ${ratio(DARK.onPlate, c).toFixed(2)}`);
});

test('every color from the color strip keeps dark text readable', async () => {
  const { toneColors } = await import('@/theme/profileColor');
  for (let h = 0; h < 360; h += 5) for (const c of toneColors(h)) assert.ok(ratio(DARK.onPlate, c) >= 4.5, `hue ${h}: ${c}`);
});
