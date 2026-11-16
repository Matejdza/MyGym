// Design tokens. Colors come in two palettes, "Grafit i zlato" (dark) and its
// light twin, picked by the owner on 2026-11-16. Contrast of text on bg and
// surface is at least 4.5:1 in both (see tests/theme.test.ts).
//
// On the web every color is a CSS variable (`var(--c-bg)`), so switching the
// theme only changes the variables on <html>: no re-render, no restart, and
// styles created at load time keep working. The variables are declared in
// public/index.html (kept equal to these palettes by a test). Native builds use
// the dark palette directly.

/** True in the browser (also keeps this file loadable by the Node tests, which have no React Native). */
const IS_WEB = typeof document !== 'undefined';

export const DARK = {
  /** 60%: page background. */
  bg: '#1C1C1A',
  /** 30%: cards, sheets, rows. */
  surface: '#272724',
  /** Inputs and quiet buttons on a surface. */
  surface2: '#32322E',
  /** Main text. */
  ink: '#F2F0EA',
  /** Secondary text. */
  muted: '#A39F96',
  /** Hairlines and the resting underline of number fields. */
  line: 'rgba(242,240,234,0.13)',
  /** Outlines of secondary buttons. */
  border: 'rgba(242,240,234,0.26)',
  /** 10%: accent for text, lines and chart strokes. */
  accent: '#F2B92A',
  /** Accent as a fill (main button, chips). Same in both themes. */
  accentFill: '#F2B92A',
  /** Text on accentFill. */
  accentInk: '#1C1C1A',
  /** accentFill while pressed. */
  press: '#D9A41F',
  /** Errors and destructive actions. */
  red: '#FF6A4D',
  /** Progress toward a target. */
  green: '#3DDC84',
  placeholder: '#6E6A63',
  /** Fill of the floating Back pill on photo heroes. */
  scrim: 'rgba(28,28,26,0.72)',
  /** Text on routine plates, avatars and zone colors (always dark). */
  onPlate: '#1C1C1A',
  /** The two gray routine plates (D, H); darker in light mode so they stay visible. */
  plateD: '#E9E6DF',
  plateH: '#C7C2B8',
} as const;

export type Palette = { [K in keyof typeof DARK]: string };

export const LIGHT: Palette = {
  bg: '#F4F2EC',
  surface: '#E7E3DA',
  surface2: '#DAD5CA',
  ink: '#1C1C1A',
  muted: '#5E5A52',
  line: 'rgba(28,28,26,0.12)',
  border: 'rgba(28,28,26,0.28)',
  accent: '#7A5800',
  accentFill: '#F2B92A',
  accentInk: '#1C1C1A',
  press: '#D9A41F',
  red: '#B8391F',
  green: '#187241',
  placeholder: '#8C877E',
  scrim: 'rgba(28,28,26,0.72)',
  onPlate: '#1C1C1A',
  plateD: '#B5B0A6',
  plateH: '#A39E93',
};

const KEYS = Object.keys(DARK) as (keyof Palette)[];
const cssName = (k: string) => `--c-${k.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}`;

/** CSS declarations for one palette: "--c-bg: #1C1C1A; …". */
export const cssVars = (p: Palette) => KEYS.map((k) => `${cssName(k)}: ${p[k]};`).join(' ');

export const colors: Palette =
  IS_WEB ? (Object.fromEntries(KEYS.map((k) => [k, `var(${cssName(k)})`])) as Palette) : { ...DARK };

/** Routine plate colors. Text on a plate is always colors.onPlate. */
export const PLATES = ['#ff5a3c', '#3ddc84', '#ffc531', colors.plateD, '#ff9f43', '#b8e04a', '#ff7aa8', colors.plateH];

/** Plate color for a routine key (A, B, C…). */
export const plate = (key: string) => PLATES[(key.charCodeAt(0) - 65) % PLATES.length];

/** Profiles pick from the first 5 plates. Plain hex: the choice is saved with the profile. */
export const PROFILE_COLORS = ['#ff5a3c', '#3ddc84', '#ffc531', '#e9e6df', '#ff9f43'];

/** Heart-rate zones 1–5. Index 0 is unused. */
export const ZONE_COLORS = ['', '#c7c2b8', '#3ddc84', '#ffc531', '#ff9f43', '#ff5a3c'] as const;

/**
 * Font families. Each weight is registered as its own family because custom
 * fonts on iOS/Android don't synthesize weights from `fontWeight`.
 */
export const fonts = {
  display700: 'BigShoulders-700',
  display800: 'BigShoulders-800',
  display900: 'BigShoulders-900',
  ui400: 'Archivo-400',
  ui500: 'Archivo-500',
  ui600: 'Archivo-600',
  ui700: 'Archivo-700',
  // Numbers use Archivo too (two fonts at most); Mono adds tabular figures.
  mono400: 'Archivo-500',
  mono500: 'Archivo-600',
} as const;

export const radii = {
  cta: 32,
  logCta: 33,
  card: 22,
  cardLg: 24,
  row: 20,
  setRow: 14,
  sheet: 28,
} as const;

/** Fixed design-frame sizes (iPhone 390 × 844 pt). */
export const frame = {
  statusBar: 50,
  homeIndicator: 28,
  tabBar: 58,
} as const;

/** CSS letter-spacing in em → React Native points. */
export const em = (value: number, fontSize: number) => value * fontSize;
