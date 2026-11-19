import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { BodyMap } from '@/components/BodyMap';
import { GoalCard } from '@/components/GoalCard';
import { Appear, Pressy } from '@/components/Motion';
import { Hero } from '@/components/Hero';
import { ProfileGlyph } from '@/components/ProfileIcon';
import { Photo, heroStops } from '@/components/Photo';
import { Display, Mono, UI } from '@/components/Txt';
import { WeekStrip } from '@/components/week';
import { PrimaryButton } from '@/components/ui';
import { ExerciseThumb } from '@/components/ExerciseThumb';
import { DAYS_FULL, exercise } from '@/data/catalog';
import { IMAGES, coverPhoto } from '@/data/photos';
import * as repo from '@/data/repo';
import { dateInWeek, dayIndex, fullDate, isoDate, shortDate, weekStartOf } from '@/domain/dates';
import { fmt, plural } from '@/domain/format';
import { MUSCLE_LABEL, routineMuscles } from '@/domain/muscles';
import { timeText, volumeText } from '@/domain/overview';
import { routineEquipment, routineMeta } from '@/domain/plan';
import { canStart } from '@/domain/session';
import type { Plan } from '@/domain/types';
import { firstPlanDay, homeWeekCells, plannedFrom } from '@/domain/week';
import { useActive, useDbQuery, useStore } from '@/state/store';
import { colors } from '@/theme/tokens';
import { t } from '@/i18n';

const RECORDS_SHOWN = 4;

/** "Next: Thursday, Legs", or that the week has no more workouts. */
function nextLine(plan: Plan, today: number): string {
  for (let i = today + 1; i < 7; i++) {
    const k = plan.days[i];
    if (k && plan.routines[k]) return t('Next: {day}, {name}', { day: DAYS_FULL[i], name: plan.routines[k].name });
  }
  return t('No more workouts this week.');
}

