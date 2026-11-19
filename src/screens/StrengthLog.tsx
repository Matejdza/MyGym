import { useEffect, useRef } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EndWorkoutButton, ExerciseSwitcher, LogTopBar, ProgressSegments, logStyles } from '@/components/LogChrome';
import { confirm } from '@/components/confirm';
import { Pop } from '@/components/Motion';
import { enterPhase } from '@/domain/mobilitySession';
import { StepRow } from '@/components/SetInputs';
import { Mono, UI } from '@/components/Txt';
import { PrimaryButton, Ring } from '@/components/ui';
import { exercise } from '@/data/catalog';
import * as repo from '@/data/repo';
import { fmt, mmss, plural } from '@/domain/format';
import { isTimed, maxReps, repsStep } from '@/domain/plan';
import * as S from '@/domain/strength';
import type { StrengthSession } from '@/domain/types';
import { useEndWorkout } from '@/hooks/useEndWorkout';
import { useNow } from '@/hooks/useNow';
import { playRestSignal, primeRestSignal } from '@/hooks/restSignal';
import { useActive, useDbQuery, useStore } from '@/state/store';
import { useScale, useTop } from '@/theme/layout';
import { colors } from '@/theme/tokens';
import { t } from '@/i18n';

/** A rest that ended more than this long ago (app was closed) ends silently. */
const SIGNAL_GRACE = 3000;

