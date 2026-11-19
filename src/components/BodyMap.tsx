// Front and back body outline made of muscle groups. Today's muscles are filled
// in red (the owner's choice, same in both themes) and slowly pulse; helper
// muscles get a faint accent; the rest stay quiet. Drawn on a 120 × 240 grid;
// left-side shapes are mirrored for the right side.

import { useEffect, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import Svg, { Ellipse, G, Path } from 'react-native-svg';

import { UI } from '@/components/Txt';
import type { MuscleKey } from '@/domain/muscles';
import { t } from '@/i18n';
import { colors } from '@/theme/tokens';

/** Worked muscles: red in both themes. Helpers get the same red, fainter. */
const MUSCLE = '#E0353B';

type Shape = { d: string; mirror?: boolean };

const MIRROR = 'translate(120,0) scale(-1,1)';

const SHOULDER = 'M42 42 C34 42 28 47 27 56 C27 60 28 63 29 66 C33 61 37 56 42 50 Z';
const UPPER_ARM = 'M28 69 C25 76 24 83 25 91 C28 92 31 92 33 91 C35 83 36 75 37 66 C34 66 31 67 28 69 Z';
const FOREARM = 'M25 95 C22 105 21 114 21 124 L27 125 C29 115 32 105 33 95 Z';

/** Muscle shapes per view. */
const FRONT: Partial<Record<MuscleKey, Shape[]>> = {
  traps: [{ d: 'M54 36 C50 39 46 41 42 42 L54 44 Z', mirror: true }],
  shoulders: [{ d: SHOULDER, mirror: true }],
  chest: [{ d: 'M58.6 44 L43 44 C40 48 39 54 41 60 C44 65 51 67 58.6 64 Z', mirror: true }],
  biceps: [{ d: UPPER_ARM, mirror: true }],
  forearms: [{ d: FOREARM, mirror: true }],
  abs: [
    { d: 'M51 68 h8 v10 h-8 Z M61 68 h8 v10 h-8 Z' },
    { d: 'M51 80 h8 v10 h-8 Z M61 80 h8 v10 h-8 Z' },
    { d: 'M51 92 h8 v10 h-8 Z M61 92 h8 v10 h-8 Z' },
    { d: 'M52 104 L68 104 L64 116 L56 116 Z' },
  ],
  obliques: [{ d: 'M42 66 C41 74 42 84 44 93 C45.5 100 47 105 49 109 L49 68 Z', mirror: true }],
  quads: [{ d: 'M43 128 C40 140 40 156 43 170 C46 174 52 174 56 170 C58 156 59 142 59.4 132 Z', mirror: true }],
  calves: [{ d: 'M44 184 C42 196 43 210 45 222 L53 222 C55 210 56 196 55 184 Z', mirror: true }],
};

const BACK: Partial<Record<MuscleKey, Shape[]>> = {
  traps: [{ d: 'M60 33 L50 41 L44 44 L53 52 L60 70 L67 52 L76 44 L70 41 Z' }],
  shoulders: [{ d: SHOULDER, mirror: true }],
  triceps: [{ d: UPPER_ARM, mirror: true }],
  forearms: [{ d: FOREARM, mirror: true }],
  lats: [{ d: 'M45 48 L53 54 L59 73 L59 94 C53 92 48 86 45 80 C41 70 41 58 45 48 Z', mirror: true }],
  lowerBack: [{ d: 'M52 96 L68 96 L68 110 L52 110 Z' }],
  glutes: [{ d: 'M44 113 C42 121 43 128 48 132 C53 134 58 132 59.4 128 L59.4 113 Z', mirror: true }],
  hamstrings: [{ d: 'M43 136 C41 148 42 160 44 172 L56 172 C58 160 58 148 58 136 Z', mirror: true }],
  calves: [{ d: 'M44 182 C41 192 42 202 45 212 C47 216 52 216 54 212 C56 202 57 192 55 182 Z', mirror: true }],
};

/** Left half of the body outline (head excluded); mirrored for the right half. */
const SILHOUETTE =
  'M60 30 L54 31 L53 38 C47 40 40 40 34 43 C28 46 26 52 26 58 C24 70 23 82 24 92 C21 104 20 116 20 126 ' +
  'C19 132 21 137 24.5 137 C28 137 29 132 28 126 C30 116 33 106 34 95 C36 86 37 76 38 68 C39 76 40 86 42 96 ' +
  'C43 106 43 114 42 124 C40 138 39 154 42 170 C43 176 43 180 44 184 C42 196 42 210 44 222 C43 228 42 232 45 234 ' +
  'L54 234 C55 230 54 226 54 222 C56 210 57 196 56 184 C57 178 58 174 58 170 C59 156 59.6 142 60 130 Z';

/** The body under the muscles, so the figure reads as one shape with muscle lines on it. */
function Frame() {
  return (
    <G fill={colors.border}>
      <Path d={SILHOUETTE} />
      <Path d={SILHOUETTE} transform={MIRROR} />
      <Ellipse cx={60} cy={18} rx={11} ry={13} />
    </G>
  );
}

function Shapes({ map, pick, fill, opacity = 1 }: { map: Partial<Record<MuscleKey, Shape[]>>; pick: (m: MuscleKey) => boolean; fill: string; opacity?: number }) {
  return (
    <G fill={fill} opacity={opacity} stroke={colors.surface} strokeWidth={1.4} strokeLinejoin="round">
      {(Object.keys(map) as MuscleKey[]).filter(pick).flatMap((m) =>
        map[m]!.map((s, i) => (
          <G key={`${m}${i}`}>
            <Path d={s.d} />
            {s.mirror && <Path d={s.d} transform={MIRROR} />}
          </G>
        )),
      )}
    </G>
  );
}

function Figure({ back, primary, secondary, width }: { back: boolean; primary: Set<MuscleKey>; secondary: Set<MuscleKey>; width: number }) {
  const map = back ? BACK : FRONT;
  const height = width * 2;
  const pulse = useSharedValue(1);
  useEffect(() => {
    pulse.set(withRepeat(withTiming(0.55, { duration: 1400, easing: Easing.inOut(Easing.quad) }), -1, true));
  }, [pulse]);
  const glow = useAnimatedStyle(() => ({ opacity: pulse.value }));
  return (
    <View style={{ width, height }}>
      <Svg width={width} height={height} viewBox="0 0 120 240">
        <Frame />
        <Shapes map={map} pick={() => true} fill={colors.border} />
        <Shapes map={map} pick={(m) => secondary.has(m)} fill={MUSCLE} opacity={0.35} />
        <Shapes map={map} pick={(m) => primary.has(m)} fill={MUSCLE} opacity={0.55} />
      </Svg>
      {/* Today's muscles on their own layer so only they pulse. */}
      <Animated.View style={[StyleSheet.absoluteFill, glow]} pointerEvents="none">
        <Svg width={width} height={height} viewBox="0 0 120 240">
          <Shapes map={map} pick={(m) => primary.has(m)} fill={MUSCLE} />
        </Svg>
      </Animated.View>
    </View>
  );
}

/** Muscles that are only drawn on the back view. */
const BACK_ONLY: MuscleKey[] = ['lats', 'traps', 'lowerBack', 'glutes', 'hamstrings', 'triceps'];

/**
 * One still figure for a thumbnail (exercises without a photo yet): the view
 * that shows the exercise's main muscle, those muscles in red.
 */
export function MiniFigure({ primary, secondary = [], height }: { primary: MuscleKey[]; secondary?: MuscleKey[]; height: number }) {
  const back = primary.length > 0 && BACK_ONLY.includes(primary[0]);
  const map = back ? BACK : FRONT;
  const p = new Set(primary);
  const s = new Set(secondary);
  return (
    <Svg width={height / 2} height={height} viewBox="0 0 120 240">
      <Frame />
      <Shapes map={map} pick={() => true} fill={colors.border} />
      <Shapes map={map} pick={(m) => s.has(m)} fill={MUSCLE} opacity={0.35} />
      <Shapes map={map} pick={(m) => p.has(m)} fill={MUSCLE} />
    </Svg>
  );
}

/** Front and back figures side by side with their labels. */
export function BodyMap({ primary, secondary, width = 120 }: { primary: MuscleKey[]; secondary: MuscleKey[]; width?: number }) {
  const p = new Set(primary);
  const s = new Set(secondary);
  return (
    <View style={styles.row} accessible accessibilityRole="image" accessibilityLabel={t('Body map. Worked today: {list}.', { list: primary.join(', ') || '–' })}>
      {[false, true].map((back) => (
        <View key={String(back)} style={styles.col}>
          <Figure back={back} primary={p} secondary={s} width={width} />
          <UI size={14} color={colors.muted}>
            {back ? t('Back view') : t('Front view')}
          </UI>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'center', gap: 24 },
  col: { alignItems: 'center', gap: 8 },
});

type Crop = { back: boolean; vb: string };

/** Close-ups per strength group: which view(s) and which part of the 120 × 240 figure. */
const ZOOM: Record<string, { muscles: MuscleKey[]; crops: Crop[] }> = {
  chest: { muscles: ['chest'], crops: [{ back: false, vb: '22 26 76 76' }] },
  back: { muscles: ['lats', 'traps', 'lowerBack'], crops: [{ back: true, vb: '18 26 84 92' }] },
  legs: {
    muscles: ['quads', 'calves', 'glutes', 'hamstrings'],
    crops: [
      { back: false, vb: '34 108 52 130' },
      { back: true, vb: '34 108 52 130' },
    ],
  },
  shoulders: { muscles: ['shoulders'], crops: [{ back: false, vb: '18 22 84 64' }] },
  arms: {
    muscles: ['biceps', 'triceps', 'forearms'],
    crops: [
      { back: false, vb: '14 50 32 82' },
      { back: true, vb: '14 50 32 82' },
    ],
  },
  core: { muscles: ['abs', 'obliques'], crops: [{ back: false, vb: '32 60 56 62' }] },
};

export const hasZoom = (group: string) => group in ZOOM;

/**
 * A close-up of the body part a muscle group trains (chest, back, legs …) with
 * those muscles in red; used instead of photos on the library tiles and group pages.
 */
export function BodyZoom({ group, height }: { group: string; height: number }) {
  const z = ZOOM[group];
  if (!z) return null;
  const on = new Set(z.muscles);
  return (
    <View style={[styles.row, { height, gap: 8 }]} accessible accessibilityRole="image" accessibilityLabel={z.muscles.join(', ')}>
      {z.crops.map((c, i) => {
        const [, , w, h] = c.vb.split(' ').map(Number);
        const width = Math.min(height * (w / h), z.crops.length > 1 ? height * 0.7 : height * 1.6);
        const map = c.back ? BACK : FRONT;
        return (
          <Svg key={i} width={width} height={height} viewBox={c.vb}>
            <Frame />
            <Shapes map={map} pick={() => true} fill={colors.border} />
            <Shapes map={map} pick={(m) => on.has(m)} fill={MUSCLE} />
          </Svg>
        );
      })}
    </View>
  );
}

/** Lungs (faint) and the heart, for Cardio. Figure coordinates. */
const LUNG = 'M57 45 C50 45 44 50 43 58 C42 64 44 69 49 70 C53 70 57 67 57 62 Z';
const HEART = 'M66 52 C66 49 63 47.5 61 49.5 C59 47.5 56 49 56 52 C56 56 61 59.5 61 59.5 C61 59.5 66 56 66 52 Z';
/** Joints that warm-up and stretching move, for Warm-up & stretching (left side; mirrored). */
const JOINTS: [number, number][] = [
  [37, 48],
  [29, 92],
  [24, 126],
  [48, 121],
  [50, 178],
  [50, 227],
];

export type Badge = 'cardio' | 'functional' | 'mobility';
export const isBadge = (group: string): group is Badge => group === 'cardio' || group === 'functional' || group === 'mobility';

/**
 * Figures for the groups that are not one muscle (owner's choice over photos):
 * Cardio = heart and lungs, legs lighter; Functional = every muscle, front and back;
 * Warm-up & stretching = the joints it moves.
 */
export function BodyBadge({ kind, height }: { kind: Badge; height: number }) {
  const width = height / 2;
  const all = () => true;
  const fig = (back: boolean, body: ReactNode) => (
    <Svg key={String(back)} width={width} height={height} viewBox="0 0 120 240">
      <Frame />
      <Shapes map={back ? BACK : FRONT} pick={all} fill={colors.border} />
      {body}
    </Svg>
  );
  return (
    <View style={[styles.row, { gap: 8 }]} accessible accessibilityRole="image" accessibilityLabel={kind}>
      {kind === 'cardio' &&
        fig(
          false,
          <>
            <Shapes map={FRONT} pick={(m) => m === 'quads' || m === 'calves'} fill={MUSCLE} opacity={0.45} />
            <G fill={MUSCLE} opacity={0.5}>
              <Path d={LUNG} />
              <Path d={LUNG} transform={MIRROR} />
            </G>
            <Path d={HEART} fill={MUSCLE} transform="translate(65 56) scale(2.3) translate(-61 -53.5)" stroke={colors.surface} strokeWidth={0.6} />
          </>,
        )}
      {kind === 'functional' && [false, true].map((back) => fig(back, <Shapes map={back ? BACK : FRONT} pick={all} fill={MUSCLE} />))}
      {kind === 'mobility' &&
        fig(
          false,
          <G fill={MUSCLE} stroke={colors.surface} strokeWidth={1.4}>
            {JOINTS.flatMap(([x, y]) => [
              <Ellipse key={`l${x}${y}`} cx={x} cy={y} rx={5} ry={5} />,
              <Ellipse key={`r${x}${y}`} cx={120 - x} cy={y} rx={5} ry={5} />,
            ])}
          </G>,
        )}
    </View>
  );
}
