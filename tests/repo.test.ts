import assert from 'node:assert/strict';
import { test } from 'node:test';

import { migrate } from '@/data/db';
import * as repo from '@/data/repo';
import { mkPlan, withDayCycled } from '@/domain/plan';
import type { Profile, StrengthSession } from '@/domain/types';
import { DEFAULT_SETTINGS } from '@/domain/types';

import { memoryDb } from './nodeDb';

const profile = (id: string, name = 'Luka'): Profile => ({
  id,
  name,
  color: '#ff5a3c',
  height: 178,
  weight: 80,
  goal: 'muscle',
  target: 78,
  photoUri: null,
  plan: mkPlan(3),
  createdAt: Date.now(),
});

async function freshDb() {
  const db = memoryDb();
  await migrate(db);
  return db;
}

test('migrations are idempotent', async () => {
  const db = await freshDb();
  await migrate(db);
  const v = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  assert.equal(v?.user_version, 1);
});

test('new install has no profiles', async () => {
  const db = await freshDb();
  assert.deepEqual(await repo.loadProfiles(db), []);
});

test('profile round trip with plan, routines and settings', async () => {
  const db = await freshDb();
  await repo.createProfile(db, profile('p1', "Ana O'Neil"), '2026-11-01');
  const [loaded] = await repo.loadProfiles(db);
  assert.equal(loaded.profile.name, "Ana O'Neil");
  assert.deepEqual(loaded.profile.plan, mkPlan(3));
  assert.deepEqual(loaded.settings, DEFAULT_SETTINGS);
  assert.equal(loaded.session, null);

  await repo.updateProfileFields(db, 'p1', { weight: 79.5, goal: 'fat', photoUri: 'file:///a.jpg' });
  await repo.saveSettings(db, 'p1', { ...DEFAULT_SETTINGS, inputVariant: 'scale', handedness: 'left' });
  const [again] = await repo.loadProfiles(db);
  assert.equal(again.profile.weight, 79.5);
  assert.equal(again.profile.goal, 'fat');
  assert.equal(again.profile.photoUri, 'file:///a.jpg');
  assert.equal(again.settings.inputVariant, 'scale');
  assert.equal(again.settings.handedness, 'left');
});

test('savePlan writes schedule, edits and removed routines', async () => {
  const db = await freshDb();
  await repo.createProfile(db, profile('p1'), '2026-11-01');
  const plan = withDayCycled(mkPlan(3), 1);
  plan.routines.F = { name: 'New routine', items: [] };
  plan.routines.A = { ...plan.routines.A, name: 'Push day' };
  delete plan.routines.C;
  await repo.savePlan(db, 'p1', plan);
  const [loaded] = await repo.loadProfiles(db);
  assert.deepEqual(loaded.profile.plan.days, plan.days);
  assert.deepEqual(Object.keys(loaded.profile.plan.routines).sort(), ['A', 'B', 'E', 'F']);
  assert.equal(loaded.profile.plan.routines.A.name, 'Push day');
  assert.deepEqual(loaded.profile.plan.routines.F.items, []); // empty routine survives
});

test('profiles keep their own data', async () => {
  const db = await freshDb();
  await repo.createProfile(db, profile('p1', 'Marko'), '2026-11-01');
  await repo.createProfile(db, profile('p2', 'Ana'), '2026-11-01');
  await repo.updateProfileFields(db, 'p2', { height: 168 });
  const all = await repo.loadProfiles(db);
  assert.deepEqual(all.map((l) => [l.profile.name, l.profile.height]), [['Marko', 178], ['Ana', 168]]);
});

const session = (): StrengthSession => ({
  type: 'strength',
  routineKey: 'A',
  routineName: 'Chest & triceps',
  day: 4,
  weekStart: '2026-11-02',
  startedAt: 1000,
  cur: 0,
  sel: 1,
  ex: [{ id: 'bench', target: 4, reps: 6, best: 0, sets: [{ w: 60, r: 6, done: true, pr: false }, { w: 60, r: 6, done: false, pr: false }] }],
  rest: { end: 5000, total: 120000 },
});

test('live session survives a reload and clears', async () => {
  const db = await freshDb();
  await repo.createProfile(db, profile('p1'), '2026-11-01');
  await repo.saveSession(db, 'p1', session());
  await repo.saveSession(db, 'p1', { ...session(), cur: 0, sel: -1 });
  const [loaded] = await repo.loadProfiles(db);
  assert.equal((loaded.session as StrengthSession).sel, -1);
  await repo.clearSession(db, 'p1');
  assert.equal((await repo.loadProfiles(db))[0].session, null);
});

