// Data model from README "State and data model", adapted for on-device storage.

export type GroupKey = 'chest' | 'back' | 'legs' | 'shoulders' | 'arms' | 'core' | 'cardio';
export type GoalKey = 'muscle' | 'strength' | 'fat';
export type Zone = 1 | 2 | 3 | 4 | 5;

export type Exercise = {
  id: string;
  name: string;
  group: GroupKey;
  equipment: string;
  description: string;
  steps: readonly string[];
  kind?: 'cardio';
  /** Cardio only: what the second value measures. */
  unit?: 'km' | 'floors';
  /** Cardio only: stepper increment for the distance/floors value. */
  step?: number;
  /** Strength exercises done with body weight (shown as "Body weight", no lift chart). */
  bodyweight?: boolean;
};

export type StrengthItem = {
  ex: string;
  sets: number;
  /** Target reps, or the bottom of a range ("6" in 6–8). */
  reps: number;
  /** Top of a rep range ("8" in 6–8). Absent or equal to `reps` = a single number. */
  repsMax?: number;
  /** Rest after each set in seconds. Absent = the profile's rest setting. */
  rest?: number;
};
export type CardioItem = { ex: string; min: number; zone: number };

export type Routine =
  | { name: string; type?: undefined; items: StrengthItem[] }
  | { name: string; type: 'cardio'; items: CardioItem[] };

/** Routine keys are single letters A–H. */
export type RoutineKey = string;

export type Plan = {
  weekly: number;
  /** Monday … Sunday. null = rest day. */
  days: (RoutineKey | null)[];
  routines: Record<RoutineKey, Routine>;
};

export type Profile = {
  id: string;
  name: string;
  color: string;
  height: number;
  weight: number;
  goal: GoalKey;
  target: number;
  photoUri: string | null;
  plan: Plan;
  createdAt: number;
};

export type InputVariant = 'stepper' | 'keypad' | 'scale';

export type Settings = {
  inputVariant: InputVariant;
  weightStep: 1.25 | 2.5 | 5;
  restSeconds: number;
  handedness: 'right' | 'left';
};

export const DEFAULT_SETTINGS: Settings = {
  inputVariant: 'stepper',
  weightStep: 2.5,
  restSeconds: 120,
  handedness: 'right',
};

// ── Live session (persisted so it survives an app restart) ──────────────────

export type SessionSet = { w: number; r: number; done: boolean; pr: boolean };
export type SessionStrengthEx = {
  id: string;
  target: number;
  reps: number;
  sets: SessionSet[];
  /** Heaviest weight in history when the workout started (0 = never logged, so no PRs yet). */
  best: number;
  /** Top of the rep range, when the routine has one. */
  repsMax?: number;
  /** Rest after each set in seconds, when the routine sets one for this exercise. */
  rest?: number;
};
export type SessionCardioEx = { id: string; target: number; zone: number; min: number; v: number; done: boolean };

type SessionBase = {
  routineKey: RoutineKey;
  routineName: string;
  /** Weekday index, 0 = Monday. */
  day: number;
  /** Monday of the week the session belongs to, YYYY-MM-DD. */
  weekStart: string;
  startedAt: number;
  /** Index of the current exercise / activity. */
  cur: number;
};

export type StrengthSession = SessionBase & {
  type: 'strength';
  /** Index of the selected set in the current exercise, -1 when all are done. */
  sel: number;
  ex: SessionStrengthEx[];
  /** Rest countdown, absolute times in ms. */
  rest: { end: number; total: number } | null;
};

export type CardioSession = SessionBase & {
  type: 'cardio';
  ex: SessionCardioEx[];
  /** Activity timer: time banked while paused, and when it last started running. */
  accumulatedMs: number;
  runningSince: number | null;
};

export type Session = StrengthSession | CardioSession;

// ── History ─────────────────────────────────────────────────────────────────

export type WorkoutRecord = {
  id: number;
  profileId: string;
  routineKey: RoutineKey;
  routineName: string;
  type: 'strength' | 'cardio';
  day: number;
  weekStart: string;
  startedAt: number;
  finishedAt: number;
};

export type LoggedSet = { exId: string; setNo: number; kg: number; reps: number; pr: boolean };
export type LoggedCardio = { exId: string; minutes: number; value: number; zone: number; target: number };

export type BodyEntry = { date: string; kg: number };
