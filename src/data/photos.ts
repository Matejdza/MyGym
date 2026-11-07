// Image map ported from PHOTOS / COVERS / gSrc / coverSrc in design_handoff_liftlog/LiftLog.dc.html.
// Metro needs every image as a static require().

import type { GroupKey, Routine } from '@/domain/types';

/** A bundled image (require) or a file/remote URI. */
export type Img = number | { uri: string };

/** Exercise photos: 1 = start position, 2 = mid/end, 3 = end position. */
export const PHOTOS: Record<string, Img[]> = {
  bench: [require('@/assets/photos/bench-1.jpg'), require('@/assets/photos/bench-2.jpg')],
  incline: [require('@/assets/photos/incline-1.jpg'), require('@/assets/photos/incline-2.jpg')],
  fly: [require('@/assets/photos/cable-fly-1.jpg'), require('@/assets/photos/cable-fly-2.jpg')],
  pushdown: [require('@/assets/photos/pushdown-1.jpg'), require('@/assets/photos/pushdown-2.jpg')],
  deadlift: [require('@/assets/photos/deadlift-1.jpg'), require('@/assets/photos/deadlift-2.jpg'), require('@/assets/photos/deadlift-3.jpg')],
  curl: [require('@/assets/photos/curl-1.jpg'), require('@/assets/photos/curl-2.jpg'), require('@/assets/photos/curl-3.jpg')],
  row: [require('@/assets/photos/row-1.jpg'), require('@/assets/photos/row-2.jpg')],
  lat: [require('@/assets/photos/lat-1.jpg'), require('@/assets/photos/lat-2.jpg')],
  squat: [require('@/assets/photos/squat-1.jpg'), require('@/assets/photos/squat-2.jpg'), require('@/assets/photos/squat-3.jpg')],
  press: [require('@/assets/photos/legpress-1.jpg'), require('@/assets/photos/legpress-2.jpg')],
  legraise: [require('@/assets/photos/legraise-1.jpg'), require('@/assets/photos/legraise-2.jpg')],
  rdl: [require('@/assets/photos/rdl-1.jpg'), require('@/assets/photos/rdl-2.jpg'), require('@/assets/photos/rdl-3.jpg')],
  ohp: [require('@/assets/photos/ohp-1.jpg'), require('@/assets/photos/ohp-2.jpg')],
  dips: [require('@/assets/photos/dips-1.jpg'), require('@/assets/photos/dips-2.jpg')],
  pullup: [require('@/assets/photos/pullup-1.jpg'), require('@/assets/photos/pullup-2.jpg')],
  lunge: [require('@/assets/photos/lunge-1.jpg'), require('@/assets/photos/lunge-2.jpg')],
  abwheel: [require('@/assets/photos/abwheel-1.jpg'), require('@/assets/photos/abwheel-2.jpg')],
  lateral: [require('@/assets/photos/lateral-1.jpg'), require('@/assets/photos/lateral-2.jpg'), require('@/assets/photos/lateral-3.jpg')],
  facepull: [require('@/assets/photos/facepull-1.jpg'), require('@/assets/photos/facepull-2.jpg')],
  hammer: [require('@/assets/photos/hammer-1.jpg'), require('@/assets/photos/hammer-2.jpg'), require('@/assets/photos/hammer-3.jpg')],
  skull: [require('@/assets/photos/skull-1.jpg'), require('@/assets/photos/skull-2.jpg'), require('@/assets/photos/skull-3.jpg')],
  treadmill: [require('@/assets/photos/treadmill-1.jpg'), require('@/assets/photos/treadmill-2.jpg')],
  bike: [require('@/assets/photos/bike-1.jpg'), require('@/assets/photos/bike-2.jpg')],
  rower: [require('@/assets/photos/rower-1.jpg'), require('@/assets/photos/rower-2.jpg')],
  elliptical: [require('@/assets/photos/elliptical-1.jpg'), require('@/assets/photos/elliptical-2.jpg')],
  stairs: [require('@/assets/photos/stairs-1.jpg'), require('@/assets/photos/stairs-2.jpg')],
};

/** Strength routine covers, matched by routine name (as in the prototype). */
export const COVERS: Record<string, Img> = {
  "Chest & triceps": require('@/assets/photos/routine-chest-triceps.jpg'),
  "Back & biceps": require('@/assets/photos/routine-back-biceps.jpg'),
  "Legs": require('@/assets/photos/routine-legs.jpg'),
  "Shoulders & arms": require('@/assets/photos/routine-shoulders-arms.jpg'),
};

const GROUP_PHOTOS: Record<Exclude<GroupKey, 'cardio'>, Img> = {
  chest: require('@/assets/photos/group-chest.jpg'),
  back: require('@/assets/photos/group-back.jpg'),
  legs: require('@/assets/photos/group-legs.jpg'),
  shoulders: require('@/assets/photos/group-shoulders.jpg'),
  arms: require('@/assets/photos/group-arms.jpg'),
  core: require('@/assets/photos/group-core.jpg'),
};

export const IMAGES = {
  hero: require('@/assets/photos/hero.jpg') as Img,
  workoutDone: require('@/assets/photos/workout-done.png') as Img,
  /** Cardio group header, cardio day hero and thumbnails. */
  cardioHero: require('@/assets/photos/cardio-hero.png') as Img,
  /** Cardio library card: subject on the right, text on the left. */
  cardioWide: require('@/assets/photos/cardio-wide.png') as Img,
  /** Cardio routine editor cover: subject centered. */
  cardioBanner: require('@/assets/photos/cardio-banner.png') as Img,
};

/** Photo n (0-based) of an exercise, or null when it has none. */
export const exPhoto = (id: string, n = 0): Img | null => PHOTOS[id]?.[n] ?? null;

/** Muscle-group photo (`gSrc` in the prototype). */
export const groupPhoto = (key: GroupKey): Img => (key === 'cardio' ? IMAGES.cardioHero : GROUP_PHOTOS[key]);

/** Routine cover (`coverSrc`). `wide` is the routine editor banner. Null for custom strength routines. */
export function coverPhoto(r: Routine | null | undefined, wide = false): Img | null {
  if (!r) return null;
  if (r.type === 'cardio') return wide ? IMAGES.cardioBanner : IMAGES.cardioHero;
  return COVERS[r.name] ?? null;
}
