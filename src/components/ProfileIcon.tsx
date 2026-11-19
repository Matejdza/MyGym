// Profile pictures without a photo: the first letter of the name, one of a few
// sport icons, or an illustrated avatar (a head and shoulders with a hairstyle
// and skin tone), all on the profile color. No emoji (owner's design rules).

import Svg, { Circle, Ellipse, G, Path } from 'react-native-svg';

import { colors } from '@/theme/tokens';

/** Line icons on a 24 × 24 grid. */
export const PROFILE_ICONS: Record<string, string> = {
  dumbbell: 'M6.5 6.5v11M3.5 9v6M17.5 6.5v11M20.5 9v6M6.5 12h11',
  kettlebell: 'M9 6.5a3 3 0 0 1 6 0M8.2 9h7.6M7 20h10a1.8 1.8 0 0 0 1.7-2.3l-1.6-6A3.5 3.5 0 0 0 13.7 9h-3.4a3.5 3.5 0 0 0-3.4 2.7l-1.6 6A1.8 1.8 0 0 0 7 20z',
  flame: 'M12 21c3.9 0 6.5-2.6 6.5-6.2 0-3.7-3-5.6-3.6-9.3-1.8 1.3-3 3.3-3 5.4-1.1-.8-1.8-2.1-1.9-3.4C7.5 9.2 5.5 11.6 5.5 14.8 5.5 18.4 8.1 21 12 21z',
  bolt: 'M13.5 3 5.5 13.5h6l-1 7.5 8-10.5h-6l1-7.5z',
  heart: 'M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z',
  mountain: 'M3 19.5 9.5 8l4 7 2.5-4 5 8.5z',
  star: 'M12 3.5l2.6 5.6 6 .7-4.5 4.1 1.2 6-5.3-3-5.3 3 1.2-6L3.4 9.8l6-.7z',
  trophy: 'M8 4h8v5a4 4 0 0 1-8 0zM8 6H5.5a2.5 2.5 0 0 0 2.8 3.5M16 6h2.5a2.5 2.5 0 0 1-2.8 3.5M12 13v4M10 17h4v3.5h-4zM8 20.5h8',
  target: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7.5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9zM12 11.5v1',
  stopwatch: 'M12 21a7.5 7.5 0 1 0 0-15 7.5 7.5 0 0 0 0 15zM12 13.5V10M10 2.5h4M12 2.5V6M18 6.5l1.5-1.5',
  bike: 'M6 18.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM18 18.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM6 15l3.5-6.5h5L18 15M9.5 8.5 12 15H6M13 5.5h3',
  waves: 'M3 8.5c2-1.5 4-1.5 6 0s4 1.5 6 0 4-1.5 6 0M3 13.5c2-1.5 4-1.5 6 0s4 1.5 6 0 4-1.5 6 0M3 18.5c2-1.5 4-1.5 6 0s4 1.5 6 0 4-1.5 6 0',
  sun: 'M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4',
  moon: 'M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z',
  leaf: 'M5 19C5 10 10 5 19.5 4.5 19 14 14 19 5 19zM5 19l8-8',
  music: 'M9 18V5.5l10-2V16M9 18a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0zM19 16a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z',
  crown: 'M4.5 19h15M5 16 4 7l4.5 3.5L12 5l3.5 5.5L20 7l-1 9z',
};

const SKIN = { light: '#F3D2B5', mid: '#D9A277', tan: '#B27A52', deep: '#7A4B30' };
const HAIR = { dark: '#1C1C1A', brown: '#5A3A22', blond: '#E2B65A', grey: '#B9B4AA' };
/** Sport tops in dark shades, so they stand apart from every profile color. */
const TOP = { black: '#1C1C1A', navy: '#22344A', forest: '#24402F', wine: '#4A2524', graphite: '#33332F' };

type Style = 'short' | 'long' | 'ponytail' | 'bun' | 'beard' | 'cap' | 'curly' | 'bob';
type Look = { skin: string; hair: string; top: string; eyes: string; style: Style };

const EYES = { brown: '#6B4A2B', hazel: '#7A6A3A', green: '#4F6B4A', blue: '#3E6A8A' };

