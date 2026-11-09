import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Photo } from '@/components/Photo';
import { Segmented } from '@/components/Segmented';
import { Display, UI } from '@/components/Txt';
import { WeekStrip } from '@/components/week';
import { BackPill, StepperCard } from '@/components/ui';
import { GOALS } from '@/data/catalog';
import { pickProfilePhoto } from '@/data/profilePhoto';
import { fmt, r2 } from '@/domain/format';
import { workoutsText } from '@/domain/plan';
import type { GoalKey, InputVariant } from '@/domain/types';
import { planCells } from '@/domain/week';
import { useActive, useStore } from '@/state/store';
import { useTop } from '@/theme/layout';
import { colors } from '@/theme/tokens';

const VARIANTS: [InputVariant, string][] = [
  ['stepper', 'Buttons'],
  ['keypad', 'Keypad'],
  ['scale', 'Scale'],
];

/** Profile: photo, body numbers, goal, plan summary and set-entry setting. */
export default function Profile() {
  const { profile, settings } = useActive();
  const { updateProfile, setSettings, leaveProfile } = useStore();
  const top = useTop();

  const step = (k: 'height' | 'weight' | 'target', d: number) => updateProfile({ [k]: r2(Math.max(0, profile[k] + d)) });

  const changePhoto = async () => {
    try {
      const uri = await pickProfilePhoto(profile.id, profile.photoUri);
      if (uri) updateProfile({ photoUri: uri });
    } catch (e) {
      console.error('[liftlog] could not save the profile photo', e);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={[styles.content, { paddingTop: top(58) }]}>
      <View style={styles.topRow}>
        <BackPill onPress={() => router.back()} />
        <Pressable onPress={leaveProfile} accessibilityRole="button" style={styles.switch}>
          <UI size={15} weight={600} numberOfLines={1}>
            Switch profile
          </UI>
        </Pressable>
      </View>

      <View style={styles.identity}>
        <Pressable
          onPress={changePhoto}
          accessibilityRole="button"
          accessibilityLabel="Change profile photo"
          style={[styles.avatarRing, { backgroundColor: profile.color }]}>
          <View style={styles.avatar}>
            {profile.photoUri ? (
              <Photo source={{ uri: profile.photoUri }} style={StyleSheet.absoluteFill} />
            ) : (
              <UI size={13} color={colors.muted}>
                Photo
              </UI>
            )}
          </View>
        </Pressable>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Display size={48} weight={900} lh={0.9}>
            {profile.name}
          </Display>
          <UI size={15} color={colors.muted} style={{ marginTop: 8 }}>
            {`${profile.height} cm, ${fmt(profile.weight)} kg`}
          </UI>
        </View>
      </View>

      <View style={styles.rows}>
        {(
          [
            ['Height', 'height', 'cm', 1],
            ['Weight', 'weight', 'kg', 0.1],
            ['Target weight', 'target', 'kg', 0.5],
          ] as const
        ).map(([label, k, unit, d]) => (
          <StepperCard
            key={k}
            label={label}
            value={k === 'height' ? String(profile.height) : fmt(profile[k])}
            unit={unit}
            onDec={() => step(k, -d)}
            onInc={() => step(k, d)}
            valueSize={26}
            button={52}
            buttonFont={22}
            labelSize={14}
            unitSize={14}
            valueGap={2}
            padding={[10, 10, 10, 18]}
            gap={8}
          />
        ))}
      </View>

      <UI size={15} color={colors.muted} style={{ marginTop: 22 }}>
        Goal
      </UI>
      <Segmented<GoalKey>
        options={GOALS.map((g) => [g.key, g.label])}
        value={profile.goal}
        onChange={(goal) => updateProfile({ goal })}
        style={{ marginTop: 8 }}
      />

      <View style={styles.planCard}>
        <UI size={15} color={colors.muted}>
          Training plan
        </UI>
        <Display size={36} weight={900} lh={0.95} style={{ marginTop: 6 }}>
          {workoutsText(profile.plan)}
        </Display>
        <View style={{ marginTop: 16 }}>
          <WeekStrip cells={planCells(profile.plan)} size={34} fontSize={13} labelSize={12} labelWeight={400} gap={4} innerGap={6} />
        </View>
        <Pressable onPress={() => router.push('/plan')} accessibilityRole="button" style={styles.planBtn}>
          <UI size={16} weight={700} color={colors.bg}>
            Edit plan and routines
          </UI>
        </Pressable>
      </View>

      <Display size={28} weight={800} style={{ marginTop: 30 }}>
        Settings
      </Display>
      <UI size={15} color={colors.muted} style={{ marginTop: 12 }}>
        Set entry
      </UI>
      <Segmented<InputVariant>
        options={VARIANTS}
        value={settings.inputVariant}
        onChange={(inputVariant) => setSettings({ inputVariant })}
        style={{ marginTop: 8 }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: 20, paddingBottom: 28 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  switch: { height: 40, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, borderColor: colors.line, justifyContent: 'center' },
  identity: { flexDirection: 'row', alignItems: 'center', gap: 18, marginTop: 22 },
  avatarRing: { width: 104, height: 104, borderRadius: 52, padding: 4 },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rows: { gap: 8, marginTop: 26 },
  planCard: { backgroundColor: colors.surface, borderRadius: 24, padding: 20, marginTop: 26 },
  planBtn: { height: 54, marginTop: 18, borderRadius: 27, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' },
});
