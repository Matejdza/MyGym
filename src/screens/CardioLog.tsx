import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EndWorkoutButton, ExerciseSwitcher, LogTopBar, ProgressSegments, logStyles } from '@/components/LogChrome';
import { StepRow } from '@/components/SetInputs';
import { Mono, UI } from '@/components/Txt';
import { PrimaryButton, Ring } from '@/components/ui';
import { ZONES, exercise } from '@/data/catalog';
import * as repo from '@/data/repo';
import * as C from '@/domain/cardio';
import { fmt, mmss } from '@/domain/format';
import type { CardioSession } from '@/domain/types';
import { useEndWorkout } from '@/hooks/useEndWorkout';
import { useNow } from '@/hooks/useNow';
import { useActive, useDbQuery, useStore } from '@/state/store';
import { useScale, useTop } from '@/theme/layout';
import { ZONE_COLORS, colors } from '@/theme/tokens';

/** Cardio workout: activity timer, activity rows, minutes and distance steppers. */
export function CardioLog({ session: s }: { session: CardioSession }) {
  const { profile, settings } = useActive();
  const { setSession } = useStore();
  const top = useTop();
  const { fit } = useScale();
  const insets = useSafeAreaInsets();
  const now = useNow(500);
  const { confirming, endWorkout, finish } = useEndWorkout(s, 'Finish without logging any activities?');

  const a = s.ex[s.cur];
  const e = exercise(a.id);
  const km = e.unit === 'km';
  const last = s.cur === s.ex.length - 1;
  const mirrored = settings.handedness === 'left';

  const el = C.elapsed(s, now);
  const target = a.target * 60000;
  const pct = Math.min(100, (el / target) * 100);

  const lastTime = useDbQuery((db) => repo.lastCardio(db, profile.id, a.id), [profile.id, a.id]);

  const done = () => finish({ sets: [], cardio: C.loggedCardio(s) });
  const main = () => {
    if (!a.done) setSession(C.logActivity(s));
    else if (C.allDone(s)) done();
    else setSession(C.goActivity(s, s.ex.findIndex((x) => !x.done)));
  };

  return (
    <View style={[styles.screen, { paddingTop: top(50) }]}>
      <LogTopBar elapsed={mmss(now - s.startedAt)} onFinish={done} />
      <ExerciseSwitcher
        exId={a.id}
        position={`Activity ${s.cur + 1} of ${s.ex.length}`}
        name={e.name}
        canPrev={s.cur > 0}
        canNext={!last}
        onPrev={() => setSession(C.goActivity(s, s.cur - 1))}
        onNext={() => setSession(C.goActivity(s, s.cur + 1))}
      />
      <ProgressSegments states={s.ex.map((x, i) => (x.done ? 'done' : i === s.cur ? 'current' : 'todo'))} />
      {lastTime && (
        <UI size={14} color={colors.muted} style={logStyles.prevText}>
          {`Last time: ${lastTime.minutes} min, ${fmt(lastTime.value)} ${e.unit}`}
        </UI>
      )}

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.body}>
        <View style={styles.timerCard}>
          <View style={styles.timerHead}>
            <UI size={14} color={colors.muted}>
              Activity timer
            </UI>
            <View style={[styles.zone, { backgroundColor: ZONE_COLORS[a.zone] }]}>
              <UI size={13} weight={700} color={colors.bg}>{`Zone ${a.zone}`}</UI>
            </View>
          </View>
          <View style={styles.timerRow}>
            <Mono size={58} weight={500} lh={1} spacing={-0.06} color={el >= target ? colors.green : colors.ink}>
              {mmss(el)}
            </Mono>
            <Mono size={15} color={colors.muted}>{`/ ${mmss(target)}`}</Mono>
          </View>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${pct}%` }]} />
          </View>
          <UI size={14} color={colors.muted} style={{ marginTop: 10 }}>
            {ZONES[a.zone]}
          </UI>
          <View style={styles.timerButtons}>
            <Pressable onPress={() => setSession(C.toggleTimer(s, Date.now()))} accessibilityRole="button" style={styles.toggle}>
              <UI size={16} weight={700} color={colors.bg}>
                {C.timerLabel(s)}
              </UI>
            </Pressable>
            <Pressable onPress={() => setSession(C.resetTimer(s))} accessibilityRole="button" style={styles.reset}>
              <UI size={15} weight={600}>
                Reset
              </UI>
            </Pressable>
          </View>
        </View>

        <View style={styles.rows}>
          {s.ex.map((x, i) => {
            const act = i === s.cur;
            const ee = exercise(x.id);
            return (
              <Pressable
                key={i}
                onPress={() => setSession(C.goActivity(s, i))}
                accessibilityRole="button"
                style={[styles.row, { backgroundColor: act || x.done ? colors.surface : 'transparent' }]}>
                {act ? <Ring width={2} color={colors.accent} radius={14} /> : !x.done && <Ring width={1} color={colors.line} radius={14} />}
                <Mono size={13} color={colors.muted} style={{ width: 22 }}>
                  {String(i + 1)}
                </Mono>
                <UI size={15} weight={600} numberOfLines={1} color={x.done || act ? colors.ink : colors.muted} style={{ flex: 1 }}>
                  {ee.name}
                </UI>
                <Mono size={14} weight={500} color={x.done || act ? colors.ink : colors.muted}>
                  {x.done ? `${x.min} min, ${fmt(x.v)} ${ee.unit === 'km' ? 'km' : 'fl'}` : `${x.target} min`}
                </Mono>
                <UI size={13} weight={700} align="right" color={act ? colors.accent : colors.muted} style={{ minWidth: 34 }}>
                  {x.done ? 'Done' : act ? 'Now' : ''}
                </UI>
              </Pressable>
            );
          })}
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <EndWorkoutButton confirming={confirming} onPress={endWorkout} />
        </View>
      </ScrollView>

      <View style={[logStyles.sheet, { paddingTop: 12, paddingBottom: 12 + insets.bottom }]}>
        <StepRow
          value={String(a.min)}
          label="minutes"
          mirrored={mirrored}
          onDec={() => setSession(C.adjustActivity(s, 'min', -1))}
          onInc={() => setSession(C.adjustActivity(s, 'min', 1))}
        />
        <StepRow
          value={fmt(a.v)}
          label={km ? 'km, step 0.1' : 'floors'}
          mirrored={mirrored}
          onDec={() => setSession(C.adjustActivity(s, 'v', -(e.step ?? 1)))}
          onInc={() => setSession(C.adjustActivity(s, 'v', e.step ?? 1))}
        />
        <PrimaryButton
          label={(!a.done ? 'Log activity' : C.allDone(s) ? 'Finish workout' : 'Next activity').toUpperCase()}
          onPress={main}
          height={fit(66)}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  body: { paddingTop: 10, paddingHorizontal: 16, paddingBottom: 6 },
  timerCard: { backgroundColor: colors.surface, borderRadius: 24, paddingVertical: 16, paddingHorizontal: 18 },
  timerHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  zone: { height: 28, paddingHorizontal: 12, borderRadius: 14, justifyContent: 'center' },
  timerRow: { flexDirection: 'row', alignItems: 'baseline', gap: 10, marginTop: 8 },
  track: { height: 6, borderRadius: 3, backgroundColor: colors.surface2, marginTop: 14, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 3, backgroundColor: colors.accent },
  timerButtons: { flexDirection: 'row', gap: 8, marginTop: 14 },
  toggle: { flex: 1, height: 48, borderRadius: 24, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' },
  reset: { height: 48, paddingHorizontal: 20, borderRadius: 24, backgroundColor: colors.surface2, justifyContent: 'center' },
  rows: { gap: 5, marginTop: 10 },
  row: { height: 48, borderRadius: 14, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14 },
});
