// Which muscles each exercise trains, for the body map on Home. Written by hand
// (not in the design): primary = the muscles the exercise is for, secondary =
// the ones that help. Cardio maps to the legs (and back for the rower).

import { exercise } from '@/data/catalog';
import { onLang } from '@/i18n';

import type { Routine } from './types';

export type MuscleKey =
  | 'chest'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'forearms'
  | 'abs'
  | 'obliques'
  | 'traps'
  | 'lats'
  | 'lowerBack'
  | 'glutes'
  | 'quads'
  | 'hamstrings'
  | 'calves';

/** Muscles a focus area works, for the figure on the onboarding Focus step. */
export const FOCUS_MUSCLES: Record<string, MuscleKey[]> = {
  full: ['chest', 'shoulders', 'biceps', 'triceps', 'forearms', 'abs', 'obliques', 'traps', 'lats', 'lowerBack', 'glutes', 'quads', 'hamstrings', 'calves'],
  chest: ['chest'],
  back: ['lats', 'traps', 'lowerBack'],
  shoulders: ['shoulders'],
  arms: ['biceps', 'triceps', 'forearms'],
  glutes: ['glutes'],
  legs: ['quads', 'hamstrings', 'calves'],
  core: ['abs', 'obliques'],
};

export const MUSCLE_LABEL: Record<MuscleKey, string> = {
  chest: 'Chest',
  shoulders: 'Shoulders',
  biceps: 'Biceps',
  triceps: 'Triceps',
  forearms: 'Forearms',
  abs: 'Abs',
  obliques: 'Obliques',
  traps: 'Traps',
  lats: 'Lats',
  lowerBack: 'Lower back',
  glutes: 'Glutes',
  quads: 'Quads',
  hamstrings: 'Hamstrings',
  calves: 'Calves',
};

const LABEL_SR: Record<MuscleKey, string> = {
  chest: 'Grudi',
  shoulders: 'Ramena',
  biceps: 'Biceps',
  triceps: 'Triceps',
  forearms: 'Podlaktice',
  abs: 'Stomak',
  obliques: 'Kosi stomak',
  traps: 'Trapez',
  lats: 'Široki leđni',
  lowerBack: 'Donja leđa',
  glutes: 'Gluteus',
  quads: 'Prednja loža',
  hamstrings: 'Zadnja loža',
  calves: 'Listovi',
};
const LABEL_EN = { ...MUSCLE_LABEL };
onLang((l) => Object.assign(MUSCLE_LABEL, l === 'sr' ? LABEL_SR : LABEL_EN));

type Work = { primary: MuscleKey[]; secondary?: MuscleKey[] };

