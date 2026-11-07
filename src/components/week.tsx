import { Pressable, StyleSheet, View } from 'react-native';

import { Mono, UI } from '@/components/Txt';
import { Ring } from '@/components/ui';
import type { WeekCell } from '@/domain/week';
import { useScale } from '@/theme/layout';

/** One day of a week strip: label above a lettered circle. */
export function DayCircle({ cell, size, fontSize }: { cell: WeekCell; size: number; fontSize: number }) {
  // Never wider than its column: on narrow phones seven design-size circles don't fit.
  const d = useScale().sz(size);
  const r = 999;
  return (
    <View style={[styles.circle, { width: d, maxWidth: '100%', aspectRatio: 1, borderRadius: r, backgroundColor: cell.fill }]}>
      {cell.ring.kind === 'inset' && <Ring width={cell.ring.width} color={cell.ring.color} radius={r} />}
      {cell.ring.kind === 'outer' && (
        <Ring width={cell.ring.width} color={cell.ring.color} radius={r} offset={cell.ring.gap + cell.ring.width} />
      )}
      <Mono size={fontSize} weight={500} color={cell.text}>
        {cell.letter}
      </Mono>
    </View>
  );
}

/**
 * Seven equal columns: label, then circle. With `onPress` each column is a
 * button; `accessibilityLabels` names each day for screen readers.
 */
export function WeekStrip({
  cells,
  size,
  fontSize,
  labelSize = 13,
  labelWeight = 600,
  gap = 6,
  innerGap = 8,
  onPress,
  accessibilityLabels,
}: {
  cells: WeekCell[];
  size: number;
  fontSize: number;
  labelSize?: number;
  labelWeight?: 400 | 600;
  gap?: number;
  innerGap?: number;
  onPress?: (dayIndex: number) => void;
  accessibilityLabels?: string[];
}) {
  return (
    <View style={[styles.row, { gap }]}>
      {cells.map((c, i) => {
        const content = (
          <>
            <UI size={labelSize} weight={labelWeight} color={c.dayColor}>
              {c.day}
            </UI>
            <DayCircle cell={c} size={size} fontSize={fontSize} />
          </>
        );
        if (!onPress) {
          return (
            <View key={i} style={[styles.col, { gap: innerGap }]}>
              {content}
            </View>
          );
        }
        return (
          <Pressable
            key={i}
            onPress={() => onPress(i)}
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabels?.[i]}
            style={({ pressed }) => [styles.col, { gap: innerGap, opacity: pressed ? 0.6 : 1 }]}>
            {content}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
  col: { flex: 1, alignItems: 'center' },
  circle: { alignItems: 'center', justifyContent: 'center' },
});
