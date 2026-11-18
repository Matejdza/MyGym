import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { Hero } from '@/components/Hero';
import { Photo, heroStops } from '@/components/Photo';
import { Display, Mono, UI } from '@/components/Txt';
import { WeekStrip } from '@/components/week';
import { PrimaryButton } from '@/components/ui';
import { DAYS_FULL, exercise } from '@/data/catalog';
import { IMAGES, coverPhoto, exPhoto } from '@/data/photos';
import * as repo from '@/data/repo';
import { addDays, dateInWeek, dayIndex, fullDate, isoDate, shortDate, weekStartOf } from '@/domain/dates';
import { fmt, plural, r2 } from '@/domain/format';
import { timeText, volumeText } from '@/domain/overview';
import { routineEquipment, routineMeta, workoutsPerWeek } from '@/domain/plan';
import { canStart } from '@/domain/session';
import type { Plan } from '@/domain/types';
import { homeWeekCells } from '@/domain/week';
import { useActive, useDbQuery, useStore } from '@/state/store';
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

/** "Next: Thursday, Legs", or that the week has no more workouts. */
function nextLine(plan: Plan, today: number): string {
  for (let i = today + 1; i < 7; i++) {
    const k = plan.days[i];
    if (k && plan.routines[k]) return `Next: ${DAYS_FULL[i]}, ${plan.routines[k].name}`;
  }
  return 'No more workouts this week.';
}

