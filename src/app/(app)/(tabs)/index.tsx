import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { Photo, Shade, heroStops } from '@/components/Photo';
import { Display, Mono, UI } from '@/components/Txt';
import { WeekStrip } from '@/components/week';
import { PrimaryButton } from '@/components/ui';
import { DAYS_FULL, exercise } from '@/data/catalog';
import { IMAGES, exPhoto } from '@/data/photos';
import * as repo from '@/data/repo';
import { addDays, dateInWeek, dayIndex, fullDate, isoDate, shortDate, weekStartOf } from '@/domain/dates';
import { fmt, r2 } from '@/domain/format';
import { routineMeta, workoutsPerWeek } from '@/domain/plan';
import { canStart } from '@/domain/session';
import { homeWeekCells } from '@/domain/week';
import { useActive, useDbQuery, useStore } from '@/state/store';
import { useTop } from '@/theme/layout';
import { colors } from '@/theme/tokens';

const RECORDS_SHOWN = 4;
const BODY_WINDOW_DAYS = 12 * 7;

/** Sparkline path for a 120 × 56 box (`spark` in the prototype). */
function spark(vals: number[]): string {
  const lo = Math.min(...vals);
  const hi = Math.max(...vals);
  const n = vals.length;
  return 'M' + vals.map((v, i) => `${((i * 120) / (n - 1)).toFixed(1)} ${(50 - ((v - lo) / (hi - lo || 1)) * 44).toFixed(1)}`).join(' L');
}

