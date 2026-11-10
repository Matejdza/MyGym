// App state: profiles, plan, settings and the live session, kept in memory and
// written through to SQLite. Screens read from here; history screens query the
// database directly with `useDbQuery`, which re-runs after every history write.

import { SQLiteProvider, useSQLiteContext } from 'expo-sqlite';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type DependencyList,
  type PropsWithChildren,
} from 'react';

import { DATABASE_NAME, migrate, type Db } from '@/data/db';
import * as repo from '@/data/repo';
import type { NewWorkout, ProfileFields } from '@/data/repo';
import { removeProfilePhoto } from '@/data/profilePhoto';
import { isoDate, weekStartOf } from '@/domain/dates';
import { withWeeklyFromDays } from '@/domain/plan';
import { makeSession, routineExercises } from '@/domain/session';
import type { Plan, Profile, Session, Settings } from '@/domain/types';
import { DEFAULT_SETTINGS } from '@/domain/types';

type Entry = { profile: Profile; settings: Settings; session: Session | null };

type State = {
  ready: boolean;
  /** Profiles in creation order. */
  order: string[];
  byId: Record<string, Entry>;
  /** Profile picked on the profile screen; null until someone picks. */
  activeId: string | null;
  /** Bumped after each write to history, so history queries refresh. */
  historyVersion: number;
};

type Actions = {
  selectProfile: (id: string) => void;
  /** "Switch profile": back to the profile picker. */
  leaveProfile: () => void;
  createProfile: (p: Omit<Profile, 'id' | 'createdAt' | 'photoUri'>) => Promise<string>;
  /** Deletes the active profile and all its history, then returns to the profile picker. */
  deleteProfile: () => Promise<void>;
  updateProfile: (fields: ProfileFields) => void;
  setPlan: (plan: Plan) => void;
  setSettings: (patch: Partial<Settings>) => void;
  setSession: (session: Session | null) => void;
  /**
   * Opens the workout for weekday `day` of this week: keeps the running session
   * if it is for that day, otherwise starts a new one (replacing any other, as in
   * the prototype). Returns false when the day has nothing to start.
   */
  startWorkout: (day: number) => Promise<boolean>;
  /** Stores a finished workout, clears the session and returns the workout id. */
  finishWorkout: (w: Omit<NewWorkout, 'profileId'>) => Promise<number>;
  saveBodyWeight: (date: string, kg: number) => Promise<void>;
};

type Store = State & Actions & { db: Db };

const StoreContext = createContext<Store | null>(null);

const INITIAL: State = { ready: false, order: [], byId: {}, activeId: null, historyVersion: 0 };

/** Opens the database, runs migrations, then provides the store. */
export function AppDataProvider({ children }: PropsWithChildren) {
  return (
    <SQLiteProvider databaseName={DATABASE_NAME} onInit={migrate}>
      <StoreProvider>{children}</StoreProvider>
    </SQLiteProvider>
  );
}

