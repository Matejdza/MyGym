import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Photo, Shade, dark } from '@/components/Photo';
import { Display, UI } from '@/components/Txt';
import { BackPill } from '@/components/ui';
import { ALL_GROUPS, EXERCISE_IDS, exercise } from '@/data/catalog';
import { exPhoto, groupPhoto } from '@/data/photos';
import { plural } from '@/domain/format';
import type { GroupKey, Routine } from '@/domain/types';
import { useActive, useStore } from '@/state/store';
import { useTop } from '@/theme/layout';
import { colors } from '@/theme/tokens';

/**
 * A muscle group (or Cardio) and its exercises. With `pick` (a routine key) each
 * row has a yellow "Add" pill that appends the exercise to that routine.
 */
export default function Group() {
  const { k, pick } = useLocalSearchParams<{ k: string; pick?: string }>();
  const { profile } = useActive();
  const { setPlan } = useStore();
  const top = useTop();

  const g = ALL_GROUPS.find((x) => x.key === k) ?? ALL_GROUPS[0];
  const cardio = g.key === 'cardio';
  const ids = EXERCISE_IDS.filter((id) => exercise(id).group === g.key);
  const picking = !!pick && !!profile.plan.routines[pick];

  const open = (id: string) => {
    if (!picking || !pick) {
      router.push(`/exercise/${id}`);
      return;
    }
    const plan = profile.plan;
    const r = plan.routines[pick];
    const next: Routine =
      r.type === 'cardio'
        ? { ...r, items: [...r.items, { ex: id, min: 15, zone: 2 }] }
        : { ...r, items: [...r.items, { ex: id, sets: 3, reps: 10 }] };
    setPlan({ ...plan, routines: { ...plan.routines, [pick]: next } });
    // Back to the routine editor, past the muscle-group picker if it was used.
    router.dismissTo({ pathname: '/routine/[id]', params: { id: pick } });
  };

  return (
    <ScrollView style={styles.screen}>
      <View style={{ height: top(250) }}>
        <Photo source={groupPhoto(g.key as GroupKey)} style={StyleSheet.absoluteFill} />
        <Shade
          stops={[
            [0, dark(0.7)],
            [0.35, dark(0)],
            [0.96, colors.bg],
            [1, colors.bg],
          ]}
        />
        <BackPill onPress={() => router.back()} onPhoto style={{ position: 'absolute', top: top(54), left: 16 }} />
        <View style={styles.heroText}>
          <Display size={60} weight={900} lh={0.9}>
            {g.label}
          </Display>
          <UI size={15} style={{ marginTop: 6, opacity: 0.8 }}>
            {cardio ? `${ids.length} activities` : plural(ids.length, 'exercise')}
          </UI>
        </View>
      </View>

      <View style={styles.list}>
        {ids.map((id) => {
          const e = exercise(id);
          return (
            <Pressable key={id} onPress={() => open(id)} accessibilityRole="button" style={styles.row}>
              <Photo source={exPhoto(id)} style={styles.thumb} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <UI size={17} weight={600}>
                  {e.name}
                </UI>
                <UI size={14} color={colors.muted} style={{ marginTop: 3 }}>
                  {e.equipment}
                </UI>
              </View>
              <View style={[styles.pill, { backgroundColor: picking ? colors.accent : colors.surface }]}>
                <UI size={14} weight={700} color={picking ? colors.accentInk : colors.ink}>
                  {picking ? 'Add' : 'View'}
                </UI>
              </View>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  heroText: { position: 'absolute', left: 20, bottom: 2 },
  list: { paddingTop: 14, paddingHorizontal: 20, paddingBottom: 24 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  thumb: { width: 60, height: 60, borderRadius: 14 },
  pill: { height: 34, paddingHorizontal: 14, borderRadius: 17, justifyContent: 'center', flexShrink: 0 },
});
