// Progress overview: Week / Month / Year, the week's days, and four totals.
// Reading order: period → date range → (week: days) → workouts done → the rest.
// States: loading (values show "–"), empty (no workouts in the period: a short
// note under the cards), default.

import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { Segmented } from '@/components/Segmented';
import { Mono, UI } from '@/components/Txt';
import * as repo from '@/data/repo';
import { isoDate } from '@/domain/dates';
import { periodRange, plannedWorkouts, timeText, volumeText, type Period } from '@/domain/overview';
import { thou } from '@/domain/format';
import { DAY_LETTERS } from '@/domain/week';
import type { Plan } from '@/domain/types';
import { useDbQuery } from '@/state/store';
import { colors } from '@/theme/tokens';

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

export function Overview({ profileId, plan }: { profileId: string; plan: Plan }) {
  const [period, setPeriod] = useState<Period>('week');
  const now = new Date();
  const range = periodRange(period, now);
  const stats = useDbQuery((db) => repo.periodStats(db, profileId, range.from.getTime(), range.to.getTime()), [
    profileId,
    period,
    range.from.getTime(),
  ]);
  const planned = plannedWorkouts(plan, range);
  const done = stats?.workouts ?? 0;
  const pct = planned ? Math.min(100, (done / planned) * 100) : done ? 100 : 0;
  const show = (v: string) => (stats ? v : '–');

  return (
    <View>
      <Segmented<Period> options={PERIODS} value={period} onChange={setPeriod} />
      <UI size={16} weight={600} style={{ marginTop: 16 }}>
        {range.label}
      </UI>

      {period === 'week' && <WeekDays from={range.from} plan={plan} done={stats?.days ?? []} today={isoDate(now)} />}

      <View style={styles.card}>
        <View style={styles.valueRow}>
          <Mono size={36} weight={500}>
            {show(String(done))}
          </Mono>
          <Mono size={18} color={colors.muted}>{`/ ${planned}`}</Mono>
        </View>
        <View style={styles.track} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: planned, now: done }}>
          <View style={[styles.fill, { width: `${pct}%` }]} />
        </View>
        <UI size={15} color={colors.muted} style={{ marginTop: 8 }}>
          Workouts done
        </UI>
      </View>

      <View style={styles.list}>
        <Stat label="Sets logged" value={show(thou(stats?.sets ?? 0))} />
        <Stat label="Volume lifted" value={show(volumeText(stats?.volume ?? 0))} />
        <Stat label="Time trained" value={show(timeText(stats?.minutes ?? 0))} last />
      </View>

      {stats && done === 0 && (
        <UI size={15} color={colors.muted} style={{ marginTop: 16 }}>
          {EMPTY_NOTE[period]}
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
      <Mono size={18} weight={500} numberOfLines={1}>
        {value}
      </Mono>
    </View>
  );
}

/** Mon–Sun with dates: done days filled and checked, planned days outlined, today in accent. */
function WeekDays({ from, plan, done, today }: { from: Date; plan: Plan; done: string[]; today: string }) {
  return (
    <View style={styles.week}>
      {DAY_LETTERS.map((letter, i) => {
        const d = new Date(from);
        d.setDate(d.getDate() + i);
        const iso = isoDate(d);
        const isDone = done.includes(iso);
        const planned = !!plan.days[i];
        const isToday = iso === today;
        return (
          <View key={i} style={styles.day} accessibilityLabel={`${letter} ${d.getDate()}${isDone ? ', done' : planned ? ', planned' : ''}`}>
            <UI size={14} weight={600} color={isToday ? colors.accent : colors.muted}>
              {letter}
            </UI>
            <View
              style={[
                styles.dayCircle,
                isDone
                  ? { backgroundColor: colors.accentFill }
                  : planned
                    ? { borderWidth: 1.5, borderColor: isToday ? colors.accent : colors.border }
                    : isToday && { borderWidth: 1.5, borderColor: colors.accent },
              ]}>
              {isDone ? (
                <Svg width={18} height={18} viewBox="0 0 18 18">
                  <Path d="M3.5 9.5 L7.5 13.5 L14.5 5" fill="none" stroke={colors.onPlate} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
              ) : (
                <Mono size={15} weight={500} color={planned || isToday ? colors.ink : colors.muted}>
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
  fill: { height: '100%', borderRadius: 3, backgroundColor: colors.accentFill },
  week: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
  day: { alignItems: 'center', gap: 8 },
  dayCircle: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
});
