import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import type { Img } from '@/data/photos';
import { colors } from '@/theme/tokens';

/**
 * Photo filling its box (object-fit: cover). Shows the surface color when there is no image.
 * `top` keeps the top of the photo in view when it is cropped (heads in tall hero boxes).
 */
export function Photo({
  source,
  style,
  fill = colors.surface,
  top = false,
}: {
  source: Img | null;
  style?: StyleProp<ViewStyle>;
  fill?: string;
  top?: boolean;
}) {
  return (
    <View style={[{ overflow: 'hidden', backgroundColor: fill }, style]}>
      {source != null && <Image source={source} style={StyleSheet.absoluteFill} contentFit="cover" contentPosition={top ? 'top' : 'center'} transition={0} />}
    </View>
  );
}

/** One gradient stop: [position 0–1, color]. */
export type Stop = [number, string];

const DARK = (a: number) => `rgba(13,13,12,${a})`;

/** Vertical (top→bottom) or horizontal (left→right) gradient over a photo. */
export function Shade({ stops, horizontal }: { stops: Stop[]; horizontal?: boolean }) {
  return (
    <LinearGradient
      pointerEvents="none"
      style={StyleSheet.absoluteFill}
      colors={stops.map((s) => s[1]) as [string, string, ...string[]]}
      locations={stops.map((s) => s[0]) as [number, number, ...number[]]}
      start={{ x: 0, y: 0 }}
      end={horizontal ? { x: 1, y: 0 } : { x: 0, y: 1 }}
    />
  );
}

/**
 * Standard hero overlay: dark at the top for the status bar, clear in the
 * middle, solid bg at the bottom where the title sits.
 * `clear` = [from, to] where the photo is fully visible, `solid` = where it turns bg.
 */
export const heroStops = (top: number, clear: [number, number], solid: number): Stop[] => [
  [0, DARK(top)],
  [clear[0], DARK(0)],
  [clear[1], DARK(0)],
  [solid, colors.bg],
  [1, colors.bg],
];

export const dark = DARK;
