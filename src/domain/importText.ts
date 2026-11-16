// "Import routine": turns pasted text into a strength routine. One exercise per
// line ("Bench press 4 x 8, 90 s rest"), or a name line followed by a details
// line ("Bench press" / "4 sets, 8 reps, 90s rest"). An optional first line is
// the routine name and a line of weekdays ("Monday, Thursday") picks its days.
// Weights are skipped: routines don't store them. Names are matched to the
// exercise library; anything else is reported back, never guessed into.

import { EXERCISE_IDS, exercise } from '@/data/catalog';

import { REST_MAX, REST_MIN, isTimed, maxReps, nextRoutineKey, withWeeklyFromDays } from './plan';
import type { Plan, RoutineKey, StrengthItem } from './types';

export type ImportResult = {
  name: string | null;
  /** Weekday indexes (0 = Monday) named in the text. */
  days: number[];
  items: StrengthItem[];
  /** Lines that named something outside the library (or a cardio activity). */
  unknown: { line: string; reason: string }[];
};

const DAY_WORDS: [RegExp, number][] = [
  [/^mon(day)?$/, 0],
  [/^tue(s|sday)?$/, 1],
  [/^wed(nesday)?$/, 2],
  [/^thu(r|rs|rsday)?$/, 3],
  [/^fri(day)?$/, 4],
  [/^sat(urday)?$/, 5],
  [/^sun(day)?$/, 6],
];

/** Common short names → library ids. */
const ALIASES: Record<string, string> = {
  squat: 'squat',
  'pull up': 'pullup',
  pullup: 'pullup',
  'chin up': 'pullup',
  rdl: 'rdl',
  ohp: 'ohp',
  'military press': 'ohp',
  'shoulder press': 'ohp',
  'lat pull down': 'lat',
  skullcrusher: 'skull',
  'leg raise': 'legraise',
  lunge: 'lunge',
  'chest fly': 'fly',
  'pec fly': 'fly',
  'ab wheel': 'abwheel',
  'split squat': 'bulgarian',
  'calf raise': 'calf',
  'leg curl': 'legcurl',
  'hamstring curl': 'legcurl',
};

/** Lowercase words, plurals trimmed ("Curls" → "curl"), dashes as spaces. */
function words(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[-–_/]/g, ' ')
    .replace(/[^a-z ]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => (/(ss|sh|ch|x)es$/.test(w) ? w.slice(0, -2) : w.length > 3 && w.endsWith('s') && !w.endsWith('ss') ? w.slice(0, -1) : w));
}

/** The library exercise a name refers to: an alias, or every word of a library name present. */
export function matchExercise(name: string): string | null {
  const w = words(name);
  if (!w.length) return null;
  const joined = w.join(' ');
  if (ALIASES[joined]) return ALIASES[joined];
  let best: { id: string; size: number } | null = null;
  for (const id of EXERCISE_IDS) {
    const target = words(exercise(id).name);
    if (target.every((t) => w.includes(t)) && (!best || target.length > best.size)) best = { id, size: target.length };
  }
  if (best) return best.id;
  for (const [alias, id] of Object.entries(ALIASES)) if (joined.includes(alias)) return id;
  return null;
}

type Details = { sets?: number; reps?: number; repsMax?: number; rest?: number };