/** Illustrated avatars, keyed "av-…". Mixed hairstyles, skin tones and tops. */
export const PROFILE_AVATARS: Record<string, Look> = {
  'av-long': { skin: SKIN.light, hair: HAIR.brown, top: TOP.navy, eyes: EYES.green, style: 'long' },
  'av-ponytail': { skin: SKIN.mid, hair: HAIR.dark, top: TOP.black, eyes: EYES.brown, style: 'ponytail' },
  'av-bun': { skin: SKIN.deep, hair: HAIR.dark, top: TOP.wine, eyes: EYES.brown, style: 'bun' },
  'av-bob': { skin: SKIN.light, hair: HAIR.blond, top: TOP.forest, eyes: EYES.blue, style: 'bob' },
  'av-short': { skin: SKIN.mid, hair: HAIR.dark, top: TOP.navy, eyes: EYES.hazel, style: 'short' },
  'av-beard': { skin: SKIN.tan, hair: HAIR.brown, top: TOP.forest, eyes: EYES.brown, style: 'beard' },
  'av-cap': { skin: SKIN.light, hair: HAIR.dark, top: TOP.graphite, eyes: EYES.blue, style: 'cap' },
  'av-curly': { skin: SKIN.deep, hair: HAIR.dark, top: TOP.black, eyes: EYES.brown, style: 'curly' },
};

/** Darker (amount < 0) or lighter (amount > 0) version of a hex color. */
function tint(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16);
  const f = (c: number) => Math.max(0, Math.min(255, Math.round(amount < 0 ? c * (1 + amount) : c + (255 - c) * amount)));
  const r = f(n >> 16);
  const g = f((n >> 8) & 255);
  const b = f(n & 255);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

const INK = '#1C1C1A';
const GOLD = '#F2B92A';

