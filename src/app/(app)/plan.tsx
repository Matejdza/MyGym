import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { CoverThumb } from '@/components/Cover';
import { Display, Mono, UI } from '@/components/Txt';
import { BackPill, Ring } from '@/components/ui';
import { DAYS } from '@/data/catalog';
import { coverPhoto } from '@/data/photos';
import { newRoutine, nextRoutineKey, routineMeta, sortedKeys, withDayCycled, workoutsText } from '@/domain/plan';
import { useActive, useStore } from '@/state/store';
import { useTop } from '@/theme/layout';
import { colors, plate } from '@/theme/tokens';
import { t } from '@/i18n';

/**
 * The 7-day schedule and the routine list. Workouts a week follow the days that
 * have a routine: tapping a day cycles A → B → … → rest.
 */
export default function Plan() {
  const { profile } = useActive();
  const { setPlan } = useStore();
  const top = useTop();
  const plan = profile.plan;

  const addRoutine = (type: 'strength' | 'cardio') => {
    const k = nextRoutineKey(plan);
    if (!k) return;
    setPlan({ ...plan, routines: { ...plan.routines, [k]: newRoutine(type) } });
    router.push(`/routine/${k}`);
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={[styles.content, { paddingTop: top(58) }]}>
      <BackPill onPress={() => router.back()} style={{ alignSelf: 'flex-start' }} />
      <Display size={56} weight={900} lh={0.9} style={{ marginTop: 16 }}>
        {t('Training plan')}
      </Display>

      <UI size={16} color={colors.muted} style={{ marginTop: 24 }}>
        {t('Schedule')}
      </UI>
      <View style={styles.days}>
        {DAYS.map((d, i) => {
          const k = plan.days[i];
          return (
            <Pressable key={d} onPress={() => setPlan(withDayCycled(plan, i))} accessibilityRole="button" style={styles.day}>
              <UI size={14} weight={600} color={colors.muted}>
                {d}
              </UI>
              <View style={[styles.dayCircle, { backgroundColor: k ? plate(k) : 'transparent' }]}>
                {!k && <Ring width={1} color={colors.line} radius={999} />}
                <Mono size={16} weight={500} color={k ? colors.onPlate : colors.muted}>
                  {k ?? '·'}
                </Mono>
              </View>
            </Pressable>
          );
        })}
      </View>
      <UI size={14} color={colors.muted} style={{ marginTop: 16 }}>
        {`${workoutsText(plan)}. ${t('Tap a day to change its routine or make it a rest day.')}`}
      </UI>

      <Display size={32} weight={800} style={{ marginTop: 32 }}>
        {t('Routines')}
      </Display>
      <View style={styles.list}>
        {sortedKeys(plan).map((k) => {
          const r = plan.routines[k];
          return (
            <Pressable key={k} onPress={() => router.push(`/routine/${k}`)} accessibilityRole="button" style={styles.routine}>
              <CoverThumb source={coverPhoto(r)} size={58} radius={13} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <UI size={20} weight={600}>
                  {r.name}
                </UI>
                <UI size={14} color={colors.muted} style={{ marginTop: 4 }}>
                  {routineMeta(r).list}
                </UI>
              </View>
              <UI size={24} color={colors.muted}>
                ›
              </UI>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.newRow}>
        <Pressable onPress={() => addRoutine('strength')} accessibilityRole="button" style={styles.newBtn}>
          <UI size={16} weight={700}>
            {t('New strength')}
          </UI>
        </Pressable>
        <Pressable onPress={() => addRoutine('cardio')} accessibilityRole="button" style={styles.newBtn}>
          <UI size={16} weight={700}>
            {t('New cardio')}
          </UI>
        </Pressable>
      </View>
      <Pressable onPress={() => router.push('/import')} accessibilityRole="button" style={[styles.newBtn, { flex: 0, marginTop: 8 }]}>
        <UI size={16} weight={700}>
          {t('Import from text')}
        </UI>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: 16, paddingBottom: 32 },
  days: { flexDirection: 'row', gap: 8, marginTop: 8 },
  day: { flex: 1, alignItems: 'center', gap: 8 },
  dayCircle: { width: 44, maxWidth: '100%', aspectRatio: 1, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  list: { gap: 8, marginTop: 16 },
  routine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: colors.surface,
    borderRadius: 20,
    paddingVertical: 8,
    paddingLeft: 8,
    paddingRight: 16,
  },
  newRow: { flexDirection: 'row', gap: 8, marginTop: 16 },
  newBtn: {
    flex: 1,
    height: 56,
    borderRadius: 28,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
