import { Pressable, StyleSheet, View } from 'react-native';

import { UI } from '@/components/Txt';
import { colors } from '@/theme/tokens';

/** Pill segmented control (`seg` in the prototype). Active segment: ink fill by default. */
export function Segmented<K extends string>({
  options,
  value,
  onChange,
  active = colors.ink,
  activeText = colors.bg,
  fontSize = 14,
  style,
}: {
  options: [K, string][];
  value: K;
  onChange: (k: K) => void;
  active?: string;
  activeText?: string;
  fontSize?: number;
  style?: object;
}) {
  return (
    <View style={[styles.wrap, style]}>
      {options.map(([k, label]) => {
        const on = k === value;
        return (
          <Pressable
            key={k}
            onPress={() => onChange(k)}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            style={[styles.btn, { backgroundColor: on ? active : 'transparent' }]}>
            <UI size={fontSize} weight={700} color={on ? activeText : colors.ink} numberOfLines={1}>
              {label}
            </UI>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', gap: 4, padding: 4, borderRadius: 26, backgroundColor: colors.surface },
  btn: { flex: 1, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
});
