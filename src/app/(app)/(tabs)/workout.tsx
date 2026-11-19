import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { Appear, Pressy } from '@/components/Motion';
import { Photo } from '@/components/Photo';
import { Display, UI } from '@/components/Txt';
import { DAYS_FULL } from '@/data/catalog';
import { coverPhoto } from '@/data/photos';
import * as repo from '@/data/repo';
import { dateInWeek, dayIndex, longDate, parseIso, shortDate, weekStartOf } from '@/domain/dates';
import { firstPlanDay } from '@/domain/week';
import { routineEquipment, routineMeta } from '@/domain/plan';
import type { Routine } from '@/domain/types';
import { useActive, useDbQuery } from '@/state/store';
import { useTop } from '@/theme/layout';
import { colors } from '@/theme/tokens';
import { t } from '@/i18n';

type DayState = 'done' | 'progress' | 'today' | 'missed' | 'upcoming' | 'rest' | 'before';

const STATUS: Record<Exclude<DayState, 'rest' | 'before'>, string> = {
  done: 'Done',
  progress: 'In progress',
  today: 'Today',
  missed: 'Missed',
  upcoming: 'Upcoming',
};

/**
 * This week as a timeline: a line down the left with one marker per day, and a
 * card per training day (photo, date, routine, time and kit). Rest days are a
 * single quiet line. Reading order: today's card (accent outline) → the rest.
 */
export default function Workout() {
  const { profile, session } = useActive();
  const top = useTop();
  const plan = profile.plan;

  const now = new Date();
  const today = dayIndex(now);
  const weekStart = weekStartOf(now);
  const done = useDbQuery((db) => repo.doneDays(db, profile.id, weekStart), [profile.id, weekStart]) ?? [];
  const live = session && session.weekStart === weekStart ? session.day : -1;
  // Days before the profile was made are not "missed": they just show the date.
  const firstDay = firstPlanDay(profile.createdAt, weekStart);

  const stateOf = (i: number, r: Routine | null): DayState => {
    if (!r) return 'rest';
    if (done.includes(i)) return 'done';
    if (i === live) return 'progress';
    if (i === today) return 'today';
    if (i < firstDay) return 'before';
    return i < today ? 'missed' : 'upcoming';
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={[styles.content, { paddingTop: top(66) }]}>
      <Display size={56} weight={900} lh={0.9}>
        {t('Workout')}
      </Display>
      <UI size={16} color={colors.muted} style={{ marginTop: 8 }}>
        {t('Week of {date}. Pick a day to open its workout.', { date: longDate(parseIso(weekStart)) })}
      </UI>

      <View style={{ marginTop: 24 }}>
        {DAYS_FULL.map((dayName, i) => {
          const k = plan.days[i];
          const r = k ? (plan.routines[k] ?? null) : null;
          const state = stateOf(i, r);
          const date = shortDate(dateInWeek(weekStart, i));
          return (
            <Appear key={i} index={i} style={styles.row}>
              <View style={styles.rail}>
                <View style={[styles.line, i === 0 && { top: '50%' }, i === 6 && { bottom: '50%' }]} />
                <Marker state={state} />
              </View>
              {state === 'rest' || state === 'before' || !r || !k ? (
                <View style={styles.restRow}>
                  <UI size={16} color={colors.muted}>{state === 'before' ? `${dayName}, ${date}` : `${dayName}, ${date} · ${t('Rest')}`}</UI>
                </View>
              ) : (
                <Pressy
                  onPress={() => router.push(`/day/${i}`)}
                  accessibilityRole="button"
                  accessibilityLabel={`${dayName}, ${r.name}, ${t(STATUS[state])}`}
                  style={({ pressed }) => [
                    styles.card,
                    (state === 'today' || state === 'progress') && styles.cardToday,
                    pressed && { opacity: 0.7 },
                  ]}>
                  <View style={styles.photo}>
                    <Photo source={coverPhoto(r)} fill={colors.surface2} style={StyleSheet.absoluteFill} />
                  </View>
                  <View style={styles.text}>
                    <UI size={14} weight={600} color={state === 'today' || state === 'progress' ? colors.accent : colors.muted}>
                      {`${dayName}, ${date} · ${t(STATUS[state])}`}
                    </UI>
                    <Display size={24} weight={800} lh={1} numberOfLines={2} style={{ marginTop: 4 }}>
                      {r.name}
                    </Display>
                    <UI size={14} color={colors.muted} style={{ marginTop: 8 }}>
                      {timeLine(r)}
                    </UI>
                    {r.items.length > 0 && (
                      <UI size={14} color={colors.muted} numberOfLines={1}>
                        {routineEquipment(r)}
                      </UI>
                    )}
                  </View>
                </Pressy>
              )}
            </Appear>
          );
        })}
      </View>
    </ScrollView>
  );
}

/** "About 45 min" (cardio: the planned minutes; empty routine: "No exercises yet"). */
function timeLine(r: Routine): string {
  if (!r.items.length) return r.type === 'cardio' ? t('No activities yet') : t('No exercises yet');
  return r.type === 'cardio' ? `${routineMeta(r).min} min` : t('About {min} min', { min: routineMeta(r).min });
}

/** The marker on the line: check (done), accent ring (today), outline (upcoming), dash (missed), dot (rest). */
function Marker({ state }: { state: DayState }) {
  if (state === 'rest' || state === 'before') return <View style={styles.restDot} />;
  if (state === 'done')
    return (
      <View style={[styles.node, { backgroundColor: colors.green }]}>
        <Svg width={14} height={14} viewBox="0 0 18 18">
          <Path d="M3.5 9.5 L7.5 13.5 L14.5 5" fill="none" stroke={colors.accentInk} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      </View>
    );
  if (state === 'today' || state === 'progress')
    return (
      <View style={[styles.node, { borderWidth: 2, borderColor: colors.accent }]}>
        <View style={[styles.innerDot, { backgroundColor: state === 'progress' ? colors.accentFill : colors.accent }]} />
      </View>
    );
  if (state === 'missed')
    return (
      <View style={[styles.node, { borderWidth: 1.5, borderColor: colors.border }]}>
        <View style={styles.dash} />
      </View>
    );
  return <View style={[styles.node, { borderWidth: 1.5, borderColor: colors.border }]} />;
}

const NODE = 24;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: 16, paddingBottom: 24 },
  row: { flexDirection: 'row', alignItems: 'stretch' },
  rail: { width: 40, alignItems: 'center', justifyContent: 'center' },
  line: { position: 'absolute', top: 0, bottom: 0, width: 2, left: 19, backgroundColor: colors.line },
  node: {
    width: NODE,
    height: NODE,
    borderRadius: NODE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
  },
  innerDot: { width: 8, height: 8, borderRadius: 4 },
  dash: { width: 10, height: 2, borderRadius: 1, backgroundColor: colors.muted },
  restDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.border },
  restRow: { flex: 1, justifyContent: 'center', paddingVertical: 16, paddingLeft: 8 },
  card: {
    flex: 1,
    flexDirection: 'row',
    minHeight: 112,
    marginVertical: 4,
    marginLeft: 8,
    backgroundColor: colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardToday: { borderWidth: 1.5, borderColor: colors.accent },
  photo: { width: 96, backgroundColor: colors.surface2 },
  text: { flex: 1, minWidth: 0, paddingVertical: 16, paddingHorizontal: 16, justifyContent: 'center' },
});
