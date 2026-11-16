import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { confirm } from '@/components/confirm';
import { Photo, Shade, dark, DARK_SCOPE } from '@/components/Photo';
import { Display, Mono, UI } from '@/components/Txt';
import { InkDisplayButton } from '@/components/ui';
import { IMAGES } from '@/data/photos';
import * as repo from '@/data/repo';
import { cardioSummary, strengthSummary } from '@/domain/cardio';
import { shortDate } from '@/domain/dates';
import { useActive, useDbQuery, useStore } from '@/state/store';
import { useTop } from '@/theme/layout';
import { colors, fonts } from '@/theme/tokens';

/** "Workout done": the totals as one list card and new records (strength) or activities (cardio). */
export default function Summary() {
  const { id, from } = useLocalSearchParams<{ id: string; from?: string }>();
  // Opened from All workouts: show when it was and go back to the list.
  const past = from === 'history';
  const { profile } = useActive();
  const top = useTop();
  const insets = useSafeAreaInsets();
  const data = useDbQuery((db) => repo.getWorkout(db, Number(id)), [id]);

  const { deleteWorkout, setWorkoutNote } = useStore();

  const w = data?.workout;
  // The note is typed locally and saved when the field loses focus.
  const [note, setNote] = useState<string | null>(null);
  const [noteFocused, setNoteFocused] = useState(false);
  const saved = w?.note ?? '';
  const noteText = note ?? saved;
  const saveNote = () => {
    setNoteFocused(false);
    if (w && noteText.trim() !== saved) setWorkoutNote(w.id, noteText);
  };

  const remove = async () => {
    if (!w) return;
    if (!(await confirm('Delete this workout?', 'Delete', 'Its sets are removed from your history and progress. This cannot be undone.'))) return;
    await deleteWorkout(w.id);
    if (past) router.back();
    else {
      if (router.canDismiss()) router.dismissAll();
      router.navigate('/');
    }
  };
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
    if (router.canDismiss()) router.dismissAll();
    router.navigate('/');
  };

  return (
    <View style={styles.screen}>
      <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled">
        <View style={{ height: top(300) }} {...DARK_SCOPE}>
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
              {w ? (past ? `${w.routineName}, ${shortDate(new Date(w.finishedAt))}` : w.routineName) : ''}
            </UI>
            <Display size={68} weight={900} lh={0.88} style={{ marginTop: 8 }}>
              Workout done
            </Display>
          </View>
        </View>

        {summary && (
          <View style={styles.body}>
            <View style={styles.stats}>
              {summary.rows.map((r, i) => (
                <View key={r.k} style={[styles.stat, i < summary.rows.length - 1 && styles.statLine]}>
                  <UI size={16} color={colors.muted}>
                    {r.k}
                  </UI>
                  <Mono size={20} weight={500} numberOfLines={1}>
                    {r.v}
                  </Mono>
                </View>
              ))}
            </View>
            {summary.list.length > 0 && (
              <>
                <Display size={28} weight={800} style={{ marginTop: 32 }}>
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

            <UI size={15} color={colors.muted} style={{ marginTop: 32 }}>
              Note
            </UI>
            <TextInput
              value={noteText}
              onChangeText={setNote}
              onFocus={() => setNoteFocused(true)}
              onBlur={saveNote}
              multiline
              maxLength={repo.NOTE_MAX}
              placeholder="How did it go? Anything to remember next time."
              placeholderTextColor={colors.placeholder}
              accessibilityLabel="Workout note"
              textAlignVertical="top"
              style={[styles.note, { borderColor: noteFocused ? colors.accent : colors.line }]}
            />

            <Pressable onPress={remove} accessibilityRole="button" style={({ pressed }) => [styles.delete, pressed && { opacity: 0.6 }]}>
              <UI size={15} weight={600} color={colors.red}>
                Delete workout
              </UI>
            </Pressable>
          </View>
        )}
      </ScrollView>
      <View style={{ paddingTop: 8, paddingHorizontal: 16, paddingBottom: 16 + insets.bottom }}>
        <InkDisplayButton label={past ? 'BACK' : 'BACK TO HOME'} onPress={past ? () => router.back() : home} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  heroText: { position: 'absolute', left: 16, right: 16, bottom: 8 },
  body: { paddingTop: 24, paddingHorizontal: 16, paddingBottom: 24 },
  stats: { backgroundColor: colors.surface, borderRadius: 20, paddingHorizontal: 16 },
  stat: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 16, paddingVertical: 16 },
  statLine: { borderBottomWidth: 1, borderBottomColor: colors.line },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  note: {
    minHeight: 96,
    marginTop: 8,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    backgroundColor: colors.surface,
    color: colors.ink,
    fontFamily: fonts.ui400,
    fontSize: 16,
    lineHeight: 24,
  },
  delete: { height: 48, marginTop: 16, alignItems: 'center', justifyContent: 'center' },
  pill: { backgroundColor: colors.accentFill, paddingVertical: 8, paddingHorizontal: 8, borderRadius: 12 },
});
