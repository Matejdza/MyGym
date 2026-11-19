// "Your goal" on Home (owner, 2026-11-20): instead of a body weight the app
// cannot know, it shows the way from the first weigh-in to the target weight.
// - A bar fills up to the progress (animated), with a dot riding its end, and
//   the kilos still to go count up.
// - The last weigh-in is shown with its date; after 7 days it asks for a new one.
// - "Weigh in" opens a small stepper right here; saving logs today's weight and
//   the bar moves to the new spot.

import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from 'react-native-reanimated';

import { useCountUp } from '@/components/Motion';
import { Mono, UI } from '@/components/Txt';
import { NumberField } from '@/components/NumberField';
import { RoundButton } from '@/components/ui';
import { fmt, r2 } from '@/domain/format';
import { goalProgress } from '@/domain/goal';
import { BODY_LIMITS } from '@/domain/numberEntry';
import { t } from '@/i18n';
import { colors } from '@/theme/tokens';

type Entry = { date: string; kg: number };

const DAY = 86_400_000;
const TRACK = 12;

export function GoalCard({
  log,
  weight,
  target,
  today,
  onSave,
}: {
  /** Body weight entries, oldest first. */
  log: Entry[];
  /** The profile's weight (used when nothing is logged yet). */
  weight: number;
  target: number;
  /** Today as yyyy-mm-dd. */
  today: string;
  onSave: (kg: number) => void;
}) {
  const last = log[log.length - 1];
  // The profile weight is the latest the user gave (weigh-in here or on Profile).
  const now = weight;
  // Start = the first weigh-in (owner's choice), shown at the left end of the bar.
  const start = log[0]?.kg ?? weight;
  const losing = target > 0 && (start !== target ? start > target : now > target);
  const pct = goalProgress(start, now, target);
  const toGo = r2(Math.abs(now - target));
  const reached = target > 0 && (losing ? now <= target : now >= target);
  const days = last ? Math.round((Date.parse(today) - Date.parse(last.date)) / DAY) : null;
  const stale = days == null || days >= 7;

  const [open, setOpen] = useState(false);
  const [kg, setKg] = useState(now);
  const shownToGo = useCountUp(toGo, 900);

  // The bar fills from empty on first show and moves to each new value.
  const fill = useSharedValue(0);
  useEffect(() => {
    fill.set(withTiming(pct, { duration: 1100, easing: Easing.out(Easing.cubic) }));
  }, [pct, fill]);
  const barStyle = useAnimatedStyle(() => ({ width: `${fill.value}%` }));

  // The dot at the end of the bar breathes softly.
  const pulse = useSharedValue(1);
  useEffect(() => {
    pulse.set(withDelay(1100, withRepeat(withSequence(withTiming(1.35, { duration: 700 }), withTiming(1, { duration: 700 })), -1)));
  }, [pulse]);
  const dotStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));

  const openWeighIn = () => {
    setKg(now);
    setOpen(true);
  };
  const save = () => {
    onSave(r2(kg));
    setOpen(false);
  };

  const lastLine =
    days == null
      ? t('No weigh-in yet')
      : days === 0
        ? t('Last weigh-in today')
        : days === 1
          ? t('Last weigh-in yesterday')
          : t('Last weigh-in {n} days ago', { n: days });

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <UI size={16} color={colors.muted}>
          {t('Your goal')}
        </UI>
        {!open && (
          <Pressable onPress={openWeighIn} accessibilityRole="button" style={({ pressed }) => [styles.pill, pressed && { backgroundColor: colors.line }]}>
            <UI size={16} weight={600}>
              {t('Weigh in')}
            </UI>
          </Pressable>
        )}
      </View>

      {target > 0 ? (
        <>
          {/* Current weight; the bar below runs from the first weigh-in to the goal. */}
          <View style={[styles.baseline, { marginTop: 8 }]}>
            <Mono size={40} weight={500} spacing={-0.05}>
              {fmt(now)}
            </Mono>
            <UI size={16} color={colors.muted}>
              {t('kg')}
            </UI>
          </View>

          <View style={styles.track} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: Math.round(pct) }}>
            <Animated.View style={[styles.fill, barStyle]}>
              <Animated.View style={[styles.dot, dotStyle]} />
              {/* What is left, riding on the dot; kept inside the card near the ends. */}
              <View pointerEvents="none" style={[styles.bubble, pct < 20 ? styles.bubbleStart : pct > 80 ? styles.bubbleEnd : styles.bubbleMid]}>
                <UI size={14} weight={700} color={reached ? colors.green : colors.accent} numberOfLines={1}>
                  {reached ? t('Goal reached') : t('{kg} kg to go', { kg: fmt(r2(shownToGo)) })}
                </UI>
              </View>
            </Animated.View>
          </View>
          <View style={styles.ends}>
            <UI size={14} color={colors.muted}>
              {`${fmt(start)} ${t('kg')}`}
            </UI>
            <UI size={14} color={colors.muted}>
              {`${fmt(target)} ${t('kg')}`}
            </UI>
          </View>
        </>
      ) : (
        <View style={[styles.baseline, { marginTop: 8 }]}>
          <Mono size={40} weight={500} spacing={-0.05}>
            {fmt(now)}
          </Mono>
          <UI size={16} color={colors.muted}>
            {t('kg')}
          </UI>
        </View>
      )}

      <UI size={14} weight={stale ? 600 : 400} color={stale ? colors.accent : colors.muted} style={{ marginTop: 16 }}>
        {stale && days != null ? `${lastLine}. ${t('Time for a new weigh-in.')}` : lastLine}
      </UI>

      {open && (
        <View style={styles.weighIn}>
          <View style={styles.stepper}>
            <RoundButton sign="−" size={48} fontSize={22} onPress={() => setKg((v) => r2(Math.max(BODY_LIMITS.weight.min, v - 0.1)))} />
            <View style={[styles.baseline, { flex: 1, justifyContent: 'center' }]}>
              <NumberField
                input={{ ...BODY_LIMITS.weight, value: kg, onSet: setKg }}
                display={fmt(kg)}
                size={32}
                label={t("Today's body weight in kg")}
              />
              <UI size={16} color={colors.muted}>
                {t('kg')}
              </UI>
            </View>
            <RoundButton sign="+" size={48} fontSize={22} onPress={() => setKg((v) => r2(Math.min(BODY_LIMITS.weight.max, v + 0.1)))} />
          </View>
          <View style={styles.actions}>
            <Pressable onPress={() => setOpen(false)} accessibilityRole="button" style={({ pressed }) => [styles.pill, styles.grow, pressed && { backgroundColor: colors.line }]}>
              <UI size={16} weight={600}>
                {t('Cancel')}
              </UI>
            </Pressable>
            <Pressable
              onPress={save}
              accessibilityRole="button"
              style={({ pressed }) => [styles.pill, styles.grow, styles.save, { backgroundColor: pressed ? colors.press : colors.accentFill }]}>
              <UI size={16} weight={700} color={colors.accentInk}>
                {t('Save for today')}
              </UI>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 16, paddingLeft: 18, borderRadius: 20, backgroundColor: colors.surface },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 40 },
  baseline: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  pill: { height: 40, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  track: { height: TRACK, marginTop: 40, borderRadius: TRACK / 2, backgroundColor: colors.surface2, overflow: 'visible' },
  fill: { height: TRACK, minWidth: TRACK, borderRadius: TRACK / 2, backgroundColor: colors.accentFill, justifyContent: 'center', alignItems: 'flex-end' },
  dot: { width: 20, height: 20, marginRight: -4, borderRadius: 10, backgroundColor: colors.accentFill, borderWidth: 4, borderColor: colors.surface },
  bubble: { position: 'absolute', bottom: TRACK + 8, width: 160 },
  bubbleMid: { right: -80, alignItems: 'center' },
  bubbleStart: { left: -2, alignItems: 'flex-start' },
  bubbleEnd: { right: -6, alignItems: 'flex-end' },
  ends: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  weighIn: { marginTop: 16, paddingTop: 16, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line, gap: 16 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  actions: { flexDirection: 'row', gap: 8 },
  grow: { flex: 1, height: 48, borderRadius: 24 },
  save: { borderWidth: 0 },
});
