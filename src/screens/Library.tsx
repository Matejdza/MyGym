import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View, useWindowDimensions } from 'react-native';

import { BodyBadge, BodyZoom, type Badge } from '@/components/BodyMap';
import { Appear, Pressy } from '@/components/Motion';
import { Display, Mono, UI } from '@/components/Txt';
import { BackPill } from '@/components/ui';
import { ExerciseThumb } from '@/components/ExerciseThumb';
import { ALL_GROUPS, EXERCISE_IDS, GROUPS, exercise } from '@/data/catalog';
import { plural } from '@/domain/format';
import { searchExercises, withExerciseAdded } from '@/domain/plan';
import { useActive, useStore } from '@/state/store';
import { useTop } from '@/theme/layout';
import { colors, fonts } from '@/theme/tokens';
import { t } from '@/i18n';


/**
 * Muscle-group tiles and the Cardio card. With `pickFor` (a routine key) it is
 * the "Add exercise" picker: no Cardio card and a "‹ Routine X" back pill.
 * Typing in the search field replaces the tiles with matching exercises
 * (name, muscle group or equipment); no match shows a short note.
 */
export function Library({ pickFor }: { pickFor?: string }) {
  const top = useTop();
  const { width } = useWindowDimensions();
  const tileWidth = (width - 16 * 2 - 8) / 2;
  const pick = pickFor != null;
  const cardioCount = EXERCISE_IDS.filter((id) => exercise(id).group === 'cardio').length;
  const functionalCount = EXERCISE_IDS.filter((id) => exercise(id).group === 'functional').length;

  const { profile } = useActive();
  const { setPlan } = useStore();
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const searching = query.trim().length > 0;
  // The picker adds to a strength routine, so cardio activities are left out there.
  const pool = pick ? EXERCISE_IDS.filter((id) => exercise(id).group !== 'cardio') : EXERCISE_IDS;
  const groupLabel = (id: string) => ALL_GROUPS.find((g) => g.key === exercise(id).group)?.label ?? '';
  const results = searchExercises(query, pool, (id) => `${exercise(id).name} ${groupLabel(id)} ${exercise(id).equipment}`);

  const openExercise = (id: string) => {
    if (!pick || !pickFor) {
      router.push(`/exercise/${id}`);
      return;
    }
    setPlan(withExerciseAdded(profile.plan, pickFor, id));
    router.dismissTo({ pathname: '/routine/[id]', params: { id: pickFor } });
  };

  const openGroup = (k: string) =>
    router.push({ pathname: '/group/[k]', params: pick ? { k, pick: pickFor } : { k } });

  return (
    <ScrollView style={styles.screen} contentContainerStyle={[styles.content, { paddingTop: top(58) }]} keyboardShouldPersistTaps="handled">
      {pick && <BackPill onPress={() => router.back()} style={styles.pickBack} />}
      <View style={styles.head}>
        <Display size={56} weight={900} lh={0.9}>
          {pick ? t('Add exercise') : t('Exercises')}
        </Display>
        <Mono size={14} color={colors.muted}>
          {String(EXERCISE_IDS.length)}
        </Mono>
      </View>
      <UI size={16} color={colors.muted} style={styles.sub}>
        {pick ? t('Search, or pick a muscle group.') : t('Search, or browse by muscle group.')}
      </UI>

      <View style={[styles.search, { borderColor: focused ? colors.accent : colors.line }]}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={t('Search exercises')}
          placeholderTextColor={colors.placeholder}
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
          accessibilityLabel={t('Search exercises')}
          style={styles.searchInput}
        />
        {searching && (
          <Pressable onPress={() => setQuery('')} accessibilityRole="button" accessibilityLabel={t('Clear search')} style={styles.clear}>
            <UI size={16} weight={600} color={colors.muted}>
              {t('Clear')}
            </UI>
          </Pressable>
        )}
      </View>

      {searching && (
        <View style={{ marginTop: 16 }}>
          {results.length === 0 ? (
            <UI size={16} color={colors.muted} lh={1.5}>
              {t('No exercise matches “{q}”. Try a muscle group or a piece of equipment, e.g. “back” or “dumbbell”.', { q: query.trim() })}
            </UI>
          ) : (
            results.map((id) => (
              <Pressable
                key={id}
                onPress={() => openExercise(id)}
                accessibilityRole="button"
                style={({ pressed }) => [styles.row, pressed && { opacity: 0.6 }]}>
                <ExerciseThumb id={id} size={60} radius={14} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <UI size={20} weight={600} numberOfLines={1}>
                    {exercise(id).name}
                  </UI>
                  <UI size={14} color={colors.muted} numberOfLines={1} style={{ marginTop: 4 }}>
                    {`${groupLabel(id)}, ${exercise(id).equipment}`}
                  </UI>
                </View>
                {pick ? (
                  <View style={styles.addPill}>
                    <UI size={14} weight={700} color={colors.accentInk}>
                      {t('Add')}
                    </UI>
                  </View>
                ) : (
                  <UI size={24} color={colors.muted}>
                    ›
                  </UI>
                )}
              </Pressable>
            ))
          )}
        </View>
      )}

      {!searching && (
      <View style={styles.grid}>
        {GROUPS.map((g) => {
          const n = EXERCISE_IDS.filter((id) => exercise(id).group === g.key).length;
          return (
            <Appear key={g.key} index={GROUPS.indexOf(g)}>
            <Pressy onPress={() => openGroup(g.key)} accessibilityRole="button" style={[styles.tile, { width: tileWidth }]}>
              {/* A close-up of the body part with its muscles in red (owner's choice over photos). */}
              <View style={styles.tileArt}>
                <BodyZoom group={g.key} height={96} />
              </View>
              <Display size={24} weight={900} lh={1}>
                {g.label}
              </Display>
              <UI size={14} color={colors.muted} style={{ marginTop: 4 }}>
                {plural(n, 'exercise')}
              </UI>
            </Pressy>
            </Appear>
          );
        })}
      </View>
      )}

      {!pick && !searching && (
        <WideCard kind="cardio" kicker={t('Conditioning')} title={t('Cardio')} count={plural(cardioCount, 'activity')} onPress={() => openGroup('cardio')} />
      )}

      {/* Functional training: full-body and conditioning moves; they fit strength routines, so the picker shows it too. */}
      {!searching && (
        <WideCard
          kind="functional"
          kicker={t('Strength and conditioning')}
          title={t('Functional')}
          count={plural(functionalCount, 'exercise')}
          onPress={() => openGroup('functional')}
        />
      )}

      {!pick && !searching && (
        <WideCard
          kind="mobility"
          kicker={t('Before and after every workout')}
          title={t('Warm-up & stretching')}
          count={plural(EXERCISE_IDS.filter((id) => exercise(id).group === 'mobility').length, 'exercise')}
          onPress={() => openGroup('mobility')}
        />
      )}
    </ScrollView>
  );
}

