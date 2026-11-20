// Builds a training plan from the onboarding answers (Setup): which days,
// which routines, which exercises, sets, reps and rest, plus warm-up and
// stretching. Pure and deterministic, so it is tested in tests/generate.test.ts.
//
// How it decides:
// - Split by strength days: 1–2 full body, 3 full body (beginner) or
//   push/pull/legs (or lower/upper/lower with a glutes or legs focus), 4 upper/lower,
//   5 upper/lower/push/pull/legs, 6 push/pull/legs twice.
// - Exercises per workout from the length (up to 45 min → 4, about an hour → 5, longer → 7; beginners one fewer).
// - Each slot (e.g. "a squat", "a row") takes the first exercise the equipment
//   and experience allow and the plan has not used yet.
// - Focus areas add extra slots for those muscles near the start of a workout.
// - Sets, reps and rest from the main goal; the second goal adds a little
//   (a conditioning finisher for fat loss or fitness, a heavier first lift for strength).
// - Cardio days get one cardio routine; its minutes follow the goal.

import { GROUPS, PATTERNS, exercise } from '@/data/catalog';
import { t } from '@/i18n';

import { stretchFor, warmupFor } from './mobility';
import { withWeeklyFromDays } from './plan';
import type { CardioItem, DayType, Equipment, Experience, Focus, GroupKey, MainGoal, Plan, Routine, RoutineKey, Setup, Sex, StrengthItem } from './types';

/** Main and second goals offered in onboarding (texts in English, shown with t()). */
export const GOAL_OPTIONS: { key: MainGoal; label: string; description: string }[] = [
  { key: 'muscle', label: 'Build muscle', description: 'More size, steady weight gain' },
  { key: 'strength', label: 'Get stronger', description: 'Heavier lifts on the main exercises' },
  { key: 'fat', label: 'Lose fat', description: 'Keep strength while the scale goes down' },
  { key: 'tone', label: 'Tone up', description: 'Firmer, more defined body without much bulk' },
  { key: 'fitness', label: 'Better fitness', description: 'More energy and stamina, easier breathing' },
];

/** The stored profile goal (older screens know three). */
export const legacyGoal = (g: MainGoal): 'muscle' | 'strength' | 'fat' => (g === 'muscle' || g === 'strength' ? g : g === 'tone' ? 'muscle' : 'fat');

export const FOCUS_OPTIONS: { key: Focus; label: string }[] = [
  { key: 'full', label: 'Whole body' },
  { key: 'glutes', label: 'Glutes' },
  { key: 'legs', label: 'Legs' },
  { key: 'chest', label: 'Chest' },
  { key: 'back', label: 'Back (muscles)' },
  { key: 'shoulders', label: 'Shoulders' },
  { key: 'arms', label: 'Arms' },
  { key: 'core', label: 'Core' },
];

/** Focus areas suggested from sex; the user can add more or change them. */
export const SUGGESTED_FOCUS: Record<Sex, Focus[]> = {
  female: ['glutes', 'legs'],
  male: ['chest', 'back', 'arms'],
};

/**
 * The focus suggested on the focus step, from sex and then the main goal
 * (owner, 2026-11-20: sex first, then the goal, then the body parts).
 * Fat loss and fitness work the whole body; strength leans on the big lifts.
 */
export function suggestFocus(sex: Sex, goal: MainGoal): Focus[] {
  if (goal === 'fat' || goal === 'fitness') return ['full'];
  if (goal === 'strength') return sex === 'female' ? ['legs', 'back'] : ['legs', 'back', 'chest'];
  if (goal === 'tone') return sex === 'female' ? ['glutes', 'legs', 'core'] : ['chest', 'arms', 'core'];
  return SUGGESTED_FOCUS[sex];
}

/** What an exercise needs: nothing, dumbbells (and a bench) or a gym. */
export function needs(id: string): Equipment {
  const e = exercise(id);
  if (!e) return 'gym';
  if (e.bodyweight && !/bar\b|bench|box|parallel/i.test(e.equipment)) return 'none';
  if (/machine|cable|barbell|ez bar|t-bar|landmine|sled|parallel|box|battle|preacher|leg press|treadmill|bike|rower|ab wheel|\bbar\b/i.test(e.equipment))
    return 'gym';
  return 'dumbbells';
}

const RANK: Record<Equipment, number> = { none: 0, dumbbells: 1, gym: 2 };
const fits = (id: string, eq: Equipment) => RANK[needs(id)] <= RANK[eq];

