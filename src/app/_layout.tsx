import { useFonts } from 'expo-font';
import { DarkTheme, Stack, ThemeProvider, type Theme } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AppDataProvider, useStore } from '@/state/store';
import { fontAssets } from '@/theme/fonts';
import { colors } from '@/theme/tokens';

SplashScreen.preventAutoHideAsync();

// On the web all training history lives in the browser. Ask it to keep the data
// even when the phone runs low on space or the site isn't opened for a while.
if (Platform.OS === 'web' && typeof navigator !== 'undefined') {
  navigator.storage?.persist?.().catch(() => {});
}

const theme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: colors.accent,
    background: colors.bg,
    card: colors.bg,
    text: colors.ink,
    border: colors.line,
  },
};

export default function RootLayout() {
  const [loaded, error] = useFonts(fontAssets);
  if (!loaded && !error) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ThemeProvider value={theme}>
        <StatusBar style="light" />
        <AppDataProvider>
          <RootStack />
        </AppDataProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

/**
 * Which screens exist depends on the profiles on this phone:
 * - no profiles yet → Welcome first (first launch);
 * - profiles but nobody picked → the profile picker;
 * - a profile picked → the app. Picking or creating a profile moves there,
 *   "Switch profile" moves back to the picker.
 */
function RootStack() {
  const { ready, order, activeId } = useStore();

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  const signedIn = activeId !== null;
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
      <Stack.Protected guard={!signedIn}>
        <Stack.Protected guard={order.length === 0}>
          <Stack.Screen name="welcome" />
        </Stack.Protected>
        <Stack.Screen name="profiles" />
        <Stack.Screen name="onboarding" />
      </Stack.Protected>
      <Stack.Protected guard={signedIn}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
    </Stack>
  );
}
