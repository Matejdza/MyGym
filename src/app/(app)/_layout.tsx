import { Stack } from 'expo-router';

import { colors } from '@/theme/tokens';

/**
 * Everything after a profile is picked. The tabs sit at the bottom of this stack;
 * every other screen is pushed above them, so the tab bar only shows at the
 * root of a tab.
 */
export default function AppLayout() {
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }} />;
}
