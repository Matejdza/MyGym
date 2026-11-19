import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { BodyBadge, BodyZoom, hasZoom, isBadge } from '@/components/BodyMap';
import { Hero } from '@/components/Hero';
import { BackPill } from '@/components/ui';
import { dark } from '@/components/Photo';
import { Display, UI } from '@/components/Txt';
import { ExerciseThumb } from '@/components/ExerciseThumb';
import { ALL_GROUPS, EXERCISE_IDS, exercise } from '@/data/catalog';
import { SECTIONS } from '@/data/catalog.more';
import { groupPhoto } from '@/data/photos';
import { plural } from '@/domain/format';
import { withExerciseAdded, withMobility } from '@/domain/plan';
import type { GroupKey } from '@/domain/types';
import { useActive, useStore } from '@/state/store';
import { useTop } from '@/theme/layout';
import { colors } from '@/theme/tokens';
import { t } from '@/i18n';

/**
 * A muscle group (or Cardio) and its exercises. With `pick` (a routine key) each
 * row has a yellow "Add" pill that appends the exercise to that routine.
 */
export default function Group() {
  const { k, pick, slot } = useLocalSearchParams<{
    k: string;
    pick?: string;
    slot?: string;
  }>();
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
    if (slot === 'warmup' || slot === 'stretch')
      setPlan(withMobility(profile.plan, pick, slot, (l) => (l.some((x) => x.ex === id) ? l : [...l, { ex: id, sec: 30 }])));
    else setPlan(withExerciseAdded(profile.plan, pick, id));
    // Back to the routine editor, past the muscle-group picker if it was used.
    router.dismissTo({ pathname: '/routine/[id]', params: { id: pick } });
  };

  return (
    <ScrollView style={styles.screen}>
      {hasZoom(g.key) || isBadge(g.key) ? (
        // Muscle groups: a close-up of the body part with its muscles in red (owner's choice over photos).
        <View style={[styles.head, { paddingTop: top(54) }]}>
          <BackPill onPress={() => router.back()} style={{ alignSelf: 'flex-start' }} />
          <Display size={56} weight={900} lh={0.9} style={{ marginTop: 24 }}>
            {g.label}
          </Display>
          <UI size={16} color={colors.muted} style={{ marginTop: 8 }}>
            {plural(ids.length, cardio ? 'activity' : 'exercise')}
          </UI>
          <View style={styles.zoomCard}>
            {isBadge(g.key) ? <BodyBadge kind={g.key} height={220} /> : <BodyZoom group={g.key} height={220} />}
          </View>
        </View>
      ) : (
        <Hero
          source={groupPhoto(g.key as GroupKey)}
          height={250}
          cardHeight={220}
          stops={[
            [0, dark(0.7)],
            [0.35, dark(0)],
            [0.96, colors.bg],
            [1, colors.bg],
          ]}
          onBack={() => router.back()}
          caption={
            <>
              <Display size={56} weight={900} lh={0.9}>
                {g.label}
              </Display>
              <UI size={16} style={{ marginTop: 8, opacity: 0.8 }}>
                {plural(ids.length, cardio ? 'activity' : 'exercise')}
              </UI>
            </>
          }
        />
      )}

      <View style={styles.list}>
        {(SECTIONS[g.key] ?? [{ label: '', ids }]).map((sec) => (
          <View key={sec.label}>
            {sec.label !== '' && (
              <Display size={24} weight={800} style={styles.section}>
                {`${t(sec.label)} · ${sec.ids.length}`}
              </Display>
            )}
            {sec.ids
              .filter((id) => ids.includes(id))
              .map((id) => {
                const e = exercise(id);
                return (
                  <Pressable key={id} onPress={() => open(id)} accessibilityRole="button" style={({ pressed }) => [styles.row, pressed && { opacity: 0.6 }]}>
                    <ExerciseThumb id={id} size={60} radius={14} />
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <UI size={20} weight={600}>
                        {e.name}
                      </UI>
                      <UI size={14} color={colors.muted} style={{ marginTop: 4 }}>
                        {e.equipment}
                      </UI>
                    </View>
                    {picking ? (
                      <View style={[styles.pill, { backgroundColor: colors.accentFill }]}>
                        <UI size={14} weight={700} color={colors.accentInk}>
                          {t('Add')}
                        </UI>
                      </View>
                    ) : (
                      // The whole row opens the exercise; a chevron says so without a button on every line.
                      <UI size={24} color={colors.muted}>
                        ›
                      </UI>
                    )}
                  </Pressable>
                );
              })}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  head: { paddingHorizontal: 16 },
  zoomCard: { marginTop: 24, paddingVertical: 24, alignItems: 'center', backgroundColor: colors.surface, borderRadius: 20 },
  list: { paddingTop: 16, paddingHorizontal: 16, paddingBottom: 24 },
  section: { marginTop: 24, marginBottom: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  thumb: { width: 60, height: 60, borderRadius: 14 },
  pill: {
    height: 34,
    paddingHorizontal: 14,
    borderRadius: 17,
    justifyContent: 'center',
    flexShrink: 0,
  },
});
