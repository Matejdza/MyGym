// Signal at the end of a rest: two short beeps (web) and a vibration where the
// phone supports it. Browsers only allow sound after a tap, so the audio is
// unlocked by `primeRestSignal()` when a set is logged, which starts the rest.

import { Platform, Vibration } from 'react-native';

type Ctx = AudioContext;
let ctx: Ctx | null = null;

/** Call from the tap that starts a rest. */
export function primeRestSignal() {
  if (Platform.OS !== 'web') return;
  try {
    const AC = globalThis.AudioContext ?? (globalThis as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    ctx ??= new AC();
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  } catch {
    ctx = null; // No sound on this browser; the vibration still runs.
  }
}

function beep(c: Ctx, at: number) {
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = 'sine';
  osc.frequency.value = 880;
  // Short fade in and out so the beep doesn't click.
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(0.35, at + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.18);
  osc.connect(gain).connect(c.destination);
  osc.start(at);
  osc.stop(at + 0.2);
}

/** Rest is over. */
export function playRestSignal() {
  if (Platform.OS !== 'web') {
    Vibration.vibrate([0, 250, 150, 250]);
    return;
  }
  try {
    navigator.vibrate?.([250, 150, 250]);
  } catch {
    // Not supported (iPhone); the beep still plays.
  }
  if (!ctx || ctx.state !== 'running') return;
  const t = ctx.currentTime;
  beep(ctx, t);
  beep(ctx, t + 0.28);
}
