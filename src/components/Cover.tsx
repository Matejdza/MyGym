import { StyleSheet, View } from 'react-native';

import { Photo } from '@/components/Photo';
import { Mono } from '@/components/Txt';
import type { Img } from '@/data/photos';
import { colors, plate } from '@/theme/tokens';

/** Routine cover thumbnail with the plate badge in the bottom-left corner. */
export function CoverThumb({
  source,
  routineKey,
  size,
  radius,
  badge,
  badgeFont,
  inset,
}: {
  source: Img | null;
  routineKey: string;
  size: number;
  radius: number;
  badge: number;
  badgeFont: number;
  inset: number;
}) {
  return (
    <View style={{ width: size, height: size }}>
      <Photo source={source} fill={colors.surface2} style={{ width: size, height: size, borderRadius: radius }} />
      <PlateBadge routineKey={routineKey} size={badge} fontSize={badgeFont} style={{ position: 'absolute', left: inset, bottom: inset }} />
    </View>
  );
}

/** Round routine letter on its plate color. */
export function PlateBadge({
  routineKey,
  size,
  fontSize,
  style,
}: {
  routineKey: string;
  size: number;
  fontSize: number;
  style?: object;
}) {
  return (
    <View style={[styles.badge, { width: size, height: size, borderRadius: size / 2, backgroundColor: plate(routineKey) }, style]}>
      <Mono size={fontSize} weight={500} color={colors.bg}>
        {routineKey}
      </Mono>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { alignItems: 'center', justifyContent: 'center' },
});