/** Hard or technical lifts left out for beginners (they get the easier options in the same slot). */
const ADVANCED_ONLY = new Set(['deadlift', 'frontsquat', 'turkish', 'boxjump', 'pullup', 'chinup', 'dips', 'abwheel', 'legraise', 'decline', 'tbarrow']);

type Slot =
  | 'squat' | 'hinge' | 'lunge' | 'glute' | 'hamCurl' | 'quadIso' | 'calves'
  | 'chestPress' | 'chestIncline' | 'chestFly' | 'backVert' | 'backRow' | 'shoulderPress' | 'shoulderSide' | 'rearDelt'
  | 'biceps' | 'triceps' | 'core' | 'finisher';

/** Candidates per slot, best first. Beginners try the BEGINNER list first. */
const SLOTS: Record<Slot, string[]> = {
  squat: ['squat', 'press', 'hacksquat', 'goblet', 'frontsquat', 'sumo', 'jumpsquat'],
  hinge: ['rdl', 'deadlift', 'stiffleg', 'kbswing', 'pullthrough', 'glutebridge'],
  lunge: ['bulgarian', 'walklunge', 'revlunge', 'stepup', 'lunge'],
  glute: ['hipthrust', 'glutebridge', 'kickbackglute', 'abduction', 'pullthrough', 'sumo'],
  hamCurl: ['legcurl', 'seatedlegcurl', 'standlegcurl', 'stiffleg'],
  quadIso: ['legext', 'stepup', 'revlunge'],
  calves: ['calf', 'seatedcalf', 'presscalf'],
  chestPress: ['bench', 'dbbench', 'chestpress', 'inclinebb', 'pushup'],
  chestIncline: ['incline', 'inclinebb', 'pushup'],
  chestFly: ['pecdeck', 'fly', 'dbfly'],
  backVert: ['lat', 'pullup', 'chinup', 'sapulldown', 'dbrow'],
  backRow: ['cablerow', 'row', 'dbrow', 'machinerow', 'csrow', 'tbarrow'],
  shoulderPress: ['ohp', 'dbpress', 'arnold', 'pushup'],
  shoulderSide: ['lateral', 'cablelateral', 'uprightrow'],
  rearDelt: ['facepull', 'revpecdeck', 'revfly'],
  biceps: ['curl', 'dbcurl', 'hammer', 'cablecurl', 'preacher', 'inclinecurl', 'conccurl'],
  triceps: ['pushdown', 'ropepushdown', 'skull', 'ohext', 'cableohext', 'kickback', 'benchdip'],
  core: ['plank', 'cablecrunch', 'legraise', 'kneeraise', 'crunch', 'russiantwist', 'sideplank', 'revcrunch', 'abwheel'],
  finisher: ['burpee', 'climber', 'kbswing', 'jumprope', 'battlerope', 'jumpsquat'],
};

const BEGINNER: Partial<Record<Slot, string[]>> = {
  squat: ['goblet', 'press', 'hacksquat'],
  hinge: ['rdl', 'glutebridge', 'pullthrough'],
  chestPress: ['chestpress', 'dbbench', 'pushup'],
  backVert: ['lat', 'sapulldown', 'dbrow'],
  backRow: ['machinerow', 'cablerow', 'dbrow'],
  shoulderPress: ['dbpress'],
  biceps: ['dbcurl', 'machinecurl', 'cablecurl'],
  triceps: ['ropepushdown', 'pushdown', 'kickback', 'benchdip'],
  core: ['plank', 'crunch', 'revcrunch', 'kneeraise'],
};

type Kind = 'full' | 'upper' | 'lower' | 'push' | 'pull' | 'legs';

const TEMPLATES: Record<Kind, Slot[]> = {
  full: ['squat', 'chestPress', 'backRow', 'hinge', 'shoulderPress', 'backVert', 'core', 'glute'],
  upper: ['chestPress', 'backRow', 'shoulderPress', 'backVert', 'chestIncline', 'biceps', 'triceps', 'shoulderSide'],
  lower: ['squat', 'hinge', 'lunge', 'glute', 'hamCurl', 'calves', 'core', 'quadIso'],
  push: ['chestPress', 'shoulderPress', 'chestIncline', 'shoulderSide', 'triceps', 'chestFly', 'triceps'],
  pull: ['backVert', 'backRow', 'rearDelt', 'biceps', 'backRow', 'biceps', 'core'],
  legs: ['squat', 'hinge', 'lunge', 'hamCurl', 'quadIso', 'calves', 'glute', 'core'],
};