/** Strength workout: set rows, rest timer and the set-entry sheet. */
export function StrengthLog({ session: s }: { session: StrengthSession }) {
  const { profile, settings } = useActive();
  const { setSession } = useStore();
  const top = useTop();
  const { fit } = useScale();
  const insets = useSafeAreaInsets();
  const now = useNow(500);

  // Exercises where logging 0 kg was confirmed, so the question is asked once per exercise.
  const zeroOk = useRef(new Set<string>());
  const { confirming, endWorkout, finish: finishWith } = useEndWorkout(s, t('Finish without logging any sets?'));

  const e = s.ex[s.cur];
  const ex = exercise(e.id);
  const set = S.currentSet(s);
  const last = s.cur === s.ex.length - 1;
  const mirrored = settings.handedness === 'left';
  const timed = isTimed(e.id);

  // Rest timer ends on its own, with a signal unless the app was away long past the end.
  useEffect(() => {
    if (!s.rest || now < s.rest.end) return;
    if (now - s.rest.end < SIGNAL_GRACE) playRestSignal();
    setSession(S.skipRest(s));
  }, [now, s, setSession]);

  const lastTime = useDbQuery((db) => repo.lastSets(db, profile.id, e.id), [profile.id, e.id]);

  const update = (next: StrengthSession) => setSession(next);

  const finish = () => {
    const open = s.ex.reduce((n, x) => n + x.sets.filter((y) => !y.done).length, 0);
    return finishWith({ sets: S.loggedSets(s), cardio: [] }, open ? plural(open, 'set') : undefined);
  };

  const main = async () => {
    if (set) {
      primeRestSignal();
      // A weighted exercise left at 0 kg is usually a forgotten weight, not a real set.
      if (set.w === 0 && !ex.bodyweight && !timed && !zeroOk.current.has(e.id)) {
        if (!(await confirm(t('Log this set with 0 kg?'), t('Log set'), t('Set the weight first if you lifted something.')))) return;
        zeroOk.current.add(e.id);
      }
      // Rest set on this exercise in the routine, otherwise the profile setting.
      update(S.logSet(s, Date.now(), e.rest ?? settings.restSeconds));
    } else if (last) {
      if (s.stretch?.length) update(enterPhase(s, 'stretch') as StrengthSession);
      else finish();
    }
    else update(S.goExercise(s, 1));
  };

  let lastLine: string | null = null;
  if (lastTime && lastTime.length) {
    const kg = Math.max(...lastTime.map((x) => x.kg));
    lastLine = ex.bodyweight
      ? `${t('Last time:')} ${lastTime.length} × ${lastTime[0].reps}${timed ? ' s' : ''}`
      : `${t('Last time:')} ${lastTime.length} × ${lastTime[0].reps} × ${fmt(kg)} kg`;
  }

  const restLeft = s.rest ? Math.max(0, s.rest.end - now) : 0;
  const restPct = s.rest ? Math.max(0, Math.min(100, (restLeft / s.rest.total) * 100)) : 0;

  return (
    <View style={[styles.screen, { paddingTop: top(50) }]}>
      <LogTopBar elapsed={mmss(now - s.startedAt)} onFinish={finish} />
      <ExerciseSwitcher
        exId={e.id}
        position={t('Exercise {n} of {total}', { n: s.cur + 1, total: s.ex.length })}
        name={ex.name}
        canPrev={s.cur > 0}
        canNext={!last}
        onPrev={() => update(S.goExercise(s, -1))}
        onNext={() => update(S.goExercise(s, 1))}
      />
      <ProgressSegments states={s.ex.map((_, i) => (S.exerciseDone(s, i) ? 'done' : i === s.cur ? 'current' : 'todo'))} />
      {lastLine && (
        <UI size={14} color={colors.muted} style={logStyles.prevText}>
          {lastLine}
        </UI>
      )}

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.rows}>
        {e.sets.map((x, i) => {
          const active = i === s.sel;
          const status = x.pr ? t('PR') : x.done ? t('Done') : active ? t('Now') : '';
          return (
            <Pressable
              key={i}
              onPress={() => update(S.selectSet(s, i))}
              accessibilityRole="button"
              style={[styles.setRow, { backgroundColor: active || x.done ? colors.surface : 'transparent' }]}>
              {active ? (
                <Ring width={2} color={colors.accent} radius={14} />
              ) : (
                !x.done && <Ring width={1} color={colors.line} radius={14} />
              )}
              <Mono size={14} color={colors.muted} style={{ width: 28 }}>
                {String(i + 1)}
              </Mono>
              <Mono size={20} weight={500} color={x.done || active ? colors.ink : colors.muted} style={{ flex: 1 }}>
                {timed && x.w === 0 ? `${x.r} s` : `${fmt(x.w)} kg × ${x.r}${timed ? ' s' : ''}`}
              </Mono>
              <Pop key={status} off={!x.done}>
                <UI size={14} weight={700} color={x.pr || active ? colors.accent : colors.muted}>
                  {status}
                </UI>
              </Pop>
            </Pressable>
          );
        })}
        <View style={styles.rowActions}>
          <Pressable onPress={() => update(S.addSet(s))} accessibilityRole="button" style={logStyles.textBtn}>
            <UI size={16} weight={600} color={colors.accent}>
              {t('Add set')}
            </UI>
          </Pressable>
          <EndWorkoutButton confirming={confirming} onPress={endWorkout} />
        </View>
      </ScrollView>

      <View style={[logStyles.sheet, { paddingTop: 10, paddingBottom: 12 + insets.bottom }]}>
        {s.rest && (
          <View style={[styles.rest, { height: fit(46) }]}>
            <UI size={14} color={colors.muted}>
              {t('Rest')}
            </UI>
            <Mono size={24} weight={500} color={colors.accent} style={{ flex: 1 }}>
              {mmss(restLeft)}
            </Mono>
            <Pressable onPress={() => update(S.addRest(s, 30000))} accessibilityRole="button" style={styles.plus30}>
              <Mono size={14}>+30 s</Mono>
            </Pressable>
            <Pressable onPress={() => update(S.skipRest(s))} accessibilityRole="button" style={styles.skip}>
              <UI size={16} weight={600}>
                {t('Skip')}
              </UI>
            </Pressable>
            <View style={styles.restTrack}>
              <View style={[styles.restFill, { width: `${restPct}%` }]} />
            </View>
          </View>
        )}

        {set && (
          <>
            <StepRow
              value={fmt(set.w)}
              label={t('kg, step {step} kg', { step: fmt(settings.weightStep) })}
              mirrored={mirrored}
              onDec={() => update(S.adjust(s, 'w', -settings.weightStep))}
              onInc={() => update(S.adjust(s, 'w', settings.weightStep))}
              input={{ min: 0, max: 500, decimals: true, value: set.w, onSet: (v) => update(S.setValue(s, 'w', v)) }}
            />
            <StepRow
              value={String(set.r)}
              label={timed ? 'seconds' : 'reps'}
              mirrored={mirrored}
              onDec={() => update(S.adjust(s, 'r', -repsStep(e.id)))}
              onInc={() => update(S.adjust(s, 'r', repsStep(e.id)))}
              input={{ min: 1, max: maxReps(e.id), value: set.r, onSet: (v) => update(S.setValue(s, 'r', v)) }}
            />
          </>
        )}

        <PrimaryButton
          label={(set ? t('Log set {n}', { n: s.sel + 1 }) : last ? (s.stretch?.length ? t('Stretching') : t('Finish workout')) : t('Next exercise')).toUpperCase()}
          onPress={main}
          height={fit(56)}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  rows: { paddingTop: 8, paddingHorizontal: 16, paddingBottom: 6 },
  setRow: {
    height: 48,
    borderRadius: 14,
    marginBottom: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
  },
  rowActions: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  rest: { height: 46, flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 6, paddingRight: 4, overflow: 'hidden' },
  plus30: { height: 38, paddingHorizontal: 14, borderRadius: 19, backgroundColor: colors.surface2, justifyContent: 'center' },
  skip: { height: 38, paddingHorizontal: 10, justifyContent: 'center' },
  restTrack: { position: 'absolute', left: 6, right: 6, bottom: 0, height: 3, borderRadius: 2, backgroundColor: colors.surface2 },
  restFill: { height: '100%', borderRadius: 2, backgroundColor: colors.accentFill },
});
