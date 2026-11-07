// Design tokens from design_handoff_liftlog/README.md ("Design tokens").

export const colors = {
  bg: '#0d0d0c',
  surface: '#181817',
  surface2: '#232321',
  ink: '#f2f0ea',
  muted: '#9c9890',
  line: 'rgba(242,240,234,0.13)',
  accent: '#ffc531',
  accentInk: '#0d0d0c',
  press: '#e6ad1c',
  red: '#ff5a3c',
  green: '#3ddc84',
  placeholder: '#6b6863',
  /** Fill of the floating Back pill on photo heroes. */
  scrim: 'rgba(13,13,12,0.72)',
} as const;

/** Routine plate colors. Text on a plate is always colors.bg. */
export const PLATES = [
  '#ff5a3c',
  '#3ddc84',
  '#ffc531',
  '#e9e6df',
  '#ff9f43',
  '#b8e04a',
  '#ff7aa8',
  '#c7c2b8',
] as const;

/** Plate color for a routine key (A, B, C…). */
export const plate = (key: string) => PLATES[(key.charCodeAt(0) - 65) % PLATES.length];

/** Profiles pick from the first 5 plates. */
export const PROFILE_COLORS = PLATES.slice(0, 5);

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
  mono400: 'MartianMono-400',
  mono500: 'MartianMono-500',
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
