// Progress overview: Week / Month / Year, the week's days, and four totals.
// Reading order: period → date range → (week: days) → workouts done → the rest.
// States: loading (values show "–"), empty (no workouts in the period: a short
// note under the cards), default.

import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { Fill, useCountUp } from '@/components/Motion';
import { Segmented } from '@/components/Segmented';
import { Mono, UI } from '@/components/Txt';
import * as repo from '@/data/repo';
import { isoDate } from '@/domain/dates';
import { periodRange, plannedWorkouts, timeText, volumeText, type Period } from '@/domain/overview';
import { thou } from '@/domain/format';
import { DAY_INITIALS } from '@/domain/week';
import type { Plan } from '@/domain/types';
import { useDbQuery } from '@/state/store';
import { colors } from '@/theme/tokens';
import { t } from '@/i18n';

const PERIODS: [Period, string][] = [
  ['week', 'Week'],
  ['month', 'Month'],
  ['year', 'Year'],
];

const EMPTY_NOTE: Record<Period, string> = {
  week: 'No workouts this week yet. Your first one starts the count.',
  month: 'No workouts this month yet.',
  year: 'No workouts this year yet.',
};

export function Overview({ profileId, plan, createdAt }: { profileId: string; plan: Plan; createdAt: number }) {
  const since = isoDate(new Date(createdAt));
  const [period, setPeriod] = useState<Period>('week');
  const now = new Date();
  const range = periodRange(period, now);
  const stats = useDbQuery((db) => repo.periodStats(db, profileId, range.from.getTime(), range.to.getTime()), [
    profileId,
    period,
    range.from.getTime(),
  ]);
  const planned = plannedWorkouts(plan, range, since);
  // Days with a workout, like Home's "x of y done" (logging a day twice counts once).
  const done = stats?.days.length ?? 0;
  const pct = planned ? Math.min(100, (done / planned) * 100) : done ? 100 : 0;
  const show = (v: string) => (stats ? v : '–');
  const doneShown = Math.round(useCountUp(done));

  return (
    <View>
      <Segmented<Period> options={PERIODS} value={period} onChange={setPeriod} />
      <UI size={16} weight={600} style={{ marginTop: 16 }}>
        {range.label}
      </UI>

      {period === 'week' && <WeekDays from={range.from} plan={plan} done={stats?.days ?? []} today={isoDate(now)} since={since} />}

      <View style={styles.card}>
        <View style={styles.valueRow}>
          <Mono size={40} weight={500}>
            {show(String(doneShown))}
          </Mono>
          <Mono size={20} color={colors.muted}>{`/ ${planned}`}</Mono>
        </View>
        <View style={styles.track} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: planned, now: done }}>
          <Fill pct={pct} color={colors.accentFill} style={styles.fill} />
        </View>
        <UI size={16} color={colors.muted} style={{ marginTop: 8 }}>
          {t('Workouts done')}
        </UI>
      </View>

      <View style={styles.list}>
        <Stat label={t('Sets logged')} value={show(thou(stats?.sets ?? 0))} />
        <Stat label={t('Volume lifted')} value={show(volumeText(stats?.volume ?? 0))} />
        <Stat label={t('Time trained')} value={show(timeText(stats?.minutes ?? 0))} last />
      </View>

      {stats && done === 0 && (
        <UI size={16} color={colors.muted} style={{ marginTop: 16 }}>
          {t(EMPTY_NOTE[period])}
        </UI>
      )}
    </View>
  );
}

/** One total as a row: label left, number right. */
function Stat({ value, label, last }: { value: string; label: string; last?: boolean }) {
  return (
    <View style={[styles.row, !last && styles.rowLine]}>
      <UI size={16} color={colors.muted}>
        {label}
      </UI>
      <Mono size={20} weight={500} numberOfLines={1}>
        {value}
      </Mono>
    </View>
  );
}

/** Mon–Sun with dates: done days filled and checked, planned days outlined, today in accent. */
function WeekDays({ from, plan, done, today, since }: { from: Date; plan: Plan; done: string[]; today: string; since: string }) {
  return (
    <View style={styles.week}>
      {DAY_INITIALS.map((letter, i) => {
        const d = new Date(from);
        d.setDate(d.getDate() + i);
        const iso = isoDate(d);
        const isDone = done.includes(iso);
        const planned = !!plan.days[i] && iso >= since;
        const isToday = iso === today;
        return (
          <View key={i} style={styles.day} accessibilityLabel={`${letter} ${d.getDate()}${isDone ? `, ${t('done')}` : planned ? `, ${t('planned')}` : ''}`}>
            <UI size={14} weight={600} color={isToday ? colors.accent : colors.muted}>
              {letter}
            </UI>
            <View
              style={[
                styles.dayCircle,
                isDone
                  ? { backgroundColor: colors.green }
                  : planned
                    ? { borderWidth: 1.5, borderColor: isToday ? colors.accent : colors.border }
                    : isToday && { borderWidth: 1.5, borderColor: colors.accent },
              ]}>
              {isDone ? (
                <Svg width={18} height={18} viewBox="0 0 18 18">
                  <Path d="M3.5 9.5 L7.5 13.5 L14.5 5" fill="none" stroke={colors.accentInk} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
              ) : (
                <Mono size={16} weight={500} color={planned || isToday ? colors.ink : colors.muted}>
                  {String(d.getDate())}
                </Mono>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: 20, padding: 16, marginTop: 24 },
  list: { backgroundColor: colors.surface, borderRadius: 20, paddingHorizontal: 16, marginTop: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 16, paddingVertical: 16 },
  rowLine: { borderBottomWidth: 1, borderBottomColor: colors.line },
  valueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  track: { height: 6, borderRadius: 3, backgroundColor: colors.surface2, marginTop: 16, overflow: 'hidden' },
  fill: { borderRadius: 3 },
  week: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
  day: { alignItems: 'center', gap: 8 },
  dayCircle: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
});