/** Extra slots a focus area adds, and which workouts they go in. */
const FOCUS_SLOTS: Record<Focus, { slots: Slot[]; kinds: Kind[] }> = {
  full: { slots: [], kinds: [] },
  chest: { slots: ['chestIncline', 'chestFly'], kinds: ['full', 'upper', 'push'] },
  back: { slots: ['backVert', 'rearDelt'], kinds: ['full', 'upper', 'pull'] },
  shoulders: { slots: ['shoulderSide', 'rearDelt'], kinds: ['full', 'upper', 'push'] },
  arms: { slots: ['biceps', 'triceps'], kinds: ['full', 'upper', 'push', 'pull'] },
  glutes: { slots: ['glute', 'glute'], kinds: ['full', 'lower', 'legs'] },
  legs: { slots: ['lunge', 'quadIso', 'hamCurl'], kinds: ['full', 'lower', 'legs'] },
  core: { slots: ['core'], kinds: ['full', 'lower', 'legs', 'pull', 'upper'] },
};

/** Sets, reps (range) and rest per main goal. */
const DOSE: Record<MainGoal, { sets: number; reps: number; repsMax?: number; rest: number }> = {
  strength: { sets: 4, reps: 5, repsMax: 6, rest: 150 },
  muscle: { sets: 3, reps: 8, repsMax: 12, rest: 90 },
  tone: { sets: 3, reps: 10, repsMax: 15, rest: 60 },
  fat: { sets: 3, reps: 12, repsMax: 15, rest: 60 },
  fitness: { sets: 3, reps: 12, repsMax: 15, rest: 45 },
};

/** Workouts are named after the body parts they train (owner, 2026-11-20). */
const NAMES: Record<Kind, string> = {
  full: 'Full body',
  upper: 'Chest / Back',
  lower: 'Legs / Glutes',
  push: 'Chest / Shoulders',
  pull: 'Back / Arms',
  legs: 'Legs',
};

/** Which workouts make up the week for this many strength days. */
export function split(days: number, experience: Experience, focus: Focus[]): Kind[] {
  const lowerFocus = focus.includes('glutes') || focus.includes('legs');
  switch (Math.max(1, Math.min(6, days))) {
    case 1:
      return ['full'];
    case 2:
      return lowerFocus ? ['lower', 'upper'] : ['full', 'full'];
    case 3:
      if (experience === 'beginner') return ['full', 'full', 'full'];
      return lowerFocus ? ['lower', 'upper', 'lower'] : ['push', 'pull', 'legs'];
    case 4:
      return ['upper', 'lower', 'upper', 'lower'];
    case 5:
      return lowerFocus ? ['lower', 'upper', 'lower', 'push', 'pull'] : ['upper', 'lower', 'push', 'pull', 'legs'];
    default:
      return ['push', 'pull', 'legs', 'push', 'pull', 'legs'];
  }
}

function exerciseCount(s: Setup): number {
  const base = s.minutes <= 45 ? 4 : s.minutes >= 90 ? 7 : 5;
  return Math.max(3, base - (s.experience === 'beginner' ? 1 : 0));
}

function pick(slot: Slot, s: Setup, used: Set<string>, inWorkout: Set<string>): string | null {
  const pool = [...(s.experience === 'beginner' ? (BEGINNER[slot] ?? []) : []), ...SLOTS[slot]].filter(
    (id) => exercise(id) && fits(id, s.equipment) && !inWorkout.has(id) && !(s.experience === 'beginner' && ADVANCED_ONLY.has(id)),
  );
  return pool.find((id) => !used.has(id)) ?? pool[0] ?? null;
}

/**
 * Several full-body days in a week each lead with a different main lift and are
 * named after it: "Legs", "Back", "Chest" instead of "Full body A/B/C" (owner, 2026-11-20).
 */
const FULL_EMPHASIS: { group: GroupKey; lead: Slot }[] = [
  { group: 'legs', lead: 'squat' },
  { group: 'back', lead: 'backRow' },
  { group: 'chest', lead: 'chestPress' },
];

