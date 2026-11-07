import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EndWorkoutButton, ExerciseSwitcher, LogTopBar, ProgressSegments, logStyles } from '@/components/LogChrome';
import { KeypadInput, ScaleRuler, StepRow, rulerConf } from '@/components/SetInputs';
import { Mono, UI } from '@/components/Txt';
import { PrimaryButton, Ring } from '@/components/ui';
import { exercise } from '@/data/catalog';
import * as repo from '@/data/repo';
import { fmt, mmss } from '@/domain/format';
import * as S from '@/domain/strength';
import type { StrengthSession } from '@/domain/types';
import { useEndWorkout } from '@/hooks/useEndWorkout';
import { useNow } from '@/hooks/useNow';
import { useActive, useDbQuery, useStore } from '@/state/store';
import { useTop } from '@/theme/layout';
import { colors } from '@/theme/tokens';

/** Strength workout: set rows, rest timer and the set-entry sheet. */
export function StrengthLog({ session: s }: { session: StrengthSession }) {
  const { profile, settings } = useActive();
  const { setSession } = useStore();
  const top = useTop();
  const insets = useSafeAreaInsets();
  const now = useNow(500);

  // Keypad typing state; cleared whenever the selection or value changes another way.
  const [field, setField] = useState<S.Field>('w');
  const [padText, setPadText] = useState<string | null>(null);
  const { confirming, endWorkout, finish: finishWith } = useEndWorkout(s, 'Finish without logging any sets?');

  const e = s.ex[s.cur];
  const ex = exercise(e.id);
  const set = S.currentSet(s);
  const last = s.cur === s.ex.length - 1;
  const mirrored = settings.handedness === 'left';

  // Rest timer ends on its own.
  useEffect(() => {
    if (s.rest && now >= s.rest.end) setSession(S.skipRest(s));
  }, [now, s, setSession]);

  const lastTime = useDbQuery((db) => repo.lastSets(db, profile.id, e.id), [profile.id, e.id]);

  const update = (next: StrengthSession, keepPad = false) => {
    if (!keepPad) setPadText(null);
    setSession(next);
  };

  const finish = () => finishWith({ sets: S.loggedSets(s), cardio: [] });

  const main = () => {
    if (set) {
      setField('w');
      update(S.logSet(s, Date.now(), settings.restSeconds));
    } else if (last) finish();
    else update(S.goExercise(s, 1));
  };

  const onKey = (k: string) => {
    const res = S.keypad(padText, k, field);
    if (!res) return;
    setPadText(res.text);
    update(S.setValue(s, field, res.value), true);
  };

  let lastLine: string | null = null;
  if (lastTime && lastTime.length) {
    const kg = Math.max(...lastTime.map((x) => x.kg));
    lastLine = ex.bodyweight
      ? `Last time: ${lastTime.length} × ${lastTime[0].reps}`
      : `Last time: ${lastTime.length} × ${lastTime[0].reps} × ${fmt(kg)} kg`;
  }

  const restLeft = s.rest ? Math.max(0, s.rest.end - now) : 0;
  const restPct = s.rest ? Math.max(0, Math.min(100, (restLeft / s.rest.total) * 100)) : 0;

  return (
    <View style={[styles.screen, { paddingTop: top(50) }]}>
      <LogTopBar elapsed={mmss(now - s.startedAt)} onFinish={finish} />
      <ExerciseSwitcher
        exId={e.id}
        position={`Exercise ${s.cur + 1} of ${s.ex.length}`}
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
          const status = x.pr ? 'PR' : x.done ? 'Done' : active ? 'Now' : '';
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
              <Mono size={13} color={colors.muted} style={{ width: 28 }}>
                {String(i + 1)}
              </Mono>
              <Mono size={18} weight={500} color={x.done || active ? colors.ink : colors.muted} style={{ flex: 1 }}>
                {`${fmt(x.w)} kg × ${x.r}`}
              </Mono>
              <UI size={13} weight={700} color={x.pr || active ? colors.accent : colors.muted}>
                {status}
              </UI>
            </Pressable>
          );
        })}
        <View style={styles.rowActions}>
          <Pressable onPress={() => update(S.addSet(s))} accessibilityRole="button" style={logStyles.textBtn}>
            <UI size={15} weight={600} color={colors.accent}>
              Add set
            </UI>
          </Pressable>
          <EndWorkoutButton confirming={confirming} onPress={endWorkout} />
        </View>
      </ScrollView>

      <View style={[logStyles.sheet, { paddingTop: 10, paddingBottom: 12 + insets.bottom }]}>
        {s.rest && (
          <View style={styles.rest}>
            <UI size={14} color={colors.muted}>
              Rest
            </UI>
            <Mono size={22} weight={500} color={colors.accent} style={{ flex: 1 }}>
              {mmss(restLeft)}
            </Mono>
            <Pressable onPress={() => update(S.addRest(s, 30000))} accessibilityRole="button" style={styles.plus30}>
              <Mono size={13}>+30 s</Mono>
            </Pressable>
            <Pressable onPress={() => update(S.skipRest(s))} accessibilityRole="button" style={styles.skip}>
              <UI size={15} weight={600}>
                Skip
              </UI>
            </Pressable>
            <View style={styles.restTrack}>
              <View style={[styles.restFill, { width: `${restPct}%` }]} />
            </View>
          </View>
        )}

        {set && settings.inputVariant === 'stepper' && (
          <>
            <StepRow
              value={fmt(set.w)}
              label={`kg, step ${fmt(settings.weightStep)} kg`}
              mirrored={mirrored}
              onDec={() => update(S.adjust(s, 'w', -settings.weightStep))}
              onInc={() => update(S.adjust(s, 'w', settings.weightStep))}
            />
            <StepRow
              value={String(set.r)}
              label="reps"
              mirrored={mirrored}
              onDec={() => update(S.adjust(s, 'r', -1))}
              onInc={() => update(S.adjust(s, 'r', 1))}
            />
          </>
        )}

        {set && settings.inputVariant === 'keypad' && (
          <KeypadInput
            field={field}
            wShown={field === 'w' && padText != null ? padText || '0' : fmt(set.w)}
            rShown={field === 'r' && padText != null ? padText || '0' : String(set.r)}
            onFocus={(f) => {
              setField(f);
              setPadText(null);
            }}
            onKey={onKey}
          />
        )}

        {set && settings.inputVariant === 'scale' && (
          <>
            <ScaleRuler f="w" label="kg" value={set.w} conf={rulerConf('w', settings.weightStep)} onChange={(v) => update(S.setValue(s, 'w', v))} />
            <ScaleRuler f="r" label="reps" value={set.r} conf={rulerConf('r', settings.weightStep)} onChange={(v) => update(S.setValue(s, 'r', v))} />
          </>
        )}

        <PrimaryButton
          label={(set ? `Log set ${s.sel + 1}` : last ? 'Finish workout' : 'Next exercise').toUpperCase()}
          onPress={main}
          height={66}
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
  restFill: { height: '100%', borderRadius: 2, backgroundColor: colors.accent },
});