test('history: record, done days, best, last sets, cardio', async () => {
  const db = await freshDb();
  await repo.createProfile(db, profile('p1'), '2026-11-01');
  await repo.saveSession(db, 'p1', session());

  // Brand-new profile: no history.
  assert.deepEqual(await repo.doneDays(db, 'p1', '2026-11-02'), []);
  assert.equal(await repo.bestKg(db, 'p1', 'bench'), 0);
  assert.deepEqual(await repo.lastSets(db, 'p1', 'bench'), []);
  assert.equal(await repo.lastCardio(db, 'p1', 'treadmill'), null);

  const base = { profileId: 'p1', routineKey: 'A', routineName: 'Chest & triceps', type: 'strength' as const, weekStart: '2026-11-02' };
  const w1 = await repo.recordWorkout(db, {
    ...base, day: 0, startedAt: 1, finishedAt: 2, cardio: [],
    sets: [{ exId: 'bench', setNo: 1, kg: 60, reps: 6, pr: false }, { exId: 'bench', setNo: 2, kg: 62.5, reps: 5, pr: false }],
  });
  const w2 = await repo.recordWorkout(db, {
    ...base, day: 4, startedAt: 3, finishedAt: 4, cardio: [],
    sets: [{ exId: 'bench', setNo: 1, kg: 65, reps: 6, pr: true }],
  });
  // Finished with nothing logged would not be recorded; empty arrays still work.
  await repo.recordWorkout(db, { ...base, type: 'cardio', routineKey: 'E', routineName: 'Cardio', day: 5, startedAt: 5, finishedAt: 6, sets: [],
    cardio: [{ exId: 'treadmill', minutes: 20, value: 3.6, zone: 2, target: 20 }] });

  assert.ok(w2 > w1);
  assert.deepEqual(await repo.doneDays(db, 'p1', '2026-11-02'), [0, 4, 5]);
  assert.deepEqual(await repo.doneDays(db, 'p1', '2026-11-09'), []);
  assert.equal(await repo.bestKg(db, 'p1', 'bench'), 65);
  assert.deepEqual(await repo.lastSets(db, 'p1', 'bench'), [{ kg: 65, reps: 6 }]);
  assert.deepEqual(await repo.lastCardio(db, 'p1', 'treadmill'), { minutes: 20, value: 3.6 });
  assert.equal((await repo.loadProfiles(db))[0].session, null, 'recording clears the session');

  const got = await repo.getWorkout(db, w2);
  assert.equal(got?.workout.day, 4);
  assert.deepEqual(got?.sets, [{ exId: 'bench', setNo: 1, kg: 65, reps: 6, pr: true }]);
  assert.equal(await repo.getWorkout(db, 999), null);
});

test('a failed workout write rolls back completely', async () => {
  const db = await freshDb();
  await repo.createProfile(db, profile('p1'), '2026-11-01');
  await assert.rejects(
    repo.recordWorkout(db, {
      profileId: 'p1', routineKey: 'A', routineName: 'X', type: 'strength', day: 0, weekStart: '2026-11-02', startedAt: 1, finishedAt: 2,
      cardio: [], sets: [{ exId: 'bench', setNo: 1, kg: -5, reps: 6, pr: false }],
    }),
  );
  assert.deepEqual(await repo.doneDays(db, 'p1', '2026-11-02'), []);
});

test('body weight: one entry per day, updates profile weight', async () => {
  const db = await freshDb();
  await repo.createProfile(db, profile('p1'), '2026-11-01');
  await repo.saveBodyWeight(db, 'p1', '2026-11-05', 80.2);
  await repo.saveBodyWeight(db, 'p1', '2026-11-06', 80.0);
  await repo.saveBodyWeight(db, 'p1', '2026-11-06', 79.8);
  assert.deepEqual(await repo.bodyLog(db, 'p1'), [
    { date: '2026-11-01', kg: 80 }, // onboarding weight
    { date: '2026-11-05', kg: 80.2 },
    { date: '2026-11-06', kg: 79.8 },
  ]);
  assert.equal((await repo.loadProfiles(db))[0].profile.weight, 79.8);
});

test('last working weight and recent records', async () => {
  const db = await freshDb();
  await repo.createProfile(db, profile('p1'), '2026-11-01');
  assert.deepEqual(await repo.lastKg(db, 'p1', ['bench', 'squat']), {});
  assert.deepEqual(await repo.recentRecords(db, 'p1', 4), []);
  const base = { profileId: 'p1', routineKey: 'A', routineName: 'A', type: 'strength' as const, weekStart: '2026-11-02', day: 0, cardio: [] };
  await repo.recordWorkout(db, { ...base, startedAt: 1, finishedAt: 10, sets: [
    { exId: 'bench', setNo: 1, kg: 60, reps: 6, pr: true },
    { exId: 'squat', setNo: 1, kg: 100, reps: 5, pr: true },
  ] });
  await repo.recordWorkout(db, { ...base, startedAt: 11, finishedAt: 20, sets: [
    { exId: 'bench', setNo: 1, kg: 62.5, reps: 6, pr: true },
    { exId: 'bench', setNo: 2, kg: 60, reps: 6, pr: false },
  ] });
  assert.deepEqual(await repo.lastKg(db, 'p1', ['bench', 'squat', 'row']), { bench: 62.5, squat: 100 });
  assert.deepEqual(await repo.recentRecords(db, 'p1', 4), [
    { exId: 'bench', kg: 62.5, reps: 6, finishedAt: 20 },
    { exId: 'squat', kg: 100, reps: 5, finishedAt: 10 },
  ]);
  assert.equal((await repo.recentRecords(db, 'p1', 1)).length, 1);
});

