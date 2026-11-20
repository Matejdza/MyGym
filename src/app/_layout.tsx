import { useFonts } from 'expo-font';
import { DarkTheme, Stack, ThemeProvider, router, usePathname, type Theme } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { Platform, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { setLang, useLang } from '@/i18n';
import { AppDataProvider, useStore } from '@/state/store';
import { fontAssets } from '@/theme/fonts';
import { ConfirmHost } from '@/components/ConfirmHost';
import { LoadErrorScreen, LoadingScreen } from '@/components/LoadScreen';
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
  if (!loaded && !error) return <View style={{ flex: 1, backgroundColor: colors.bg }} />;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ThemeProvider value={theme}>
        <StatusBar style="light" />
        <AppDataProvider>
          <RootStack />
          <ConfirmHost />
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
/** Screens every stack starts on; after a language change the app returns to any other screen it was on. */
const START_PATHS = new Set(['/', '/welcome', '/profiles']);

function RootStack() {
  const { ready, order, activeId, byId } = useStore();
  const lang = useLang();
  const pathname = usePathname();

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  // The open profile's language is the app's language.
  const profileLang = activeId ? byId[activeId]?.settings.language : undefined;
  useEffect(() => {
    if (profileLang) setLang(profileLang);
  }, [profileLang]);

  // Changing the language remounts the stack (key below) so every screen reads
  // the new texts; then the screen that was open is opened again.
  const path = useRef(pathname);
  const shownLang = useRef(lang);
  useEffect(() => {
    if (shownLang.current !== lang) {
      shownLang.current = lang;
      const back = path.current;
      // On the web the new stack already opens the address shown; pushing again would
      // leave a second copy of the screen underneath (Back would open the stale one).
      if (!START_PATHS.has(back) && pathname !== back) requestAnimationFrame(() => router.push(back as never));
    } else path.current = pathname;
  }, [lang, pathname]);

  // A link opened before a profile is picked (e.g. /MyGym/library after a refresh)
  // opens once the profile is picked, instead of always landing on Home.
  const wanted = useRef(START_PATHS.has(pathname) || pathname.startsWith('/onboarding') ? null : pathname);
  const signedIn = activeId !== null;
  useEffect(() => {
    if (!signedIn || !wanted.current) return;
    const to = wanted.current;
    wanted.current = null;
    if (pathname !== to) requestAnimationFrame(() => router.navigate(to as never));
  }, [signedIn, pathname]);

  // Still opening after 12 s: say so, with "Try again".
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    if (ready) return;
    const id = setTimeout(() => setSlow(true), 12_000);
    return () => clearTimeout(id);
  }, [ready]);

  if (!ready) return slow ? <LoadErrorScreen slow /> : <LoadingScreen />;

  return (
    <Stack key={lang} screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
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
