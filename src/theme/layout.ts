import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { frame } from './tokens';

/**
 * Design top offsets (e.g. "content starts at 66") include the 50 pt status bar
 * of the design frame. On a real phone we swap that 50 for the device's safe-area
 * inset when it is taller (Dynamic Island), so spacing below it stays the same.
 */
export function useTop() {
  const insets = useSafeAreaInsets();
  const bar = Math.max(insets.top, frame.statusBar);
  return (designTop: number) => bar + (designTop - frame.statusBar);
}

/** Bottom space for the home indicator area (28 pt in the design frame). */
export function useBottomInset() {
  const insets = useSafeAreaInsets();
  return insets.bottom;
}
