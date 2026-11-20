// Data model from README "State and data model", adapted for on-device storage.

export type GroupKey = 'chest' | 'back' | 'legs' | 'shoulders' | 'arms' | 'core' | 'cardio' | 'functional' | 'mobility';
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
  /** Holds logged in seconds instead of reps (plank). */
  timed?: boolean;
  /** Warm-up or stretching move: done for a time at the start or end of a workout, never logged. */
  mobility?: 'warmup' | 'stretch';
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

/** A warm-up or stretching move done for a time (seconds). */
export type TimedItem = { ex: string; sec: number };

/** Warm-up before the first exercise and stretching after the last; absent = picked from the routine's muscles. */
type Mobility = { warmup?: TimedItem[]; stretch?: TimedItem[] };

export type Routine =
  | ({ name: string; type?: undefined; items: StrengthItem[] } & Mobility)
  | ({ name: string; type: 'cardio'; items: CardioItem[] } & Mobility);

// ── Plan builder answers (onboarding) ───────────────────────────────────────

export type Sex = 'male' | 'female';
export type MainGoal = 'muscle' | 'strength' | 'fat' | 'tone' | 'fitness';
export type Focus = 'full' | 'chest' | 'back' | 'shoulders' | 'arms' | 'glutes' | 'legs' | 'core';
export type Experience = 'beginner' | 'intermediate' | 'advanced';
export type Equipment = 'gym' | 'dumbbells' | 'none';

/** What the plan was built from. Kept with the profile so it can be rebuilt. */
export type Setup = {
  sex: Sex;
  goal: MainGoal;
  /** Optional second goal. */
  goal2: MainGoal | null;
  focus: Focus[];
  experience: Experience;
  equipment: Equipment;
  /** Typical length of a strength workout: up to 45 min, about an hour, or longer. */
  minutes: 45 | 60 | 90;
  strengthDays: number;
  cardioDays: number;
  /** Days the user picked (Mon–Sun); without it the app spreads the days itself. */
  days?: DayType[];
};

/** What a day of the week is for when the user picks the days. */
export type DayType = 'strength' | 'cardio' | null;

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
  /** Profile icon shown instead of the initial when there is no photo (see ProfileIcon.tsx). */
  avatar?: string | null;
  /** Answers the plan was built from (profiles made before the plan builder have none). */
  setup?: Setup | null;
};

export type InputVariant = 'stepper' | 'keypad' | 'scale';

export type Settings = {
  inputVariant: InputVariant;
  weightStep: 1.25 | 2.5 | 5;
  restSeconds: number;
  handedness: 'right' | 'left';
  /** App language for this profile (chosen when the profile is created). */
  language: 'en' | 'sr';
};

export const DEFAULT_SETTINGS: Settings = {
  inputVariant: 'stepper',
  weightStep: 2.5,
  restSeconds: 120,
  handedness: 'right',
  language: 'en',
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
  /** Where the workout is: warm-up, the exercises, or stretching. Absent (older sessions) = main. */
  phase?: 'warmup' | 'main' | 'stretch';
  warmup?: MobilityItem[];
  stretch?: MobilityItem[];
  /** Timer of the current warm-up / stretch move: which one, when it ends while running, ms left while paused. */
  mob?: { cur: number; end: number | null; left: number };
};

/** A warm-up or stretching move in a live workout. */
export type MobilityItem = { ex: string; sec: number; done: boolean };

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
  /** Free text added on the summary screen; empty when there is none. */
  note?: string;
};

export type LoggedSet = { exId: string; setNo: number; kg: number; reps: number; pr: boolean };
export type LoggedCardio = { exId: string; minutes: number; value: number; zone: number; target: number };

export type BodyEntry = { date: string; kg: number };
