import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Hero } from '@/components/Hero';
import { Display, Mono, UI } from '@/components/Txt';
import { PrimaryButton } from '@/components/ui';
import { ExerciseThumb } from '@/components/ExerciseThumb';
import { DAYS_FULL, exercise } from '@/data/catalog';
import { BodyPair, RoutineFigure } from '@/components/BodyMap';
import * as repo from '@/data/repo';
import { dateInWeek, shortDate, weekStartOf } from '@/domain/dates';
import { fmt } from '@/domain/format';
import { routineStretch, routineWarmup } from '@/domain/mobility';
import { routineMeta, schemeText } from '@/domain/plan';
import type { TimedItem } from '@/domain/types';
import { canStart } from '@/domain/session';
import { useActive, useDbQuery, useStore } from '@/state/store';
import { colors } from '@/theme/tokens';
import { t } from '@/i18n';

/** One day of the plan: cover, exercise list and the start button. */
export default function DayDetail() {
  const { d } = useLocalSearchParams<{ d: string }>();
  const day = Math.min(6, Math.max(0, Number(d) || 0));
  const { profile, session } = useActive();
  const { startWorkout } = useStore();
  const insets = useSafeAreaInsets();

  const plan = profile.plan;
  const weekStart = weekStartOf(new Date());
  const key = plan.days[day];
  const r = key ? plan.routines[key] : null;
  const cardio = r?.type === 'cardio';
  const items: { ex: string }[] = r?.items ?? [];

  const done = useDbQuery((db) => repo.doneDays(db, profile.id, weekStart), [profile.id, weekStart]) ?? [];
  const history = useDbQuery(
    async (db) => {
      const ids = items.map((it) => it.ex);
      if (cardio) {
        const out: Record<string, number> = {};
        for (const id of ids) {
          const last = await repo.lastCardio(db, profile.id, id);
          if (last) out[id] = last.value;
        }
        return out;
      }
      return repo.lastKg(db, profile.id, ids);
    },
    [profile.id, key, items.map((it) => it.ex).join(',')],
  );

  const back = () => router.back();
  const dateLabel = shortDate(dateInWeek(weekStart, day));

  if (!key || !r) {
    // A day that has become a rest day (plan changed while this screen was open).
    return (
      <View style={styles.screen}>
        <ScrollView style={{ flex: 1 }}>
          <DayHero art={<BodyPair primary={[]} secondary={[]} height={200} />} onBack={back}>
            <UI size={16} weight={600}>
              {DAYS_FULL[day]}
            </UI>
            <Display size={56} weight={900} lh={0.9} style={{ marginTop: 8 }}>
              {t('Rest day')}
            </Display>
          </DayHero>
          <View style={styles.list}>
            <EditLink label={t('Edit this routine')} onPress={() => router.push('/plan')} />
          </View>
        </ScrollView>
        <Footer bottom={insets.bottom}>
          <PrimaryButton label={t('BACK')} onPress={back} />
        </Footer>
      </View>
    );
  }

  const running = !!session && session.day === day && session.weekStart === weekStart;
  const startable = canStart(plan, day);
  const startLabel = running ? t('CONTINUE WORKOUT') : done.includes(day) ? t('LOG AGAIN') : t('START WORKOUT');
  const start = async () => {
    if (!startable) return;
    if (await startWorkout(day)) router.push('/log');
  };

  return (
    <View style={styles.screen}>
      <ScrollView style={{ flex: 1 }}>
        <DayHero art={<RoutineFigure routine={r} height={200} />} onBack={back}>
          <UI size={16} weight={600} color={colors.accent}>{`${DAYS_FULL[day]}, ${dateLabel}`}</UI>
          <Display size={56} weight={900} lh={0.9} style={{ marginTop: 8 }}>
            {r.name}
          </Display>
          <UI size={16} style={{ marginTop: 8, opacity: 0.8 }}>
            {routineMeta(r).long}
          </UI>
        </DayHero>

        <View style={styles.list}>
          <MobilityLine label={t('Warm-up')} items={routineWarmup(r)} />
          {r.type === 'cardio'
            ? r.items.map((it, i) => {
                const e = exercise(it.ex);
                const last = history?.[it.ex];
                return (
                  <ItemRow
                    key={i}
                    exId={it.ex}
                    name={e.name}
                    last={last != null ? t('Zone {zone}, last time {value}', { zone: it.zone, value: `${fmt(last)} ${t(e.unit ?? '')}` }) : t('Zone {zone}', { zone: it.zone })}
                    scheme={`${it.min} min`}
                  />
                );
              })
            : r.items.map((it, i) => {
                const e = exercise(it.ex);
                const last = history?.[it.ex];
                const line = e.bodyweight ? t('Body weight') : last != null ? t('Last time {kg} kg', { kg: fmt(last) }) : null;
                return <ItemRow key={i} exId={it.ex} name={e.name} last={line} scheme={schemeText(it)} />;
              })}
          <MobilityLine label={t('Stretching')} items={routineStretch(r)} />
          <EditLink label={t('Edit this routine')} onPress={() => router.push(`/routine/${key}`)} />
        </View>
      </ScrollView>
      <Footer bottom={insets.bottom}>
        {/* An empty routine has nothing to log: the button stays dimmed until exercises are added. */}
        <PrimaryButton label={startLabel} onPress={start} dimmed={!startable} />
      </Footer>
    </View>
  );
}

function DayHero({ art, onBack, children }: { art: React.ReactNode; onBack: () => void; children: React.ReactNode }) {
  return (
    <Hero source={null} art={art} cardHeight={240} onBack={onBack} caption={children} />
  );
}

function ItemRow({ exId, name, last, scheme }: { exId: string; name: string; last: string | null; scheme: string }) {
  return (
    <Pressable onPress={() => router.push(`/exercise/${exId}`)} accessibilityRole="button" style={styles.row}>
      <ExerciseThumb id={exId} size={54} radius={12} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <UI size={20} weight={600}>
          {name}
        </UI>
        {last != null && (
          <UI size={14} color={colors.muted} style={{ marginTop: 4 }}>
            {last}
          </UI>
        )}
      </View>
      <Mono size={16} weight={500}>
        {scheme}
      </Mono>
    </Pressable>
  );
}

/** Warm-up or stretching as one quiet row: label, then the moves and their times. */
function MobilityLine({ label, items }: { label: string; items: TimedItem[] }) {
  if (!items.length) return null;
  return (
    <View style={styles.mobility}>
      <UI size={14} weight={600} color={colors.accent}>
        {label}
      </UI>
      <UI size={14} color={colors.muted} style={{ marginTop: 4 }}>
        {items.map((x) => `${exercise(x.ex).name} ${x.sec} s`).join(' · ')}
      </UI>
    </View>
  );
}

function EditLink({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={styles.edit}>
      <UI size={16} weight={600} color={colors.accent}>
        {label}
      </UI>
    </Pressable>
  );
}

function Footer({ bottom, children }: { bottom: number; children: React.ReactNode }) {
  return <View style={{ paddingTop: 8, paddingHorizontal: 16, paddingBottom: 16 + bottom }}>{children}</View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  list: { paddingTop: 16, paddingHorizontal: 16, paddingBottom: 24 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  thumb: { width: 54, height: 54, borderRadius: 12 },
  mobility: { paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.line },
  edit: { height: 48, marginTop: 8, justifyContent: 'center', alignSelf: 'flex-start' },
});
