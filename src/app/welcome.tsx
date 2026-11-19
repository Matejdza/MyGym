import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Photo, Shade, heroStops, DARK_SCOPE } from '@/components/Photo';
import { Display, UI } from '@/components/Txt';
import { PrimaryButton } from '@/components/ui';
import { IMAGES } from '@/data/photos';
import { colors } from '@/theme/tokens';
import { t } from '@/i18n';

/** First launch: full-screen photo, wordmark, headline and the two ways in. */
export default function Welcome() {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.screen} {...DARK_SCOPE}>
      <Photo source={IMAGES.hero} style={StyleSheet.absoluteFill} fill={colors.bg} />
      <Shade stops={heroStops(0.55, [0.22, 0.38], 0.72)} />
      <View style={[styles.content, { paddingBottom: 24 + insets.bottom }]}>
        <Display size={24} weight={900} spacing={0.14} color={colors.accent}>
          {t('LIFTLOG')}
        </Display>
        <Display size={56} weight={900} lh={0.88}>
          {t('Every set counts.')}
        </Display>
        <UI size={20} lh={1.45} color={colors.muted} style={{ maxWidth: 310 }}>
          {t('Plan your week, log each set and watch your lifts go up.')}
        </UI>
        <PrimaryButton
          label={t('CREATE PROFILE')}
          style={{ marginTop: 8 }}
          onPress={() => router.push('/onboarding')}
        />
        <Pressable onPress={() => router.push('/profiles')} accessibilityRole="button" style={styles.link}>
          <UI size={16} weight={600}>
            {t('I already have a profile')}
          </UI>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { flex: 1, justifyContent: 'flex-end', paddingHorizontal: 24, gap: 16 },
  link: { height: 48, alignItems: 'center', justifyContent: 'center' },
});
