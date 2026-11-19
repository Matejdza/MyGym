// Small, quick motion used across the app. Everything respects the phone's
// "reduce motion" setting (Reanimated's default) and never delays a tap.
// - Appear: content slides up a little and fades in, staggered by `index`.
// - Pop: springs in (a title on the finish screen, a set turning Done).
// - Pressy: a Pressable that dips to 97 % while pressed, so every tap is felt.
// - useCountUp: numbers count up to their value instead of jumping.
// - Fill: a progress bar that grows to its width.

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Pressable, type PressableProps, type PressableStateCallbackType, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming } from 'react-native-reanimated';

const STAGGER = 60;
const MAX_DELAY = 360;

// Hand-made mount animations (not Reanimated's layout "entering" presets: on the
// web those leave elements absolutely positioned when the layout above changes).

export function Appear({ index = 0, children, style }: { index?: number; children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const p = useSharedValue(0);
  useEffect(() => {
    p.set(withDelay(Math.min(MAX_DELAY, index * STAGGER), withTiming(1, { duration: 380, easing: Easing.out(Easing.cubic) })));
  }, [p, index]);
  const anim = useAnimatedStyle(() => ({ opacity: p.value, transform: [{ translateY: (1 - p.value) * 16 }] }));
  return <Animated.View style={[style, anim]}>{children}</Animated.View>;
}

/** Springs in from a smaller size when it mounts (or when `key` changes). `off` shows it still. */
export function Pop({ children, style, off }: { children: ReactNode; style?: StyleProp<ViewStyle>; off?: boolean }) {
  const p = useSharedValue(off ? 1 : 0);
  useEffect(() => {
    if (!off) p.set(withSpring(1, { damping: 11, stiffness: 220 }));
  }, [p, off]);
  const anim = useAnimatedStyle(() => ({ opacity: Math.min(1, p.value * 1.5), transform: [{ scale: 0.6 + p.value * 0.4 }] }));
  return <Animated.View style={[style, anim]}>{children}</Animated.View>;
}

/** Smooths the press dip in the browser (web-only style keys, ignored on native). */
const EASE = { transitionProperty: 'transform', transitionDuration: '140ms', transitionTimingFunction: 'ease-out' } as unknown as ViewStyle;

/** Pressable that dips to 97 % while pressed. `style` may be a function of { pressed } like Pressable's. */
export function Pressy({ style, ...rest }: PressableProps & { style?: PressableProps['style'] }) {
  return (
    <Pressable
      {...rest}
      style={(state: PressableStateCallbackType) => [
        typeof style === 'function' ? style(state) : style,
        EASE,
        { transform: [{ scale: state.pressed ? 0.97 : 1 }] },
      ]}
    />
  );
}

/** Counts from the value on screen (0 the first time) to `target` in `ms`. */
export function useCountUp(target: number, ms = 700): number {
  const [shown, setShown] = useState(0);
  // The number currently on screen, so an interrupted count resumes from there.
  const cur = useRef(0);
  useEffect(() => {
    const start = cur.current;
    const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const dur = reduce || start === target ? 0 : ms;
    const t0 = performance.now();
    let raf = 0;
    const step = (t: number) => {
      const p = dur ? Math.min(1, (t - t0) / dur) : 1;
      const v = start + (target - start) * (1 - (1 - p) ** 3);
      cur.current = v;
      setShown(v);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return shown;
}

/** Progress fill that grows to `pct` (0–100) inside its track. */
export function Fill({ pct, color, style }: { pct: number; color: string; style?: StyleProp<ViewStyle> }) {
  const w = useSharedValue(0);
  useEffect(() => {
    w.set(withTiming(pct, { duration: 700, easing: Easing.out(Easing.cubic) }));
  }, [pct, w]);
  const anim = useAnimatedStyle(() => ({ width: `${w.value}%` }));
  return <Animated.View style={[{ height: '100%', backgroundColor: color }, style, anim]} />;
}
