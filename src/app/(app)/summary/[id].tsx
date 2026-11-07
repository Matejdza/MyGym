import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Photo, Shade, dark } from '@/components/Photo';
import { Display, Mono, UI } from '@/components/Txt';
import { InkDisplayButton } from '@/components/ui';
import { IMAGES } from '@/data/photos';
import * as repo from '@/data/repo';
import { cardioSummary, strengthSummary } from '@/domain/cardio';
import { useActive, useDbQuery } from '@/state/store';
import { useTop } from '@/theme/layout';
import { colors } from '@/theme/tokens';

/** "Workout done": stat tiles and new records (strength) or activities (cardio). */
export default function Summary() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profile } = useActive();
  const top = useTop();
  const insets = useSafeAreaInsets();
  const data = useDbQuery((db) => repo.getWorkout(db, Number(id)), [id]);

  const w = data?.workout;
  let summary = null;
  if (data && w) {
    if (w.type === 'cardio') {
      const r = profile.plan.routines[w.routineKey];
      // Planned activities: the routine as it is now, or at least what was logged.
      const planned = r?.type === 'cardio' ? Math.max(r.items.length, data.cardio.length) : data.cardio.length;
      summary = cardioSummary(data.cardio, planned);
    } else summary = strengthSummary(data.sets, w.finishedAt - w.startedAt);
  }

  const home = () => {
    router.dismissAll();
    router.navigate('/');
  };

  return (
    <View style={styles.screen}>
      <ScrollView style={{ flex: 1 }}>
        <View style={{ height: top(300) }}>
          <Photo source={IMAGES.workoutDone} style={StyleSheet.absoluteFill} />
          <Shade
            stops={[
              [0, dark(0.6)],
              [0.3, dark(0)],
              [0.96, colors.bg],
              [1, colors.bg],
            ]}
          />
          <View style={styles.heroText}>
            <UI size={15} weight={600} color={colors.accent}>
              {w?.routineName ?? ''}
            </UI>
            <Display size={68} weight={900} lh={0.88} style={{ marginTop: 8 }}>
              Workout done
            </Display>
          </View>
        </View>

        {summary && (
          <View style={styles.body}>
            <View style={styles.tiles}>
              {summary.rows.map((r) => (
                <View key={r.k} style={styles.tile}>
                  <UI size={13} color={colors.muted}>
                    {r.k}
                  </UI>
                  <Mono size={19} weight={500} spacing={-0.04} numberOfLines={1} style={{ marginTop: 8 }}>
                    {r.v}
                  </Mono>
                </View>
              ))}
            </View>
            {summary.list.length > 0 && (
              <>
                <Display size={28} weight={800} style={{ marginTop: 28 }}>
                  {summary.listTitle}
                </Display>
                {summary.list.map((p, i) => (
                  <View key={i} style={styles.item}>
                    <UI size={17} weight={600} style={{ flexShrink: 1 }}>
                      {p.n}
                    </UI>
                    <View style={styles.pill}>
                      <Mono size={15} weight={500} color={colors.accentInk}>
                        {p.v}
                      </Mono>
                    </View>
                  </View>
                ))}
              </>
            )}
          </View>
        )}
      </ScrollView>
      <View style={{ paddingTop: 12, paddingHorizontal: 20, paddingBottom: 14 + insets.bottom }}>
        <InkDisplayButton label="BACK TO HOME" onPress={home} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  heroText: { position: 'absolute', left: 20, right: 20, bottom: 0 },
  body: { padding: 20 },
  tiles: { flexDirection: 'row', gap: 8 },
  tile: { flex: 1, minWidth: 0, backgroundColor: colors.surface, borderRadius: 18, paddingVertical: 14, paddingHorizontal: 12 },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  pill: { backgroundColor: colors.accent, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 12 },
});