function StoreProvider({ children }: PropsWithChildren) {
  const db = useSQLiteContext();
  const [state, setState] = useState<State>(INITIAL);
  // Source of truth for actions. Every change goes through `commit`, which
  // updates this ref first and then renders, so actions never read stale state.
  const ref = useRef<State>(INITIAL);
  const commit = useCallback((fn: (s: State) => State) => {
    ref.current = fn(ref.current);
    setState(ref.current);
  }, []);

  const reload = useCallback(async () => {
    const loaded = await repo.loadProfiles(db);
    commit((s) => ({
      ...s,
      ready: true,
      order: loaded.map((l) => l.profile.id),
      byId: Object.fromEntries(loaded.map((l) => [l.profile.id, l])),
      activeId: s.activeId && loaded.some((l) => l.profile.id === s.activeId) ? s.activeId : null,
    }));
  }, [db, commit]);

  useEffect(() => {
    reload();
  }, [reload]);

  // Every write goes through one queue so rapid taps never overlap transactions.
  // If a write fails, memory is reloaded from the database so the two agree again.
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const write = useCallback(
    <T,>(fn: () => Promise<T>): Promise<T> => {
      const next = queue.current.then(fn);
      queue.current = next.catch((e) => {
        console.error('[liftlog] database write failed', e);
        return reload();
      });
      return next;
    },
    [reload],
  );

  const actions = useMemo<Actions>(() => {
    const active = () => {
      const id = ref.current.activeId;
      if (!id) throw new Error('No active profile');
      return id;
    };
    /** Updates the active profile's entry in memory. */
    const patchActive = (fn: (e: Entry) => Entry) =>
      commit((s) => (s.activeId ? { ...s, byId: { ...s.byId, [s.activeId]: fn(s.byId[s.activeId]) } } : s));
    const bumpHistory = () => commit((s) => ({ ...s, historyVersion: s.historyVersion + 1 }));

    return {
      selectProfile: (id) => commit((s) => ({ ...s, activeId: id })),
      leaveProfile: () => commit((s) => ({ ...s, activeId: null })),

      createProfile: async (input) => {
        const profile: Profile = { ...input, id: `p${Date.now()}`, createdAt: Date.now(), photoUri: null };
        await write(() => repo.createProfile(db, profile, isoDate(new Date())));
        commit((s) => ({
          ...s,
          order: [...s.order, profile.id],
          byId: { ...s.byId, [profile.id]: { profile, settings: DEFAULT_SETTINGS, session: null } },
          activeId: profile.id,
        }));
        return profile.id;
      },

      deleteProfile: async () => {
        const id = active();
        const photo = ref.current.byId[id].profile.photoUri;
        await write(() => repo.deleteProfile(db, id));
        removeProfilePhoto(photo);
        // Leaving the profile sends the router back to the picker (or Welcome when none is left).
        commit((s) => {
          const { [id]: _removed, ...byId } = s.byId;
          return { ...s, order: s.order.filter((o) => o !== id), byId, activeId: null, historyVersion: s.historyVersion + 1 };
        });
      },

      updateProfile: (fields) => {
        const id = active();
        patchActive((e) => ({ ...e, profile: { ...e.profile, ...fields } }));
        write(() => repo.updateProfileFields(db, id, fields));
      },

      setPlan: (input) => {
        const id = active();
        // Workouts a week always follow the days that have a routine.
        const plan = withWeeklyFromDays(input);
        patchActive((e) => ({ ...e, profile: { ...e.profile, plan } }));
        write(() => repo.savePlan(db, id, plan));
      },

      setSettings: (patch) => {
        const id = active();
        patchActive((e) => ({ ...e, settings: { ...e.settings, ...patch } }));
        const next = ref.current.byId[id].settings;
        write(() => repo.saveSettings(db, id, next));
      },

      setSession: (session) => {
        const id = active();
        patchActive((e) => ({ ...e, session }));
        write(() => (session ? repo.saveSession(db, id, session) : repo.clearSession(db, id)));
      },

      startWorkout: async (day) => {
        const id = active();
        const { profile, session } = ref.current.byId[id];
        const weekStart = weekStartOf(new Date());
        if (session && session.day === day && session.weekStart === weekStart) return true;
        const exIds = routineExercises(profile.plan, day);
        if (!exIds.length) return false;
        const [lastKg, bestKg] = await write(() => Promise.all([repo.lastKg(db, id, exIds), repo.bestKgMany(db, id, exIds)]));
        const next = makeSession(profile.plan, day, weekStart, Date.now(), { lastKg, bestKg });
        if (!next) return false;
        patchActive((e) => ({ ...e, session: next }));
        write(() => repo.saveSession(db, id, next));
        return true;
      },

      finishWorkout: async (w) => {
        const id = active();
        const workoutId = await write(() => repo.recordWorkout(db, { ...w, profileId: id }));
        patchActive((e) => ({ ...e, session: null }));
        bumpHistory();
        return workoutId;
      },

      saveBodyWeight: async (date, kg) => {
        const id = active();
        await write(() => repo.saveBodyWeight(db, id, date, kg));
        patchActive((e) => ({ ...e, profile: { ...e.profile, weight: kg } }));
        bumpHistory();
      },
    };
  }, [db, write, commit]);

  const store = useMemo<Store>(() => ({ ...state, ...actions, db }), [state, actions, db]);

  // Development only: lets the store be inspected from the debugger console.
  useEffect(() => {
    if (__DEV__) (globalThis as { __liftlog?: Store }).__liftlog = store;
  }, [store]);

  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const s = useContext(StoreContext);
  if (!s) throw new Error('useStore must be used inside AppDataProvider');
  return s;
}

/** The profile picked on the profile screen. Only call on screens that need one. */
export function useActive(): Entry {
  const { activeId, byId } = useStore();
  if (!activeId || !byId[activeId]) throw new Error('No active profile');
  return byId[activeId];
}

/**
 * Runs a read-only database query and re-runs it when `deps` change or history
 * is written. Returns undefined while the first result loads.
 */
export function useDbQuery<T>(query: (db: Db) => Promise<T>, deps: DependencyList): T | undefined {
  const { db, historyVersion } = useStore();
  const [result, setResult] = useState<T>();
  useEffect(() => {
    let alive = true;
    query(db).then((r) => alive && setResult(r));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db, historyVersion, ...deps]);
  return result;
}
