// The three set-entry variants of the strength log sheet: stepper, keypad, scale.

import { useRef, useState } from 'react';
import { Pressable, StyleSheet, View, type GestureResponderEvent } from 'react-native';

import { sheetRow } from '@/components/LogChrome';
import { Mono, UI } from '@/components/Txt';
import { RoundButton, Ring } from '@/components/ui';
import { fmt, r2 } from '@/domain/format';
import type { Field } from '@/domain/strength';
import { useScale } from '@/theme/layout';
import { colors } from '@/theme/tokens';

// ── Stepper ─────────────────────────────────────────────────────────────────

/** Big − value + row (74 pt buttons). */
export function StepRow({
  value,
  label,
  onDec,
  onInc,
  mirrored,
}: {
  value: string;
  label: string;
  onDec: () => void;
  onInc: () => void;
  mirrored: boolean;
}) {
  const { fit } = useScale();
  const b = fit(74);
  return (
    <View style={[sheetRow(mirrored), { height: b }]}>
      <RoundButton sign="−" size={74} fitHeight fontSize={28} onPress={onDec} />
      <View style={styles.stepValue}>
        <Mono size={42} weight={500} lh={1} spacing={-0.05}>
          {value}
        </Mono>
        <UI size={13} color={colors.muted} numberOfLines={1} style={{ marginTop: 6 }}>
          {label}
        </UI>
      </View>
      <RoundButton sign="+" size={74} fitHeight fontSize={28} onPress={onInc} />
    </View>
  );
}

// ── Keypad ──────────────────────────────────────────────────────────────────

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'del'];

/** Two fields (kg, reps) and a 3 × 4 number pad. */
export function KeypadInput({
  field,
  wShown,
  rShown,
  onFocus,
  onKey,
}: {
  field: Field;
  wShown: string;
  rShown: string;
  onFocus: (f: Field) => void;
  onKey: (k: string) => void;
}) {
  const { fit } = useScale();
  return (
    <>
      <View style={styles.fields}>
        {(['w', 'r'] as const).map((f) => (
          <Pressable
            key={f}
            onPress={() => onFocus(f)}
            accessibilityRole="button"
            accessibilityLabel={f === 'w' ? 'Weight' : 'Reps'}
            style={[styles.field, { height: fit(64), paddingTop: fit(14) }]}>
            {field === f && <Ring width={2} color={colors.accent} radius={16} />}
            <Mono size={30} weight={500} spacing={-0.05}>
              {f === 'w' ? wShown : rShown}
            </Mono>
            <UI size={13} color={colors.muted}>
              {f === 'w' ? 'kg' : 'reps'}
            </UI>
          </Pressable>
        ))}
      </View>
      <View style={styles.keys}>
        {[0, 1, 2, 3].map((row) => (
          <View key={row} style={styles.keyRow}>
            {KEYS.slice(row * 3, row * 3 + 3).map((k) => (
              <Pressable
                key={k}
                onPress={() => onKey(k)}
                accessibilityRole="button"
                accessibilityLabel={k === 'del' ? 'Delete' : k}
                style={({ pressed }) => [styles.key, { height: fit(46), backgroundColor: pressed ? colors.line : colors.surface2 }]}>
                <Mono size={k === 'del' ? 14 : 22} weight={500}>
                  {k === 'del' ? 'Delete' : k}
                </Mono>
              </Pressable>
            ))}
          </View>
        ))}
      </View>
    </>
  );
}

// ── Scale ───────────────────────────────────────────────────────────────────

type RulerConf = { step: number; spacing: number; min: number };

/** Ruler settings from `rconf`: weight 12 pt per step, reps 28 pt per rep. */
export const rulerConf = (f: Field, weightStep: number): RulerConf =>
  f === 'w' ? { step: weightStep, spacing: 12, min: 0 } : { step: 1, spacing: 28, min: 1 };

type Tick = { x: number; h: number; color: string; label: string };

