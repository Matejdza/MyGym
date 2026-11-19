// Warm-up (before the first exercise) and stretching (after the last one) in a
// live workout. One goal per phase: get through the moves, then go on.
// Reading order: phase title → the list (current move outlined) → the timer
// sheet with the current move, its countdown and the main button.
// States: timer waiting / running / paused, move done (check), all done
// (main button turns to "Start exercises" / "Finish workout"), skip.

import { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { ExerciseThumb } from '@/components/ExerciseThumb';
import { LogTopBar, logStyles } from '@/components/LogChrome';
import { Display, Mono, UI } from '@/components/Txt';
import { PrimaryButton, Ring } from '@/components/ui';
import { exercise } from '@/data/catalog';
import * as C from '@/domain/cardio';
import { mmss } from '@/domain/format';
import * as M from '@/domain/mobilitySession';
import * as S from '@/domain/strength';
import type { Session } from '@/domain/types';
import { useEndWorkout } from '@/hooks/useEndWorkout';
import { useNow } from '@/hooks/useNow';
import { playRestSignal, primeRestSignal } from '@/hooks/restSignal';
import { t } from '@/i18n';
import { useStore } from '@/state/store';
import { useScale, useTop } from '@/theme/layout';
import { colors } from '@/theme/tokens';

/** A move that ended more than this long ago (app was closed) ends silently. */
const SIGNAL_GRACE = 3000;

export function MobilityLog({ session: s, phase }: { session: Session; phase: 'warmup' | 'stretch' }) {
  const { setSession } = useStore();
  const top = useTop();
  const { fit } = useScale();
  const insets = useSafeAreaInsets();
  const now = useNow(250);
  const logged = () => (s.type === 'strength' ? { sets: S.loggedSets(s), cardio: [] } : { sets: [], cardio: C.loggedCardio(s) });
  const { finish } = useEndWorkout(s, t('Finish without logging any sets?'));

  const list = M.mobilityList(s, phase);
  const cur = s.mob?.cur ?? 0;
  const move = list[cur];
  const running = s.mob?.end != null;
  const left = M.timeLeft(s, now);
  const allDone = M.phaseDone(s, phase);
  const warm = phase === 'warmup';

  // The running move ends on its own, with a signal, and the next one starts.
  useEffect(() => {
    if (!s.mob || s.mob.end == null || now < s.mob.end) return;
    if (now - s.mob.end < SIGNAL_GRACE) playRestSignal();
    setSession(M.completeMove(s, phase, now, true));
  }, [now, s, phase, setSession]);

  const goOn = () => (warm ? setSession(M.enterPhase(s, 'main')) : finish(logged()));
  const toggle = () => {
    primeRestSignal();
    setSession(running ? M.pauseTimer(s, Date.now()) : M.startTimer(s, Date.now()));
  };

  const total = list.reduce((a, x) => a + x.sec, 0);

  return (
    <View style={[styles.screen, { paddingTop: top(50) }]}>
      <LogTopBar elapsed={mmss(now - s.startedAt)} onFinish={() => finish(logged())} />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.body}>
        <UI size={16} weight={600} color={colors.accent}>
          {warm ? t('Before your first exercise') : t('After your last exercise')}
        </UI>
        <Display size={40} weight={900} lh={0.92} style={{ marginTop: 8 }}>
          {warm ? t('Warm-up') : t('Stretching')}
        </Display>
        <UI size={16} color={colors.muted} style={{ marginTop: 8 }}>
          {t('{count} moves, about {min} min', { count: list.length, min: Math.max(1, Math.round(total / 60)) })}
        </UI>

        <View style={{ marginTop: 24, gap: 8 }}>
          {list.map((x, i) => {
            const active = i === cur && !allDone;
            return (
              <Pressable
                key={i}
                onPress={() => setSession(M.selectMove(s, phase, i))}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}>
                {active && <Ring width={2} color={colors.accent} radius={16} />}
                <ExerciseThumb id={x.ex} size={52} radius={12} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <UI size={16} weight={600} numberOfLines={1}>
                    {exercise(x.ex).name}
                  </UI>
                  <Mono size={16} color={colors.muted} style={{ marginTop: 4 }}>
                    {`${x.sec} s`}
                  </Mono>
                </View>
                {x.done ? (
                  <View style={styles.check}>
                    <Svg width={16} height={16} viewBox="0 0 18 18">
                      <Path d="M3.5 9.5 L7.5 13.5 L14.5 5" fill="none" stroke={colors.accentInk} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />
                    </Svg>
                  </View>
                ) : active ? (
                  <UI size={14} weight={700} color={colors.accent}>
                    {t('Now')}
                  </UI>
                ) : null}
              </Pressable>
            );
          })}
        </View>
        {move && !allDone && (
          <UI size={16} lh={1.5} color={colors.muted} style={{ marginTop: 16 }}>
            {exercise(move.ex).steps.join(' ')}
          </UI>
        )}
      </ScrollView>

      <View style={[logStyles.sheet, { paddingTop: 16, paddingBottom: 12 + insets.bottom }]}>
        {!allDone && move ? (
          <>
            <View style={styles.timerRow}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <UI size={16} color={colors.muted} numberOfLines={1}>
                  {exercise(move.ex).name}
                </UI>
                <Mono size={40} weight={500} color={running ? colors.accent : colors.ink}>
                  {mmss(left)}
                </Mono>
              </View>
              <Pressable onPress={() => setSession(M.completeMove(s, phase, Date.now(), running))} accessibilityRole="button" style={styles.textBtn}>
                <UI size={16} weight={600} color={colors.muted}>
                  {t('Skip')}
                </UI>
              </Pressable>
            </View>
            <PrimaryButton label={(running ? t('Pause') : left < move.sec * 1000 ? t('Resume') : t('Start timer')).toUpperCase()} onPress={toggle} height={fit(56)} />
            <Pressable onPress={goOn} accessibilityRole="button" style={[styles.textBtn, { alignSelf: 'center' }]}>
              <UI size={16} weight={600} color={colors.muted}>
                {warm ? t('Skip warm-up') : t('Skip stretching and finish')}
              </UI>
            </Pressable>
          </>
        ) : (
          <>
            <UI size={16} align="center" color={colors.muted}>
              {warm ? t('Warmed up. Time for the first exercise.') : t('All stretched. Nice work today.')}
            </UI>
            <PrimaryButton label={(warm ? t('Start exercises') : t('Finish workout')).toUpperCase()} onPress={goOn} height={fit(56)} />
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  body: { paddingTop: 16, paddingHorizontal: 16, paddingBottom: 24 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 8, paddingRight: 16, borderRadius: 16, backgroundColor: colors.surface },
  check: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.accentFill, alignItems: 'center', justifyContent: 'center' },
  timerRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  textBtn: { height: 44, paddingHorizontal: 8, justifyContent: 'center' },
});
