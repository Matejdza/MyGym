import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { confirm } from '@/components/confirm';
import { NumberField, type NumberInput } from '@/components/NumberField';
import { Photo } from '@/components/Photo';
import { Mono, UI } from '@/components/Txt';
import { BackPill } from '@/components/ui';
import { ExerciseThumb } from '@/components/ExerciseThumb';
import { ZONES, exercise } from '@/data/catalog';
import { coverPhoto } from '@/data/photos';
import { routineStretch, routineWarmup } from '@/domain/mobility';
import {
  REST_MAX,
  REST_MIN,
  REST_STEP,
  maxReps,
  repsStep,
  repsText,
  repsUnit,
  restText,
  routineMeta,
  withItemMoved,
  withMobility,
  withStrengthChange,
  withoutRoutine,
  type StrengthField,
} from '@/domain/plan';
import type { Routine, TimedItem } from '@/domain/types';
import { useActive, useStore } from '@/state/store';
import { useTop } from '@/theme/layout';
import { colors, fonts } from '@/theme/tokens';
import { t } from '@/i18n';

/**
 * Rename a routine; change sets, rep range and rest (or minutes and zone);
 * reorder, remove and add items; delete the routine.
 * Each item is one line ("4 × 6–8, rest 2:30"); tapping it opens its controls,
 * one item at a time, so the list stays short enough to scan.
 */
