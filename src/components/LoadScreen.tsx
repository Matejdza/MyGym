// What the app shows before it can show anything else (owner, 2026-11-20):
// - while the database opens: the name and a quiet spinner (after a short wait,
//   so a fast start shows no flash);
// - when opening fails or takes far too long: what happened and "Try again",
//   instead of an empty screen.

import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';

import { Display, UI } from '@/components/Txt';
import { PrimaryButton } from '@/components/ui';
import { t } from '@/i18n';
import { colors } from '@/theme/tokens';

const SHOW_SPINNER_MS = 400;

export function reloadApp() {
  if (Platform.OS === 'web' && typeof window !== 'undefined') window.location.reload();
}

export function LoadingScreen() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setShow(true), SHOW_SPINNER_MS);
    return () => clearTimeout(id);
  }, []);
  return (
    <View style={styles.screen} accessibilityLabel={t('Loading')} accessibilityRole="progressbar">
      {show && (
        <>
          <Display size={32} weight={900}>
            LIFTLOG
          </Display>
          <ActivityIndicator color={colors.ink} style={{ marginTop: 24 }} />
        </>
      )}
    </View>
  );
}

export function LoadErrorScreen({ slow }: { slow?: boolean }) {
  return (
    <View style={styles.screen}>
      <Display size={32} weight={900} align="center">
        {slow ? t('This is taking too long') : t('Something went wrong')}
      </Display>
      <UI size={16} color={colors.muted} align="center" style={styles.text}>
        {slow
          ? t('The app could not finish loading. Check your connection and try again.')
          : t('The app could not open your data. Your workouts are still saved on this phone. Try again.')}
      </UI>
      {Platform.OS === 'web' && <PrimaryButton label={t('Try again')} onPress={reloadApp} style={styles.button} />}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: colors.bg },
  text: { marginTop: 16, maxWidth: 320 },
  button: { marginTop: 32, alignSelf: 'stretch' },
});
