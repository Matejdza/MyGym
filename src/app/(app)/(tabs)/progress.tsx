import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';

import { LineChart } from '@/components/LineChart';
import { Display, Mono, UI } from '@/components/Txt';
import { RoundButton } from '@/components/ui';
import { exercise } from '@/data/catalog';
import * as repo from '@/data/repo';
import { addDays, isoDate, parseIso, shortDate } from '@/domain/dates';
import { fmt, r2 } from '@/domain/format';
import { sortedKeys } from '@/domain/plan';
import { WEEKS, bodyProgress, cardioProgress, lastWeeks, liftProgress, type ProgressView } from '@/domain/progress';
import { useActive, useDbQuery, useStore } from '@/state/store';
import { useTop } from '@/theme/layout';
import { colors } from '@/theme/tokens';

type Mode = 'lift' | 'cardio' | 'body';
const MODES: [Mode, string][] = [
  ['lift', 'Lifts'],
  ['cardio', 'Cardio'],
  ['body', 'Body weight'],
];

export default function Progress() {
  const params = useLocalSearchParams<{ mode?: string; ex?: string }>();
  const mode: Mode = params.mode === 'cardio' || params.mode === 'body' ? params.mode : 'lift';
  const { profile } = useActive();
  const { saveBodyWeight } = useStore();
  const top = useTop();
  const { width } = useWindowDimensions();
  const chartWidth = width - 20 * 2 - 14 * 2;

  const now = new Date();
  const weeks = lastWeeks(now);
  const fromMs = parseIso(weeks[0]).getTime();
  const today = isoDate(now);

  // Lift chips: every weighted exercise in the plan, plus one opened from its page.
  const ids: string[] = [];
  for (const k of sortedKeys(profile.plan)) {
    const r = profile.plan.routines[k];
    if (r.type === 'cardio') continue;
    for (const it of r.items) if (!exercise(it.ex).bodyweight && !ids.includes(it.ex)) ids.push(it.ex);
  }
  const asked = params.ex;
  if (asked && exercise(asked) && !exercise(asked).kind && !exercise(asked).bodyweight && !ids.includes(asked)) ids.unshift(asked);
  const exId = asked && ids.includes(asked) ? asked : ids[0];

  const view = useDbQuery<{ view: ProgressView | null; title: string; savedToday: boolean }>(
    async (db) => {
      if (mode === 'lift') {
        if (!exId) return { view: null, title: '', savedToday: false };
        const sets = await repo.liftSets(db, profile.id, exId, fromMs);
        return { view: liftProgress(exId, sets, weeks), title: `${exercise(exId).name}, best set`, savedToday: false };
      }
      if (mode === 'cardio') {
        const entries = await repo.cardioEntries(db, profile.id, fromMs);
        return { view: cardioProgress(entries, weeks), title: 'Cardio minutes per week', savedToday: false };
      }
      const log = await repo.bodyLog(db, profile.id);
      return {
        view: bodyProgress(log, profile.target, addDays(today, -WEEKS * 7)),
        title: 'Body weight',
        savedToday: log.some((e) => e.date === today),
      };
    },
    [mode, exId, profile.id, profile.target, today, fromMs],
  );

  // "Today" stepper starts at the current weight.
  const [bwInput, setBwInput] = useState<number | null>(null);
  const bw = bwInput ?? profile.weight;

  const setMode = (m: Mode) => router.setParams({ mode: m });
  const v = view?.view ?? null;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={[styles.content, { paddingTop: top(66) }]}>
      <View style={styles.header}>
        <Display size={52} weight={900} lh={0.9}>
          Progress
        </Display>
        <Pressable onPress={() => router.push('/history')} accessibilityRole="button" style={styles.allBtn}>
          <UI size={15} weight={600} numberOfLines={1}>
            All workouts
          </UI>
        </Pressable>
      </View>
      <View style={styles.segment}>
        {MODES.map(([m, label]) => (
          <Pressable
            key={m}
            onPress={() => setMode(m)}
            accessibilityRole="button"
            accessibilityState={{ selected: m === mode }}
            style={[styles.segBtn, { backgroundColor: m === mode ? colors.accent : 'transparent' }]}>
            <UI size={15} weight={700} color={m === mode ? colors.accentInk : colors.ink}>
              {label}
            </UI>
          </Pressable>
        ))}
      </View>

      {mode === 'lift' && ids.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips} contentContainerStyle={styles.chipsRow}>
          {ids.map((id) => {
            const on = id === exId;
            return (
              <Pressable
                key={id}
                onPress={() => router.setParams({ mode: 'lift', ex: id })}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                style={[styles.chip, { backgroundColor: on ? colors.ink : 'transparent' }]}>
                <UI size={14} weight={600} color={on ? colors.bg : colors.ink}>
                  {exercise(id).name}
                </UI>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      {view && (
        <>
          <UI size={15} color={colors.muted} style={{ marginTop: 24 }}>
            {view.title}
          </UI>
          {v && (
            <>
              <View style={styles.bigRow}>
                <Mono size={60} weight={500} lh={1} spacing={-0.06}>
                  {v.big}
                </Mono>
                <UI size={20} weight={600} color={colors.muted}>
                  {v.unit}
                </UI>
              </View>
              <UI size={15} weight={600} color={colors.green} style={{ marginTop: 8 }}>
                {v.delta}
              </UI>
            </>
          )}
          <View style={styles.card}>
            {v ? (
              <LineChart vals={v.vals} labels={v.labels} width={chartWidth} target={v.target} />
            ) : (
              <View style={[styles.empty, { width: chartWidth }]}>
                <UI size={15} color={colors.muted} align="center">
                  {mode === 'body' ? 'No weight saved yet.' : 'No workouts logged yet.'}
                </UI>
              </View>
            )}
          </View>
        </>
      )}

      {mode === 'body' && (
        <>
          <View style={styles.today}>
            <RoundButton sign="−" size={56} fontSize={24} onPress={() => setBwInput(r2(bw - 0.1))} />
            <View style={{ flex: 1, alignItems: 'center' }}>
              <UI size={13} color={colors.muted}>
                Today
              </UI>
              <Mono size={26} weight={500} spacing={-0.04}>{`${fmt(bw)} kg`}</Mono>
            </View>
            <RoundButton sign="+" size={56} fontSize={24} onPress={() => setBwInput(r2(bw + 0.1))} />
          </View>
          <Pressable
            onPress={() => saveBodyWeight(today, bw)}
            accessibilityRole="button"
            style={({ pressed }) => [styles.save, { backgroundColor: pressed ? colors.press : colors.accent }]}>
            <UI size={16} weight={700} color={colors.accentInk}>
              {view?.savedToday ? `Saved for ${shortDate(now)}. Tap to update` : 'Save for today'}
            </UI>
          </Pressable>
        </>
      )}

      {v && (
        <>
          <Display size={28} weight={800} style={{ marginTop: 28 }}>
            History
          </Display>
          {v.rows.map((r, i) => (
            <View key={i} style={styles.row}>
              <UI size={15} color={colors.muted}>
                {r.k}
              </UI>
              <Mono size={15} weight={500}>
                {r.v}
              </Mono>
            </View>
          ))}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: 20, paddingBottom: 24 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  allBtn: { height: 40, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, borderColor: colors.line, justifyContent: 'center' },
  segment: { flexDirection: 'row', gap: 4, marginTop: 18, padding: 4, borderRadius: 26, backgroundColor: colors.surface },
  segBtn: { flex: 1, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  chips: { marginTop: 14, marginHorizontal: -20 },
  chipsRow: { gap: 6, paddingHorizontal: 20 },
  chip: { height: 40, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, borderColor: colors.line, justifyContent: 'center' },
  bigRow: { flexDirection: 'row', alignItems: 'baseline', gap: 10, marginTop: 6 },
  card: { backgroundColor: colors.surface, borderRadius: 22, paddingTop: 18, paddingHorizontal: 14, paddingBottom: 12, marginTop: 20 },
  empty: { height: 190, alignItems: 'center', justifyContent: 'center' },
  today: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.surface, borderRadius: 22, padding: 12, marginTop: 12 },
  save: { height: 56, marginTop: 10, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
});