export default function Home() {
  const { profile, session } = useActive();
  const { startWorkout } = useStore();
  const top = useTop();
  const plan = profile.plan;

  const now = new Date();
  const today = dayIndex(now);
  const weekStart = weekStartOf(now);
  const todayIso = isoDate(now);

  const done = useDbQuery((db) => repo.doneDays(db, profile.id, weekStart), [profile.id, weekStart]) ?? [];
  const records = useDbQuery((db) => repo.recentRecords(db, profile.id, RECORDS_SHOWN), [profile.id]) ?? [];
  const body = useDbQuery((db) => repo.bodyLog(db, profile.id), [profile.id, profile.weight]) ?? [];

  const key = plan.days[today];
  const routine = key ? plan.routines[key] : null;
  const doneToday = done.includes(today);
  const doneCount = plan.days.filter((k, i) => k && done.includes(i)).length;

  // Hero: today's routine, or a rest day pointing at the next workout this week.
  let title: string;
  let meta: string;
  let ctaLabel: string;
  let ctaGo: () => void;
  let viewLabel: string;
  let viewGo: () => void;
  if (routine) {
    title = routine.name;
    meta = routineMeta(routine).long;
    const running = !!session && session.day === today && session.weekStart === weekStart;
    ctaLabel = running ? 'CONTINUE' : doneToday ? 'DONE TODAY' : 'START WORKOUT';
    ctaGo = async () => {
      // A finished day or an empty routine opens the day instead of starting.
      if ((doneToday && !running) || !canStart(plan, today)) router.push(`/day/${today}`);
      else if (await startWorkout(today)) router.push('/log');
    };
    viewLabel = 'Details';
    viewGo = () => router.push(`/day/${today}`);
  } else {
    let next = -1;
    for (let i = today + 1; i < 7; i++)
      if (plan.days[i]) {
        next = i;
        break;
      }
    title = 'Rest day';
    meta = next < 0 ? 'No more workouts this week.' : `Next: ${DAYS_FULL[next]}, ${plan.routines[plan.days[next]!].name}`;
    ctaLabel = 'PICK A WORKOUT';
    ctaGo = () => router.navigate('/workout');
    viewLabel = 'Plan';
    viewGo = () => router.push('/plan');
  }

  // Body weight over the last 12 weeks.
  const from = addDays(todayIso, -BODY_WINDOW_DAYS);
  const bw = body.filter((b) => b.date >= from).map((b) => b.kg);
  const hasTrend = bw.length >= 2;
  const delta = hasTrend ? r2(bw[bw.length - 1] - bw[0]) : 0;

  return (
    <ScrollView style={styles.screen} showsVerticalScrollIndicator={false}>
      <View style={{ height: top(500) }}>
        <Photo source={IMAGES.hero} style={StyleSheet.absoluteFill} />
        <Shade stops={heroStops(0.7, [0.24, 0.42], 0.88)} />
        <View style={[styles.topBar, { top: top(54) }]}>
          <Pressable
            onPress={() => router.push('/profile')}
            accessibilityRole="button"
            accessibilityLabel="Profile"
            style={[styles.avatar, { backgroundColor: profile.color }]}>
            <Display size={22} weight={900} color={colors.bg}>
              {(profile.name[0] || '?').toUpperCase()}
            </Display>
          </Pressable>
          <UI size={17} weight={600}>
            Home
          </UI>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.heroText}>
          <UI size={15} weight={600} color={colors.accent}>
            {fullDate(now)}
          </UI>
          <Display size={64} weight={900} lh={0.88} style={{ marginTop: 8 }}>
            {title}
          </Display>
          <UI size={16} style={{ marginTop: 10, opacity: 0.8 }}>
            {meta}
          </UI>
          <View style={styles.ctaRow}>
            <PrimaryButton label={ctaLabel} onPress={ctaGo} height={58} fontSize={23} style={{ flex: 1 }} />
            <Pressable onPress={viewGo} accessibilityRole="button" style={styles.viewPill}>
              <UI size={16} weight={600} color={colors.bg}>
                {viewLabel}
              </UI>
            </Pressable>
          </View>
        </View>
      </View>

      <View style={styles.week}>
        <View style={styles.sectionHead}>
          <Display size={28} weight={800}>
            This week
          </Display>
          <Mono size={15} color={colors.muted}>{`${doneCount} of ${workoutsPerWeek(plan)} done`}</Mono>
        </View>
        <View style={{ marginTop: 14 }}>
          <WeekStrip
            cells={homeWeekCells(plan, done, today, weekStart)}
            size={42}
            fontSize={15}
            onPress={(i) => router.push(`/day/${i}`)}
            accessibilityLabels={DAYS_FULL.map((d, i) => `${d}, ${shortDate(dateInWeek(weekStart, i))}`)}
          />
        </View>
      </View>

      {records.length > 0 && (
        <View style={{ paddingTop: 34 }}>
          <Display size={28} weight={800} style={{ paddingHorizontal: 20 }}>
            Recent records
          </Display>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.records}>
            {records.map((r) => (
              <Pressable
                key={r.exId}
                onPress={() => router.push(`/exercise/${r.exId}`)}
                accessibilityRole="button"
                style={{ width: 156 }}>
                <Photo source={exPhoto(r.exId)} style={styles.recordPhoto} />
                <UI size={15} weight={600} numberOfLines={1} style={{ marginTop: 10 }}>
                  {exercise(r.exId)?.name ?? r.exId}
                </UI>
                <Mono size={14} color={colors.accent} style={{ marginTop: 4 }}>
                  {`${fmt(r.kg)} kg × ${r.reps}`}
                </Mono>
                <UI size={13} color={colors.muted} style={{ marginTop: 2 }}>
                  {shortDate(new Date(r.finishedAt))}
                </UI>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}

      <View style={styles.bodyWrap}>
        <Pressable
          onPress={() => router.navigate({ pathname: '/progress', params: { mode: 'body' } })}
          accessibilityRole="button"
          style={styles.bodyCard}>
          <View style={{ flex: 1 }}>
            <UI size={15} color={colors.muted}>
              Body weight
            </UI>
            <View style={[styles.baseline, { marginTop: 6 }]}>
              <Mono size={34} weight={500} spacing={-0.05}>
                {fmt(profile.weight)}
              </Mono>
              <UI size={15} color={colors.muted}>
                kg
              </UI>
            </View>
            {hasTrend && (
              <UI size={14} weight={600} color={colors.green} style={{ marginTop: 6 }}>
                {`${delta <= 0 ? '−' : '+'}${fmt(Math.abs(delta))} kg in 12 weeks`}
              </UI>
            )}
          </View>
          {hasTrend && (
            <Svg width={120} height={56} style={{ overflow: 'visible' }}>
              <Path d={spark(bw)} fill="none" stroke={colors.accent} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
            </Svg>
          )}
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  topBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  heroText: { position: 'absolute', left: 20, right: 20, bottom: 6 },
  ctaRow: { flexDirection: 'row', gap: 10, marginTop: 18 },
  viewPill: {
    height: 58,
    paddingHorizontal: 24,
    borderRadius: 29,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  week: { paddingTop: 30, paddingHorizontal: 20 },
  sectionHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  records: { gap: 12, paddingTop: 14, paddingHorizontal: 20 },
  recordPhoto: { height: 112, borderRadius: 16 },
  bodyWrap: { paddingTop: 34, paddingHorizontal: 20, paddingBottom: 28 },
  bodyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.surface,
    borderRadius: 22,
    padding: 18,
  },
  baseline: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
});