/** Sets, reps (or a range), rest; removes those and any weight from the text, which is left as the name. */
function readDetails(line: string): { rest: string; d: Details } {
  let t = ` ${line.toLowerCase().replace(/×/g, 'x')} `;
  const d: Details = {};
  const take = (re: RegExp, fn: (m: RegExpMatchArray) => void) => {
    const m = t.match(re);
    if (m) {
      fn(m);
      t = t.replace(m[0], ' ');
    }
  };
  take(/(\d+(?:[.,]\d+)?)\s*(kg|kgs|lb|lbs)\b/, () => {});
  take(/(?:rest:?\s*)(\d{1,2}):(\d{2})|(\d{1,2}):(\d{2})\s*rest/, (m) => {
    d.rest = Number(m[1] ?? m[3]) * 60 + Number(m[2] ?? m[4]);
  });
  take(/(?:rest:?\s*)(\d+)\s*(s|sec|secs|seconds|min|mins|minutes)\b|(\d+)\s*(s|sec|secs|seconds|min|mins|minutes)\s*rest/, (m) => {
    const n = Number(m[1] ?? m[3]);
    d.rest = /^m/.test(m[2] ?? m[4]) ? n * 60 : n;
  });
  take(/(\d+)\s*x\s*(\d+)(?:\s*[-–]\s*(\d+))?/, (m) => {
    d.sets = Number(m[1]);
    d.reps = Number(m[2]);
    if (m[3]) d.repsMax = Number(m[3]);
  });
  take(/(\d+)\s*sets?\b/, (m) => (d.sets = Number(m[1])));
  take(/(\d+)(?:\s*[-–]\s*(\d+))?\s*(reps?|sec|secs|seconds|s)\b/, (m) => {
    d.reps = Number(m[1]);
    if (m[2]) d.repsMax = Number(m[2]);
  });
  const rest = t
    .replace(/^\s*(\d+[.)]|[-•*])\s+/, ' ')
    .replace(/[,;:|]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return { rest, d };
}

const hasDetails = (d: Details) => d.sets != null || d.reps != null || d.rest != null;

function toItem(ex: string, d: Details): StrengthItem {
  const top = maxReps(ex);
  const reps = Math.min(top, Math.max(1, d.reps ?? (isTimed(ex) ? 30 : 10)));
  const it: StrengthItem = { ex, sets: Math.min(20, Math.max(1, d.sets ?? 3)), reps };
  if (d.repsMax != null && d.repsMax > reps) it.repsMax = Math.min(top, d.repsMax);
  if (d.rest != null) it.rest = Math.min(REST_MAX, Math.max(REST_MIN, d.rest));
  return it;
}

/** Weekdays when the whole line is day names ("Monday, Thursday"), else null. */
function readDays(line: string): number[] | null {
  const parts = line.toLowerCase().split(/[\s,&/]+|\band\b/).filter(Boolean);
  if (!parts.length) return null;
  const days: number[] = [];
  for (const p of parts) {
    const hit = DAY_WORDS.find(([re]) => re.test(p.replace(/\.$/, '')));
    if (!hit) return null;
    if (!days.includes(hit[1])) days.push(hit[1]);
  }
  return days.sort((a, b) => a - b);
}

export function parseRoutineText(text: string): ImportResult {
  const out: ImportResult = { name: null, days: [], items: [], unknown: [] };
  // Details waiting for the exercise named on the line above (SmartGym style).
  let pending: { ex: string; index: number } | null = null;
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);

  lines.forEach((line, n) => {
    const days = readDays(line);
    if (days) {
      out.days = days;
      return;
    }
    const { rest, d } = readDetails(line);
    const ex = rest ? matchExercise(rest) : null;

    if (ex) {
      if (exercise(ex).kind === 'cardio') {
        out.unknown.push({ line, reason: 'Cardio: add it to a cardio routine' });
        pending = null;
        return;
      }
      out.items.push(toItem(ex, d));
      pending = hasDetails(d) ? null : { ex, index: out.items.length - 1 };
      return;
    }
    if (!rest && hasDetails(d)) {
      // A details line: belongs to the exercise named just above.
      if (pending) out.items[pending.index] = toItem(pending.ex, d);
      pending = null;
      return;
    }
    // The first line that is not an exercise names the routine.
    if (n === 0 && !hasDetails(d) && out.name == null) {
      out.name = line.slice(0, 40);
      return;
    }
    out.unknown.push({ line, reason: 'Not in the exercise library' });
    pending = null;
  });
  return out;
}

/**
 * Adds the imported routine under the next free key, on the days the text named
 * (those days switch to it). Returns null when all 8 routine slots are taken.
 */
export function withImportedRoutine(plan: Plan, r: ImportResult): { plan: Plan; key: RoutineKey } | null {
  const key = nextRoutineKey(plan);
  if (!key) return null;
  const days = [...plan.days];
  for (const d of r.days) days[d] = key;
  return {
    key,
    plan: withWeeklyFromDays({ ...plan, days, routines: { ...plan.routines, [key]: { name: r.name ?? 'Imported routine', items: r.items } } }),
  };
}
