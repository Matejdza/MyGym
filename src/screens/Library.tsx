import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';

import { Photo, Shade, dark } from '@/components/Photo';
import { Display, Mono, UI } from '@/components/Txt';
import { BackPill } from '@/components/ui';
import { EXERCISE_IDS, GROUPS, exercise } from '@/data/catalog';
import { IMAGES, groupPhoto } from '@/data/photos';
import { plural } from '@/domain/format';
import { useTop } from '@/theme/layout';
import { colors } from '@/theme/tokens';

const TILE_STOPS: [number, string][] = [
  [0, dark(0)],
  [0.4, dark(0)],
  [1, dark(0.85)],
];
const CARDIO_STOPS: [number, string][] = [
  [0, dark(0.85)],
  [0.7, dark(0)],
  [1, dark(0)],
];

/**
 * Muscle-group tiles and the Cardio card. With `pickFor` (a routine key) it is
 * the "Add exercise" picker: no Cardio card and a "‹ Routine X" back pill.
 */
export function Library({ pickFor }: { pickFor?: string }) {
  const top = useTop();
  const { width } = useWindowDimensions();
  const tileWidth = (width - 16 * 2 - 10) / 2;
  const pick = pickFor != null;
  const cardioCount = EXERCISE_IDS.filter((id) => exercise(id).group === 'cardio').length;

  const openGroup = (k: string) =>
    router.push({ pathname: '/group/[k]', params: pick ? { k, pick: pickFor } : { k } });

  return (
    <ScrollView style={styles.screen} contentContainerStyle={[styles.content, { paddingTop: top(58) }]}>
      {pick && <BackPill label={`‹ Routine ${pickFor}`} onPress={() => router.back()} style={styles.pickBack} />}
      <View style={styles.head}>
        <Display size={52} weight={900} lh={0.9}>
          {pick ? 'Add exercise' : 'Exercises'}
        </Display>
        <Mono size={13} color={colors.muted}>
          {String(EXERCISE_IDS.length)}
        </Mono>
      </View>
      <UI size={16} color={colors.muted} style={styles.sub}>
        {pick ? 'Pick a muscle group, then tap an exercise.' : 'Browse by muscle group.'}
      </UI>

      <View style={styles.grid}>
        {GROUPS.map((g) => {
          const n = EXERCISE_IDS.filter((id) => exercise(id).group === g.key).length;
          return (
            <Pressable key={g.key} onPress={() => openGroup(g.key)} accessibilityRole="button" style={[styles.tile, { width: tileWidth }]}>
              <Photo source={groupPhoto(g.key)} style={StyleSheet.absoluteFill} />
              <Shade stops={TILE_STOPS} />
              <View style={styles.tileText}>
                <Display size={30} weight={900} lh={1}>
                  {g.label}
                </Display>
                <UI size={13} style={{ marginTop: 4, opacity: 0.75 }}>
                  {plural(n, 'exercise')}
                </UI>
              </View>
            </Pressable>
          );
        })}
      </View>

      {!pick && (
        <Pressable onPress={() => openGroup('cardio')} accessibilityRole="button" style={styles.cardio}>
          <Photo source={IMAGES.cardioWide} style={StyleSheet.absoluteFill} />
          <Shade stops={CARDIO_STOPS} horizontal />
          <View style={styles.cardioText}>
            <UI size={13} weight={700} color={colors.accent}>
              Conditioning
            </UI>
            <Display size={38} weight={900} lh={1} style={{ marginTop: 4 }}>
              Cardio
            </Display>
            <UI size={13} style={{ marginTop: 4, opacity: 0.75 }}>
              {`${cardioCount} activities`}
            </UI>
          </View>
        </Pressable>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: 16, paddingBottom: 20 },
  pickBack: { alignSelf: 'flex-start', marginBottom: 12 },
  head: { paddingTop: 8, paddingHorizontal: 4, flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 },
  sub: { marginTop: 10, marginHorizontal: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 20 },
  tile: { height: 168, borderRadius: 22, overflow: 'hidden', backgroundColor: colors.surface },
  tileText: { position: 'absolute', left: 14, right: 14, bottom: 12 },
  cardio: { height: 150, marginTop: 10, borderRadius: 22, overflow: 'hidden', backgroundColor: colors.surface },
  cardioText: { position: 'absolute', left: 16, bottom: 14 },
});
