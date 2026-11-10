// Reads and writes for everything LiftLog stores on the phone.

import type {
  BodyEntry,
  CardioItem,
  GoalKey,
  LoggedCardio,
  LoggedSet,
  Plan,
  Profile,
  Routine,
  RoutineKey,
  Session,
  Settings,
  StrengthItem,
  WorkoutRecord,
} from '@/domain/types';
import { DEFAULT_SETTINGS } from '@/domain/types';

import type { Db } from './db';

// ── Row shapes ──────────────────────────────────────────────────────────────

type ProfileRow = {
  id: string;
  name: string;
  color: string;
  height: number;
  weight: number;
  goal: GoalKey;
  target: number;
  photo_uri: string | null;
  weekly: number;
  days: string;
  created_at: number;
};
type RoutineRow = { profile_id: string; key: string; name: string; type: 'strength' | 'cardio'; items: string };
type SettingsRow = {
  profile_id: string;
  input_variant: Settings['inputVariant'];
  weight_step: number;
  rest_seconds: number;
  handedness: Settings['handedness'];
};
type WorkoutRow = {
  id: number;
  profile_id: string;
  routine_key: string;
  routine_name: string;
  type: 'strength' | 'cardio';
  day: number;
  week_start: string;
  started_at: number;
  finished_at: number;
};

const toRoutine = (r: RoutineRow): Routine =>
  r.type === 'cardio'
    ? { name: r.name, type: 'cardio', items: JSON.parse(r.items) as CardioItem[] }
    : { name: r.name, items: JSON.parse(r.items) as StrengthItem[] };

const toSettings = (r: SettingsRow): Settings => ({
  inputVariant: r.input_variant,
  weightStep: r.weight_step as Settings['weightStep'],
  restSeconds: r.rest_seconds,
  handedness: r.handedness,
});

const toWorkout = (r: WorkoutRow): WorkoutRecord => ({
  id: r.id,
  profileId: r.profile_id,
  routineKey: r.routine_key,
  routineName: r.routine_name,
  type: r.type,
  day: r.day,
  weekStart: r.week_start,
  startedAt: r.started_at,
  finishedAt: r.finished_at,
});

// ── Profiles, plan, routines, settings ──────────────────────────────────────

export type LoadedProfile = { profile: Profile; settings: Settings; session: Session | null };

/** Everything needed to render the app, oldest profile first. */
export async function loadProfiles(db: Db): Promise<LoadedProfile[]> {
  const [profiles, routines, settings, sessions] = await Promise.all([
    db.getAllAsync<ProfileRow>('SELECT * FROM profiles ORDER BY created_at'),
    db.getAllAsync<RoutineRow>('SELECT * FROM routines'),
    db.getAllAsync<SettingsRow>('SELECT * FROM settings'),
    db.getAllAsync<{ profile_id: string; data: string }>('SELECT * FROM active_sessions'),
  ]);
  return profiles.map((p) => {
    const own: Record<RoutineKey, Routine> = {};
    for (const r of routines) if (r.profile_id === p.id) own[r.key] = toRoutine(r);
    const s = settings.find((x) => x.profile_id === p.id);
    const sess = sessions.find((x) => x.profile_id === p.id);
    return {
      profile: {
        id: p.id,
        name: p.name,
        color: p.color,
        height: p.height,
        weight: p.weight,
        goal: p.goal,
        target: p.target,
        photoUri: p.photo_uri,
        plan: { weekly: p.weekly, days: JSON.parse(p.days), routines: own },
        createdAt: p.created_at,
      },
      settings: s ? toSettings(s) : DEFAULT_SETTINGS,
      session: sess ? (JSON.parse(sess.data) as Session) : null,
    };
  });
}

async function writeRoutine(db: Db, profileId: string, key: RoutineKey, r: Routine) {
  await db.runAsync(
    `INSERT INTO routines (profile_id, key, name, type, items) VALUES (?, ?, ?, ?, ?)
     ON CONFLICT (profile_id, key) DO UPDATE SET name = excluded.name, type = excluded.type, items = excluded.items`,
    profileId,
    key,
    r.name,
    r.type === 'cardio' ? 'cardio' : 'strength',
    JSON.stringify(r.items),
  );
}

