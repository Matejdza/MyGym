// Exercise thumbnail: the first photo, or (for exercises whose photos are not in
// yet) a small body figure with the muscles the exercise works.

import { View, type StyleProp, type ViewStyle } from 'react-native';

import { MiniFigure } from '@/components/BodyMap';
import { Photo } from '@/components/Photo';
import { exPhoto } from '@/data/photos';
import { MUSCLES } from '@/domain/muscles';
import { colors } from '@/theme/tokens';

/** `size` is the height; `width` defaults to the same (square). */
export function ExerciseThumb({ id, size, width, radius, style }: { id: string; size: number; width?: number | `${number}%`; radius: number; style?: StyleProp<ViewStyle> }) {
  const photo = exPhoto(id);
  const box = { width: width ?? size, height: size, borderRadius: radius };
  if (photo) return <Photo source={photo} fill={colors.surface2} style={[box, style]} />;
  const m = MUSCLES[id];
  return (
    <View style={[box, { backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center' }, style]}>
      <MiniFigure primary={m?.primary ?? []} secondary={m?.secondary} height={size * 0.86} />
    </View>
  );
}
