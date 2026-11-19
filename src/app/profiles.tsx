import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Hero } from '@/components/Hero';
import { ProfileGlyph } from '@/components/ProfileIcon';
import { heroStops } from '@/components/Photo';
import { Display, Mono, UI } from '@/components/Txt';
import { Ring } from '@/components/ui';
import { GOALS } from '@/data/catalog';
import { IMAGES } from '@/data/photos';
import { workoutsPerWeek } from '@/domain/plan';
import { useStore } from '@/state/store';
import { colors } from '@/theme/tokens';
import { t } from '@/i18n';

const AVATAR = 112;
const SIDE = 24;
const COL_GAP = 16;

/** "Who's lifting today?" — the app's photo on top, then pick a profile or add one. */
export default function Profiles() {
  const { order, byId, selectProfile } = useStore();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const cellWidth = (width - SIDE * 2 - COL_GAP) / 2;
  const cell = [styles.cell, { width: cellWidth }];
  const avatar = Math.min(AVATAR, cellWidth);
  const avatarStyle = {
    width: avatar,
    height: avatar,
    borderRadius: avatar / 2,
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={[styles.content, { paddingBottom: 24 + insets.bottom }]}>
      <View style={styles.hero}>
        <Hero
          source={IMAGES.hero}
          height={400}
          cardHeight={320}
          photoTop
          stops={heroStops(0.5, [0.22, 0.4], 0.94)}
          caption={
            <>
              <Display size={20} weight={900} spacing={0.14} color={colors.accent}>
                {t('LIFTLOG')}
              </Display>
              <Display size={56} weight={900} lh={0.92} style={{ marginTop: 8 }}>
                {t("Who's lifting today?")}
              </Display>
            </>
          }
        />
      </View>

      <View style={styles.grid}>
        {order.map((id) => {
          const p = byId[id].profile;
          const goal = GOALS.find((g) => g.key === p.goal)?.label.toLowerCase() ?? '';
          return (
            <Pressable key={id} onPress={() => selectProfile(id)} accessibilityRole="button" style={cell}>
              <View style={[styles.avatar, avatarStyle, { backgroundColor: p.color }]}>
                {/* inset 0 0 0 15px rgba(0,0,0,.28) under inset 0 0 0 14px rgba(0,0,0,.16) */}
                <Ring width={15} color="rgba(0,0,0,0.28)" radius={avatar / 2} />
                <Ring width={14} color="rgba(0,0,0,0.16)" radius={avatar / 2} />
                {p.avatar ? (
                  <ProfileGlyph icon={p.avatar} circle={avatar} />
                ) : (
                  <Display size={56} weight={900} color={colors.onPlate}>
                    {(p.name[0] || '?').toUpperCase()}
                  </Display>
                )}
              </View>
              <UI size={20} weight={600}>
                {p.name}
              </UI>
              <UI size={14} color={colors.muted} style={styles.meta}>
                {t('{n}× a week, {goal}', { n: workoutsPerWeek(p.plan), goal })}
              </UI>
            </Pressable>
          );
        })}
        <Pressable onPress={() => router.push('/onboarding')} accessibilityRole="button" style={cell}>
          <View style={[styles.avatar, avatarStyle, styles.add]}>
            <Mono size={40} color={colors.muted}>
              +
            </Mono>
          </View>
          <UI size={20} weight={600}>
            {t('Add profile')}
          </UI>
          <UI size={14} color={colors.muted} style={styles.meta}>
            {t('Takes a minute')}
          </UI>
        </Pressable>
      </View>

      <UI size={14} color={colors.muted} align="center" style={styles.footer}>
        {t('Profiles are stored only on this phone.')}
      </UI>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { flexGrow: 1, paddingHorizontal: SIDE },
  hero: { marginHorizontal: -SIDE },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 24,
    columnGap: COL_GAP,
    marginTop: 24,
  },
  cell: { alignItems: 'center', gap: 8 },
  avatar: {
    width: AVATAR,
    overflow: 'hidden',
    height: AVATAR,
    borderRadius: AVATAR / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  add: { borderWidth: 2, borderStyle: 'dashed', borderColor: colors.line },
  meta: { marginTop: -8 },
  footer: { marginTop: 'auto', paddingTop: 32 },
});
