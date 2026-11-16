import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { UI } from '@/components/Txt';
import { colors } from '@/theme/tokens';

/** One line icon per tab, drawn on a 24 × 24 grid with a 2 pt round stroke. */
const ICONS: Record<string, string> = {
  index: 'M4 11 L12 4 L20 11 V20 H14.5 V14 H9.5 V20 H4 Z',
  workout: 'M7 12 H17 M7 7 V17 M17 7 V17 M3.5 9.5 V14.5 M20.5 9.5 V14.5',
  library: 'M4 4 H10 V10 H4 Z M14 4 H20 V10 H14 Z M4 14 H10 V20 H4 Z M14 14 H20 V20 H14 Z',
  progress: 'M4 20 H20 M7 16 V12 M12 16 V6 M17 16 V9',
};

/**
 * Tab bar: icon in a pill with its label underneath, on the surface color so it
 * reads as its own layer. Active tab: ink pill (the same "selected" look as the
 * segmented controls) and ink label. Inactive: muted. Pressed: surface2 pill.
 */
export function TabBar({ state, descriptors, emitter, navigateToTab }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { paddingBottom: insets.bottom }]}>
      {state.routes.map((route, i) => {
        const focused = state.index === i;
        const { options } = descriptors[route.key];
        const label = typeof options.title === 'string' ? options.title : route.name;
        const onPress = () => {
          const event = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) navigateToTab(route.key);
        };
        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            accessibilityRole="tab"
            accessibilityLabel={label}
            accessibilityState={{ selected: focused }}
            style={styles.item}>
            {({ pressed }) => (
              <>
                <View style={[styles.pill, { backgroundColor: focused ? colors.ink : pressed ? colors.surface2 : 'transparent' }]}>
                  <Svg width={24} height={24} viewBox="0 0 24 24">
                    <Path
                      d={ICONS[route.name] ?? ICONS.index}
                      fill="none"
                      stroke={focused ? colors.bg : colors.muted}
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                </View>
                <UI size={14} weight={focused ? 700 : 500} color={focused ? colors.ink : colors.muted} numberOfLines={1}>
                  {label}
                </UI>
              </>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    paddingTop: 8,
    paddingHorizontal: 8,
  },
  item: { flex: 1, height: 64, alignItems: 'center', gap: 4 },
  pill: { width: 64, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
});
