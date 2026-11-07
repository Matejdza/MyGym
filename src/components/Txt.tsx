import { Text, type TextProps, type TextStyle } from 'react-native';

import { useScale } from '@/theme/layout';
import { colors, em, fonts } from '@/theme/tokens';

type Base = TextProps & {
  size: number;
  color?: string;
  /** CSS letter-spacing in em (e.g. -0.05). */
  spacing?: number;
  /** CSS line-height as a multiplier (e.g. 0.9). */
  lh?: number;
  align?: TextStyle['textAlign'];
};

const MAX_SCALE = 1.2;

/** `scale` shrinks text on phones narrower than the 390 pt design (see useScale). */
function render(family: string, props: Base, scale: number, extra?: TextStyle) {
  const { size: designSize, color, spacing, lh, align, style, ...rest } = props;
  const size = Math.round(designSize * scale * 10) / 10;
  const base: TextStyle = {
    fontFamily: family,
    fontSize: size,
    color: color ?? colors.ink,
    letterSpacing: spacing != null ? em(spacing, size) : undefined,
    lineHeight: lh != null ? Math.round(size * lh) : undefined,
    textAlign: align,
    ...extra,
  };
  return <Text maxFontSizeMultiplier={MAX_SCALE} {...rest} style={[base, style]} />;
}

/** Big Shoulders Display, always uppercase. Weights 700/800/900. */
export function Display({ weight = 900, ...props }: Base & { weight?: 700 | 800 | 900 }) {
  const family = weight === 700 ? fonts.display700 : weight === 800 ? fonts.display800 : fonts.display900;
  return render(family, props, useScale().s, { textTransform: 'uppercase' });
}

/** Archivo, all UI text. Weights 400–700. */
export function UI({ weight = 400, ...props }: Base & { weight?: 400 | 500 | 600 | 700 }) {
  const family = { 400: fonts.ui400, 500: fonts.ui500, 600: fonts.ui600, 700: fonts.ui700 }[weight];
  return render(family, props, useScale().s);
}

/** Martian Mono, every number. Weights 400/500. */
export function Mono({ weight = 400, ...props }: Base & { weight?: 400 | 500 }) {
  return render(weight === 500 ? fonts.mono500 : fonts.mono400, props, useScale().s);
}
