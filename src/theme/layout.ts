import { Platform, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { frame } from './tokens';

const DESIGN_WIDTH = 390;
const DESIGN_HEIGHT = 844;
/** Narrowest phones (320 pt) get 85 % of the design sizes; nothing ever grows past 100 %. */
const MIN_SCALE = 0.85;
/** Short screens (or a browser with its toolbars) shrink the log sheet controls down to 78 %. */
const MIN_VSCALE = 0.78;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/**
 * The design is drawn for 390 × 844. On narrower phones fixed sizes (text,
 * avatars, round buttons) scale down with the width; on wider phones they stay
 * as designed and the extra room goes to the flexible parts of each layout.
 */
export function useScale() {
  const { width, height } = useWindowDimensions();
  const s = clamp(width / DESIGN_WIDTH, MIN_SCALE, 1);
  const vs = clamp(height / DESIGN_HEIGHT, MIN_VSCALE, 1);
  /** Scales a design size by the width factor. */
  const sz = (n: number) => Math.round(n * s * 10) / 10;
  /** Scales a design size by whichever is tighter, width or height (log sheet controls). */
  const fit = (n: number) => Math.round(n * Math.min(s, vs) * 10) / 10;
  return { s, vs, sz, fit, width, height };
}

/** In a browser the toolbar already sits above the page, so only a small margin is kept. */
const WEB_MIN_TOP = 16;

/**
 * Design top offsets (e.g. "content starts at 66") include the 50 pt status bar
 * of the design frame. That 50 is swapped for the device's safe-area inset: taller
 * on phones with a Dynamic Island, and on the web (no status bar of our own) just
 * the inset, or a small margin when there is none.
 */
export function useTop() {
  const insets = useSafeAreaInsets();
  const bar = Platform.OS === 'web' ? Math.max(insets.top, WEB_MIN_TOP) : Math.max(insets.top, frame.statusBar);
  return (designTop: number) => bar + (designTop - frame.statusBar);
}

/** Bottom space for the home indicator area (28 pt in the design frame). */
export function useBottomInset() {
  const insets = useSafeAreaInsets();
  return insets.bottom;
}
