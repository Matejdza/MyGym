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
  /** Accent as a fill (main button, chips, progress). Gold in dark, cobalt in light. */
  accentFill: '#F2B92A',
  /** Text and icons on accentFill. */
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

/** "Kobalt" (owner, 2026-11-19): light gray page (not pure white, owner 2026-11-19), cobalt blue in place of the gold. */
export const LIGHT: Palette = {
  bg: '#E8EAEE',
  surface: '#DADEE5',
  surface2: '#CBD0D9',
  ink: '#141922',
  muted: '#4F5867',
  line: 'rgba(20,25,34,0.12)',
  border: 'rgba(20,25,34,0.28)',
  accent: '#1E47B3',
  accentFill: '#2457D6',
  accentInk: '#FFFFFF',
  press: '#1D48B8',
  red: '#B3261E',
  green: '#146B3A',
  placeholder: '#8A93A2',
  scrim: 'rgba(20,25,34,0.72)',
  onPlate: '#141922',
  plateD: '#B4BCC8',
  plateH: '#A3ACBA',
};

const KEYS = Object.keys(DARK) as (keyof Palette)[];
const cssName = (k: string) => `--c-${k.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}`;

/** CSS declarations for one palette: "--c-bg: #1C1C1A; …". */
export const cssVars = (p: Palette) => KEYS.map((k) => `${cssName(k)}: ${p[k]};`).join(' ');

export const colors: Palette =
  IS_WEB ? (Object.fromEntries(KEYS.map((k) => [k, `var(${cssName(k)})`])) as Palette) : { ...DARK };

/**
 * Plate color for a routine key (A, B, C…). One neutral shade for every routine
 * (owner, 2026-11-20): the letter tells routines apart, so the only colors left
 * are the accent and the red of worked muscles (60/30/10). Text on it is colors.onPlate.
 */
export const plate = (_key: string) => colors.plateD;

/** Profiles pick from the first 5 plates. Plain hex: the choice is saved with the profile. */
/** Profile colors (all light enough for dark text on them, at least 4.5:1). */
export const PROFILE_COLORS = ['#ff5a3c', '#3ddc84', '#ffc531', '#e9e6df', '#ff9f43', '#7fb8f5', '#f59bb6', '#5ed3c7', '#c9e265', '#d9b38c'];

/** Heart-rate zones 1–5. Index 0 is unused. */
export const ZONE_COLORS = ['', '#c7c2b8', '#3ddc84', '#ffc531', '#ff9f43', '#ff5a3c'] as const;

/**
 * Type scale (owner, 2026-11-20): every text uses one of these sizes, with its
 * line height. Display is the screen title (Big Shoulders needs size to read
 * as a headline); headings in caps sit tight (1.0); text is 1.5. Exceptions:
 * the big typed numbers of the set and body inputs, and chart tick labels.
 */
export const TYPE = { display: 56, h1: 40, h2: 32, h3: 24, h4: 20, body: 16, mini: 14 } as const;
export const TYPE_SIZES: number[] = Object.values(TYPE);
/** Line height (px) for each size on the scale. */
export const TYPE_LINE: Record<number, number> = { 56: 56, 40: 40, 32: 40, 24: 32, 20: 28, 16: 24, 14: 20 };

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
