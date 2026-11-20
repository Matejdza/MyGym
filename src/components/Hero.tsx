// The big photo at the top of a screen: a rounded card with a margin in both
// themes (owner, 2026-11-20: light and dark should look like the same app).
// The caption (title, meta) sits on the card's bottom over a blurred strip;
// everything else (buttons, text) goes below the card on the page.

import type { ReactNode } from 'react';
import { Platform, StyleSheet, View, type ViewStyle } from 'react-native';

import { DARK_SCOPE, Photo, type Stop } from '@/components/Photo';
import { BackPill } from '@/components/ui';
import type { Img } from '@/data/photos';
import { useTop } from '@/theme/layout';
import { colors } from '@/theme/tokens';

export function Hero({
  source,
  art,
  cardHeight,
  photoTop,
  onBack,
  bar,
  caption,
  children,
}: {
  source: Img | null;
  /** A drawing instead of the photo (e.g. the routine's muscles); the caption then sits under the card. */
  art?: ReactNode;
  /** Older full-bleed height; no longer used (the card is the same in both themes). */
  height?: number;
  /** Height of the photo card. */
  cardHeight: number;
  /** Keep the top of the photo in view (heads). */
  photoTop?: boolean;
  /** Older full-bleed fade; no longer used. */
  stops?: Stop[];
  onBack?: () => void;
  /** Row at the very top instead of the back button (e.g. the profile avatar on Home). */
  bar?: ReactNode;
  /** Title and meta that sit on the photo in both themes (light: at the card's bottom, on a blurred strip). */
  caption?: ReactNode;
  /** Actions and anything else: under the card. */
  children?: ReactNode;
}) {
  const top = useTop();

  return (
    <View style={{ paddingTop: top(54) }}>
      {(bar || onBack) && (
        <View style={styles.lightBar}>{bar ?? <BackPill onPress={onBack} style={{ alignSelf: 'flex-start' }} />}</View>
      )}
      {art ? (
        <View style={[styles.card, styles.artCard, { height: cardHeight }]}>{art}</View>
      ) : (
        <View style={[styles.card, { height: cardHeight }]} {...DARK_SCOPE}>
          <Photo source={source} style={StyleSheet.absoluteFill} top={photoTop} fill={colors.surface2} />
          {caption && (
            <View style={styles.caption}>
              <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.frost, FROST]} />
              {caption}
            </View>
          )}
        </View>
      )}
      {(children || (art && caption)) && (
        <View style={styles.lightText}>
          {art && caption}
          {children && <View style={art && caption ? { marginTop: 16 } : undefined}>{children}</View>}
        </View>
      )}
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
  artCard: { backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  caption: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 16, paddingTop: 48, paddingBottom: 16 },
  frost: { backgroundColor: 'rgba(12,16,24,0.42)' },
});