test('best set and best cardio', async () => {
  const db = await freshDb();
  await repo.createProfile(db, profile('p1'), '2026-11-01');
  assert.equal(await repo.bestSet(db, 'p1', 'bench'), null);
  assert.equal(await repo.bestCardio(db, 'p1', 'bike'), 0);
  const base = { profileId: 'p1', routineKey: 'A', routineName: 'A', type: 'strength' as const, weekStart: '2026-11-02', day: 0, startedAt: 1, finishedAt: 2 };
  await repo.recordWorkout(db, { ...base, cardio: [{ exId: 'bike', minutes: 15, value: 6.2, zone: 3, target: 15 }], sets: [
    { exId: 'bench', setNo: 1, kg: 80, reps: 8, pr: false },
    { exId: 'bench', setNo: 2, kg: 85, reps: 5, pr: false },
    { exId: 'bench', setNo: 3, kg: 85, reps: 6, pr: false },
  ] });
  assert.deepEqual(await repo.bestSet(db, 'p1', 'bench'), { kg: 85, reps: 6 });
  assert.equal(await repo.bestCardio(db, 'p1', 'bike'), 6.2);
});

test('deleting a profile removes all of its data and nothing else', async () => {
  const db = await freshDb();
  // Foreign keys off, so the test proves every table is cleared explicitly.
  await db.execAsync('PRAGMA foreign_keys = OFF');
  for (const id of ['p1', 'p2']) {
    await repo.createProfile(db, profile(id, id), '2026-11-01');
    await repo.saveBodyWeight(db, id, '2026-11-05', 79);
    await repo.recordWorkout(db, {
      profileId: id, routineKey: 'A', routineName: 'Push', type: 'strength', weekStart: '2026-11-02', day: 0, startedAt: 1, finishedAt: 2,
      sets: [{ exId: 'bench', setNo: 1, kg: 60, reps: 6, pr: false }],
      cardio: [{ exId: 'treadmill', minutes: 10, value: 2, zone: 2, target: 10 }],
    });
    // A new workout in progress (finishing one clears the previous).
    await repo.saveSession(db, id, session());
  }

  await repo.deleteProfile(db, 'p1');

  const count = async (sql: string) => (await db.getFirstAsync<{ n: number }>(sql))?.n;
  assert.deepEqual((await repo.loadProfiles(db)).map((l) => l.profile.id), ['p2']);
  for (const table of ['routines', 'settings', 'active_sessions', 'workouts', 'body_log']) {
    assert.equal(await count(`SELECT COUNT(*) AS n FROM ${table} WHERE profile_id = 'p1'`), 0, table);
    assert.ok((await count(`SELECT COUNT(*) AS n FROM ${table} WHERE profile_id = 'p2'`))! > 0, table);
  }
  assert.equal(await count('SELECT COUNT(*) AS n FROM workout_sets'), 1);
  assert.equal(await count('SELECT COUNT(*) AS n FROM cardio_entries'), 1);
  assert.equal(await repo.bestKg(db, 'p2', 'bench'), 60);
});

test('workout list: newest first, with sets, records and cardio minutes', async () => {
  const db = await freshDb();
  await repo.createProfile(db, profile('p1'), '2026-11-01');
  await repo.createProfile(db, profile('p2', 'Other'), '2026-11-01');
  assert.deepEqual(await repo.workoutList(db, 'p1'), []);

  const base = { routineKey: 'A', routineName: 'Push', type: 'strength' as const, weekStart: '2026-11-02', day: 0 };
  await repo.recordWorkout(db, {
    ...base, profileId: 'p1', startedAt: 1000, finishedAt: 61000, cardio: [],
    sets: [{ exId: 'bench', setNo: 1, kg: 60, reps: 6, pr: false }, { exId: 'bench', setNo: 2, kg: 65, reps: 5, pr: true }],
  });
  await repo.recordWorkout(db, {
    ...base, profileId: 'p1', type: 'cardio', routineKey: 'E', routineName: 'Cardio', startedAt: 70000, finishedAt: 90000, sets: [],
    cardio: [{ exId: 'treadmill', minutes: 20, value: 3, zone: 2, target: 20 }, { exId: 'bike', minutes: 15, value: 5, zone: 2, target: 15 }],
  });
  await repo.recordWorkout(db, { ...base, profileId: 'p2', startedAt: 1, finishedAt: 2, cardio: [], sets: [] });

  const list = await repo.workoutList(db, 'p1');
  assert.deepEqual(
    list.map((w) => [w.routineName, w.type, w.sets, w.prs, w.minutes]),
    [
      ['Cardio', 'cardio', 0, 0, 35],
      ['Push', 'strength', 2, 1, 0],
    ],
  );
  assert.equal(list[1].finishedAt - list[1].startedAt, 60000);
});
