import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';

import { confirm } from '@/components/confirm';
import type { LoggedCardio, LoggedSet, Session } from '@/domain/types';
import { useStore } from '@/state/store';

/** Leaves the workout screens for the Workout tab. */
function toWorkoutTab() {
  router.dismissAll();
  router.navigate('/workout');
}

/**
 * "End workout" (tap twice within 3 s) and "Finish" for both log screens.
 * Finishing with nothing logged asks first and then closes without counting the day.
 */
export function useEndWorkout(s: Session, emptyPrompt: string) {
  const { setSession, finishWorkout } = useStore();
  const [confirming, setConfirming] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => clearTimeout(timer.current ?? undefined), []);

  const endWorkout = () => {
    clearTimeout(timer.current ?? undefined);
    if (!confirming) {
      setConfirming(true);
      timer.current = setTimeout(() => setConfirming(false), 3000);
      return;
    }
    setSession(null);
    toWorkoutTab();
  };

  const finish = async (logged: { sets: LoggedSet[]; cardio: LoggedCardio[] }) => {
    if (!logged.sets.length && !logged.cardio.length) {
      if (!(await confirm(emptyPrompt, 'Finish'))) return;
      setSession(null);
      toWorkoutTab();
      return;
    }
    const id = await finishWorkout({
      routineKey: s.routineKey,
      routineName: s.routineName,
      type: s.type,
      day: s.day,
      weekStart: s.weekStart,
      startedAt: s.startedAt,
      finishedAt: Date.now(),
      ...logged,
    });
    router.dismissAll();
    router.push(`/summary/${id}`);
  };

  return { confirming, endWorkout, finish };
}
