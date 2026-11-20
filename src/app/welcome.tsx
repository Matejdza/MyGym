import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Photo, DARK_SCOPE } from '@/components/Photo';
import { Display, UI } from '@/components/Txt';
import { PrimaryButton } from '@/components/ui';
import { IMAGES } from '@/data/photos';
import { useTop } from '@/theme/layout';
import { colors } from '@/theme/tokens';
import { t } from '@/i18n';

/**
 * First launch: photo, wordmark, headline and the two ways in. It follows the
 * phone's theme from the first screen, with the same layout in both themes.
 */
export default function Welcome() {
  const insets = useSafeAreaInsets();
  const top = useTop();

  const text = (
    <>
      {/* The name looks the same in both themes: page ink, not the theme accent. */}
      <Display size={24} weight={900} spacing={0.14}>
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

  // One layout in both themes (owner, 2026-11-20): the photo as a rounded card,
  // the text below on the page. Only the page, text and button colors follow the theme.
  return (
    <View style={[styles.screen, { paddingTop: top(54), paddingBottom: 24 + insets.bottom }]}>
      <View style={styles.card} {...DARK_SCOPE}>
        <Photo source={IMAGES.hero} style={[StyleSheet.absoluteFill, styles.zoom]} top fill={colors.surface2} />
      </View>
      <View style={[styles.lightText, { gap: 16 }]}>
        {text}
        {actions}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  card: { flex: 1, minHeight: 200, marginHorizontal: 16, borderRadius: 24, overflow: 'hidden', backgroundColor: colors.surface2 },
  lightText: { paddingHorizontal: 24, paddingTop: 24 },
  /** A little closer than the full photo, so the people read larger in the card. */
  zoom: { transform: [{ scale: 1.18 }, { translateY: 18 }] },
  link: { height: 48, alignItems: 'center', justifyContent: 'center' },
});