/** Tick marks around the current value (`ticks` in the prototype). */
export function rulerTicks(f: Field, value: number, c: RulerConf, center: number, width: number): Tick[] {
  const out: Tick[] = [];
  const base = Math.round(value / c.step) * c.step;
  for (let k = -18; k <= 18; k++) {
    const v = r2(base + k * c.step);
    if (v < c.min) continue;
    const x = center + ((v - value) / c.step) * c.spacing;
    if (x < -20 || x > width + 20) continue;
    if (f === 'w') {
      const major = Math.abs(v % 10) < 1e-6;
      const mid = Math.abs(v % 5) < 1e-6;
      out.push({ x, h: major ? 30 : mid ? 20 : 10, color: major ? colors.ink : colors.muted, label: major ? String(v) : '' });
    } else {
      const major = v % 5 === 0;
      out.push({ x, h: major ? 30 : 16, color: major ? colors.ink : colors.muted, label: String(v) });
    }
  }
  return out;
}

/** Label, big value, and a horizontal drag ruler with an accent center line. */
export function ScaleRuler({
  f,
  label,
  value,
  conf,
  onChange,
}: {
  f: Field;
  label: string;
  value: number;
  conf: RulerConf;
  onChange: (v: number) => void;
}) {
  const [width, setWidth] = useState(358);
  const { fit } = useScale();
  const center = width / 2;

  // Drag: value = start − dx / spacing × step, snapped to the step (`rMove` in the prototype).
  const drag = useRef({ x: 0, startValue: 0, last: 0 });
  const onGrant = (e: GestureResponderEvent) => {
    drag.current = { x: e.nativeEvent.pageX, startValue: value, last: value };
  };
  const onMove = (e: GestureResponderEvent) => {
    const dx = e.nativeEvent.pageX - drag.current.x;
    let v = drag.current.startValue - (dx / conf.spacing) * conf.step;
    v = r2(Math.max(conf.min, Math.round(v / conf.step) * conf.step));
    if (v !== drag.current.last) {
      drag.current.last = v;
      onChange(v);
    }
  };

  const ticks = rulerTicks(f, value, conf, center, width);

  return (
    <View>
      <View style={styles.scaleHead}>
        <UI size={14} color={colors.muted}>
          {label}
        </UI>
        <Mono size={32} weight={500} spacing={-0.05}>
          {f === 'w' ? fmt(value) : String(value)}
        </Mono>
      </View>
      <View
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderTerminationRequest={() => false}
        onResponderGrant={onGrant}
        onResponderMove={onMove}
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
        accessibilityRole="adjustable"
        accessibilityLabel={label}
        style={[styles.ruler, { height: fit(60) }]}>
        {ticks.map((t, i) => (
          <View key={i} pointerEvents="none" style={[StyleSheet.absoluteFill, { left: t.x }]}>
            <View style={{ position: 'absolute', left: 0, bottom: 0, width: 1, height: t.h, backgroundColor: t.color }} />
            {t.label !== '' && (
              <Mono size={11} color={colors.muted} align="center" style={styles.tickLabel}>
                {t.label}
              </Mono>
            )}
          </View>
        ))}
        <View pointerEvents="none" style={[styles.centerLine, { left: center - 1.5 }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stepValue: { flex: 1, minWidth: 0, alignItems: 'center' },
  fields: { flexDirection: 'row', gap: 8 },
  field: {
    flex: 1,
    height: 64,
    borderRadius: 16,
    backgroundColor: colors.bg,
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingTop: 14,
  },
  keys: { gap: 6 },
  keyRow: { flexDirection: 'row', gap: 6 },
  key: { flex: 1, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  scaleHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', paddingHorizontal: 4, paddingBottom: 4 },
  ruler: { height: 60, borderRadius: 14, backgroundColor: colors.bg, overflow: 'hidden' },
  tickLabel: { position: 'absolute', top: 7, left: -20, width: 40 },
  centerLine: { position: 'absolute', top: 0, bottom: 0, width: 3, backgroundColor: colors.accent },
});