/** One strength workout of the given kind; `lead` puts that main lift first. */
function strengthRoutine(kind: Kind, s: Setup, used: Set<string>, label: string, lead?: Slot): Routine {
  const dose = DOSE[s.goal];
  // At most two extras for the focus areas, so the workout stays balanced.
  const focusSlots = s.focus.flatMap((f) => (FOCUS_SLOTS[f].kinds.includes(kind) ? FOCUS_SLOTS[f].slots : [])).slice(0, 2);
  // Main lifts first (a full-body workout keeps legs, push and pull), then focus extras, then the rest.
  const template = lead ? [lead, ...TEMPLATES[kind].filter((x) => x !== lead)] : TEMPLATES[kind];
  const head = kind === 'full' ? 3 : 2;
  const order: Slot[] = [...template.slice(0, head), ...focusSlots, ...template.slice(head)];
  const want = exerciseCount(s);
  const items: StrengthItem[] = [];
  const inWorkout = new Set<string>();
  for (const slot of order) {
    if (items.length >= want) break;
    const id = pick(slot, s, used, inWorkout);
    if (!id) continue;
    inWorkout.add(id);
    used.add(id);
    const e = exercise(id);
    const timed = !!e.timed;
    const first = items.length === 0;
    const sets = Math.max(2, dose.sets + (first && (s.goal2 === 'strength' || s.experience === 'advanced') ? 1 : 0) - (s.experience === 'beginner' && dose.sets > 3 ? 1 : 0));
    const item: StrengthItem = timed
      ? { ex: id, sets: Math.min(3, sets), reps: s.experience === 'beginner' ? 20 : 30 }
      : first && s.goal2 === 'strength'
        ? { ex: id, sets, reps: 5, rest: 150 }
        : { ex: id, sets, reps: dose.reps, ...(dose.repsMax ? { repsMax: dose.repsMax } : {}), rest: dose.rest };
    items.push(item);
  }
  // A short conditioning finisher when fat loss or fitness is a goal and there is time.
  if ((s.goal2 === 'fat' || s.goal2 === 'fitness' || s.goal === 'fitness') && s.minutes >= 60) {
    const id = pick('finisher', s, used, inWorkout);
    if (id) {
      used.add(id);
      items.push(exercise(id).timed ? { ex: id, sets: 2, reps: 30 } : { ex: id, sets: 2, reps: 12, rest: 45 });
    }
  }
  const r: Routine = { name: label, items };
  return { ...r, warmup: warmupFor(r, s.minutes), stretch: stretchFor(r, s.minutes) };
}

function cardioRoutine(s: Setup): Routine {
  const long = s.goal === 'fat' || s.goal === 'fitness' || s.goal2 === 'fat' || s.goal2 === 'fitness';
  const total = Math.min(s.minutes, long ? 40 : 25);
  const zone = s.goal === 'fitness' ? 3 : 2;
  const gym = s.equipment === 'gym';
  const items: CardioItem[] = gym
    ? [
        { ex: s.experience === 'beginner' ? 'inclinewalk' : 'treadmill', min: Math.round(total * 0.6), zone },
        { ex: s.goal === 'fitness' ? 'rower' : 'bike', min: Math.round(total * 0.4), zone: zone + (s.experience === 'advanced' ? 1 : 0) },
      ]
    : [{ ex: 'treadmill', min: total, zone }];
  const r: Routine = { name: t('Cardio'), type: 'cardio', items };
  return { ...r, warmup: warmupFor(r, s.minutes), stretch: stretchFor(r, s.minutes) };
}

/** Days for strength (spread out) and cardio (in the gaps), at most 7 in total. */
export function weekDays(strength: number, cardio: number): { strength: number[]; cardio: number[] } {
  const sDays = strength <= 0 ? [] : strength === 1 ? [0] : (PATTERNS[Math.min(6, strength)] ?? [0, 2, 4]);
  const free = [0, 1, 2, 3, 4, 5, 6].filter((d) => !sDays.includes(d));
  // Cardio prefers days that don't sit right before a strength day, then any free day.
  const ranked = [...free].sort((a, b) => Number(sDays.includes(a + 1)) - Number(sDays.includes(b + 1)) || a - b);
  return { strength: sDays, cardio: ranked.slice(0, Math.max(0, cardio)).sort((a, b) => a - b) };
}

const indicesOf = (days: DayType[], type: DayType) => days.flatMap((d, i) => (d === type ? [i] : []));

