import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PlateBadge } from '@/components/Cover';
import { Photo, Shade, heroStops } from '@/components/Photo';
import { Display, Mono, UI } from '@/components/Txt';
import { BackPill, PrimaryButton } from '@/components/ui';
import { DAYS_FULL, exercise } from '@/data/catalog';
import { coverPhoto, exPhoto } from '@/data/photos';
import * as repo from '@/data/repo';
import { dateInWeek, shortDate, weekStartOf } from '@/domain/dates';
import { fmt } from '@/domain/format';
import { routineMeta } from '@/domain/plan';
import { canStart } from '@/domain/session';
import { useActive, useDbQuery, useStore } from '@/state/store';
import { useTop } from '@/theme/layout';
import { colors } from '@/theme/tokens';

/** One day of the plan: cover, exercise list and the start button. */
export default function DayDetail() {
  const { d } = useLocalSearchParams<{ d: string }>();
  const day = Math.min(6, Math.max(0, Number(d) || 0));
  const { profile, session } = useActive();
  const { startWorkout } = useStore();
  const top = useTop();
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
          <Hero top={top} source={null} onBack={back}>
            <UI size={15} weight={600}>
              {DAYS_FULL[day]}
            </UI>
            <Display size={56} weight={900} lh={0.9} style={{ marginTop: 10 }}>
              Rest day
            </Display>
          </Hero>
          <View style={styles.list}>
            <EditLink label="Edit this routine" onPress={() => router.push('/plan')} />
          </View>
        </ScrollView>
        <Footer bottom={insets.bottom}>
          <PrimaryButton label="BACK" onPress={back} />
        </Footer>
      </View>
    );
  }

  const running = !!session && session.day === day && session.weekStart === weekStart;
  const startable = canStart(plan, day);
  const startLabel = running ? 'CONTINUE WORKOUT' : done.includes(day) ? 'LOG AGAIN' : 'START WORKOUT';
  const start = async () => {
    if (!startable) return;
    if (await startWorkout(day)) router.push('/log');
  };

  return (
    <View style={styles.screen}>
      <ScrollView style={{ flex: 1 }}>
        <Hero top={top} source={coverPhoto(r)} onBack={back}>
          <View style={styles.badgeRow}>
            <PlateBadge routineKey={key} size={28} fontSize={13} />
            <UI size={15} weight={600}>{`${DAYS_FULL[day]}, ${dateLabel}`}</UI>
          </View>
          <Display size={56} weight={900} lh={0.9} style={{ marginTop: 10 }}>
            {r.name}
          </Display>
          <UI size={16} style={{ marginTop: 8, opacity: 0.8 }}>
            {routineMeta(r).long}
          </UI>
        </Hero>

        <View style={styles.list}>
          {r.type === 'cardio'
            ? r.items.map((it, i) => {
                const e = exercise(it.ex);
                const last = history?.[it.ex];
                return (
                  <ItemRow
                    key={i}
                    exId={it.ex}
                    name={e.name}
                    last={last != null ? `Zone ${it.zone}, last time ${fmt(last)} ${e.unit}` : `Zone ${it.zone}`}
                    scheme={`${it.min} min`}
                  />
                );
              })
            : r.items.map((it, i) => {
                const e = exercise(it.ex);
                const last = history?.[it.ex];
                const line = e.bodyweight ? 'Body weight' : last != null ? `Last time ${fmt(last)} kg` : null;
                return <ItemRow key={i} exId={it.ex} name={e.name} last={line} scheme={`${it.sets} × ${it.reps}`} />;
              })}
          <EditLink label="Edit this routine" onPress={() => router.push(`/routine/${key}`)} />
        </View>
      </ScrollView>
      <Footer bottom={insets.bottom}>
        {/* An empty routine has nothing to log: the button stays dimmed until exercises are added. */}
        <PrimaryButton label={startLabel} onPress={start} dimmed={!startable} />
      </Footer>
    </View>
  );
}

function Hero({
  top,
  source,
  onBack,
  children,
}: {
  top: (n: number) => number;
  source: ReturnType<typeof coverPhoto>;
  onBack: () => void;
  children: React.ReactNode;
}) {
  return (
    <View style={{ height: top(330) }}>
      <Photo source={source} style={StyleSheet.absoluteFill} />
      <Shade stops={heroStops(0.7, [0.3, 0.45], 0.96)} />
      <BackPill onPress={onBack} onPhoto style={{ position: 'absolute', top: top(54), left: 16 }} />
      <View style={styles.heroText}>{children}</View>
    </View>
  );
}

function ItemRow({ exId, name, last, scheme }: { exId: string; name: string; last: string | null; scheme: string }) {
  return (
    <Pressable onPress={() => router.push(`/exercise/${exId}`)} accessibilityRole="button" style={styles.row}>
      <Photo source={exPhoto(exId)} style={styles.thumb} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <UI size={17} weight={600}>
          {name}
        </UI>
        {last != null && (
          <UI size={14} color={colors.muted} style={{ marginTop: 3 }}>
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
  return <View style={{ paddingTop: 12, paddingHorizontal: 20, paddingBottom: 14 + bottom }}>{children}</View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  heroText: { position: 'absolute', left: 20, right: 20, bottom: 4 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  list: { paddingTop: 18, paddingHorizontal: 20, paddingBottom: 20 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  thumb: { width: 54, height: 54, borderRadius: 12 },
  edit: { height: 48, marginTop: 8, justifyContent: 'center', alignSelf: 'flex-start' },
});