async function writeSettings(db: Db, profileId: string, s: Settings) {
  await db.runAsync(
    `INSERT INTO settings (profile_id, input_variant, weight_step, rest_seconds, handedness) VALUES (?, ?, ?, ?, ?)
     ON CONFLICT (profile_id) DO UPDATE SET input_variant = excluded.input_variant, weight_step = excluded.weight_step,
       rest_seconds = excluded.rest_seconds, handedness = excluded.handedness`,
    profileId,
    s.inputVariant,
    s.weightStep,
    s.restSeconds,
    s.handedness,
  );
}

/**
 * Creates a profile with its plan, routines and default settings. The weight
 * entered during onboarding becomes the first body-weight entry, dated `today`.
 */
export async function createProfile(db: Db, p: Profile, today: string, settings: Settings = DEFAULT_SETTINGS) {
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `INSERT INTO profiles (id, name, color, height, weight, goal, target, photo_uri, weekly, days, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      p.id,
      p.name,
      p.color,
      p.height,
      p.weight,
      p.goal,
      p.target,
      p.photoUri,
      p.plan.weekly,
      JSON.stringify(p.plan.days),
      p.createdAt,
    );
    for (const [key, r] of Object.entries(p.plan.routines)) await writeRoutine(db, p.id, key, r);
    await writeSettings(db, p.id, settings);
    await db.runAsync('INSERT INTO body_log (profile_id, date, kg) VALUES (?, ?, ?)', p.id, today, p.weight);
  });
}

export type ProfileFields = Partial<Pick<Profile, 'name' | 'color' | 'height' | 'weight' | 'goal' | 'target' | 'photoUri'>>;

const FIELD_COLUMNS: Record<keyof ProfileFields, string> = {
  name: 'name',
  color: 'color',
  height: 'height',
  weight: 'weight',
  goal: 'goal',
  target: 'target',
  photoUri: 'photo_uri',
};

/** Updates profile fields (height, weight, target, goal, photo…). */
export async function updateProfileFields(db: Db, id: string, fields: ProfileFields) {
  const keys = Object.keys(fields) as (keyof ProfileFields)[];
  if (!keys.length) return;
  // Column names come from the fixed FIELD_COLUMNS allowlist, never from input.
  const set = keys.map((k) => `${FIELD_COLUMNS[k]} = ?`).join(', ');
  await db.runAsync(`UPDATE profiles SET ${set} WHERE id = ?`, ...keys.map((k) => fields[k] ?? null), id);
}

/**
 * Deletes a profile and everything stored for it: plan, settings, the workout in
 * progress, finished workouts and body weight. Each table is cleared explicitly
 * instead of relying on ON DELETE CASCADE, which only works while foreign keys are on.
 */
export async function deleteProfile(db: Db, id: string) {
  await db.withTransactionAsync(async () => {
    const workouts = 'SELECT id FROM workouts WHERE profile_id = ?';
    await db.runAsync(`DELETE FROM workout_sets WHERE workout_id IN (${workouts})`, id);
    await db.runAsync(`DELETE FROM cardio_entries WHERE workout_id IN (${workouts})`, id);
    for (const table of ['workouts', 'body_log', 'active_sessions', 'settings', 'routines']) {
      await db.runAsync(`DELETE FROM ${table} WHERE profile_id = ?`, id);
    }
    await db.runAsync('DELETE FROM profiles WHERE id = ?', id);
  });
}

/** Saves the whole plan: weekly count, schedule and every routine. */
export async function savePlan(db: Db, profileId: string, plan: Plan) {
  await db.withTransactionAsync(async () => {
    await db.runAsync('UPDATE profiles SET weekly = ?, days = ? WHERE id = ?', plan.weekly, JSON.stringify(plan.days), profileId);
    const keys = Object.keys(plan.routines);
    for (const key of keys) await writeRoutine(db, profileId, key, plan.routines[key]);
    const placeholders = keys.map(() => '?').join(', ');
    await db.runAsync(
      `DELETE FROM routines WHERE profile_id = ?${keys.length ? ` AND key NOT IN (${placeholders})` : ''}`,
      profileId,
      ...keys,
    );
  });
}

export async function saveSettings(db: Db, profileId: string, s: Settings) {
  await writeSettings(db, profileId, s);
}

// ── Live session ────────────────────────────────────────────────────────────

export async function saveSession(db: Db, profileId: string, s: Session) {
  await db.runAsync(
    `INSERT INTO active_sessions (profile_id, data) VALUES (?, ?)
     ON CONFLICT (profile_id) DO UPDATE SET data = excluded.data`,
    profileId,
    JSON.stringify(s),
  );
}

export async function clearSession(db: Db, profileId: string) {
  await db.runAsync('DELETE FROM active_sessions WHERE profile_id = ?', profileId);
}

// ── History ─────────────────────────────────────────────────────────────────

export type NewWorkout = Omit<WorkoutRecord, 'id'> & { sets: LoggedSet[]; cardio: LoggedCardio[] };

/** Stores a finished workout and clears the live session in one transaction. Returns the workout id. */
export async function recordWorkout(db: Db, w: NewWorkout): Promise<number> {
  let id = 0;
  await db.withTransactionAsync(async () => {
    const res = await db.runAsync(
      `INSERT INTO workouts (profile_id, routine_key, routine_name, type, day, week_start, started_at, finished_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      w.profileId,
      w.routineKey,
      w.routineName,
      w.type,
      w.day,
      w.weekStart,
      w.startedAt,
      w.finishedAt,
    );
    id = res.lastInsertRowId;
    for (const s of w.sets) {
      await db.runAsync(
        'INSERT INTO workout_sets (workout_id, ex_id, set_no, kg, reps, pr) VALUES (?, ?, ?, ?, ?, ?)',
        id,
        s.exId,
        s.setNo,
        s.kg,
        s.reps,
        s.pr ? 1 : 0,
      );
    }
    for (const c of w.cardio) {
      await db.runAsync(
        'INSERT INTO cardio_entries (workout_id, ex_id, minutes, value, zone, target) VALUES (?, ?, ?, ?, ?, ?)',
        id,
        c.exId,
        c.minutes,
        c.value,
        c.zone,
        c.target,
      );
    }
    await db.runAsync('DELETE FROM active_sessions WHERE profile_id = ?', w.profileId);
  });
  return id;
}