/** The whole plan: up to 8 routines (A–H), cardio last. */
export function generatePlan(s: Setup): Plan {
  // Days the user picked win over the app's own spread (owner, 2026-11-20).
  const picked = s.days && s.days.some((d) => d === 'strength') ? s.days : null;
  const kinds = split(picked ? picked.filter((d) => d === 'strength').length : s.strengthDays, s.experience, s.focus);
  const { strength, cardio } = picked
    ? { strength: indicesOf(picked, 'strength').slice(0, kinds.length), cardio: indicesOf(picked, 'cardio') }
    : weekDays(kinds.length, s.cardioDays);
  const used = new Set<string>();
  const routines: Record<RoutineKey, Routine> = {};
  const days: (RoutineKey | null)[] = [null, null, null, null, null, null, null];
  const seen = new Map<Kind, number>();
  let next = 0;
  const key = () => String.fromCharCode(65 + next++);

  kinds.forEach((kind, i) => {
    const n = (seen.get(kind) ?? 0) + 1;
    seen.set(kind, n);
    const count = kinds.filter((k) => k === kind).length;
    const emphasis = kind === 'full' && count > 1 ? FULL_EMPHASIS[(n - 1) % FULL_EMPHASIS.length] : undefined;
    // A workout that repeats keeps the same name; the letter in its circle tells them apart.
    const label = emphasis ? GROUPS.find((g) => g.key === emphasis.group)!.label : t(NAMES[kind]);
    const k = key();
    routines[k] = strengthRoutine(kind, s, used, label, emphasis?.lead);
    days[strength[i]] = k;
  });
  if (cardio.length) {
    const k = key();
    routines[k] = cardioRoutine(s);
    for (const d of cardio) days[d] = k;
  }
  return withWeeklyFromDays({ weekly: 3, days, routines });
}

const GROUP_NAMES: Record<'en' | 'sr', Partial<Record<GroupKey, string>>> = {
  en: { chest: 'Chest', back: 'Back', legs: 'Legs', shoulders: 'Shoulders', arms: 'Arms', core: 'Core' },
  sr: { chest: 'Grudi', back: 'Leđa', legs: 'Noge', shoulders: 'Ramena', arms: 'Ruke', core: 'Trup' },
};

/**
 * Plans made before 2026-11-20 call their full-body days "Full body A/B/C"
 * ("Celo telo A/B/C"). They now take the name of the muscle group their first
 * exercise works, like new plans. When two would end up with the same name, the
 * old names stay. Names the user typed are never touched.
 */
export function renameFullBodyDays(input: Record<RoutineKey, Routine>): Record<RoutineKey, Routine> {
  const routines = renameSplitDays(input);
  const old = Object.entries(routines).filter(([, r]) => /^(Full body|Celo telo) [A-H]$/.test(r.name) && r.items.length > 0);
  if (old.length < 2) return routines;
  const names = old.map(([, r]) => {
    const lang = r.name.startsWith('Celo') ? 'sr' : 'en';
    const group = exercise(r.items[0].ex)?.group;
    return group ? GROUP_NAMES[lang][group] : undefined;
  });
  if (names.some((n) => !n) || new Set(names).size !== names.length) return routines;
  const out = { ...routines };
  old.forEach(([k, r], i) => (out[k] = { ...r, name: names[i]! }));
  return out;
}

/** Names older plans gave their workouts, in English and Serbian, and the new name. */
const OLD_NAMES: [RegExp, Record<'en' | 'sr', string>][] = [
  [/^Push( [A-H])?$|^Potisak( [A-H])?$/, { en: 'Chest / Shoulders', sr: 'Grudi / Ramena' }],
  [/^Pull( [A-H])?$|^Povlačenje( [A-H])?$/, { en: 'Back / Arms', sr: 'Leđa / Ruke' }],
  [/^Upper body( [A-H])?$|^Gornji deo tela( [A-H])?$/, { en: 'Chest / Back', sr: 'Grudi / Leđa' }],
  [/^Lower body( [A-H])?$|^Donji deo tela( [A-H])?$/, { en: 'Legs / Glutes', sr: 'Noge / Gluteus' }],
  [/^Legs [A-H]$|^Noge [A-H]$/, { en: 'Legs', sr: 'Noge' }],
];
const SR_OLD = /^(Potisak|Povlačenje|Gornji|Donji|Noge)/;

/** "Push", "Pull B", "Gornji deo tela A"… from older plans take the body-part names. */
function renameSplitDays(routines: Record<RoutineKey, Routine>): Record<RoutineKey, Routine> {
  let out = routines;
  for (const [k, r] of Object.entries(routines)) {
    const hit = OLD_NAMES.find(([re]) => re.test(r.name));
    if (!hit) continue;
    if (out === routines) out = { ...routines };
    out[k] = { ...r, name: hit[1][SR_OLD.test(r.name) ? 'sr' : 'en'] };
  }
  return out;
}