export default function RoutineEditor() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profile, settings } = useActive();
  const { setPlan } = useStore();
  const top = useTop();
  const plan = profile.plan;
  const r = id ? plan.routines[id] : undefined;
  /** Index of the item whose controls are open, or null. */
  const [open, setOpen] = useState<number | null>(null);

  const save = (next: Routine) => setPlan({ ...plan, routines: { ...plan.routines, [id]: next } });

  if (!r) {
    return (
      <View style={[styles.screen, { paddingTop: top(58), paddingHorizontal: 16 }]}>
        <BackPill onPress={() => router.back()} style={{ alignSelf: 'flex-start' }} />
      </View>
    );
  }

  const cardio = r.type === 'cardio';

  /** Cardio steppers with the prototype's limits: minutes ≥ 5 (±5), zone 1–5. */
  const changeCardio = (i: number, f: 'min' | 'zone', d: number) => {
    if (r.type !== 'cardio') return;
    const items = r.items.map((it, j) => {
      if (j !== i) return it;
      if (f === 'min') return { ...it, min: Math.max(5, it.min + d) };
      return { ...it, zone: Math.min(5, Math.max(1, it.zone + d)) };
    });
    save({ ...r, items });
  };

  const changeStrength = (i: number, f: StrengthField, d: number) => {
    if (r.type === 'cardio') return;
    save({ ...r, items: r.items.map((it, j) => (j !== i ? it : withStrengthChange(it, f, d, settings.restSeconds))) });
  };

  // Typed values go through the same rules as the steppers, as one step of (typed − current).
  const strengthInput = (i: number, f: StrengthField, current: number, spec: Omit<NumberInput, 'value' | 'onSet'>): NumberInput => ({
    ...spec,
    value: current,
    onSet: (v) => changeStrength(i, f, v - current),
  });
  const cardioInput = (i: number, f: 'min' | 'zone', current: number, min: number, max: number): NumberInput => ({
    min,
    max,
    value: current,
    onSet: (v) => changeCardio(i, f, v - current),
  });

  const move = (i: number, dir: -1 | 1) => {
    save(withItemMoved(r, i, dir));
    setOpen(i + dir);
  };

  const deleteRoutine = async () => {
    if (!(await confirm(t('Delete this routine?'), t('Delete'), undefined, true))) return;
    router.back();
    setPlan(withoutRoutine(plan, id));
  };

  const remove = (i: number) => {
    setOpen(null);
    save(r.type === 'cardio' ? { ...r, items: r.items.filter((_, j) => j !== i) } : { ...r, items: r.items.filter((_, j) => j !== i) });
  };

  const add = () => {
    if (cardio) router.push({ pathname: '/group/[k]', params: { k: 'cardio', pick: id } });
    else router.push(`/pick/${id}`);
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={[styles.content, { paddingTop: top(58) }]} keyboardShouldPersistTaps="handled">
      <BackPill onPress={() => router.back()} style={{ alignSelf: 'flex-start' }} />
      <Photo source={coverPhoto(r, true)} style={styles.cover} />
      <UI size={16} color={colors.muted} style={styles.meta}>
        {routineMeta(r).text}
      </UI>
      <TextInput
        value={r.name}
        onChangeText={(name) => save({ ...r, name })}
        autoCorrect={false}
        returnKeyType="done"
        maxFontSizeMultiplier={1.2}
        accessibilityLabel={t('Routine name')}
        style={styles.name}
      />

      <MobilityEditor
        title={t('Warm-up')}
        items={routineWarmup(r)}
        onChange={(fn) => setPlan(withMobility(plan, id, 'warmup', fn))}
        onAdd={() => router.push({ pathname: '/group/[k]', params: { k: 'mobility', pick: id, slot: 'warmup' } })}
      />

      <View style={styles.items}>
        {r.type === 'cardio'
          ? r.items.map((it, i) => (
              <ItemCard
                key={i}
                exId={it.ex}
                summary={t('{min} min, zone {zone}', { min: it.min, zone: it.zone })}
                open={open === i}
                onToggle={() => setOpen(open === i ? null : i)}
                onRemove={() => remove(i)}
                onMove={(dir) => move(i, dir)}
                first={i === 0}
                last={i === r.items.length - 1}>
                <View style={styles.pair}>
                  <Pill
                    label={t('minutes')}
                    value={String(it.min)}
                    onDec={() => changeCardio(i, 'min', -5)}
                    onInc={() => changeCardio(i, 'min', 5)}
                    input={cardioInput(i, 'min', it.min, 5, 240)}
                  />
                  <View style={styles.divider} />
                  <Pill
                    label={t('zone')}
                    value={String(it.zone)}
                    onDec={() => changeCardio(i, 'zone', -1)}
                    onInc={() => changeCardio(i, 'zone', 1)}
                    input={cardioInput(i, 'zone', it.zone, 1, 5)}
                  />
                </View>
                <UI size={14} color={colors.muted} style={{ marginTop: 8, paddingLeft: 4 }}>
                  {`${t('Zone {zone}', { zone: it.zone })}: ${ZONES[it.zone]}`}
                </UI>
              </ItemCard>
            ))
          : r.items.map((it, i) => (
              <ItemCard
                key={i}
                exId={it.ex}
                summary={t('{scheme}, rest {rest}', { scheme: `${it.sets} × ${repsText(it)}`, rest: restText(it.rest ?? settings.restSeconds) })}
                open={open === i}
                onToggle={() => setOpen(open === i ? null : i)}
                onRemove={() => remove(i)}
                onMove={(dir) => move(i, dir)}
                first={i === 0}
                last={i === r.items.length - 1}>
                <View style={styles.pair}>
                  <Pill
                    label={t('sets')}
                    value={String(it.sets)}
                    onDec={() => changeStrength(i, 'sets', -1)}
                    onInc={() => changeStrength(i, 'sets', 1)}
                    input={strengthInput(i, 'sets', it.sets, { min: 1, max: 20 })}
                  />
                  <View style={styles.divider} />
                  <Pill
                    label={repsUnit(it.ex)}
                    value={String(it.reps)}
                    onDec={() => changeStrength(i, 'reps', -repsStep(it.ex))}
                    onInc={() => changeStrength(i, 'reps', repsStep(it.ex))}
                    input={strengthInput(i, 'reps', it.reps, { min: 1, max: maxReps(it.ex) })}
                  />
                </View>
                <View style={styles.pair}>
                  {/* "up to" turns the reps into a range (6–8); equal to reps means a single number. */}
                  <Pill
                    label={t('up to')}
                    value={String(it.repsMax ?? it.reps)}
                    onDec={() => changeStrength(i, 'repsMax', -repsStep(it.ex))}
                    onInc={() => changeStrength(i, 'repsMax', repsStep(it.ex))}
                    input={strengthInput(i, 'repsMax', it.repsMax ?? it.reps, { min: it.reps, max: maxReps(it.ex) })}
                  />
                  <View style={styles.divider} />
                  <Pill
                    label={t('rest')}
                    value={restText(it.rest ?? settings.restSeconds)}
                    onDec={() => changeStrength(i, 'rest', -REST_STEP)}
                    onInc={() => changeStrength(i, 'rest', REST_STEP)}
                    input={strengthInput(i, 'rest', it.rest ?? settings.restSeconds, { min: REST_MIN, max: REST_MAX, kind: 'duration' })}
                  />
                </View>
              </ItemCard>
            ))}
      </View>

      <Pressable onPress={add} accessibilityRole="button" style={styles.add}>
        <UI size={16} weight={700}>
          {cardio ? t('Add activity') : t('Add exercise')}
        </UI>
      </Pressable>

      <MobilityEditor
        title={t('Stretching')}
        items={routineStretch(r)}
        onChange={(fn) => setPlan(withMobility(plan, id, 'stretch', fn))}
        onAdd={() => router.push({ pathname: '/group/[k]', params: { k: 'mobility', pick: id, slot: 'stretch' } })}
      />

      <Pressable onPress={deleteRoutine} accessibilityRole="button" style={styles.delete}>
        <UI size={16} weight={600} color={colors.red}>
          {t('Delete routine')}
        </UI>
      </Pressable>
    </ScrollView>
  );
}

