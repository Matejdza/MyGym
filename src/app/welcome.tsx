import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Photo, Shade, heroStops } from '@/components/Photo';
import { Display, UI } from '@/components/Txt';
import { PrimaryButton } from '@/components/ui';
import { IMAGES } from '@/data/photos';
import { colors } from '@/theme/tokens';

/** First launch: full-screen photo, wordmark, headline and the two ways in. */
export default function Welcome() {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.screen}>
      <Photo source={IMAGES.hero} style={StyleSheet.absoluteFill} fill={colors.bg} />
      <Shade stops={heroStops(0.55, [0.22, 0.38], 0.72)} />
      <View style={[styles.content, { paddingBottom: 20 + insets.bottom }]}>
        <Display size={22} weight={900} spacing={0.14} color={colors.accent}>
          LIFTLOG
        </Display>
        <Display size={70} weight={900} lh={0.88}>
          Every set counts.
        </Display>
        <UI size={17} lh={1.45} color={colors.muted} style={{ maxWidth: 310 }}>
          Plan your week, log each set and watch your lifts go up.
        </UI>
        <PrimaryButton
          label="CREATE PROFILE"
          style={{ marginTop: 10 }}
          onPress={() => router.push('/onboarding')}
        />
        <Pressable onPress={() => router.push('/profiles')} accessibilityRole="button" style={styles.link}>
          <UI size={16} weight={600}>
            I already have a profile
          </UI>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { flex: 1, justifyContent: 'flex-end', paddingHorizontal: 24, gap: 14 },
  link: { height: 48, alignItems: 'center', justifyContent: 'center' },
});
