import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { PlateBadge } from '@/components/Cover';
import { Display, UI } from '@/components/Txt';
import { BackPill } from '@/components/ui';
import * as repo from '@/data/repo';
import { fullDate } from '@/domain/dates';
import { plural } from '@/domain/format';
import { useActive, useDbQuery } from '@/state/store';
import { useTop } from '@/theme/layout';
import { colors } from '@/theme/tokens';

/** Every finished workout, newest first. A row opens that workout's summary. */
export default function History() {
  const { profile } = useActive();
  const top = useTop();
  const rows = useDbQuery((db) => repo.workoutList(db, profile.id), [profile.id]);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={[styles.content, { paddingTop: top(58) }]}>
      <BackPill onPress={() => router.back()} style={{ alignSelf: 'flex-start' }} />
      <Display size={52} weight={900} lh={0.9} style={{ marginTop: 22 }}>
        All workouts
      </Display>
      {rows && (
        <UI size={15} color={colors.muted} style={{ marginTop: 10 }}>
          {rows.length ? `${plural(rows.length, 'workout')} logged` : 'No workouts logged yet.'}
        </UI>
      )}

      <View style={{ marginTop: 18 }}>
        {rows?.map((w) => {
          const mins = Math.max(1, Math.round((w.finishedAt - w.startedAt) / 60000));
          const detail =
            w.type === 'cardio' ? `${w.minutes} min of cardio` : `${plural(w.sets, 'set')}, ${mins} min`;
          return (
            <Pressable
              key={w.id}
              onPress={() => router.push({ pathname: '/summary/[id]', params: { id: String(w.id), from: 'history' } })}
              accessibilityRole="button"
              style={({ pressed }) => [styles.row, pressed && { opacity: 0.6 }]}>
              <PlateBadge routineKey={w.routineKey} size={36} fontSize={14} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <UI size={13} color={colors.muted}>
                  {fullDate(new Date(w.finishedAt))}
                </UI>
                <UI size={17} weight={600} numberOfLines={1} style={{ marginTop: 3 }}>
                  {w.routineName}
                </UI>
                <UI size={14} color={colors.muted} style={{ marginTop: 3 }}>
                  {detail}
                </UI>
              </View>
              {w.prs > 0 && (
                <View style={styles.pr}>
                  <UI size={12} weight={700} color={colors.accentInk}>
                    {w.prs === 1 ? 'PR' : `${w.prs} PRs`}
                  </UI>
                </View>
              )}
              <UI size={22} color={colors.muted}>
                ›
              </UI>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: 20, paddingBottom: 28 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  pr: { backgroundColor: colors.accent, paddingVertical: 4, paddingHorizontal: 8, borderRadius: 10 },
});
