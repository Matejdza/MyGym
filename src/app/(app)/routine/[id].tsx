import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { confirm } from '@/components/confirm';
import { PlateBadge } from '@/components/Cover';
import { Photo } from '@/components/Photo';
import { Mono, UI } from '@/components/Txt';
import { BackPill } from '@/components/ui';
import { ZONES, exercise } from '@/data/catalog';
import { coverPhoto, exPhoto } from '@/data/photos';
import {
  REST_STEP,
  repsText,
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
 */
export default function RoutineEditor() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profile, settings } = useActive();
  const { setPlan } = useStore();
  const top = useTop();
  const plan = profile.plan;
  const r = id ? plan.routines[id] : undefined;

  const save = (next: Routine) => setPlan({ ...plan, routines: { ...plan.routines, [id]: next } });

  if (!r) {
    return (
      <View style={[styles.screen, { paddingTop: top(58), paddingHorizontal: 20 }]}>
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

  const move = (i: number, dir: -1 | 1) => save(withItemMoved(r, i, dir));

  const deleteRoutine = async () => {
    if (!(await confirm('Delete this routine?', 'Delete'))) return;
    router.back();
    setPlan(withoutRoutine(plan, id));
  };

  const remove = (i: number) =>
    save(r.type === 'cardio' ? { ...r, items: r.items.filter((_, j) => j !== i) } : { ...r, items: r.items.filter((_, j) => j !== i) });

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
              <ItemCard key={i} exId={it.ex} onRemove={() => remove(i)} onMove={(dir) => move(i, dir)} first={i === 0} last={i === r.items.length - 1}>
                <View style={styles.pair}>
                  <Pill label="minutes" value={String(it.min)} onDec={() => changeCardio(i, 'min', -5)} onInc={() => changeCardio(i, 'min', 5)} />
                  <Pill label="zone" value={String(it.zone)} onDec={() => changeCardio(i, 'zone', -1)} onInc={() => changeCardio(i, 'zone', 1)} />
                </View>
                <UI size={13} color={colors.muted} style={{ marginTop: 8, paddingLeft: 4 }}>
                  {`Zone ${it.zone}: ${ZONES[it.zone]}`}
                </UI>
              </ItemCard>
            ))
          : r.items.map((it, i) => (
              <ItemCard key={i} exId={it.ex} onRemove={() => remove(i)} onMove={(dir) => move(i, dir)} first={i === 0} last={i === r.items.length - 1}>
                <View style={styles.pair}>
                  <Pill label="sets" value={String(it.sets)} onDec={() => changeStrength(i, 'sets', -1)} onInc={() => changeStrength(i, 'sets', 1)} />
                  <Pill label="reps" value={String(it.reps)} onDec={() => changeStrength(i, 'reps', -1)} onInc={() => changeStrength(i, 'reps', 1)} />
                </View>
                <View style={styles.pair}>
                  {/* "up to" turns the reps into a range (6–8); equal to reps means a single number. */}
                  <Pill
                    label="up to"
                    value={String(it.repsMax ?? it.reps)}
                    onDec={() => changeStrength(i, 'repsMax', -1)}
                    onInc={() => changeStrength(i, 'repsMax', 1)}
                  />
                  <Pill
                    label="rest"
                    value={restText(it.rest ?? settings.restSeconds)}
                    onDec={() => changeStrength(i, 'rest', -REST_STEP)}
                    onInc={() => changeStrength(i, 'rest', REST_STEP)}
                  />
                </View>
                <UI size={13} color={colors.muted} style={{ marginTop: 8, paddingLeft: 4 }}>
                  {`${it.sets} × ${repsText(it)}, rest ${restText(it.rest ?? settings.restSeconds)}`}
                </UI>
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
  onRemove,
  onMove,
  first,
  last,
  children,
}: {
  exId: string;
  onRemove: () => void;
  onMove: (dir: -1 | 1) => void;
  first: boolean;
  last: boolean;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHead}>
        <Photo source={exPhoto(exId)} fill={colors.surface2} style={styles.thumb} />
        <UI size={16} weight={600} style={{ flex: 1, minWidth: 0 }}>
          {exercise(exId)?.name ?? exId}
        </UI>
        <MoveButton label="↑" hint="Move up" disabled={first} onPress={() => onMove(-1)} />
        <MoveButton label="↓" hint="Move down" disabled={last} onPress={() => onMove(1)} />
        <Pressable onPress={onRemove} accessibilityRole="button" style={styles.remove}>
          <UI size={14} color={colors.muted}>
            Remove
          </UI>
        </Pressable>
      </View>
      {children}
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
function Pill({ label, value, onDec, onInc }: { label: string; value: string; onDec: () => void; onInc: () => void }) {
  return (
    <View style={styles.pill}>
      <Pressable onPress={onDec} accessibilityRole="button" accessibilityLabel={`Fewer ${label}`} style={styles.pillBtn}>
        <Mono size={20}>−</Mono>
      </Pressable>
      <View style={{ flex: 1, alignItems: 'center' }}>
        <UI size={11} lh={1.1} color={colors.muted}>
          {label}
        </UI>
        <Mono size={18} weight={500} lh={1.1}>
          {value}
        </Mono>
      </View>
      <Pressable onPress={onInc} accessibilityRole="button" accessibilityLabel={`More ${label}`} style={styles.pillBtn}>
        <Mono size={20}>+</Mono>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: 20, paddingBottom: 28 },
  cover: { height: 150, borderRadius: 22, marginTop: 16 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 18 },
  name: {
    marginTop: 8,
    borderBottomWidth: 2,
    borderBottomColor: colors.line,
    color: colors.ink,
    fontFamily: fonts.display900,
    fontSize: 44,
    textTransform: 'uppercase',
    paddingTop: 2,
    paddingBottom: 6,
    paddingHorizontal: 0,
  },
  items: { gap: 8, marginTop: 18 },
  card: { backgroundColor: colors.surface, borderRadius: 20, padding: 12 },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  thumb: { width: 44, height: 44, borderRadius: 11 },
  remove: { height: 36, paddingHorizontal: 4, justifyContent: 'center' },
  moveBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center' },
  delete: { height: 48, marginTop: 8, alignItems: 'center', justifyContent: 'center' },
  pair: { flexDirection: 'row', gap: 8, marginTop: 10 },
  pill: { flex: 1, flexDirection: 'row', alignItems: 'center', height: 50, borderRadius: 25, backgroundColor: colors.surface2 },
  pillBtn: { width: 46, height: 50, alignItems: 'center', justifyContent: 'center' },
  add: {
    height: 56,
    marginTop: 12,
    borderRadius: 28,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