/** Mirror a path drawn for the left side of the face onto the right side. */
const mirror = (d: string) => d.replace(/(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g, (_, x, y) => `${100 - Number(x)} ${y}`);

const FACE = 'M31 30C31 20 39 16 50 16S69 20 69 30V46C69 56 62 66 55 69C52 70.5 48 70.5 45 69C38 66 31 56 31 46Z';
const FACE_SHADE = 'M44 16.4C36 17.5 31 22 31 30V46C31 56 38 66 45 69C46.5 69.7 48 70.2 49.5 70.3L45 44Z';
const EYE = 'M35.5 42Q41 37.6 46.5 42Q41 45.6 35.5 42Z';
const LID = 'M35 42.2Q41 37 47 41.6';
const BROW_M = 'M34 37L41 34.6L47.2 35.6L47 37.6L41 36.8L34.6 38.6Z';
const BROW_F = 'M34.6 37.4Q40.5 34.4 46.8 36.1L46.6 37.2Q40.5 35.9 34.9 38.4Z';

/**
 * Head and shoulders on a 100 × 100 grid, filling the circle it sits in.
 * Flat vector look: two tones on the skin, hair and top (lit right side,
 * shaded left side), almond eyes with a colored iris, a collar or crew neck.
 */
function Face({ look, size }: { look: Look; size: number }) {
  const { skin, hair, top, eyes, style } = look;
  const fem = style === 'long' || style === 'ponytail' || style === 'bun' || style === 'bob';
  const shade = tint(skin, -0.14);
  const deep = tint(skin, -0.3);
  const hairShade = tint(hair, hair === HAIR.dark ? 0.12 : -0.18);
  const shine = tint(hair, hair === HAIR.dark ? 0.3 : 0.35);
  const brow = hair === HAIR.blond || hair === HAIR.grey ? tint(hair, -0.45) : hair === HAIR.dark ? INK : tint(hair, -0.2);
  const topLit = tint(top, 0.22);
  const collar = !fem;
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      {/* Hair behind the head */}
      {style === 'long' && <Path d="M26 42C23 18 36 9 50 9S77 18 74 42L79 86C66 92 34 92 21 86Z" fill={hairShade} />}
      {style === 'bob' && <Path d="M27 42C25 18 37 10 50 10S75 18 73 42L74 65C74 67 72 68 70 68H30C28 68 26 67 26 65Z" fill={hairShade} />}
      {style === 'ponytail' && <Path d="M64 20C80 20 86 44 77 66C77 50 73 36 62 28Z" fill={hairShade} />}
      {style === 'bun' && <Circle cx={50} cy={10} r={9.5} fill={hairShade} />}

      {/* Neck with the jaw's shadow, then the top */}
      <Path d="M42 60H58V86H42Z" fill={shade} />
      <Path d="M42 62H58V70C55 73 45 73 42 70Z" fill={deep} />
      <Path d="M6 100C8 87 20 80 38 77L50 86L62 77C80 80 92 87 94 100Z" fill={topLit} />
      <Path d="M6 100C8 87 20 80 38 77L50 86V100Z" fill={top} />
      {collar ? (
        <G>
          <Path d="M38 74L50 86L43 93L35 79Z" fill={tint(top, 0.1)} />
          <Path d="M62 74L50 86L57 93L65 79Z" fill={tint(top, 0.38)} />
          <Path d="M50 86V100" stroke={tint(top, -0.25)} strokeWidth={0.8} />
        </G>
      ) : (
        <Path d="M38 77Q50 89 62 77" stroke={tint(top, 0.45)} strokeWidth={2.2} fill="none" strokeLinecap="round" />
      )}

      {/* Ears, head, shaded side */}
      <Ellipse cx={30.5} cy={46} rx={4} ry={6} fill={shade} />
      <Ellipse cx={69.5} cy={46} rx={4} ry={6} fill={skin} />
      <Ellipse cx={30.5} cy={46.5} rx={1.8} ry={3.2} fill={deep} />
      <Ellipse cx={69.5} cy={46.5} rx={1.8} ry={3.2} fill={shade} />
      <Path d={FACE} fill={skin} />
      <Path d={FACE_SHADE} fill={shade} />

      {/* Eyes: white almond, colored iris, pupil, highlight, upper lid */}
      {[EYE, mirror(EYE)].map((d, i) => (
        <Path key={`e${i}`} d={d} fill="#FFFFFF" />
      ))}
      {[41, 59].map((cx) => (
        <G key={`i${cx}`}>
          <Circle cx={cx} cy={41.9} r={2.3} fill={eyes} />
          <Circle cx={cx} cy={41.9} r={1.15} fill={INK} />
          <Circle cx={cx + 0.8} cy={41.1} r={0.6} fill="#FFFFFF" />
        </G>
      ))}
      {[LID, mirror(LID)].map((d, i) => (
        <Path key={`l${i}`} d={d} stroke={INK} strokeWidth={fem ? 1.5 : 1.1} strokeLinecap="round" fill="none" />
      ))}
      {fem && <Path d="M35.2 42.2L33.6 41M64.8 42.2L66.4 41" stroke={INK} strokeWidth={1.1} strokeLinecap="round" fill="none" />}
      {[fem ? BROW_F : BROW_M, mirror(fem ? BROW_F : BROW_M)].map((d, i) => (
        <Path key={`b${i}`} d={d} fill={brow} />
      ))}

      {/* Nose (shaded side), mouth */}
      <Path d="M49.5 43C48.5 48 46 52 46 54.3C47.5 56.2 52.5 56.2 54 54.3C52 55 49.8 54.3 49.3 53.2Z" fill={deep} opacity={0.75} />
      {fem ? (
        <G>
          <Path d="M44.5 61Q47.5 59.4 50 60.4Q52.5 59.4 55.5 61Q50 65.2 44.5 61Z" fill="#B5545A" />
          <Path d="M44.5 61Q50 62 55.5 61" stroke="#7A2E2A" strokeWidth={0.7} fill="none" />
        </G>
      ) : (
        <G>
          <Path d="M44 61Q50 62.3 56 61" stroke={tint(skin, -0.45)} strokeWidth={1.1} strokeLinecap="round" fill="none" />
          <Path d="M46.5 63.4Q50 65 53.5 63.4" stroke={deep} strokeWidth={1.4} strokeLinecap="round" fill="none" />
        </G>
      )}

      {/* Hair on top */}
      {(style === 'short' || style === 'beard') && (
        <G>
          <Path
            d="M29 41C27 31 28 23 33 17L30 8L39 12.5L42 4L50 10.5L58 3L60 10.5L71 8.5L67 17C72 23 72 32 71 41C69 34 67 30 64 27.5C59 30.5 51 30 46 27.5C41 30.5 36 31.5 33 33.5C31 35.5 30 38 29 41Z"
            fill={hair}
          />
          <Path d="M29 41C27 31 28 23 33 17L30 8L39 12.5L42 4L46 7.5C40 14 37 24 38 30.5C35 31.8 33.5 32.5 33 33.5C31 35.5 30 38 29 41Z" fill={tint(hair, hair === HAIR.dark ? -0.3 : -0.25)} />
          <Path d="M47 12Q56 9.5 63 13.5" stroke={shine} strokeWidth={1.6} strokeLinecap="round" fill="none" />
        </G>
      )}
      {style === 'long' && (
        <G>
          <Path d="M30 40C28 22 37 12.5 50 12.5S72 22 70 40C67 29 60 22 47 23C40 25 34 31 30 40Z" fill={hair} />
          <Path d="M52 15.5Q61 16 66 23" stroke={shine} strokeWidth={1.6} strokeLinecap="round" fill="none" />
        </G>
      )}
      {style === 'bob' && (
        <G>
          <Path d="M30 37C29.5 21 38 13.5 50 13.5S70.5 21 70 37C68 33 66 31 64 30H36C34 31 32 33 30 37Z" fill={hair} />
          <Path d="M53 16Q61 17 66 23" stroke={shine} strokeWidth={1.6} strokeLinecap="round" fill="none" />
        </G>
      )}
      {(style === 'ponytail' || style === 'bun') && (
        <G>
          <Path d="M30 38C29 22 38 13 50 13S71 22 70 38C66 28 58 23.5 50 23.5S34 28 30 38Z" fill={hair} />
          <Path d="M52 15.5Q61 16 66 22" stroke={shine} strokeWidth={1.6} strokeLinecap="round" fill="none" />
        </G>
      )}
      {style === 'ponytail' && <Path d="M63.5 21.5L67.5 25.5" stroke={GOLD} strokeWidth={3} strokeLinecap="round" />}
      {style === 'bun' && <Path d="M43.5 17.6Q50 15.5 56.5 17.6" stroke={GOLD} strokeWidth={2.6} strokeLinecap="round" fill="none" />}
      {style === 'long' && (
        <G fill={GOLD}>
          <Circle cx={30.5} cy={53.5} r={1.8} />
          <Circle cx={69.5} cy={53.5} r={1.8} />
        </G>
      )}
      {style === 'beard' && (
        <G fill={hair}>
          <Path d="M31 46C32 59 40 70 50 71S68 59 69 46C67 54 62 58.5 57 58.5C54 57.5 46 57.5 43 58.5C38 58.5 33 54 31 46Z" />
          <Path d="M42.5 59.3Q50 55.6 57.5 59.3Q50 58.6 42.5 59.3Z" />
          <Path d="M31 46C32 59 40 70 50 71L48 64C42 62 35 56 31 46Z" fill={tint(hair, -0.3)} />
        </G>
      )}
      {style === 'cap' && (
        <G>
          <Path d="M30 42L31.5 34H35L34 44Z" fill={hair} />
          <Path d="M70 42L68.5 34H65L66 44Z" fill={hair} />
          <Path d="M28 37C28 20 37 11.5 50 11.5S72 20 72 37C66 33 58 31 50 31S34 33 28 37Z" fill={TOP.navy} />
          <Path d="M28 37C28 20 37 11.5 50 11.5C43 14 38 22 38 32C34 33 31 35 28 37Z" fill={tint(TOP.navy, -0.3)} />
          <Path d="M26.5 36C36 30.5 64 30.5 73.5 36C74.5 38 72.5 40 70.5 39.5C62 36 38 36 29.5 39.5C27.5 40 25.5 38 26.5 36Z" fill={tint(TOP.navy, -0.45)} />
          <Circle cx={50} cy={22} r={2.4} fill={GOLD} />
        </G>
      )}
      {style === 'curly' && (
        <G>
          <G fill={tint(hair, -0.3)}>
            <Circle cx={32} cy={33} r={6} />
            <Circle cx={34} cy={23} r={7} />
            <Circle cx={42} cy={15} r={7.5} />
          </G>
          <G fill={hair}>
            <Circle cx={52} cy={12.5} r={8} />
            <Circle cx={61} cy={16} r={7.5} />
            <Circle cx={67} cy={24} r={7} />
            <Circle cx={68.5} cy={33} r={5.5} />
            <Circle cx={45} cy={23} r={6} />
            <Circle cx={56} cy={23} r={6} />
          </G>
          <Path d="M54 7.5Q60 8.5 63 12" stroke={shine} strokeWidth={1.6} strokeLinecap="round" fill="none" />
        </G>
      )}
    </Svg>
  );
}

/**
 * A profile icon or avatar for a circle of diameter `circle`: icons sit in the
 * middle at half the size, avatars fill the circle (its container clips them).
 */
export function ProfileGlyph({ icon, circle }: { icon: string; circle: number }) {
  const look = PROFILE_AVATARS[icon];
  if (look) return <Face look={look} size={circle} />;
  const size = circle * 0.5;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d={PROFILE_ICONS[icon] ?? PROFILE_ICONS.dumbbell} fill="none" stroke={colors.onPlate} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