/** Wide card for a group that is not one muscle: text on the left, its figure on the right. */
function WideCard({ kind, kicker, title, count, onPress }: { kind: Badge; kicker: string; title: string; count: string; onPress: () => void }) {
  return (
    <Pressy onPress={onPress} accessibilityRole="button" style={styles.cardio}>
      <View style={{ flex: 1, minWidth: 0 }}>
        <UI size={14} weight={700} color={colors.accent}>
          {kicker}
        </UI>
        <Display size={kind === 'mobility' ? 32 : 40} weight={900} lh={1} style={{ marginTop: 4 }}>
          {title}
        </Display>
        <UI size={14} color={colors.muted} style={{ marginTop: 4 }}>
          {count}
        </UI>
      </View>
      <BodyBadge kind={kind} height={kind === 'functional' ? 118 : 126} />
    </Pressy>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: 16, paddingBottom: 24 },
  pickBack: { alignSelf: 'flex-start', marginBottom: 16 },
  head: { paddingTop: 8, paddingHorizontal: 4, flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 },
  sub: { marginTop: 8, marginHorizontal: 4 },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    marginTop: 16,
    paddingLeft: 16,
    borderRadius: 24,
    borderWidth: 1.5,
    backgroundColor: colors.surface,
  },
  searchInput: { flex: 1, minWidth: 0, height: 48, color: colors.ink, fontFamily: fonts.ui400, fontSize: 16, outlineStyle: 'none' } as never,
  clear: { height: 48, paddingHorizontal: 16, justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.line },
  thumb: { width: 60, height: 60, borderRadius: 14 },
  addPill: { height: 32, paddingHorizontal: 16, borderRadius: 16, justifyContent: 'center', backgroundColor: colors.accentFill },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 },
  tile: { height: 184, borderRadius: 22, overflow: 'hidden', backgroundColor: colors.surface, padding: 16 },
  tileArt: { flex: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  cardio: { height: 150, marginTop: 8, borderRadius: 22, overflow: 'hidden', backgroundColor: colors.surface, flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 16 },
});