/** Weekday indexes with a finished workout in the given week. */
export async function doneDays(db: Db, profileId: string, weekStart: string): Promise<number[]> {
  const rows = await db.getAllAsync<{ day: number }>(
    'SELECT DISTINCT day FROM workouts WHERE profile_id = ? AND week_start = ? ORDER BY day',
    profileId,
    weekStart,
  );
  return rows.map((r) => r.day);
}

export async function getWorkout(
  db: Db,
  id: number,
): Promise<{ workout: WorkoutRecord; sets: LoggedSet[]; cardio: LoggedCardio[] } | null> {
  const row = await db.getFirstAsync<WorkoutRow>('SELECT * FROM workouts WHERE id = ?', id);
  if (!row) return null;
  const [sets, cardio] = await Promise.all([
    db.getAllAsync<{ ex_id: string; set_no: number; kg: number; reps: number; pr: number }>(
      'SELECT ex_id, set_no, kg, reps, pr FROM workout_sets WHERE workout_id = ? ORDER BY id',
      id,
    ),
    db.getAllAsync<{ ex_id: string; minutes: number; value: number; zone: number; target: number }>(
      'SELECT ex_id, minutes, value, zone, target FROM cardio_entries WHERE workout_id = ? ORDER BY id',
      id,
    ),
  ]);
  return {
    workout: toWorkout(row),
    sets: sets.map((s) => ({ exId: s.ex_id, setNo: s.set_no, kg: s.kg, reps: s.reps, pr: !!s.pr })),
    cardio: cardio.map((c) => ({ exId: c.ex_id, minutes: c.minutes, value: c.value, zone: c.zone, target: c.target })),
  };
}

