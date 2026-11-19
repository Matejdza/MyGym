import { View } from 'react-native';

import { Photo } from '@/components/Photo';
import type { Img } from '@/data/photos';
import { colors } from '@/theme/tokens';

/** Routine cover thumbnail (Training plan list). Routine letters are not shown (owner, 2026-11-19). */
export function CoverThumb({ source, size, radius }: { source: Img | null; size: number; radius: number }) {
  return (
    <View style={{ width: size, height: size }}>
      <Photo source={source} fill={colors.surface2} style={{ width: size, height: size, borderRadius: radius }} />
    </View>
  );
}