/** Warm-up or stretching list: each move with its time (− / + by 15 s) and Remove; Add opens the moves. */
function MobilityEditor({
  title,
  items,
  onChange,
  onAdd,
}: {
  title: string;
  items: TimedItem[];
  onChange: (fn: (l: TimedItem[]) => TimedItem[]) => void;
  onAdd: () => void;
}) {
  const setSec = (i: number, d: number) => onChange((l) => l.map((x, j) => (j === i ? { ...x, sec: Math.min(600, Math.max(15, x.sec + d)) } : x)));
  return (
    <View style={styles.mobility}>
      <View style={styles.mobilityHead}>
        <UI size={16} weight={700} style={{ flex: 1 }}>
          {title}
        </UI>
        <Pressable onPress={onAdd} accessibilityRole="button" style={styles.remove}>
          <UI size={16} weight={600} color={colors.accent}>
            {t('Add')}
          </UI>
        </Pressable>
      </View>
      {items.map((x, i) => (
        <View key={x.ex} style={[styles.mobilityRow, i > 0 && styles.mobilityLine]}>
          <ExerciseThumb id={x.ex} size={36} radius={9} />
          <UI size={16} weight={600} numberOfLines={2} style={{ flex: 1, minWidth: 0 }}>
            {exercise(x.ex).name}
          </UI>
          <Pressable onPress={() => setSec(i, -15)} accessibilityRole="button" accessibilityLabel={t('Decrease')} style={styles.secBtn}>
            <Mono size={20}>−</Mono>
          </Pressable>
          <Mono size={16} weight={500} style={{ width: 48, textAlign: 'center' }}>{`${x.sec} s`}</Mono>
          <Pressable onPress={() => setSec(i, 15)} accessibilityRole="button" accessibilityLabel={t('Increase')} style={styles.secBtn}>
            <Mono size={20}>+</Mono>
          </Pressable>
          <Pressable
            onPress={() => onChange((l) => l.filter((_, j) => j !== i))}
            accessibilityRole="button"
            accessibilityLabel={t('Remove')}
            style={styles.secBtn}>
            <UI size={20} color={colors.red}>
              ×
            </UI>
          </Pressable>
        </View>
      ))}
      {!items.length && (
        <UI size={14} color={colors.muted} style={{ marginTop: 8 }}>
          {t('None. Tap Add to pick moves.')}
        </UI>
      )}
    </View>
  );
}

function ItemCard({
  exId,
  summary,
  open,
  onToggle,
  onRemove,
  onMove,
  first,
  last,
  children,
}: {
  exId: string;
  /** The item on one line, e.g. "4 × 6–8, rest 2:30". */
  summary: string;
  open: boolean;
  onToggle: () => void;
  onRemove: () => void;
  onMove: (dir: -1 | 1) => void;
  first: boolean;
  last: boolean;
  children: React.ReactNode;
}) {
  const name = exercise(exId)?.name ?? exId;
  return (
    <View style={[styles.card, open && styles.cardOpen]}>
      <Pressable
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityLabel={`${name}, ${summary}`}
        accessibilityState={{ expanded: open }}
        style={({ pressed }) => [styles.cardHead, pressed && { opacity: 0.6 }]}>
        <ExerciseThumb id={exId} size={44} radius={11} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <UI size={16} weight={600} numberOfLines={1}>
            {name}
          </UI>
          <Mono size={16} color={colors.muted} numberOfLines={1} style={{ marginTop: 4 }}>
            {summary}
          </Mono>
        </View>
        <UI size={16} weight={600} color={open ? colors.muted : colors.accent}>
          {open ? t('Done') : t('Edit')}
        </UI>
      </Pressable>
      {open && (
        <>
          {children}
          <View style={styles.actions}>
            <MoveButton label="↑" hint={t('Move up')} disabled={first} onPress={() => onMove(-1)} />
            <MoveButton label="↓" hint={t('Move down')} disabled={last} onPress={() => onMove(1)} />
            <View style={{ flex: 1 }} />
            <Pressable onPress={onRemove} accessibilityRole="button" style={styles.remove}>
              <UI size={16} weight={600} color={colors.red}>
                {t('Remove')}
              </UI>
            </Pressable>
          </View>
        </>
      )}
    </View>
  );
}

