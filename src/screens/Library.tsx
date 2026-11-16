import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View, useWindowDimensions } from 'react-native';

import { Photo, Shade, dark, DARK_SCOPE } from '@/components/Photo';
import { Display, Mono, UI } from '@/components/Txt';
import { BackPill } from '@/components/ui';
import { ALL_GROUPS, EXERCISE_IDS, GROUPS, exercise } from '@/data/catalog';
import { IMAGES, exPhoto, groupPhoto } from '@/data/photos';
import { plural } from '@/domain/format';
import { searchExercises, withExerciseAdded } from '@/domain/plan';
import { useActive, useStore } from '@/state/store';
import { useTop } from '@/theme/layout';
import { colors, fonts } from '@/theme/tokens';

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
 * Typing in the search field replaces the tiles with matching exercises
 * (name, muscle group or equipment); no match shows a short note.
 */
export function Library({ pickFor }: { pickFor?: string }) {
  const top = useTop();
  const { width } = useWindowDimensions();
  const tileWidth = (width - 16 * 2 - 8) / 2;
  const pick = pickFor != null;
  const cardioCount = EXERCISE_IDS.filter((id) => exercise(id).group === 'cardio').length;

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
      {pick && <BackPill label={`‹ Routine ${pickFor}`} onPress={() => router.back()} style={styles.pickBack} />}
      <View style={styles.head}>
        <Display size={52} weight={900} lh={0.9}>
          {pick ? 'Add exercise' : 'Exercises'}
        </Display>
        <Mono size={14} color={colors.muted}>
          {String(EXERCISE_IDS.length)}
        </Mono>
      </View>
      <UI size={16} color={colors.muted} style={styles.sub}>
        {pick ? 'Search, or pick a muscle group.' : 'Search, or browse by muscle group.'}
      </UI>

      <View style={[styles.search, { borderColor: focused ? colors.accent : colors.line }]}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Search exercises"
          placeholderTextColor={colors.placeholder}
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
          accessibilityLabel="Search exercises"
          style={styles.searchInput}
        />
        {searching && (
          <Pressable onPress={() => setQuery('')} accessibilityRole="button" accessibilityLabel="Clear search" style={styles.clear}>
            <UI size={15} weight={600} color={colors.muted}>
              Clear
            </UI>
          </Pressable>
        )}
      </View>

      {searching && (
        <View style={{ marginTop: 16 }}>
          {results.length === 0 ? (
            <UI size={16} color={colors.muted} lh={1.5}>
              {`No exercise matches “${query.trim()}”. Try a muscle group or a piece of equipment, e.g. “back” or “dumbbell”.`}
            </UI>
          ) : (
            results.map((id) => (
              <Pressable
                key={id}
                onPress={() => openExercise(id)}
                accessibilityRole="button"
                style={({ pressed }) => [styles.row, pressed && { opacity: 0.6 }]}>
                <Photo source={exPhoto(id)} fill={colors.surface2} style={styles.thumb} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <UI size={17} weight={600} numberOfLines={1}>
                    {exercise(id).name}
                  </UI>
                  <UI size={14} color={colors.muted} numberOfLines={1} style={{ marginTop: 4 }}>
                    {`${groupLabel(id)}, ${exercise(id).equipment}`}
                  </UI>
                </View>
                {pick ? (
                  <View style={styles.addPill}>
                    <UI size={14} weight={700} color={colors.accentInk}>
                      Add
                    </UI>
                  </View>
                ) : (
                  <UI size={22} color={colors.muted}>
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
            <Pressable key={g.key} onPress={() => openGroup(g.key)} accessibilityRole="button" style={[styles.tile, { width: tileWidth }]} {...DARK_SCOPE}>
              <Photo source={groupPhoto(g.key)} style={StyleSheet.absoluteFill} />
              <Shade stops={TILE_STOPS} />
              <View style={styles.tileText}>
                <Display size={30} weight={900} lh={1}>
                  {g.label}
                </Display>
                <UI size={14} style={{ marginTop: 4, opacity: 0.75 }}>
                  {plural(n, 'exercise')}
                </UI>
              </View>
            </Pressable>
          );
        })}
      </View>
      )}

      {!pick && !searching && (
        <Pressable onPress={() => openGroup('cardio')} accessibilityRole="button" style={styles.cardio} {...DARK_SCOPE}>
          <Photo source={IMAGES.cardioWide} style={StyleSheet.absoluteFill} />
          <Shade stops={CARDIO_STOPS} horizontal />
          <View style={styles.cardioText}>
            <UI size={14} weight={700} color={colors.accent}>
              Conditioning
            </UI>
            <Display size={38} weight={900} lh={1} style={{ marginTop: 4 }}>
              Cardio
            </Display>
            <UI size={14} style={{ marginTop: 4, opacity: 0.75 }}>
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
  tile: { height: 168, borderRadius: 22, overflow: 'hidden', backgroundColor: colors.surface },
  tileText: { position: 'absolute', left: 14, right: 14, bottom: 12 },
  cardio: { height: 150, marginTop: 8, borderRadius: 22, overflow: 'hidden', backgroundColor: colors.surface },
  cardioText: { position: 'absolute', left: 16, bottom: 14 },
});
