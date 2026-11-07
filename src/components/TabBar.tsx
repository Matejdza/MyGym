import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { UI } from '@/components/Txt';
import { colors, frame } from '@/theme/tokens';

/**
 * Tab bar from the design: 58 pt, hairline on top, label with a small bar above it.
 * Active: ink text and a 22 × 6 accent bar. Inactive: muted text and a 6 × 6 transparent dot.
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
            accessibilityState={{ selected: focused }}
            style={styles.item}>
            <View
              style={[
                styles.indicator,
                { width: focused ? 22 : 6, backgroundColor: focused ? colors.accent : 'transparent' },
              ]}
            />
            <UI size={14} weight={600} color={focused ? colors.ink : colors.muted}>
              {label}
            </UI>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.bg,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  item: {
    flex: 1,
    height: frame.tabBar,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  indicator: { height: 6, borderRadius: 3 },
});
