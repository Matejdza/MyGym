import { StyleSheet, View } from 'react-native';

import { Mono, UI } from '@/components/Txt';
import { Ring } from '@/components/ui';
import type { WeekCell } from '@/domain/week';

/** One day of a week strip: label above a lettered circle. */
export function DayCircle({ cell, size, fontSize }: { cell: WeekCell; size: number; fontSize: number }) {
  const r = size / 2;
  return (
    <View style={[styles.circle, { width: size, height: size, borderRadius: r, backgroundColor: cell.fill }]}>
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

/** Seven equal columns: day label, then circle. */
export function WeekStrip({
  cells,
  size,
  fontSize,
  labelSize = 13,
  labelWeight = 600,
  gap = 6,
  innerGap = 8,
}: {
  cells: WeekCell[];
  size: number;
  fontSize: number;
  labelSize?: number;
  labelWeight?: 400 | 600;
  gap?: number;
  innerGap?: number;
}) {
  return (
    <View style={[styles.row, { gap }]}>
      {cells.map((c, i) => (
        <View key={i} style={[styles.col, { gap: innerGap }]}>
          <UI size={labelSize} weight={labelWeight} color={c.dayColor}>
            {c.day}
          </UI>
          <DayCircle cell={c} size={size} fontSize={fontSize} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
  col: { flex: 1, alignItems: 'center' },
  circle: { alignItems: 'center', justifyContent: 'center' },
});
