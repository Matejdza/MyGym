import { StyleSheet, View } from 'react-native';
import Svg, { Circle, G, Line, Path } from 'react-native-svg';

import { Mono } from '@/components/Txt';
import { chart } from '@/domain/progress';
import { colors } from '@/theme/tokens';

const HEIGHT = 190;
/** Room on the right for the value labels (322 − 280 in the design). */
const LABEL_SPACE = 42;
const X_LABEL_WIDTH = 80;
/** Lets the first point's dot spill past the left edge, like `overflow: visible` in the design. */
const BLEED = 8;

/**
 * 12-week line chart: 3 grid lines with values on the right, x labels at the
 * start / middle / end, the last point highlighted, optional dashed green goal line.
 */
export function LineChart({ vals, labels, width, target }: { vals: number[]; labels: string[]; width: number; target?: number }) {
  const w = width - LABEL_SPACE;
  const g = chart(vals, labels, w, target);

  return (
    <View style={{ width, height: HEIGHT }}>
      <Svg width={width + BLEED} height={HEIGHT} style={{ position: 'absolute', top: 0, left: -BLEED }}>
        <G x={BLEED}>
          {g.grid.map((l, i) => (
            <Line key={i} x1={0} x2={w} y1={l.y} y2={l.y} stroke={colors.line} strokeWidth={1} />
          ))}
          {g.target && <Line x1={0} x2={w} y1={g.target.y} y2={g.target.y} stroke={colors.green} strokeWidth={1.5} strokeDasharray="4 5" />}
          <Path d={g.d} fill="none" stroke={colors.accent} strokeWidth={2.5} strokeLinejoin="round" />
          {g.pts.map((p, i) => (
            <Circle key={i} cx={p.x} cy={p.y} r={3} fill={colors.surface} stroke={colors.accent} strokeWidth={1.5} />
          ))}
          <Circle cx={g.last.x} cy={g.last.y} r={6} fill={colors.accent} />
        </G>
      </Svg>

      {g.grid.map((l, i) => (
        <Mono key={i} size={11} lh={14 / 11} color={colors.muted} style={[styles.right, { top: l.y - 7 }]}>
          {l.label}
        </Mono>
      ))}
      {g.target && (
        <Mono size={11} lh={14 / 11} color={colors.green} style={[styles.right, { top: g.target.y - 17 }]}>
          {g.target.label}
        </Mono>
      )}
      {g.xl.map((x, i) => (
        <Mono
          key={i}
          size={11}
          lh={14 / 11}
          color={colors.muted}
          numberOfLines={1}
          align={x.align === 'start' ? 'left' : x.align === 'end' ? 'right' : 'center'}
          style={[
            styles.bottom,
            {
              width: X_LABEL_WIDTH,
              left: x.align === 'start' ? x.x : x.align === 'end' ? x.x - X_LABEL_WIDTH : x.x - X_LABEL_WIDTH / 2,
            },
          ]}>
          {x.label}
        </Mono>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  right: { position: 'absolute', right: 0 },
  bottom: { position: 'absolute', bottom: 0 },
});