/** Heaviest weight ever logged for an exercise, or 0 with no history. */
export async function bestKg(db: Db, profileId: string, exId: string): Promise<number> {
  const row = await db.getFirstAsync<{ best: number | null }>(
    `SELECT MAX(s.kg) AS best FROM workout_sets s JOIN workouts w ON w.id = s.workout_id
     WHERE w.profile_id = ? AND s.ex_id = ?`,
    profileId,
    exId,
  );
  return row?.best ?? 0;
}

/** Sets of an exercise from its most recent workout, in order. Empty with no history. */
export async function lastSets(db: Db, profileId: string, exId: string): Promise<{ kg: number; reps: number }[]> {
  return db.getAllAsync<{ kg: number; reps: number }>(
    `SELECT s.kg, s.reps FROM workout_sets s
     WHERE s.ex_id = ? AND s.workout_id = (
       SELECT w.id FROM workouts w JOIN workout_sets x ON x.workout_id = w.id
       WHERE w.profile_id = ? AND x.ex_id = ? ORDER BY w.finished_at DESC LIMIT 1)
     ORDER BY s.set_no`,
    exId,
    profileId,
    exId,
  );
}

/**
 * Working weight from the most recent workout of each exercise (its heaviest
 * set). Exercises never logged are left out.
 */
export async function lastKg(db: Db, profileId: string, exIds: string[]): Promise<Record<string, number>> {
  const out: Record<string, number> = {};
  for (const id of new Set(exIds)) {
    const sets = await lastSets(db, profileId, id);
    if (sets.length) out[id] = Math.max(...sets.map((s) => s.kg));
  }
  return out;
}

/** Heaviest weight ever logged per exercise. Exercises never logged are left out. */
export async function bestKgMany(db: Db, profileId: string, exIds: string[]): Promise<Record<string, number>> {
  const out: Record<string, number> = {};
  for (const id of new Set(exIds)) {
    const best = await bestKg(db, profileId, id);
    if (best > 0) out[id] = best;
  }
  return out;
}

export type WorkoutListRow = {
  id: number;
  routineKey: string;
  routineName: string;
  type: 'strength' | 'cardio';
  startedAt: number;
  finishedAt: number;
  sets: number;
  prs: number;
  minutes: number;
};

/** Finished workouts, newest first, with set, record and cardio-minute counts. */
export async function workoutList(db: Db, profileId: string, limit = 300): Promise<WorkoutListRow[]> {
  const rows = await db.getAllAsync<{
    id: number;
    routine_key: string;
    routine_name: string;
    type: 'strength' | 'cardio';
    started_at: number;
    finished_at: number;
    sets: number;
    prs: number;
    minutes: number;
  }>(
    `SELECT w.id, w.routine_key, w.routine_name, w.type, w.started_at, w.finished_at,
       (SELECT COUNT(*) FROM workout_sets s WHERE s.workout_id = w.id) AS sets,
       (SELECT COUNT(*) FROM workout_sets s WHERE s.workout_id = w.id AND s.pr = 1) AS prs,
       (SELECT COALESCE(SUM(c.minutes), 0) FROM cardio_entries c WHERE c.workout_id = w.id) AS minutes
     FROM workouts w WHERE w.profile_id = ? ORDER BY w.finished_at DESC LIMIT ?`,
    profileId,
    limit,
  );
  return rows.map((r) => ({
    id: r.id,
    routineKey: r.routine_key,
    routineName: r.routine_name,
    type: r.type,
    startedAt: r.started_at,
    finishedAt: r.finished_at,
    sets: r.sets,
    prs: r.prs,
    minutes: r.minutes,
  }));
}

export type RecordRow = { exId: string; kg: number; reps: number; finishedAt: number };

/** Latest personal record per exercise, newest first. */
export async function recentRecords(db: Db, profileId: string, limit: number): Promise<RecordRow[]> {
  const rows = await db.getAllAsync<{ ex_id: string; kg: number; reps: number; finished_at: number }>(
    `SELECT s.ex_id, s.kg, s.reps, w.finished_at FROM workout_sets s JOIN workouts w ON w.id = s.workout_id
     WHERE w.profile_id = ? AND s.pr = 1 ORDER BY w.finished_at DESC, s.kg DESC`,
    profileId,
  );
  const seen = new Set<string>();
  const out: RecordRow[] = [];
  for (const r of rows) {
    if (seen.has(r.ex_id)) continue;
    seen.add(r.ex_id);
    out.push({ exId: r.ex_id, kg: r.kg, reps: r.reps, finishedAt: r.finished_at });
    if (out.length === limit) break;
  }
  return out;
}

