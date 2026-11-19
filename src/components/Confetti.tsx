// A small one-off burst of confetti, e.g. when a workout is finished. Pieces fly
// up and out from a point, fall and fade within about 1.6 s, then the layer is
// gone. Skipped entirely when the phone asks for reduced motion.

import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming, type SharedValue } from 'react-native-reanimated';

import { colors } from '@/theme/tokens';

const COUNT = 28;
const DURATION = 1600;

type Piece = { vx: number; vy: number; spin: number; w: number; h: number; color: number };

/** Deterministic pseudo-random numbers, so every burst looks alike and render stays pure. */
function pieces(): Piece[] {
  let seed = 7;
  const rnd = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  return Array.from({ length: COUNT }, () => {
    const angle = -Math.PI / 2 + (rnd() - 0.5) * Math.PI * 0.9;
    const speed = 140 + rnd() * 160;
    return {
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      spin: (rnd() - 0.5) * 720,
      w: 6 + rnd() * 4,
      h: 8 + rnd() * 6,
      color: Math.floor(rnd() * 4),
    };
  });
}

const PIECES = pieces();

function Bit({ piece, p }: { piece: Piece; p: SharedValue<number> }) {
  const palette = [colors.accentFill, colors.green, colors.red, colors.ink];
  const style = useAnimatedStyle(() => {
    const t = p.value;
    return {
      opacity: t < 0.7 ? 1 : 1 - (t - 0.7) / 0.3,
      transform: [
        { translateX: piece.vx * t },
        { translateY: piece.vy * t + 320 * t * t },
        { rotate: `${piece.spin * t}deg` },
      ],
    };
  });
  return <Animated.View style={[styles.bit, { width: piece.w, height: piece.h, backgroundColor: palette[piece.color] }, style]} />;
}

/** Bursts once from the given point (relative to the parent), then removes itself. */
export function Confetti({ x, y }: { x: number; y: number }) {
  const p = useSharedValue(0);
  const [done, setDone] = useState(false);
  useEffect(() => {
    const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const timer = setTimeout(() => setDone(true), reduce ? 0 : DURATION + 100);
    if (!reduce) p.set(withTiming(1, { duration: DURATION, easing: Easing.out(Easing.quad) }));
    return () => clearTimeout(timer);
  }, [p]);
  if (done) return null;
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { zIndex: 10 }]}>
      <View style={{ position: 'absolute', left: x, top: y }}>
        {PIECES.map((piece, i) => (
          <Bit key={i} piece={piece} p={p} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bit: { position: 'absolute', left: 0, top: 0, borderRadius: 2 },
});