export default function Home() {
  const { profile, session } = useActive();
  const { startWorkout, saveBodyWeight } = useStore();
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
  // A profile made mid-week only counts the days from then on.
  const firstDay = firstPlanDay(profile.createdAt, weekStart);

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
    meta = finished ? `${t('Done for today.')} ${nextLine(plan, today)}` : routineMeta(routine).long;
    ctaLabel = running ? t('CONTINUE') : t('START WORKOUT');
    ctaGo = async () => {
      // A finished day or an empty routine opens the day instead of starting.
      if ((doneToday && !running) || !canStart(plan, today)) router.push(`/day/${today}`);
      else if (await startWorkout(today)) router.push('/log');
    };
    viewLabel = finished ? t('View workout') : t('Details');
    viewGo = () => router.push(`/day/${today}`);
  } else {
    title = t('Rest day');
    meta = nextLine(plan, today);
    ctaLabel = t('PICK A WORKOUT');
    ctaGo = () => router.navigate('/workout');
    viewLabel = t('Plan');
    viewGo = () => router.push('/plan');
  }

  // The next planned workout later this week (today's own workout is the hero above).
  const nextDay = plan.days.findIndex((k, i) => i > today && !!k && !!plan.routines[k]);
  const nextRoutine = nextDay >= 0 ? plan.routines[plan.days[nextDay]!] : null;

  // Body map: today's routine, or on a rest day the next one this week.
  const focusDay = routine && routine.items.length ? today : nextRoutine?.items.length ? nextDay : -1;
  const focus = focusDay >= 0 ? routineMuscles(plan.routines[plan.days[focusDay]!]) : null;
  const focusTitle = focusDay === today ? (doneToday ? t('Worked today') : t("Today's muscles")) : focusDay >= 0 ? t('Next up: {day}', { day: DAYS_FULL[focusDay] }) : t('Recovery');


  return (
    <ScrollView style={styles.screen} showsVerticalScrollIndicator={false}>
      <Hero
        source={IMAGES.hero}
        height={500}
        cardHeight={360}
        photoTop
        stops={heroStops(0.7, [0.24, 0.42], 0.88)}
        bar={
          <Pressable
            onPress={() => router.push('/profile')}
            accessibilityRole="button"
            accessibilityLabel={t('Profile')}
            style={[styles.avatar, { backgroundColor: profile.color }]}>
            {profile.avatar ? (
              <ProfileGlyph icon={profile.avatar} circle={40} />
            ) : (
              <Display size={24} weight={900} color={colors.onPlate}>
                {(profile.name[0] || '?').toUpperCase()}
              </Display>
            )}
          </Pressable>
        }
        caption={
          <>
            <UI size={16} weight={600} color={colors.accent}>
              {fullDate(now)}
            </UI>
            <Display size={56} weight={900} lh={0.88} style={{ marginTop: 8 }}>
              {title}
            </Display>
            <UI size={16} style={{ marginTop: 8, opacity: 0.85 }}>
              {meta}
            </UI>
          </>
        }>
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

      <Appear index={1} style={styles.section}>
        <Display size={32} weight={800}>
          {focusTitle}
        </Display>
        <Pressy
          onPress={() => (focusDay >= 0 ? router.push(`/day/${focusDay}`) : router.navigate('/workout'))}
          accessibilityRole="button"
          style={({ pressed }) => [styles.bodyCardMap, pressed && { opacity: 0.8 }]}>
          <BodyMap primary={focus?.primary ?? []} secondary={focus?.secondary ?? []} width={112} />
          {focus && focus.primary.length > 0 ? (
            <View style={styles.focusText}>
              <UI size={20} weight={600} align="center">
                {focus.primary.map((m) => MUSCLE_LABEL[m]).join(' · ')}
              </UI>
              {focus.secondary.length > 0 && (
                <UI size={14} color={colors.muted} align="center" style={{ marginTop: 4 }}>
                  {t('Also working: {list}', { list: focus.secondary.map((m) => MUSCLE_LABEL[m].toLowerCase()).join(', ') })}
                </UI>
              )}
            </View>
          ) : (
            <UI size={16} color={colors.muted} align="center" style={styles.focusText}>
              {t('No more workouts this week. Rest well, your muscles grow while you recover.')}
            </UI>
          )}
        </Pressy>
      </Appear>

      <Appear index={2} style={styles.week}>
        <View style={styles.sectionHead}>
          <Display size={32} weight={800}>
            {t('This week')}
          </Display>
          <Mono size={16} color={colors.muted}>{t('{done} of {total} done', { done: doneCount, total: Math.max(doneCount, plannedFrom(plan, firstDay)) })}</Mono>
        </View>
        <View style={{ marginTop: 16 }}>
          <WeekStrip
            cells={homeWeekCells(plan, done, today, weekStart, firstDay)}
            size={42}
            fontSize={16}
            onPress={(i) => router.push(`/day/${i}`)}
            accessibilityLabels={DAYS_FULL.map((d, i) => `${d}, ${shortDate(dateInWeek(weekStart, i))}`)}
          />
        </View>
        {totals && totals.workouts > 0 && (
          <UI size={16} color={colors.muted} style={{ marginTop: 16 }}>
            {[plural(totals.sets, 'set'), totals.volume > 0 ? t('{volume} lifted', { volume: volumeText(totals.volume) }) : null, timeText(totals.minutes)]
              .filter(Boolean)
              .join(' · ')}
          </UI>
        )}
      </Appear>

      {nextRoutine && (
        <Appear index={3} style={styles.section}>
          <Display size={32} weight={800}>
            {t('Coming up')}
          </Display>
          <Pressy
            onPress={() => router.push(`/day/${nextDay}`)}
            accessibilityRole="button"
            style={({ pressed }) => [styles.card, pressed && { opacity: 0.7 }]}>
            <Photo source={coverPhoto(nextRoutine)} fill={colors.surface2} style={styles.cardPhoto} />
            <View style={styles.cardText}>
              <UI size={14} weight={600} color={colors.muted}>
                {`${DAYS_FULL[nextDay]}, ${shortDate(dateInWeek(weekStart, nextDay))}`}
              </UI>
              <Display size={24} weight={800} lh={1} numberOfLines={2} style={{ marginTop: 4 }}>
                {nextRoutine.name}
              </Display>
              <UI size={14} color={colors.muted} numberOfLines={1} style={{ marginTop: 8 }}>
                {nextRoutine.items.length ? [routineMeta(nextRoutine).list, routineEquipment(nextRoutine)].filter(Boolean).join(' · ') : t('Nothing added yet')}
              </UI>
            </View>
            <UI size={24} color={colors.muted} style={{ paddingRight: 16 }}>
              ›
            </UI>
          </Pressy>
        </Appear>
      )}

      {lastWorkout && (
        <Appear index={4} style={styles.section}>
          <View style={styles.sectionHead}>
            <Display size={32} weight={800}>
              {t('Last workout')}
            </Display>
            <Pressable onPress={() => router.push('/history')} accessibilityRole="button" style={styles.link}>
              <UI size={16} weight={600} color={colors.accent}>
                {t('All workouts')}
              </UI>
            </Pressable>
          </View>
          <Pressy
            onPress={() => router.push({ pathname: '/summary/[id]', params: { id: String(lastWorkout.id), from: 'history' } })}
            accessibilityRole="button"
            style={({ pressed }) => [styles.card, styles.cardPad, pressed && { opacity: 0.7 }]}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <UI size={14} weight={600} color={colors.muted}>
                {fullDate(new Date(lastWorkout.finishedAt))}
              </UI>
              <Display size={24} weight={800} lh={1} numberOfLines={2} style={{ marginTop: 4 }}>
                {lastWorkout.routineName}
              </Display>
              <UI size={14} color={colors.muted} numberOfLines={1} style={{ marginTop: 8 }}>
                {lastWorkout.type === 'cardio'
                  ? t('{min} min of cardio', { min: lastWorkout.minutes })
                  : [
                      plural(lastWorkout.sets, 'set'),
                      timeText(Math.max(1, (lastWorkout.finishedAt - lastWorkout.startedAt) / 60000)),
                      lastWorkout.prs ? plural(lastWorkout.prs, 'record') : null,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
              </UI>
            </View>
            <UI size={24} color={colors.muted}>
              ›
            </UI>
          </Pressy>
        </Appear>
      )}

      {records.length > 0 && (
        <Appear index={5} style={{ paddingTop: 32 }}>
          <Display size={32} weight={800} style={{ paddingHorizontal: 16 }}>
            {t('Recent records')}
          </Display>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.records}>
            {records.map((r) => (
              <Pressable
                key={r.exId}
                onPress={() => router.push(`/exercise/${r.exId}`)}
                accessibilityRole="button"
                style={{ width: 156 }}>
                <ExerciseThumb id={r.exId} size={112} width="100%" radius={16} />
                <UI size={16} weight={600} numberOfLines={1} style={{ marginTop: 8 }}>
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
        </Appear>
      )}

      <Appear index={6} style={styles.bodyWrap}>
        <GoalCard log={body} weight={profile.weight} target={profile.target} today={todayIso} onSave={(kg) => saveBodyWeight(todayIso, kg)} />
      </Appear>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
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
  bodyCardMap: { marginTop: 16, paddingTop: 24, paddingBottom: 24, paddingHorizontal: 16, backgroundColor: colors.surface, borderRadius: 20 },
  focusText: { marginTop: 16 },
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
  baseline: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
});
