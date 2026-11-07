// On-device database. Everything LiftLog stores lives here; there is no backend.

import type { SQLiteDatabase } from 'expo-sqlite';

/** The subset of expo-sqlite the app uses. Keeps the repository testable. */
export type Db = Pick<SQLiteDatabase, 'execAsync' | 'runAsync' | 'getAllAsync' | 'getFirstAsync' | 'withTransactionAsync'>;

export const DATABASE_NAME = 'liftlog.db';
const SCHEMA_VERSION = 1;

const V1 = `
CREATE TABLE profiles (
  id          TEXT PRIMARY KEY NOT NULL,
  name        TEXT NOT NULL,
  color       TEXT NOT NULL,
  height      REAL NOT NULL,
  weight      REAL NOT NULL,
  goal        TEXT NOT NULL CHECK (goal IN ('muscle', 'strength', 'fat')),
  target      REAL NOT NULL,
  photo_uri   TEXT,
  weekly      INTEGER NOT NULL CHECK (weekly BETWEEN 2 AND 6),
  days        TEXT NOT NULL,              -- JSON: (routine key | null)[7], Monday first
  created_at  INTEGER NOT NULL
);

CREATE TABLE routines (
  profile_id  TEXT NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
  key         TEXT NOT NULL,              -- 'A' … 'H'
  name        TEXT NOT NULL,
  type        TEXT NOT NULL CHECK (type IN ('strength', 'cardio')),
  items       TEXT NOT NULL,              -- JSON: StrengthItem[] | CardioItem[]
  PRIMARY KEY (profile_id, key)
);

CREATE TABLE settings (
  profile_id    TEXT PRIMARY KEY NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
  input_variant TEXT NOT NULL CHECK (input_variant IN ('stepper', 'keypad', 'scale')),
  weight_step   REAL NOT NULL,
  rest_seconds  INTEGER NOT NULL,
  handedness    TEXT NOT NULL CHECK (handedness IN ('right', 'left'))
);

-- The workout in progress, one per profile, so it survives closing the app.
CREATE TABLE active_sessions (
  profile_id  TEXT PRIMARY KEY NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
  data        TEXT NOT NULL               -- JSON: Session
);

-- Finished workouts.
CREATE TABLE workouts (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  profile_id    TEXT NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
  routine_key   TEXT NOT NULL,
  routine_name  TEXT NOT NULL,
  type          TEXT NOT NULL CHECK (type IN ('strength', 'cardio')),
  day           INTEGER NOT NULL CHECK (day BETWEEN 0 AND 6),
  week_start    TEXT NOT NULL,            -- YYYY-MM-DD, Monday
  started_at    INTEGER NOT NULL,
  finished_at   INTEGER NOT NULL
);
CREATE INDEX workouts_by_week ON workouts (profile_id, week_start);
CREATE INDEX workouts_by_time ON workouts (profile_id, finished_at);

CREATE TABLE workout_sets (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  workout_id  INTEGER NOT NULL REFERENCES workouts (id) ON DELETE CASCADE,
  ex_id       TEXT NOT NULL,
  set_no      INTEGER NOT NULL,
  kg          REAL NOT NULL CHECK (kg >= 0),
  reps        INTEGER NOT NULL CHECK (reps >= 0),
  pr          INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX workout_sets_by_workout ON workout_sets (workout_id);
CREATE INDEX workout_sets_by_exercise ON workout_sets (ex_id);

CREATE TABLE cardio_entries (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  workout_id  INTEGER NOT NULL REFERENCES workouts (id) ON DELETE CASCADE,
  ex_id       TEXT NOT NULL,
  minutes     INTEGER NOT NULL CHECK (minutes >= 0),
  value       REAL NOT NULL CHECK (value >= 0), -- km or floors, see the exercise unit
  zone        INTEGER NOT NULL CHECK (zone BETWEEN 1 AND 5),
  target      INTEGER NOT NULL                  -- planned minutes
);
CREATE INDEX cardio_entries_by_workout ON cardio_entries (workout_id);
CREATE INDEX cardio_entries_by_exercise ON cardio_entries (ex_id);

CREATE TABLE body_log (
  profile_id  TEXT NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
  date        TEXT NOT NULL,              -- YYYY-MM-DD, one entry per day
  kg          REAL NOT NULL CHECK (kg > 0),
  PRIMARY KEY (profile_id, date)
);
`;

/** Runs from SQLiteProvider's onInit, before any screen reads the database. */
export async function migrate(db: Db) {
  // Connection settings must be applied outside the migration transaction.
  await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');

  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  if (row === null) throw new Error('Could not read the database schema version');
  const version = row.user_version;
  if (version > SCHEMA_VERSION) throw new Error('Database schema is newer than this app supports');
  if (version === SCHEMA_VERSION) return;

  await db.withTransactionAsync(async () => {
    if (version < 1) await db.execAsync(V1);
    await db.execAsync(`PRAGMA user_version = ${SCHEMA_VERSION}`);
  });
}