/** Most recent cardio entry for an activity, or null with no history. */
export async function lastCardio(db: Db, profileId: string, exId: string): Promise<{ minutes: number; value: number } | null> {
  return db.getFirstAsync<{ minutes: number; value: number }>(
    `SELECT c.minutes, c.value FROM cardio_entries c JOIN workouts w ON w.id = c.workout_id
     WHERE w.profile_id = ? AND c.ex_id = ? ORDER BY w.finished_at DESC, c.id DESC LIMIT 1`,
    profileId,
    exId,
  );
}

/** Heaviest set ever logged for an exercise (ties: more reps), or null with no history. */
export async function bestSet(db: Db, profileId: string, exId: string): Promise<{ kg: number; reps: number } | null> {
  return db.getFirstAsync<{ kg: number; reps: number }>(
    `SELECT s.kg, s.reps FROM workout_sets s JOIN workouts w ON w.id = s.workout_id
     WHERE w.profile_id = ? AND s.ex_id = ? ORDER BY s.kg DESC, s.reps DESC LIMIT 1`,
    profileId,
    exId,
  );
}

/** Best distance / floors ever logged for an activity, or 0 with no history. */
export async function bestCardio(db: Db, profileId: string, exId: string): Promise<number> {
  const row = await db.getFirstAsync<{ best: number | null }>(
    `SELECT MAX(c.value) AS best FROM cardio_entries c JOIN workouts w ON w.id = c.workout_id
     WHERE w.profile_id = ? AND c.ex_id = ?`,
    profileId,
    exId,
  );
  return row?.best ?? 0;
}

/** Every logged set of an exercise since `fromMs`, oldest first. */
export async function liftSets(
  db: Db,
  profileId: string,
  exId: string,
  fromMs: number,
): Promise<{ workoutId: number; finishedAt: number; kg: number; reps: number }[]> {
  return db.getAllAsync(
    `SELECT w.id AS workoutId, w.finished_at AS finishedAt, s.kg, s.reps FROM workout_sets s JOIN workouts w ON w.id = s.workout_id
     WHERE w.profile_id = ? AND s.ex_id = ? AND w.finished_at >= ? ORDER BY w.finished_at, s.set_no`,
    profileId,
    exId,
    fromMs,
  );
}

/** Every cardio entry since `fromMs`, oldest first. */
export async function cardioEntries(
  db: Db,
  profileId: string,
  fromMs: number,
): Promise<{ finishedAt: number; exId: string; minutes: number; value: number }[]> {
  return db.getAllAsync(
    `SELECT w.finished_at AS finishedAt, c.ex_id AS exId, c.minutes, c.value FROM cardio_entries c JOIN workouts w ON w.id = c.workout_id
     WHERE w.profile_id = ? AND w.finished_at >= ? ORDER BY w.finished_at, c.id`,
    profileId,
    fromMs,
  );
}

// ── Body weight ─────────────────────────────────────────────────────────────

export async function bodyLog(db: Db, profileId: string): Promise<BodyEntry[]> {
  return db.getAllAsync<BodyEntry>('SELECT date, kg FROM body_log WHERE profile_id = ? ORDER BY date', profileId);
}

/** Saves today's weight (one entry per day) and updates the profile weight. */
export async function saveBodyWeight(db: Db, profileId: string, date: string, kg: number) {
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `INSERT INTO body_log (profile_id, date, kg) VALUES (?, ?, ?)
       ON CONFLICT (profile_id, date) DO UPDATE SET kg = excluded.kg`,
      profileId,
      date,
      kg,
    );
    await db.runAsync('UPDATE profiles SET weight = ? WHERE id = ?', kg, profileId);
  });
}
