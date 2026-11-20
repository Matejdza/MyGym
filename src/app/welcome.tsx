import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Photo, Shade, heroStops, DARK_SCOPE } from '@/components/Photo';
import { Display, UI } from '@/components/Txt';
import { PrimaryButton } from '@/components/ui';
import { IMAGES } from '@/data/photos';
import { useTop } from '@/theme/layout';
import { useIsLight } from '@/theme/themePref';
import { colors } from '@/theme/tokens';
import { t } from '@/i18n';

/**
 * First launch: photo, wordmark, headline and the two ways in. It follows the
 * phone's theme from the first screen (owner, 2026-11-20): dark = full-screen
 * photo; light = the photo as a rounded card on the light page, cobalt button.
 */
export default function Welcome() {
  const insets = useSafeAreaInsets();
  const top = useTop();
  const light = useIsLight();

  const text = (
    <>
      <Display size={24} weight={900} spacing={0.14} color={colors.accent}>
        {t('LIFTLOG')}
      </Display>
      <Display size={56} weight={900}>
        {t('Every set counts.')}
      </Display>
      <UI size={20} color={colors.muted} style={{ maxWidth: 310 }}>
        {t('Plan your week, log each set and watch your lifts go up.')}
      </UI>
    </>
  );
  const actions = (
    <>
      <PrimaryButton label={t('CREATE PROFILE')} style={{ marginTop: 8 }} onPress={() => router.push('/onboarding')} />
      <Pressable onPress={() => router.push('/profiles')} accessibilityRole="button" style={styles.link}>
        <UI size={16} weight={600}>
          {t('I already have a profile')}
        </UI>
      </Pressable>
    </>
  );

  if (light) {
    return (
      <View style={[styles.screen, { paddingTop: top(54), paddingBottom: 24 + insets.bottom }]}>
        <View style={styles.card} {...DARK_SCOPE}>
          <Photo source={IMAGES.hero} style={StyleSheet.absoluteFill} top fill={colors.surface2} />
        </View>
        <View style={[styles.lightText, { gap: 16 }]}>
          {text}
          {actions}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen} {...DARK_SCOPE}>
      <Photo source={IMAGES.hero} style={StyleSheet.absoluteFill} fill={colors.bg} />
      <Shade stops={heroStops(0.55, [0.22, 0.38], 0.72)} />
      <View style={[styles.content, { paddingBottom: 24 + insets.bottom }]}>
        {text}
        {actions}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { flex: 1, justifyContent: 'flex-end', paddingHorizontal: 24, gap: 16 },
  card: { flex: 1, minHeight: 200, marginHorizontal: 16, borderRadius: 24, overflow: 'hidden', backgroundColor: colors.surface2 },
  lightText: { paddingHorizontal: 24, paddingTop: 24 },
  link: { height: 48, alignItems: 'center', justifyContent: 'center' },
});
