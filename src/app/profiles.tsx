import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Display, Mono, UI } from '@/components/Txt';
import { Ring } from '@/components/ui';
import { GOALS } from '@/data/catalog';
import { useStore } from '@/state/store';
import { useTop } from '@/theme/layout';
import { colors } from '@/theme/tokens';

const AVATAR = 132;
const SIDE = 24;
const COL_GAP = 18;

/** "Who's lifting today?" — pick a profile or add one. */
export default function Profiles() {
  const { order, byId, selectProfile } = useStore();
  const top = useTop();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const cellWidth = (width - SIDE * 2 - COL_GAP) / 2;
  const cell = [styles.cell, { width: cellWidth }];
  const avatar = Math.min(AVATAR, cellWidth);
  const avatarStyle = { width: avatar, height: avatar, borderRadius: avatar / 2 };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: top(74), paddingBottom: 20 + insets.bottom }]}>
      <Display size={18} weight={900} spacing={0.14} color={colors.accent} align="center">
        LIFTLOG
      </Display>
      <Display size={52} weight={900} lh={0.92} align="center" style={{ marginTop: 18 }}>
        {"Who's lifting today?"}
      </Display>

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
                <Display size={72} weight={900} color={colors.bg}>
                  {(p.name[0] || '?').toUpperCase()}
                </Display>
              </View>
              <UI size={20} weight={600}>
                {p.name}
              </UI>
              <UI size={14} color={colors.muted} style={styles.meta}>
                {`${p.plan.weekly}× a week, ${goal}`}
              </UI>
            </Pressable>
          );
        })}
        <Pressable
          onPress={() => router.push('/onboarding')}
          accessibilityRole="button"
          style={cell}>
          <View style={[styles.avatar, avatarStyle, styles.add]}>
            <Mono size={44} color={colors.muted}>
              +
            </Mono>
          </View>
          <UI size={20} weight={600}>
            Add profile
          </UI>
          <UI size={14} color={colors.muted} style={styles.meta}>
            Takes a minute
          </UI>
        </Pressable>
      </View>

      <UI size={14} color={colors.muted} align="center" style={styles.footer}>
        Profiles are stored only on this phone.
      </UI>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { flexGrow: 1, paddingHorizontal: SIDE },
  grid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 28, columnGap: COL_GAP, marginTop: 44 },
  cell: { alignItems: 'center', gap: 12 },
  avatar: {
    width: AVATAR,
    height: AVATAR,
    borderRadius: AVATAR / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  add: { borderWidth: 2, borderStyle: 'dashed', borderColor: colors.line },
  meta: { marginTop: -8 },
  footer: { marginTop: 'auto', paddingTop: 28 },
});