export const MUSCLES: Record<string, Work> = {
  bench: { primary: ['chest'], secondary: ['shoulders', 'triceps'] },
  incline: { primary: ['chest', 'shoulders'], secondary: ['triceps'] },
  fly: { primary: ['chest'], secondary: ['shoulders'] },
  dips: { primary: ['chest', 'triceps'], secondary: ['shoulders'] },
  deadlift: { primary: ['lowerBack', 'glutes', 'hamstrings'], secondary: ['traps', 'quads', 'forearms'] },
  row: { primary: ['lats', 'traps'], secondary: ['biceps', 'lowerBack'] },
  pullup: { primary: ['lats'], secondary: ['biceps', 'forearms'] },
  lat: { primary: ['lats'], secondary: ['biceps'] },
  squat: { primary: ['quads', 'glutes'], secondary: ['hamstrings', 'lowerBack'] },
  rdl: { primary: ['hamstrings', 'glutes'], secondary: ['lowerBack'] },
  press: { primary: ['quads', 'glutes'] },
  lunge: { primary: ['quads', 'glutes'], secondary: ['hamstrings'] },
  ohp: { primary: ['shoulders'], secondary: ['triceps', 'traps'] },
  lateral: { primary: ['shoulders'] },
  facepull: { primary: ['shoulders', 'traps'] },
  curl: { primary: ['biceps'], secondary: ['forearms'] },
  hammer: { primary: ['biceps', 'forearms'] },
  skull: { primary: ['triceps'] },
  pushdown: { primary: ['triceps'] },
  legraise: { primary: ['abs'], secondary: ['obliques'] },
  abwheel: { primary: ['abs'], secondary: ['obliques', 'lats'] },
  dbpress: { primary: ['shoulders'], secondary: ['triceps'] },
  dbcurl: { primary: ['biceps'] },
  ohext: { primary: ['triceps'] },
  cablerow: { primary: ['lats', 'traps'], secondary: ['biceps'] },
  bulgarian: { primary: ['quads', 'glutes'] },
  legcurl: { primary: ['hamstrings'] },
  calf: { primary: ['calves'] },
  plank: { primary: ['abs', 'obliques'] },
  treadmill: { primary: ['quads', 'calves'], secondary: ['glutes', 'hamstrings'] },
  bike: { primary: ['quads', 'calves'], secondary: ['glutes'] },
  rower: { primary: ['lats', 'quads'], secondary: ['glutes', 'biceps'] },
  stairs: { primary: ['glutes', 'quads'], secondary: ['calves'] },
  elliptical: { primary: ['quads', 'glutes'], secondary: ['shoulders'] },

  // Added from the owner's list
  inclinebb: { primary: ['chest', 'shoulders'], secondary: ['triceps'] },
  decline: { primary: ['chest'], secondary: ['triceps'] },
  dbbench: { primary: ['chest'], secondary: ['shoulders', 'triceps'] },
  dbfly: { primary: ['chest'], secondary: ['shoulders'] },
  pecdeck: { primary: ['chest'] },
  chestpress: { primary: ['chest'], secondary: ['shoulders', 'triceps'] },
  pushup: { primary: ['chest', 'triceps'], secondary: ['shoulders', 'abs'] },
  chinup: { primary: ['lats', 'biceps'], secondary: ['forearms'] },
  dbrow: { primary: ['lats'], secondary: ['biceps', 'traps'] },
  tbarrow: { primary: ['lats', 'traps'], secondary: ['biceps', 'lowerBack'] },
  csrow: { primary: ['lats', 'traps'], secondary: ['biceps'] },
  sapulldown: { primary: ['lats'] },
  machinerow: { primary: ['lats', 'traps'], secondary: ['biceps'] },
  arnold: { primary: ['shoulders'], secondary: ['triceps'] },
  cablelateral: { primary: ['shoulders'] },
  frontraise: { primary: ['shoulders'] },
  revfly: { primary: ['shoulders', 'traps'] },
  revpecdeck: { primary: ['shoulders', 'traps'] },
  uprightrow: { primary: ['shoulders', 'traps'], secondary: ['biceps'] },
  inclinecurl: { primary: ['biceps'] },
  conccurl: { primary: ['biceps'] },
  preacher: { primary: ['biceps'], secondary: ['forearms'] },
  cablecurl: { primary: ['biceps'] },
  revcurl: { primary: ['forearms', 'biceps'] },
  machinecurl: { primary: ['biceps'] },
  ropepushdown: { primary: ['triceps'] },
  cableohext: { primary: ['triceps'] },
  closegrip: { primary: ['triceps', 'chest'], secondary: ['shoulders'] },
  benchdip: { primary: ['triceps'], secondary: ['chest', 'shoulders'] },
  kickback: { primary: ['triceps'] },
  onearmext: { primary: ['triceps'] },
  frontsquat: { primary: ['quads'], secondary: ['glutes', 'abs'] },
  hacksquat: { primary: ['quads'], secondary: ['glutes'] },
  legext: { primary: ['quads'] },
  goblet: { primary: ['quads', 'glutes'], secondary: ['abs'] },
  walklunge: { primary: ['quads', 'glutes'], secondary: ['hamstrings'] },
  revlunge: { primary: ['glutes', 'quads'], secondary: ['hamstrings'] },
  stepup: { primary: ['quads', 'glutes'] },
  sumo: { primary: ['glutes', 'quads'], secondary: ['hamstrings'] },
  stiffleg: { primary: ['hamstrings'], secondary: ['glutes', 'lowerBack'] },
  hipthrust: { primary: ['glutes'], secondary: ['hamstrings'] },
  glutebridge: { primary: ['glutes'], secondary: ['hamstrings'] },
  seatedlegcurl: { primary: ['hamstrings'] },
  standlegcurl: { primary: ['hamstrings'] },
  kickbackglute: { primary: ['glutes'] },
  abduction: { primary: ['glutes'] },
  adduction: { primary: ['quads'] },
  pullthrough: { primary: ['glutes', 'hamstrings'] },
  seatedcalf: { primary: ['calves'] },
  presscalf: { primary: ['calves'] },
  crunch: { primary: ['abs'] },
  situp: { primary: ['abs'], secondary: ['obliques'] },
  cablecrunch: { primary: ['abs'] },
  kneeraise: { primary: ['abs'] },
  revcrunch: { primary: ['abs'] },
  sideplank: { primary: ['obliques'], secondary: ['abs'] },
  russiantwist: { primary: ['obliques'], secondary: ['abs'] },
  abmachine: { primary: ['abs'] },
  inclinewalk: { primary: ['glutes', 'calves'], secondary: ['hamstrings', 'quads'] },
  jumprope: { primary: ['calves'], secondary: ['shoulders', 'quads'] },
  burpee: { primary: ['quads', 'chest'], secondary: ['shoulders', 'abs'] },
  climber: { primary: ['abs'], secondary: ['shoulders', 'quads'] },
  jumpsquat: { primary: ['quads', 'glutes'], secondary: ['calves'] },
  battlerope: { primary: ['shoulders'], secondary: ['abs', 'forearms'] },
  farmer: { primary: ['forearms', 'traps'], secondary: ['abs', 'glutes'] },
  kbswing: { primary: ['glutes', 'hamstrings'], secondary: ['lowerBack', 'shoulders'] },
  boxjump: { primary: ['quads', 'glutes'], secondary: ['calves'] },
  sled: { primary: ['quads', 'glutes'], secondary: ['calves', 'abs'] },
  turkish: { primary: ['shoulders', 'abs'], secondary: ['glutes', 'obliques'] },
  ropeslam: { primary: ['shoulders', 'abs'], secondary: ['lats'] },

  // Warm-up and stretching
  jumpingjack: { primary: ['calves', 'shoulders'], secondary: ['quads'] },
  highknees: { primary: ['quads', 'calves'], secondary: ['abs'] },
  armcircles: { primary: ['shoulders'] },
  legswings: { primary: ['hamstrings', 'glutes'], secondary: ['quads'] },
  hipcircles: { primary: ['glutes', 'lowerBack'], secondary: ['obliques'] },
  airsquat: { primary: ['quads', 'glutes'] },
  inchworm: { primary: ['hamstrings', 'shoulders'], secondary: ['abs'] },
  greateststretch: { primary: ['glutes', 'quads'], secondary: ['shoulders', 'obliques'] },
  catcow: { primary: ['lowerBack', 'abs'] },
  chestStretch: { primary: ['chest'], secondary: ['shoulders'] },
  latStretch: { primary: ['lats'], secondary: ['obliques'] },
  shoulderStretch: { primary: ['shoulders'] },
  tricepsStretch: { primary: ['triceps'] },
  bicepsStretch: { primary: ['biceps', 'forearms'] },
  quadStretch: { primary: ['quads'] },
  hamStretch: { primary: ['hamstrings'] },
  hipFlexorStretch: { primary: ['quads'], secondary: ['abs'] },
  glutStretch: { primary: ['glutes'] },
  calfStretch: { primary: ['calves'] },
  childsPose: { primary: ['lats', 'lowerBack'] },
  cobra: { primary: ['abs'] },
  spinalTwist: { primary: ['obliques', 'lowerBack'] },
};

export type RoutineMuscles = { primary: MuscleKey[]; secondary: MuscleKey[] };

/**
 * Muscles a routine trains. Primary muscles are ordered by how many sets (or
 * cardio minutes) hit them; a muscle that is primary anywhere is not secondary.
 */
export function routineMuscles(r: Routine): RoutineMuscles {
  const weight = new Map<MuscleKey, number>();
  const helpers = new Set<MuscleKey>();
  for (const it of r.items) {
    const w = MUSCLES[it.ex] ?? MUSCLES[exercise(it.ex)?.id ?? ''];
    if (!w) continue;
    const amount = 'sets' in it ? it.sets : 1;
    for (const m of w.primary) weight.set(m, (weight.get(m) ?? 0) + amount);
    for (const m of w.secondary ?? []) helpers.add(m);
  }
  const primary = [...weight.entries()].sort((a, b) => b[1] - a[1]).map(([m]) => m);
  return { primary, secondary: [...helpers].filter((m) => !weight.has(m)) };
}
