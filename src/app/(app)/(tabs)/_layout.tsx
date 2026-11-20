import { Tabs } from 'expo-router/js-tabs';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Platform, View } from 'react-native';

import { TabBar } from '@/components/TabBar';
import { colors } from '@/theme/tokens';

/**
 * The four root tabs. Every other screen is pushed on the root stack above
 * this navigator, so the tab bar only shows at the root of a tab.
 */
export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenLayout={({ navigation, children }) => <HiddenWhenBlurred navigation={navigation}>{children}</HiddenWhenBlurred>}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.bg } }}>
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="workout" options={{ title: 'Workout' }} />
      <Tabs.Screen name="library" options={{ title: 'Exercises' }} />
      <Tabs.Screen name="progress" options={{ title: 'Progress' }} />
    </Tabs>
  );
}

type Nav = { isFocused: () => boolean; addListener: (e: 'focus' | 'blur', cb: () => void) => () => void };

/**
 * Tabs that are not shown stay mounted (so they open instantly). On the web they
 * are made `inert`: screen readers skip them and Tab never lands on their buttons.
 */
function HiddenWhenBlurred({ navigation, children }: { navigation: Nav; children: ReactNode }) {
  const ref = useRef<unknown>(null);
  const [focused, setFocused] = useState(() => navigation.isFocused());
  useEffect(() => {
    const offFocus = navigation.addListener('focus', () => setFocused(true));
    const offBlur = navigation.addListener('blur', () => setFocused(false));
    return () => {
      offFocus();
      offBlur();
    };
  }, [navigation]);
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const node = ref.current as unknown as HTMLElement | null;
    if (node) node.inert = !focused;
  }, [focused]);
  return (
    <View ref={ref as never} style={{ flex: 1 }}>
      {children}
    </View>
  );
}
