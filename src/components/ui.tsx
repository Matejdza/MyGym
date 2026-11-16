// Shared controls from the design: CTAs, round stepper buttons, stepper cards, rings.

import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { NumberField, type NumberInput } from '@/components/NumberField';
import { Display, Mono, UI } from '@/components/Txt';
import { useScale } from '@/theme/layout';
import { colors } from '@/theme/tokens';

type PressProps = { onPress?: () => void; disabled?: boolean; style?: StyleProp<ViewStyle>; accessibilityLabel?: string };

/**
 * Primary CTA: accent pill, Big Shoulders 900 label. Pressed → `press` color.
 * Default 64 h / 26 px; the log CTA is 66 h, the home hero CTA 58 h / 23 px.
 */
export function PrimaryButton({
  label,
  onPress,
  disabled,
  dimmed,
  height = 52,
  fontSize = 22,
  style,
}: PressProps & { label: string; dimmed?: boolean; height?: number; fontSize?: number }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.center,
        { height, borderRadius: height / 2, backgroundColor: pressed ? colors.press : colors.accentFill, opacity: dimmed ? 0.35 : 1 },
        style,
      ]}>
      <Display size={fontSize} weight={900} spacing={0.02} color={colors.accentInk}>
        {label}
      </Display>
    </Pressable>
  );
}

/** Secondary CTA: outlined, ink label (e.g. "BACK TO HOME"). Only the main action is yellow. */
export function InkDisplayButton({ label, onPress, style }: PressProps & { label: string }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.center, { height: 52, borderRadius: 26, backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.border }, pressed && { backgroundColor: colors.surface }, style]}>
      <Display size={22} weight={900} spacing={0.02}>
        {label}
      </Display>
    </Pressable>
  );
}

/**
 * Round − / + button, kept quiet so the yellow main action stands out.
 * Plus: surface2 fill. Minus: outline only. Both darken to `line` when pressed.
 */
export function RoundButton({
  sign,
  size,
  fontSize,
  onPress,
  style,
  fitHeight,
}: PressProps & { sign: '−' | '+'; size: number; fontSize: number; fitHeight?: boolean }) {
  const plus = sign === '+';
  const { sz, fit } = useScale();
  // Log-sheet buttons also shrink on short screens; the rest only follow the width.
  const d = fitHeight ? fit(size) : sz(size);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={plus ? 'Increase' : 'Decrease'}
      style={({ pressed }) => [
        styles.center,
        {
          width: d,
          height: d,
          borderRadius: d / 2,
          backgroundColor: pressed ? colors.line : plus ? colors.surface2 : 'transparent',
          borderWidth: plus ? 0 : 1.5,
          borderColor: colors.border,
        },
        style,
      ]}>
      <Mono size={fontSize}>
        {sign}
      </Mono>
    </Pressable>
  );
}

/**
 * Card with a label, a big mono value with unit, and − / + buttons
 * (onboarding body/target, profile rows).
 */
export function StepperCard({
  label,
  value,
  unit,
  onDec,
  onInc,
  valueSize = 40,
  button = 58,
  buttonFont = 24,
  labelSize = 15,
  unitSize = 16,
  valueGap = 4,
  padding = [14, 14, 14, 18],
  gap = 10,
  input,
}: {
  label: string;
  value: string;
  unit: string;
  /** Makes the number typeable; its error replaces the label while shown. */
  input?: NumberInput;
  onDec: () => void;
  onInc: () => void;
  valueSize?: number;
  button?: number;
  buttonFont?: number;
  labelSize?: number;
  unitSize?: number;
  valueGap?: number;
  padding?: [number, number, number, number];
  gap?: number;
}) {
  const [pt, pr, pb, pl] = padding;
  const [error, setError] = useState<string | null>(null);
  return (
    <View style={[styles.stepCard, { paddingTop: pt, paddingRight: pr, paddingBottom: pb, paddingLeft: pl, gap }]}>
      <View style={{ flex: 1, minWidth: 0 }}>
        <UI size={labelSize} color={error ? colors.red : colors.muted} numberOfLines={1}>
          {error ?? label}
        </UI>
        <View style={[styles.baseline, { marginTop: valueGap }]}>
          {input ? (
            <NumberField input={input} display={value} size={valueSize} label={`${label}${unit ? ` in ${unit}` : ''}`} onError={setError} />
          ) : (
            <Mono size={valueSize} weight={500} spacing={-0.05}>
              {value}
            </Mono>
          )}
          <UI size={unitSize} color={colors.muted}>
            {unit}
          </UI>
        </View>
      </View>
      <RoundButton sign="−" size={button} fontSize={buttonFont} onPress={onDec} />
      <RoundButton sign="+" size={button} fontSize={buttonFont} onPress={onInc} />
    </View>
  );
}

/** Circular back button with "‹" (onboarding header). */
export function BackCircle({ onPress }: { onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel="Back" style={[styles.center, styles.backCircle]}>
      <UI size={22}>‹</UI>
    </Pressable>
  );
}

/** "‹ Back" pill. `onPhoto` uses the translucent fill used over hero photos. */
export function BackPill({ onPress, label = '‹ Back', onPhoto, style }: PressProps & { label?: string; onPhoto?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={[styles.center, styles.backPill, { backgroundColor: onPhoto ? colors.scrim : colors.surface, paddingHorizontal: onPhoto ? 16 : 14 }, style]}>
      <UI size={15} weight={600}>
        {label}
      </UI>
    </Pressable>
  );
}

/**
 * Outline drawn over a box without changing its layout, like CSS
 * `box-shadow: inset 0 0 0 Npx color` (or an outer ring with `offset`).
 */
export function Ring({ width, color, radius, offset = 0 }: { width: number; color: string; radius: number; offset?: number }) {
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: -offset,
        left: -offset,
        right: -offset,
        bottom: -offset,
        borderRadius: radius + offset,
        borderWidth: width,
        borderColor: color,
      }}
    />
  );
}

/** Profile initial on the profile color. */
export function Avatar({
  size,
  color,
  initial,
  fontSize,
  children,
}: {
  size: number;
  color: string;
  initial: string;
  fontSize: number;
  children?: ReactNode;
}) {
  const d = useScale().sz(size);
  return (
    <View style={[styles.center, { width: d, height: d, borderRadius: d / 2, backgroundColor: color }]}>
      <Display size={fontSize} weight={900} color={colors.onPlate}>
        {initial}
      </Display>
      {children}
    </View>
  );
}

export const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  baseline: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  stepCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 20 },
  backCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surface },
  backPill: { height: 40, borderRadius: 20 },
});
