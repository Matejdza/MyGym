import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';

import { LineChart } from '@/components/LineChart';
import { NumberField } from '@/components/NumberField';
import { Overview } from '@/components/Overview';
import { Display, Mono, UI } from '@/components/Txt';
import { RoundButton } from '@/components/ui';
import { exercise } from '@/data/catalog';
import { BODY_LIMITS } from '@/domain/numberEntry';
import * as repo from '@/data/repo';
import { addDays, isoDate, parseIso, shortDate } from '@/domain/dates';
import { fmt, r2 } from '@/domain/format';
import { sortedKeys } from '@/domain/plan';
import { WEEKS, bodyProgress, cardioProgress, lastWeeks, liftProgress, type ProgressView } from '@/domain/progress';
import { useActive, useDbQuery, useStore } from '@/state/store';
import { useTop } from '@/theme/layout';
import { colors } from '@/theme/tokens';
import { t } from '@/i18n';

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
        return { view: liftProgress(exId, sets, weeks), title: t('{name}, best set', { name: exercise(exId).name }), savedToday: false };
      }
      if (mode === 'cardio') {
        const entries = await repo.cardioEntries(db, profile.id, fromMs);
        return { view: cardioProgress(entries, weeks), title: t('Cardio minutes per week'), savedToday: false };
      }
      const log = await repo.bodyLog(db, profile.id);
      return {
        view: bodyProgress(log, profile.target, addDays(today, -WEEKS * 7)),
        title: t('Body weight'),
        savedToday: log.some((e) => e.date === today),
      };
    },
    [mode, exId, profile.id, profile.target, today, fromMs],
  );

  // "Today" stepper starts at the current weight.
  const [bwInput, setBwInput] = useState<number | null>(null);
  const [bwError, setBwError] = useState<string | null>(null);
  const bw = bwInput ?? profile.weight;

  const setMode = (m: Mode) => router.setParams({ mode: m });
  const v = view?.view ?? null;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={[styles.content, { paddingTop: top(66) }]}>
      <View style={styles.header}>
        <Display size={56} weight={900} lh={0.9}>
          {t('Progress')}
        </Display>
        <Pressable onPress={() => router.push('/history')} accessibilityRole="button" style={styles.allBtn}>
          <UI size={16} weight={600} numberOfLines={1}>
            {t('All workouts')}
          </UI>
        </Pressable>
      </View>

      <View style={{ marginTop: 24 }}>
        <Overview profileId={profile.id} plan={profile.plan} createdAt={profile.createdAt} />
      </View>

      <Display size={32} weight={800} style={{ marginTop: 48 }}>
        {t('Trends')}
      </Display>
      <View style={styles.segment}>
        {MODES.map(([m, label]) => (
          <Pressable
            key={m}
            onPress={() => setMode(m)}
            accessibilityRole="button"
            accessibilityState={{ selected: m === mode }}
            style={[styles.segBtn, { backgroundColor: m === mode ? colors.ink : 'transparent' }]}>
            <UI size={16} weight={700} color={m === mode ? colors.bg : colors.ink}>
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
          <UI size={16} color={colors.muted} style={{ marginTop: 24 }}>
            {view.title}
          </UI>
          {v && (
            <>
              <View style={styles.bigRow}>
                <Mono size={56} weight={500} lh={1} spacing={-0.06}>
                  {v.big}
                </Mono>
                <UI size={20} weight={600} color={colors.muted}>
                  {v.unit}
                </UI>
              </View>
              {/* Green only for an actual change; "first entry" and "no change" stay quiet. */}
              <UI size={16} weight={600} color={/^(First|No change)/.test(v.delta) ? colors.muted : colors.green} style={{ marginTop: 8 }}>
                {v.delta}
              </UI>
            </>
          )}
          <View style={styles.card}>
            {v ? (
              <LineChart vals={v.vals} labels={v.labels} width={chartWidth} target={v.target} />
            ) : (
              <View style={[styles.empty, { width: chartWidth }]}>
                <UI size={16} color={colors.muted} align="center">
                  {mode === 'body' ? t('No weight saved yet.') : t('No workouts logged yet.')}
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
              <UI size={14} color={bwError ? colors.red : colors.muted}>
                {bwError ?? t('Today, kg')}
              </UI>
              <NumberField
                input={{ ...BODY_LIMITS.weight, value: bw, onSet: setBwInput }}
                display={fmt(bw)}
                size={24}
                label={t('Today\'s body weight in kg')}
                onError={setBwError}
              />
            </View>
            <RoundButton sign="+" size={56} fontSize={24} onPress={() => setBwInput(r2(bw + 0.1))} />
          </View>
          <Pressable
            onPress={() => saveBodyWeight(today, bw)}
            accessibilityRole="button"
            style={({ pressed }) => [styles.save, { backgroundColor: pressed ? colors.press : colors.accentFill }]}>
            <UI size={16} weight={700} color={colors.accentInk}>
              {view?.savedToday ? t('Saved for {date}. Tap to update', { date: shortDate(now) }) : t('Save for today')}
            </UI>
          </Pressable>
        </>
      )}

      {v && (
        <>
          <Display size={32} weight={800} style={{ marginTop: 32 }}>
            {t('History')}
          </Display>
          {v.rows.map((r, i) => (
            <View key={i} style={styles.row}>
              <UI size={16} color={colors.muted}>
                {r.k}
              </UI>
              <Mono size={16} weight={500}>
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
  content: { paddingHorizontal: 16, paddingBottom: 24 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  allBtn: { height: 40, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, borderColor: colors.line, justifyContent: 'center' },
  segment: { flexDirection: 'row', gap: 4, marginTop: 16, padding: 4, borderRadius: 26, backgroundColor: colors.surface },
  segBtn: { flex: 1, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  chips: { marginTop: 16, marginHorizontal: -20 },
  chipsRow: { gap: 8, paddingHorizontal: 16 },
  chip: { height: 40, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, borderColor: colors.line, justifyContent: 'center' },
  bigRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 8 },
  card: { backgroundColor: colors.surface, borderRadius: 22, paddingTop: 16, paddingHorizontal: 16, paddingBottom: 16, marginTop: 24 },
  empty: { height: 190, alignItems: 'center', justifyContent: 'center' },
  today: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.surface, borderRadius: 22, padding: 16, marginTop: 16 },
  save: { height: 56, marginTop: 8, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: 8,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
});
