import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { confirm } from '@/components/confirm';
import { PlateBadge } from '@/components/Cover';
import { NumberField, type NumberInput } from '@/components/NumberField';
import { Photo } from '@/components/Photo';
import { Mono, UI } from '@/components/Txt';
import { BackPill } from '@/components/ui';
import { ZONES, exercise } from '@/data/catalog';
import { coverPhoto, exPhoto } from '@/data/photos';
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
  withStrengthChange,
  withoutRoutine,
  type StrengthField,
} from '@/domain/plan';
import type { Routine } from '@/domain/types';
import { useActive, useStore } from '@/state/store';
import { useTop } from '@/theme/layout';
import { colors, fonts } from '@/theme/tokens';

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
    if (!(await confirm('Delete this routine?', 'Delete'))) return;
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
      <View style={styles.metaRow}>
        <PlateBadge routineKey={id} size={28} fontSize={13} />
        <UI size={15} color={colors.muted} style={{ flex: 1 }}>{`Routine ${id}, ${routineMeta(r).text}`}</UI>
      </View>
      <TextInput
        value={r.name}
        onChangeText={(name) => save({ ...r, name })}
        autoCorrect={false}
        returnKeyType="done"
        maxFontSizeMultiplier={1.2}
        accessibilityLabel="Routine name"
        style={styles.name}
      />

      <View style={styles.items}>
        {r.type === 'cardio'
          ? r.items.map((it, i) => (
              <ItemCard
                key={i}
                exId={it.ex}
                summary={`${it.min} min, zone ${it.zone}`}
                open={open === i}
                onToggle={() => setOpen(open === i ? null : i)}
                onRemove={() => remove(i)}
                onMove={(dir) => move(i, dir)}
                first={i === 0}
                last={i === r.items.length - 1}>
                <View style={styles.pair}>
                  <Pill
                    label="minutes"
                    value={String(it.min)}
                    onDec={() => changeCardio(i, 'min', -5)}
                    onInc={() => changeCardio(i, 'min', 5)}
                    input={cardioInput(i, 'min', it.min, 5, 240)}
                  />
                  <Pill
                    label="zone"
                    value={String(it.zone)}
                    onDec={() => changeCardio(i, 'zone', -1)}
                    onInc={() => changeCardio(i, 'zone', 1)}
                    input={cardioInput(i, 'zone', it.zone, 1, 5)}
                  />
                </View>
                <UI size={14} color={colors.muted} style={{ marginTop: 8, paddingLeft: 4 }}>
                  {`Zone ${it.zone}: ${ZONES[it.zone]}`}
                </UI>
              </ItemCard>
            ))
          : r.items.map((it, i) => (
              <ItemCard
                key={i}
                exId={it.ex}
                summary={`${it.sets} × ${repsText(it)}, rest ${restText(it.rest ?? settings.restSeconds)}`}
                open={open === i}
                onToggle={() => setOpen(open === i ? null : i)}
                onRemove={() => remove(i)}
                onMove={(dir) => move(i, dir)}
                first={i === 0}
                last={i === r.items.length - 1}>
                <View style={styles.pair}>
                  <Pill
                    label="sets"
                    value={String(it.sets)}
                    onDec={() => changeStrength(i, 'sets', -1)}
                    onInc={() => changeStrength(i, 'sets', 1)}
                    input={strengthInput(i, 'sets', it.sets, { min: 1, max: 20 })}
                  />
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
                    label="up to"
                    value={String(it.repsMax ?? it.reps)}
                    onDec={() => changeStrength(i, 'repsMax', -repsStep(it.ex))}
                    onInc={() => changeStrength(i, 'repsMax', repsStep(it.ex))}
                    input={strengthInput(i, 'repsMax', it.repsMax ?? it.reps, { min: it.reps, max: maxReps(it.ex) })}
                  />
                  <Pill
                    label="rest"
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
          {cardio ? 'Add activity' : 'Add exercise'}
        </UI>
      </Pressable>

      <Pressable onPress={deleteRoutine} accessibilityRole="button" style={styles.delete}>
        <UI size={15} weight={600} color={colors.red}>
          Delete routine
        </UI>
      </Pressable>
    </ScrollView>
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
        <Photo source={exPhoto(exId)} fill={colors.surface2} style={styles.thumb} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <UI size={16} weight={600} numberOfLines={1}>
            {name}
          </UI>
          <Mono size={15} color={colors.muted} numberOfLines={1} style={{ marginTop: 4 }}>
            {summary}
          </Mono>
        </View>
        <UI size={15} weight={600} color={open ? colors.muted : colors.accent}>
          {open ? 'Done' : 'Edit'}
        </UI>
      </Pressable>
      {open && (
        <>
          {children}
          <View style={styles.actions}>
            <MoveButton label="↑" hint="Move up" disabled={first} onPress={() => onMove(-1)} />
            <MoveButton label="↓" hint="Move down" disabled={last} onPress={() => onMove(1)} />
            <View style={{ flex: 1 }} />
            <Pressable onPress={onRemove} accessibilityRole="button" style={styles.remove}>
              <UI size={15} weight={600} color={colors.red}>
                Remove
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
      <Pressable onPress={onDec} accessibilityRole="button" accessibilityLabel={`Fewer ${label}`} style={styles.pillBtn}>
        <Mono size={20}>−</Mono>
      </Pressable>
      <View style={{ flex: 1, minWidth: 0, alignItems: 'center' }}>
        <UI size={11} lh={1.1} color={error ? colors.red : colors.muted} numberOfLines={1}>
          {error ?? label}
        </UI>
        <NumberField input={input} display={value} size={18} label={label} onError={setError} />
      </View>
      <Pressable onPress={onInc} accessibilityRole="button" accessibilityLabel={`More ${label}`} style={styles.pillBtn}>
        <Mono size={20}>+</Mono>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: 16, paddingBottom: 32 },
  cover: { height: 150, borderRadius: 22, marginTop: 16 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16 },
  name: {
    marginTop: 8,
    borderBottomWidth: 2,
    borderBottomColor: colors.line,
    color: colors.ink,
    fontFamily: fonts.display900,
    fontSize: 44,
    textTransform: 'uppercase',
    paddingTop: 4,
    paddingBottom: 8,
    paddingHorizontal: 0,
  },
  items: { gap: 8, marginTop: 16 },
  card: { backgroundColor: colors.surface, borderRadius: 20, padding: 16, borderWidth: 1.5, borderColor: 'transparent' },
  cardOpen: { borderColor: colors.border },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16 },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  thumb: { width: 44, height: 44, borderRadius: 11 },
  remove: { height: 44, paddingHorizontal: 8, justifyContent: 'center' },
  moveBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center' },
  delete: { height: 48, marginTop: 8, alignItems: 'center', justifyContent: 'center' },
  pair: { flexDirection: 'row', gap: 8, marginTop: 16 },
  pill: { flex: 1, flexDirection: 'row', alignItems: 'center', height: 50, borderRadius: 25, backgroundColor: colors.surface2 },
  pillBtn: { width: 46, height: 50, alignItems: 'center', justifyContent: 'center' },
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
