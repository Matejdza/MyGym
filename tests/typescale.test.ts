import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

import { TYPE_LINE, TYPE_SIZES } from '@/theme/tokens';

const files = (dir: string): string[] =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? files(p) : p.endsWith('.tsx') ? [p] : [];
  });

test('every text size in the app is on the type scale (owner, 2026-11-20)', () => {
  const off: string[] = [];
  for (const f of files('src')) {
    // Chart tick labels are the agreed exception.
    if (f.endsWith('LineChart.tsx')) continue;
    const src = readFileSync(f, 'utf8');
    for (const m of src.matchAll(/<(Display|UI|Mono)\b[^>]*?\bsize=\{(\d+)\}/g)) {
      const n = Number(m[2]);
      // Big typed numbers (set and body inputs) are the other exception.
      if (m[1] === 'Mono' && n >= 66) continue;
      if (!TYPE_SIZES.includes(n)) off.push(`${f}: ${m[1]} ${n}`);
    }
    for (const m of src.matchAll(/fontSize: (\d+)/g)) if (!TYPE_SIZES.includes(Number(m[1]))) off.push(`${f}: fontSize ${m[1]}`);
  }
  assert.deepEqual(off, []);
  for (const s of TYPE_SIZES) assert.ok(TYPE_LINE[s] >= s && TYPE_LINE[s] % 4 === 0, `line height for ${s}`);
});
