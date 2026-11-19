// The big photo at the top of a screen, in two looks:
// - dark theme: full-bleed photo that fades into the page, light text over it;
// - light theme: the photo as a rounded card with a margin; the caption (title,
//   meta) sits on the card's bottom over a blurred strip, the rest below it. The photos are dark gym shots; as a card they
//   read as pictures on the page instead of a dark block cut off by the cream.

import type { ReactNode } from 'react';
import { Platform, StyleSheet, View, type ViewStyle } from 'react-native';

import { DARK_SCOPE, Photo, Shade, heroStops, type Stop } from '@/components/Photo';
import { BackPill } from '@/components/ui';
import type { Img } from '@/data/photos';
import { useTop } from '@/theme/layout';
import { useIsLight } from '@/theme/themePref';
import { colors } from '@/theme/tokens';

export function Hero({
  source,
  height,
  cardHeight,
  photoTop,
  stops,
  onBack,
  bar,
  caption,
  children,
}: {
  source: Img | null;
  /** Dark theme: height of the photo area (design points, status bar included). */
  height: number;
  /** Light theme: height of the photo card. */
  cardHeight: number;
  /** Keep the top of the photo in view (heads). */
  photoTop?: boolean;
  /** Dark theme overlay; defaults to the standard hero fade. */
  stops?: Stop[];
  onBack?: () => void;
  /** Row at the very top instead of the back button (e.g. the profile avatar on Home). */
  bar?: ReactNode;
  /** Title and meta that sit on the photo in both themes (light: at the card's bottom, on a blurred strip). */
  caption?: ReactNode;
  /** Title, meta and actions: over the photo (dark) or under the card (light). */
  children?: ReactNode;
}) {
  const light = useIsLight();
  const top = useTop();

  if (light) {
    return (
      <View style={{ paddingTop: top(54) }}>
        {(bar || onBack) && (
          <View style={styles.lightBar}>{bar ?? <BackPill onPress={onBack} style={{ alignSelf: 'flex-start' }} />}</View>
        )}
        <View style={[styles.card, { height: cardHeight }]} {...DARK_SCOPE}>
          <Photo source={source} style={StyleSheet.absoluteFill} top={photoTop} fill={colors.surface2} />
          {caption && (
            <View style={styles.caption}>
              <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.frost, FROST]} />
              {caption}
            </View>
          )}
        </View>
        {children && <View style={styles.lightText}>{children}</View>}
      </View>
    );
  }

  return (
    <View style={{ height: top(height) }} {...DARK_SCOPE}>
      <Photo source={source} style={StyleSheet.absoluteFill} top={photoTop} />
      <Shade stops={stops ?? heroStops(0.7, [0.3, 0.45], 0.96)} />
      {bar && <View style={[styles.darkBar, { top: top(54) }]}>{bar}</View>}
      {!bar && onBack && <BackPill onPress={onBack} onPhoto style={{ position: 'absolute', top: top(54), left: 16 }} />}
      <View style={styles.darkText}>
        {caption}
        {children}
      </View>
    </View>
  );
}

/** Web: blur the photo under the caption, fading in from the top so there is no hard edge. */
const FROST = (
  Platform.OS === 'web'
    ? {
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        maskImage: 'linear-gradient(to bottom, transparent 0%, #000 45%)',
        WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, #000 45%)',
      }
    : {}
) as ViewStyle;

const styles = StyleSheet.create({
  lightBar: { paddingHorizontal: 16, marginBottom: 16, minHeight: 40, justifyContent: 'center' },
  card: { marginHorizontal: 16, borderRadius: 24, overflow: 'hidden', backgroundColor: colors.surface2 },
  lightText: { paddingHorizontal: 16, paddingTop: 16 },
  caption: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 16, paddingTop: 48, paddingBottom: 16 },
  frost: { backgroundColor: 'rgba(12,16,24,0.42)' },
  darkBar: { position: 'absolute', left: 16, right: 16 },
  darkText: { position: 'absolute', left: 16, right: 16, bottom: 8 },
});
