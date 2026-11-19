import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

import { EXERCISE_IDS } from '@/data/catalog';
import { countOf, getLang, setLang, srForm, t } from '@/i18n';
import { EXERCISES_SR } from '@/i18n/exercises.sr';
import { SR } from '@/i18n/sr';

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? files(p) : /\.tsx?$/.test(n) ? [p] : [];
  });
}

test('every t() text in the app has a Serbian translation', () => {
  const missing = new Set<string>();
  const call = /\b(?:t|tr)\(\s*(['"])((?:\\.|(?!\1).)*)\1/g;
  for (const f of files('src')) {
    if (f.includes('/i18n/')) continue;
    for (const m of readFileSync(f, 'utf8').matchAll(call)) {
      const key = m[2].replace(/\\'/g, "'");
      if (!(key in SR)) missing.add(`${key}  (${f})`);
    }
  }
  assert.deepEqual([...missing], []);
});

test('every exercise has Serbian texts with the same number of steps', async () => {
  const { exercise } = await import('@/data/catalog');
  assert.equal(getLang(), 'en');
  for (const id of EXERCISE_IDS) {
    const sr = EXERCISES_SR[id];
    assert.ok(sr, `Serbian for ${id}`);
    assert.equal(sr.steps.length, exercise(id).steps.length, `${id} steps`);
  }
});

test('Serbian plural forms and counts', () => {
  assert.deepEqual([1, 2, 4, 5, 11, 12, 21, 22, 25, 101, 112].map(srForm), [0, 1, 1, 2, 2, 2, 0, 1, 2, 0, 2]);
  assert.equal(getLang(), 'en');
  assert.equal(countOf(3, 'set'), '3 sets');
  setLang('sr');
  try {
    assert.equal(countOf(1, 'set'), '1 serija');
    assert.equal(countOf(3, 'set'), '3 serije');
    assert.equal(countOf(5, 'workout'), '5 treninga');
    assert.equal(t('Next: {day}, {name}', { day: 'Petak', name: 'Noge' }), 'Sledeće: Petak, Noge');
    assert.equal(t('Not translated'), 'Not translated');
  } finally {
    setLang('en');
  }
  assert.equal(t('Back view'), 'Back');
});
