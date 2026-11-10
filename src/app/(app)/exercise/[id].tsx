import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Photo, Shade, heroStops } from '@/components/Photo';
import { Display, Mono, UI } from '@/components/Txt';
import { BackPill } from '@/components/ui';
import { ALL_GROUPS, EX, exercise } from '@/data/catalog';
import { PHOTOS, exPhoto } from '@/data/photos';
import * as repo from '@/data/repo';
import { exerciseStats } from '@/domain/stats';
import { useActive, useDbQuery } from '@/state/store';
import { useTop } from '@/theme/layout';
import { colors } from '@/theme/tokens';

/** Exercise page: hero photo, position photos, how-to steps and "Your numbers". */
export default function ExerciseDetail() {
  const { id: raw } = useLocalSearchParams<{ id: string }>();
  const id = raw && raw in EX ? raw : 'bench';
  const e = exercise(id);
  const { profile } = useActive();
  const top = useTop();
  const cardio = e.kind === 'cardio';

  const stats = useDbQuery(
    async (db) => {
      const [best, last, lastCardio, bestCardio] = await Promise.all([
        repo.bestSet(db, profile.id, id),
        repo.lastSets(db, profile.id, id),
        repo.lastCardio(db, profile.id, id),
        repo.bestCardio(db, profile.id, id),
      ]);
      return exerciseStats(e, { best, last, lastCardio, bestCardio });
    },
    [profile.id, id],
  );

  const group = ALL_GROUPS.find((g) => g.key === e.group)?.label ?? '';
  // Two photos: start / end side by side. Three: photo 1 is the hero, 2 and 3 below.
  const two = cardio || PHOTOS[id]?.length === 2;
  const captions = cardio ? ['1. Setup', '2. In motion'] : ['1. Start position', '2. End position'];

  const toProgress = () => {
    router.dismissAll();
    router.navigate({ pathname: '/progress', params: cardio ? { mode: 'cardio' } : { mode: 'lift', ex: id } });
  };

  return (
    <ScrollView style={styles.screen}>
      <View style={{ height: top(340) }}>
        <Photo source={exPhoto(id, 0)} style={StyleSheet.absoluteFill} top />
        <Shade stops={heroStops(0.7, [0.28, 0.5], 0.97)} />
        <BackPill onPress={() => router.back()} onPhoto style={{ position: 'absolute', top: top(54), left: 16 }} />
        <View style={styles.heroText}>
          <UI size={15} weight={600} color={colors.accent}>{`${group}, ${e.equipment}`}</UI>
          <Display size={54} weight={900} lh={0.9} style={{ marginTop: 8 }}>
            {e.name}
          </Display>
        </View>
      </View>

      <View style={styles.body}>
        <View style={styles.photos}>
          {two ? (
            <>
              <Shot source={exPhoto(id, 0)} height={190} caption={captions[0]} />
              <Shot source={exPhoto(id, 1)} height={190} caption={captions[1]} />
            </>
          ) : (
            <>
              <Shot source={exPhoto(id, 1)} height={150} caption="2. Mid-rep" />
              <Shot source={exPhoto(id, 2)} height={150} caption="3. End position" />
            </>
          )}
        </View>

        <UI size={17} lh={1.5} style={{ marginTop: 22 }}>
          {e.description}
        </UI>

        <Display size={28} weight={800} style={{ marginTop: 28 }}>
          How to do it
        </Display>
        <View style={styles.steps}>
          {e.steps.map((t, i) => (
            <View key={i} style={styles.step}>
              <View style={styles.stepNo}>
                <Mono size={14} weight={500} color={colors.accentInk}>
                  {String(i + 1)}
                </Mono>
              </View>
              <UI size={16} lh={1.45} style={{ flex: 1, paddingTop: 4 }}>
                {t}
              </UI>
            </View>
          ))}
        </View>

        {stats && (
          <>
            <Display size={28} weight={800} style={{ marginTop: 28 }}>
              Your numbers
            </Display>
            {stats.map((r) => (
              <View key={r.k} style={styles.stat}>
                <UI size={16} color={colors.muted}>
                  {r.k}
                </UI>
                <Mono size={17} weight={500}>
                  {r.v}
                </Mono>
              </View>
            ))}
            <Pressable onPress={toProgress} accessibilityRole="button" style={styles.progressBtn}>
              <UI size={16} weight={700} color={colors.bg}>
                View progress
              </UI>
            </Pressable>
          </>
        )}
      </View>
    </ScrollView>
  );
}

function Shot({ source, height, caption }: { source: ReturnType<typeof exPhoto>; height: number; caption: string }) {
  return (
    <View style={{ flex: 1 }}>
      <Photo source={source} style={{ height, borderRadius: 18 }} />
      <UI size={14} color={colors.muted} style={{ marginTop: 8 }}>
        {caption}
      </UI>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  heroText: { position: 'absolute', left: 20, right: 20, bottom: 0 },
  body: { paddingTop: 20, paddingHorizontal: 20, paddingBottom: 28 },
  photos: { flexDirection: 'row', gap: 10 },
  steps: { gap: 8, marginTop: 12 },
  step: { flexDirection: 'row', gap: 14, backgroundColor: colors.surface, borderRadius: 18, paddingVertical: 14, paddingHorizontal: 16 },
  stepNo: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  stat: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  progressBtn: { height: 56, marginTop: 18, borderRadius: 28, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' },
});