/** Small round arrow that moves an item up or down; dimmed at the ends of the list. */
function MoveButton({ label, hint, disabled, onPress }: { label: string; hint: string; disabled: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={hint}
      accessibilityState={{ disabled }}
      style={[styles.moveBtn, { opacity: disabled ? 0.3 : 1 }]}>
      <UI size={16} weight={700}>
        {label}
      </UI>
    </Pressable>
  );
}

/** − label/value + pill (50 h). */
function Pill({
  label,
  value,
  onDec,
  onInc,
  input,
}: {
  label: string;
  value: string;
  onDec: () => void;
  onInc: () => void;
  input: NumberInput;
}) {
  const [error, setError] = useState<string | null>(null);
  return (
    <View style={styles.pill}>
      <Pressable onPress={onDec} accessibilityRole="button" accessibilityLabel={t('Fewer {what}', { what: label })} style={({ pressed }) => [styles.pillBtn, styles.noOutline, pressed && { backgroundColor: colors.surface2 }]}>
        <Mono size={20}>−</Mono>
      </Pressable>
      <View style={{ flex: 1, minWidth: 0, alignItems: 'center' }}>
        <UI size={14} lh={1.1} color={error ? colors.red : colors.muted} numberOfLines={1}>
          {error ?? label}
        </UI>
        <NumberField input={input} display={value} size={20} label={label} onError={setError} />
      </View>
      <Pressable onPress={onInc} accessibilityRole="button" accessibilityLabel={t('More {what}', { what: label })} style={({ pressed }) => [styles.pillBtn, styles.noOutline, pressed && { backgroundColor: colors.surface2 }]}>
        <Mono size={20}>+</Mono>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: 16, paddingBottom: 32 },
  cover: { height: 150, borderRadius: 22, marginTop: 16 },
  meta: { marginTop: 16 },
  name: {
    marginTop: 8,
    borderBottomWidth: 2,
    borderBottomColor: colors.line,
    color: colors.ink,
    fontFamily: fonts.display900,
    fontSize: 40,
    textTransform: 'uppercase',
    paddingTop: 4,
    paddingBottom: 8,
    paddingHorizontal: 0,
  },
  items: { gap: 8, marginTop: 16 },
  mobility: { marginTop: 16, backgroundColor: colors.surface, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8 },
  mobilityHead: { flexDirection: 'row', alignItems: 'center' },
  mobilityRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 },
  mobilityLine: { borderTopWidth: 1, borderTopColor: colors.line },
  secBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  card: { backgroundColor: colors.surface, borderRadius: 20, padding: 16, borderWidth: 1.5, borderColor: 'transparent' },
  cardOpen: { borderColor: colors.border },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16 },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  thumb: { width: 44, height: 44, borderRadius: 11 },
  remove: { height: 44, paddingHorizontal: 8, justifyContent: 'center' },
  moveBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center' },
  delete: { height: 48, marginTop: 8, alignItems: 'center', justifyContent: 'center' },
  pair: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16 },
  /** Thin line between the two steppers of a row (no pill backgrounds). */
  divider: { width: 1, height: 32, backgroundColor: colors.line },
  pill: { flex: 1, flexDirection: 'row', alignItems: 'center', height: 50 },
  pillBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  /** No browser focus box on the − / + taps; pressed shows a soft circle instead. */
  noOutline: { outlineStyle: 'none' } as never,
  add: {
    height: 56,
    marginTop: 16,
    borderRadius: 28,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
