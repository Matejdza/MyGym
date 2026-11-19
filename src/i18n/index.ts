// App language: English (default) or Serbian in Latin script. Chosen per
// profile (when it is created, changeable in Profile → Settings); the last one
// used is remembered on this device for the screens before a profile is open.
//
// Strings are written in English in the code and looked up with t('…'); the
// Serbian text lives in ./sr.ts (a test checks that every t() string has one).
// Changing the language remounts the screens (see app/_layout.tsx), so plain
// t() calls are enough; lists such as weekday names are swapped in place by the
// modules that own them through onLang().

import { useSyncExternalStore } from 'react';

import { SR } from './sr';

export type Lang = 'en' | 'sr';
export const LANGS: [Lang, string][] = [
  ['en', 'English'],
  ['sr', 'Srpski'],
];

const KEY = 'liftlog-lang';

function stored(): Lang {
  try {
    return globalThis.localStorage?.getItem(KEY) === 'sr' ? 'sr' : 'en';
  } catch {
    return 'en';
  }
}

let current: Lang = stored();
const listeners = new Set<() => void>();
const appliers = new Set<(l: Lang) => void>();

export const getLang = () => current;

/** Registers a function that swaps a module's lists to the language; runs now and on every change. */
export function onLang(apply: (l: Lang) => void) {
  appliers.add(apply);
  apply(current);
}

export function setLang(l: Lang) {
  if (l === current) return;
  current = l;
  try {
    globalThis.localStorage?.setItem(KEY, l);
  } catch {
    // Storage blocked: the choice still holds for this session.
  }
  if (typeof document !== 'undefined') document.documentElement.lang = l === 'sr' ? 'sr-Latn' : 'en';
  appliers.forEach((a) => a(l));
  listeners.forEach((f) => f());
}

function subscribe(f: () => void) {
  listeners.add(f);
  return () => listeners.delete(f);
}

export const useLang = () => useSyncExternalStore(subscribe, getLang, getLang);

/** Keys that need context in the code but read shorter in English. */
const EN: Record<string, string> = { 'Back view': 'Back', 'Front view': 'Front' };

/** The text in the current language; {name} placeholders are filled from `params`. */
export function t(en: string, params?: Record<string, string | number>): string {
  const s = current === 'sr' ? (SR[en] ?? en) : (EN[en] ?? en);
  return params ? s.replace(/\{(\w+)\}/g, (_, k: string) => String(params[k] ?? '')) : s;
}

/** Word forms for counts: English [one, many], Serbian [one, few (2–4), many]. */
const WORDS: Record<string, { en: [string, string]; sr: [string, string, string] }> = {
  set: { en: ['set', 'sets'], sr: ['serija', 'serije', 'serija'] },
  exercise: { en: ['exercise', 'exercises'], sr: ['vežba', 'vežbe', 'vežbi'] },
  workout: { en: ['workout', 'workouts'], sr: ['trening', 'treninga', 'treninga'] },
  activity: { en: ['activity', 'activities'], sr: ['aktivnost', 'aktivnosti', 'aktivnosti'] },
  record: { en: ['record', 'records'], sr: ['rekord', 'rekorda', 'rekorda'] },
  line: { en: ['line', 'lines'], sr: ['red', 'reda', 'redova'] },
};

/** Serbian plural form: 0 = one (1, 21, 31…), 1 = few (2–4, 22–24…), 2 = many. */
export function srForm(n: number): 0 | 1 | 2 {
  const d = n % 10;
  const h = n % 100;
  if (d === 1 && h !== 11) return 0;
  if (d >= 2 && d <= 4 && (h < 12 || h > 14)) return 1;
  return 2;
}

/** "3 sets" / "3 serije". Unknown words fall back to adding an "s". */
export function countOf(n: number, word: string): string {
  const w = WORDS[word];
  if (!w) return `${n} ${word}${n === 1 ? '' : 's'}`;
  return current === 'sr' ? `${n} ${w.sr[srForm(n)]}` : `${n} ${w.en[n === 1 ? 0 : 1]}`;
}

/** Just the word for a count, without the number ("serije"). */
export function wordFor(n: number, word: string): string {
  return countOf(n, word).replace(/^\S+ /, '');
}
