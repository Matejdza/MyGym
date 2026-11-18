// The big photo at the top of a screen, in two looks:
// - dark theme: full-bleed photo that fades into the page, light text over it;
// - light theme: the photo as a rounded card with a margin, the text below it
//   in dark ink on the cream page. The photos are dark gym shots; as a card they
//   read as pictures on the page instead of a dark block cut off by the cream.

import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

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
  /** Title, meta and actions: over the photo (dark) or under the card (light). */
  children: ReactNode;
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
        </View>
        <View style={styles.lightText}>{children}</View>
      </View>
    );
  }

  return (
    <View style={{ height: top(height) }} {...DARK_SCOPE}>
      <Photo source={source} style={StyleSheet.absoluteFill} top={photoTop} />
      <Shade stops={stops ?? heroStops(0.7, [0.3, 0.45], 0.96)} />
      {bar && <View style={[styles.darkBar, { top: top(54) }]}>{bar}</View>}
      {!bar && onBack && <BackPill onPress={onBack} onPhoto style={[styles.darkBar, { top: top(54), right: undefined }]} />}
      <View style={styles.darkText}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  lightBar: { paddingHorizontal: 16, marginBottom: 16, minHeight: 40, justifyContent: 'center' },
  card: { marginHorizontal: 16, borderRadius: 24, overflow: 'hidden', backgroundColor: colors.surface2 },
  lightText: { paddingHorizontal: 16, paddingTop: 16 },
  darkBar: { position: 'absolute', left: 16, right: 16 },
  darkText: { position: 'absolute', left: 16, right: 16, bottom: 8 },
});
