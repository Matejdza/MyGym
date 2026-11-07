import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { CoverThumb } from '@/components/Cover';
import { Display, UI } from '@/components/Txt';
import { Ring } from '@/components/ui';
import { DAYS_FULL } from '@/data/catalog';
import { coverPhoto } from '@/data/photos';
import * as repo from '@/data/repo';
import { dateInWeek, dayIndex, longDate, parseIso, shortDate, weekStartOf } from '@/domain/dates';
import { routineMeta } from '@/domain/plan';
import { useActive, useDbQuery } from '@/state/store';
import { useTop } from '@/theme/layout';
import { colors, plate } from '@/theme/tokens';

/** The 7 days of this week as cards; rest days as dashed rows. */
export default function Workout() {
  const { profile, session } = useActive();
  const top = useTop();
  const plan = profile.plan;

  const now = new Date();
  const today = dayIndex(now);
  const weekStart = weekStartOf(now);
  const done = useDbQuery((db) => repo.doneDays(db, profile.id, weekStart), [profile.id, weekStart]) ?? [];

  return (
    <ScrollView style={styles.screen} contentContainerStyle={[styles.content, { paddingTop: top(66) }]}>
      <View style={{ paddingHorizontal: 4 }}>
        <Display size={52} weight={900} lh={0.9}>
          Workout
        </Display>
        <UI size={16} color={colors.muted} style={{ marginTop: 10 }}>
          {`Week of ${longDate(parseIso(weekStart))}. Pick a day to open its workout.`}
        </UI>
      </View>

      <View style={styles.list}>
        {DAYS_FULL.map((dayName, i) => {
          const date = shortDate(dateInWeek(weekStart, i));
          const k = plan.days[i];
          const r = k ? plan.routines[k] : null;
          if (!k || !r) {
            return (
              <View key={i} style={styles.rest}>
                <UI size={14} weight={600} color={colors.muted}>{`${dayName}, ${date}`}</UI>
                <UI size={14} color={colors.muted}>
                  Rest
                </UI>
              </View>
            );
          }

          let status: string;
          let bg: string;
          let fg: string;
          if (done.includes(i)) {
            status = 'Done';
            bg = plate(k);
            fg = colors.bg;
          } else if (i === today) {
            status = session && session.day === i && session.weekStart === weekStart ? 'In progress' : 'Today';
            bg = colors.accent;
            fg = colors.accentInk;
          } else if (i < today) {
            status = 'Missed';
            bg = colors.surface2;
            fg = colors.muted;
          } else {
            status = 'Upcoming';
            bg = colors.surface2;
            fg = colors.ink;
          }

          return (
            <Pressable key={i} onPress={() => router.push(`/day/${i}`)} accessibilityRole="button" style={styles.card}>
              {i === today && <Ring width={2} color={colors.accent} radius={22} />}
              <CoverThumb source={coverPhoto(r)} routineKey={k} size={72} radius={15} badge={24} badgeFont={12} inset={6} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <UI size={14} weight={600} color={colors.muted}>{`${dayName}, ${date}`}</UI>
                <Display size={25} weight={800} lh={0.95} style={{ marginTop: 3 }}>
                  {r.name}
                </Display>
                <UI size={14} color={colors.muted} style={{ marginTop: 3 }}>
                  {routineMeta(r).list}
                </UI>
              </View>
              <View style={[styles.status, { backgroundColor: bg }]}>
                <UI size={13} weight={700} color={fg}>
                  {status}
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
  content: { paddingHorizontal: 16, paddingBottom: 20 },
  list: { gap: 8, marginTop: 22 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.surface,
    borderRadius: 22,
    paddingVertical: 10,
    paddingLeft: 10,
    paddingRight: 14,
  },
  status: { height: 30, paddingHorizontal: 12, borderRadius: 15, justifyContent: 'center', flexShrink: 0 },
  rest: {
    height: 48,
    borderRadius: 22,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.line,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
