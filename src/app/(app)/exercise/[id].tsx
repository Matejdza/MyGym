import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { BodyMap } from '@/components/BodyMap';
import { BackPill } from '@/components/ui';
import { Photo } from '@/components/Photo';
import { Display, Mono, UI } from '@/components/Txt';
import { ALL_GROUPS, exercise } from '@/data/catalog';
import { PHOTOS, exPhoto } from '@/data/photos';
import * as repo from '@/data/repo';
import { MUSCLE_LABEL, MUSCLES } from '@/domain/muscles';
import { exerciseStats } from '@/domain/stats';
import { useTop } from '@/theme/layout';
import { useActive, useDbQuery } from '@/state/store';
import { colors } from '@/theme/tokens';
import { t } from '@/i18n';

/** Exercise page: body map of the worked muscles, position photos, how-to steps and "Your numbers". */
export default function ExerciseDetail() {
  const { id: raw } = useLocalSearchParams<{ id: string }>();
  const id = raw && exercise(raw) ? raw : 'bench';
  const e = exercise(id);
  const { profile } = useActive();
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

  const top = useTop();
  const muscles = { primary: MUSCLES[id]?.primary ?? [], secondary: MUSCLES[id]?.secondary ?? [] };
  const hasPhotos = exPhoto(id, 0) != null;
  const group = ALL_GROUPS.find((g) => g.key === e.group)?.label ?? '';
  // Two photos: start / end side by side. Three: start and mid-rep side by side, the end below.
  const two = cardio || PHOTOS[id]?.length === 2;
  const captions = cardio ? [`1. ${t('Setup')}`, `2. ${t('In motion')}`] : [`1. ${t('Start position')}`, `2. ${t('End position')}`];

  const toProgress = () => {
    router.dismissAll();
    router.navigate({
      pathname: '/progress',
      params: cardio ? { mode: 'cardio' } : { mode: 'lift', ex: id },
    });
  };

  return (
    <ScrollView style={styles.screen}>
      <View style={[styles.plainHead, { paddingTop: top(54) }]}>
        <BackPill onPress={() => router.back()} style={{ alignSelf: 'flex-start' }} />
        <View style={{ marginTop: 24 }}>
          <UI size={16} weight={600} color={colors.accent}>{`${group}, ${e.equipment}`}</UI>
          <Display size={56} weight={900} lh={0.9} style={{ marginTop: 8 }}>
            {e.name}
          </Display>
        </View>
        {/* The worked muscles on a body figure (owner's choice over a hero photo). */}
        <View style={styles.mapCard}>
          <BodyMap primary={muscles.primary} secondary={muscles.secondary} width={104} />
          {muscles.primary.length > 0 && (
            <View style={{ marginTop: 16, paddingHorizontal: 16 }}>
              <UI size={20} weight={600} align="center">
                {muscles.primary.map((m) => MUSCLE_LABEL[m]).join(' · ')}
              </UI>
              {muscles.secondary.length > 0 && (
                <UI size={14} color={colors.muted} align="center" style={{ marginTop: 4 }}>
                  {t('Also working: {list}', { list: muscles.secondary.map((m) => MUSCLE_LABEL[m].toLowerCase()).join(', ') })}
                </UI>
              )}
            </View>
          )}
        </View>
      </View>

      <View style={styles.body}>
        {hasPhotos && (
          <View style={styles.photos}>
            {two ? (
              <View style={styles.photoRow}>
                <Shot source={exPhoto(id, 0)} height={190} caption={captions[0]} />
                <Shot source={exPhoto(id, 1)} height={190} caption={captions[1]} />
              </View>
            ) : (
              <>
                <View style={styles.photoRow}>
                  <Shot source={exPhoto(id, 0)} height={170} caption={`1. ${t('Start position')}`} />
                  <Shot source={exPhoto(id, 1)} height={170} caption={`2. ${t('Mid-rep')}`} />
                </View>
                <Shot source={exPhoto(id, 2)} height={220} caption={`3. ${t('End position')}`} />
              </>
            )}
          </View>
        )}

        <UI size={20} lh={1.5} style={{ marginTop: 24 }}>
          {e.description}
        </UI>

        <Display size={32} weight={800} style={{ marginTop: 32 }}>
          {t('How to do it')}
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
            <Display size={32} weight={800} style={{ marginTop: 32 }}>
              {t('Your numbers')}
            </Display>
            {stats.map((r) => (
              <View key={r.k} style={styles.stat}>
                <UI size={16} color={colors.muted}>
                  {r.k}
                </UI>
                <Mono size={20} weight={500}>
                  {r.v}
                </Mono>
              </View>
            ))}
            <Pressable onPress={toProgress} accessibilityRole="button" style={styles.progressBtn}>
              <UI size={16} weight={600}>
                {t('View progress')}
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
  body: { paddingTop: 24, paddingHorizontal: 16, paddingBottom: 32 },
  plainHead: { paddingHorizontal: 16 },
  mapCard: {
    marginTop: 24,
    paddingVertical: 24,
    backgroundColor: colors.surface,
    borderRadius: 20,
  },
  photos: { gap: 16 },
  photoRow: { flexDirection: 'row', gap: 8 },
  steps: { gap: 8, marginTop: 16 },
  step: {
    flexDirection: 'row',
    gap: 16,
    backgroundColor: colors.surface,
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  stepNo: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.accentFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stat: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: 8,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  progressBtn: {
    height: 48,
    marginTop: 16,
    borderRadius: 24,
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