export default function Home() {
  const { profile, session } = useActive();
  const { startWorkout } = useStore();
  const plan = profile.plan;

  const now = new Date();
  const today = dayIndex(now);
  const weekStart = weekStartOf(now);
  const todayIso = isoDate(now);

  const done = useDbQuery((db) => repo.doneDays(db, profile.id, weekStart), [profile.id, weekStart]) ?? [];
  const records = useDbQuery((db) => repo.recentRecords(db, profile.id, RECORDS_SHOWN), [profile.id]) ?? [];
  // This week's totals and the newest finished workout, for the cards under the week strip.
  const weekFrom = dateInWeek(weekStart, 0).getTime();
  const totals = useDbQuery((db) => repo.periodStats(db, profile.id, weekFrom, weekFrom + 7 * 86400000), [profile.id, weekFrom]);
  const lastWorkout = useDbQuery((db) => repo.workoutList(db, profile.id, 1), [profile.id])?.[0];
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
  // Today's workout is logged: nothing left to start, so the yellow button gives way to one quiet link.
  let finished = false;
  if (routine) {
    title = routine.name;
    const running = !!session && session.day === today && session.weekStart === weekStart;
    finished = doneToday && !running;
    meta = finished ? `Done for today. ${nextLine(plan, today)}` : routineMeta(routine).long;
    ctaLabel = running ? 'CONTINUE' : 'START WORKOUT';
    ctaGo = async () => {
      // A finished day or an empty routine opens the day instead of starting.
      if ((doneToday && !running) || !canStart(plan, today)) router.push(`/day/${today}`);
      else if (await startWorkout(today)) router.push('/log');
    };
    viewLabel = finished ? 'View workout' : 'Details';
    viewGo = () => router.push(`/day/${today}`);
  } else {
    title = 'Rest day';
    meta = nextLine(plan, today);
    ctaLabel = 'PICK A WORKOUT';
    ctaGo = () => router.navigate('/workout');
    viewLabel = 'Plan';
    viewGo = () => router.push('/plan');
  }

  // The next planned workout later this week (today's own workout is the hero above).
  const nextDay = plan.days.findIndex((k, i) => i > today && !!k && !!plan.routines[k]);
  const nextRoutine = nextDay >= 0 ? plan.routines[plan.days[nextDay]!] : null;

  // Body weight over the last 12 weeks.
  const from = addDays(todayIso, -BODY_WINDOW_DAYS);
  const bw = body.filter((b) => b.date >= from).map((b) => b.kg);
  const hasTrend = bw.length >= 2;
  const delta = hasTrend ? r2(bw[bw.length - 1] - bw[0]) : 0;

  return (
    <ScrollView style={styles.screen} showsVerticalScrollIndicator={false}>
      <Hero
        source={IMAGES.hero}
        height={500}
        cardHeight={280}
        photoTop
        stops={heroStops(0.7, [0.24, 0.42], 0.88)}
        bar={
          <Pressable
            onPress={() => router.push('/profile')}
            accessibilityRole="button"
            accessibilityLabel="Profile"
            style={[styles.avatar, { backgroundColor: profile.color }]}>
            <Display size={22} weight={900} color={colors.onPlate}>
              {(profile.name[0] || '?').toUpperCase()}
            </Display>
          </Pressable>
        }>
        <UI size={15} weight={600} color={colors.accent}>
          {fullDate(now)}
        </UI>
        <Display size={64} weight={900} lh={0.88} style={{ marginTop: 8 }}>
          {title}
        </Display>
        <UI size={16} style={{ marginTop: 8, opacity: 0.8 }}>
          {meta}
        </UI>
        <View style={styles.ctaRow}>
          {!finished && <PrimaryButton label={ctaLabel} onPress={ctaGo} height={52} fontSize={20} style={{ flex: 1 }} />}
          <Pressable
            onPress={viewGo}
            accessibilityRole="button"
            style={({ pressed }) => [styles.viewPill, finished && { flex: 1 }, pressed && { backgroundColor: colors.surface }]}>
            <UI size={16} weight={600}>
              {viewLabel}
            </UI>
          </Pressable>
        </View>
      </Hero>

      <View style={styles.week}>
        <View style={styles.sectionHead}>
          <Display size={28} weight={800}>
            This week
          </Display>
          <Mono size={15} color={colors.muted}>{`${doneCount} of ${workoutsPerWeek(plan)} done`}</Mono>
        </View>
        <View style={{ marginTop: 16 }}>
          <WeekStrip
            cells={homeWeekCells(plan, done, today, weekStart)}
            size={42}
            fontSize={15}
            onPress={(i) => router.push(`/day/${i}`)}
            accessibilityLabels={DAYS_FULL.map((d, i) => `${d}, ${shortDate(dateInWeek(weekStart, i))}`)}
          />
        </View>
        {totals && totals.workouts > 0 && (
          <UI size={15} color={colors.muted} style={{ marginTop: 16 }}>
            {[plural(totals.sets, 'set'), totals.volume > 0 ? `${volumeText(totals.volume)} lifted` : null, timeText(totals.minutes)]
              .filter(Boolean)
              .join(' · ')}
          </UI>
        )}
      </View>

      {nextRoutine && (
        <View style={styles.section}>
          <Display size={28} weight={800}>
            Coming up
          </Display>
          <Pressable
            onPress={() => router.push(`/day/${nextDay}`)}
            accessibilityRole="button"
            style={({ pressed }) => [styles.card, pressed && { opacity: 0.7 }]}>
            <Photo source={coverPhoto(nextRoutine)} fill={colors.surface2} style={styles.cardPhoto} />
            <View style={styles.cardText}>
              <UI size={14} weight={600} color={colors.muted}>
                {`${DAYS_FULL[nextDay]}, ${shortDate(dateInWeek(weekStart, nextDay))}`}
              </UI>
              <Display size={22} weight={800} lh={1} numberOfLines={2} style={{ marginTop: 4 }}>
                {nextRoutine.name}
              </Display>
              <UI size={14} color={colors.muted} numberOfLines={1} style={{ marginTop: 8 }}>
                {nextRoutine.items.length ? [routineMeta(nextRoutine).list, routineEquipment(nextRoutine)].filter(Boolean).join(' · ') : 'Nothing added yet'}
              </UI>
            </View>
            <UI size={22} color={colors.muted} style={{ paddingRight: 16 }}>
              ›
            </UI>
          </Pressable>
        </View>
      )}

      {lastWorkout && (
        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <Display size={28} weight={800}>
              Last workout
            </Display>
            <Pressable onPress={() => router.push('/history')} accessibilityRole="button" style={styles.link}>
              <UI size={15} weight={600} color={colors.accent}>
                All workouts
              </UI>
            </Pressable>
          </View>
          <Pressable
            onPress={() => router.push({ pathname: '/summary/[id]', params: { id: String(lastWorkout.id), from: 'history' } })}
            accessibilityRole="button"
            style={({ pressed }) => [styles.card, styles.cardPad, pressed && { opacity: 0.7 }]}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <UI size={14} weight={600} color={colors.muted}>
                {fullDate(new Date(lastWorkout.finishedAt))}
              </UI>
              <Display size={22} weight={800} lh={1} numberOfLines={2} style={{ marginTop: 4 }}>
                {lastWorkout.routineName}
              </Display>
              <UI size={14} color={colors.muted} numberOfLines={1} style={{ marginTop: 8 }}>
                {lastWorkout.type === 'cardio'
                  ? `${lastWorkout.minutes} min of cardio`
                  : [
                      plural(lastWorkout.sets, 'set'),
                      timeText(Math.max(1, (lastWorkout.finishedAt - lastWorkout.startedAt) / 60000)),
                      lastWorkout.prs ? plural(lastWorkout.prs, 'record') : null,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
              </UI>
            </View>
            <UI size={22} color={colors.muted}>
              ›
            </UI>
          </Pressable>
        </View>
      )}

      {records.length > 0 && (
        <View style={{ paddingTop: 32 }}>
          <Display size={28} weight={800} style={{ paddingHorizontal: 16 }}>
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
                <UI size={15} weight={600} numberOfLines={1} style={{ marginTop: 8 }}>
                  {exercise(r.exId)?.name ?? r.exId}
                </UI>
                <Mono size={14} color={colors.accent} style={{ marginTop: 4 }}>
                  {`${fmt(r.kg)} kg × ${r.reps}`}
                </Mono>
                <UI size={14} color={colors.muted} style={{ marginTop: 2 }}>
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
            <View style={[styles.baseline, { marginTop: 8 }]}>
              <Mono size={34} weight={500} spacing={-0.05}>
                {fmt(profile.weight)}
              </Mono>
              <UI size={15} color={colors.muted}>
                kg
              </UI>
            </View>
            {hasTrend && (
              <UI size={14} weight={600} color={colors.green} style={{ marginTop: 8 }}>
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
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  ctaRow: { flexDirection: 'row', gap: 8, marginTop: 16 },
  viewPill: {
    height: 52,
    paddingHorizontal: 24,
    borderRadius: 26,
    backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  week: { paddingTop: 32, paddingHorizontal: 16 },
  section: { paddingTop: 32, paddingHorizontal: 16 },
  link: { height: 44, justifyContent: 'center' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 96,
    marginTop: 16,
    backgroundColor: colors.surface,
    borderRadius: 20,
    overflow: 'hidden',
  },
  cardPad: { padding: 16, gap: 16 },
  cardPhoto: { width: 96, alignSelf: 'stretch' },
  cardText: { flex: 1, minWidth: 0, padding: 16 },
  sectionHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  records: { gap: 16, paddingTop: 16, paddingHorizontal: 16 },
  recordPhoto: { height: 112, borderRadius: 16 },
  bodyWrap: { paddingTop: 32, paddingHorizontal: 16, paddingBottom: 32 },
  bodyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 16,
  },
  baseline: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
});
