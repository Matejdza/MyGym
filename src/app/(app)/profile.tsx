import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { Photo } from '@/components/Photo';
import { confirm } from '@/components/confirm';
import { Segmented } from '@/components/Segmented';
import { Display, UI } from '@/components/Txt';
import { WeekStrip } from '@/components/week';
import { AvatarPicker } from '@/components/AvatarPicker';
import { Avatar, BackPill, StepperCard } from '@/components/ui';
import { GOALS } from '@/data/catalog';
import { GOAL_OPTIONS, legacyGoal } from '@/domain/generate';
import { BODY_LIMITS } from '@/domain/numberEntry';
import { pickProfilePhoto } from '@/data/profilePhoto';
import { isoDate } from '@/domain/dates';
import { fmt, r2 } from '@/domain/format';
import { REST_MAX, REST_MIN, REST_STEP, restText, workoutsText } from '@/domain/plan';
import type { GoalKey, Settings } from '@/domain/types';
import { planCells } from '@/domain/week';
import { useActive, useStore } from '@/state/store';
import { useTop } from '@/theme/layout';
import { THEME_SWITCH, getThemePref, setThemePref, type ThemePref } from '@/theme/themePref';
import { colors, fonts } from '@/theme/tokens';
import { LANGS, t, type Lang } from '@/i18n';

const STEPS: Settings['weightStep'][] = [1.25, 2.5, 5];
type Step = `${Settings['weightStep']}`;

/** Profile: name, photo, body numbers, goal, plan summary and workout settings. */
export default function Profile() {
  const { profile, settings } = useActive();
  const setup = profile.setup ?? null;
  const { updateProfile, setSettings, leaveProfile, deleteProfile, saveBodyWeight } = useStore();
  const top = useTop();

  // A weight change here is a weigh-in for today too, so Home's goal bar and Progress see it.
  const setBody = (k: 'weight' | 'target', v: number) => (k === 'weight' ? saveBodyWeight(isoDate(new Date()), v) : updateProfile({ [k]: v }));
  const step = (k: 'weight' | 'target', d: number) => setBody(k, r2(Math.max(0, profile[k] + d)));

  const changePhoto = async () => {
    try {
      const uri = await pickProfilePhoto(profile.id, profile.photoUri);
      if (uri) updateProfile({ photoUri: uri });
    } catch (e) {
      console.error('[liftlog] could not save the profile photo', e);
    }
  };

  // Name being typed; saved when the field loses focus. An empty name keeps the old one.
  const [nameDraft, setNameDraft] = useState<string | null>(null);
  const [theme, setTheme] = useState<ThemePref>(getThemePref);
  const saveName = () => {
    const name = nameDraft?.trim();
    if (name && name !== profile.name) updateProfile({ name });
    setNameDraft(null);
  };

  const removeProfile = async () => {
    const ok = await confirm(
      t('Delete {name}?', { name: profile.name }),
      t('Delete'),
      t('Every workout, record and body weight entry for this profile will be removed from this phone. This cannot be undone.'),
      true,
    );
    if (ok) await deleteProfile();
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={[styles.content, { paddingTop: top(58) }]}>
      <View style={styles.topRow}>
        <BackPill onPress={() => (router.canGoBack() ? router.back() : router.navigate('/'))} />
        <Pressable onPress={leaveProfile} accessibilityRole="button" style={styles.switch}>
          <UI size={16} weight={600} numberOfLines={1}>
            {t('Switch profile')}
          </UI>
        </Pressable>
      </View>

      <View style={styles.identity}>
        <Pressable
          onPress={changePhoto}
          accessibilityRole="button"
          accessibilityLabel={t('Change profile photo')}
          style={[styles.avatarRing, { backgroundColor: profile.color }]}>
          <View style={styles.avatar}>
            {profile.photoUri ? (
              <Photo source={{ uri: profile.photoUri }} style={StyleSheet.absoluteFill} />
            ) : (
              // No photo: the profile icon or letter on the profile color (tap to add a photo).
              <Avatar size={96} color={profile.color} initial={(profile.name[0] || '?').toUpperCase()} fontSize={48} icon={profile.avatar} />
            )}
          </View>
        </Pressable>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Display size={40} weight={900} lh={0.9}>
            {profile.name}
          </Display>
          <UI size={14} color={colors.muted} style={{ marginTop: 8 }}>
            {`${fmt(profile.weight)} kg, ${(setup ? t(GOAL_OPTIONS.find((g) => g.key === setup.goal)!.label) : (GOALS.find((g) => g.key === profile.goal)?.label ?? '')).toLowerCase()}`}
          </UI>
        </View>
      </View>

      <View style={styles.rows}>
        <View style={styles.nameCard}>
          <UI size={14} color={colors.muted}>
            {t('Name')}
          </UI>
          <TextInput
            value={nameDraft ?? profile.name}
            onChangeText={setNameDraft}
            onBlur={saveName}
            onSubmitEditing={saveName}
            autoCapitalize="words"
            autoCorrect={false}
            returnKeyType="done"
            maxLength={24}
            maxFontSizeMultiplier={1.2}
            accessibilityLabel={t('Profile name')}
            style={styles.nameInput}
          />
        </View>
        <View style={styles.pickerCard}>
          <AvatarPicker
            preview={false}
            color={profile.color}
            icon={profile.avatar ?? null}
            initial={(profile.name[0] || '?').toUpperCase()}
            onColor={(color) => updateProfile({ color })}
            onIcon={(avatar) => updateProfile({ avatar })}
          />
        </View>
        {(
          [
            [t('Weight'), 'weight', 'kg', 0.1],
            [t('Target weight'), 'target', 'kg', 0.5],
          ] as const
        ).map(([label, k, unit, d]) => (
          <StepperCard
            key={k}
            label={label}
            value={fmt(profile[k])}
            unit={unit}
            onDec={() => step(k, -d)}
            onInc={() => step(k, d)}
            input={{ ...BODY_LIMITS[k], value: profile[k], onSet: (v) => setBody(k, v) }}
            valueSize={24}
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

      <UI size={16} color={colors.muted} style={{ marginTop: 24 }}>
        {t('Goal')}
      </UI>
      {setup ? (
        // Profiles made with the plan builder have five goals; the second goal stays as chosen.
        <View style={styles.goalChips}>
          {GOAL_OPTIONS.map((g) => {
            const on = g.key === setup.goal;
            return (
              <Pressable
                key={g.key}
                onPress={() => updateProfile({ goal: legacyGoal(g.key), setup: { ...setup, goal: g.key, goal2: setup.goal2 === g.key ? null : setup.goal2 } })}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                style={[styles.goalChip, on && styles.goalChipOn]}>
                <UI size={16} weight={600} color={on ? colors.accentInk : colors.ink}>
                  {t(g.label)}
                </UI>
              </Pressable>
            );
          })}
        </View>
      ) : (
        <Segmented<GoalKey>
          options={GOALS.map((g) => [g.key, g.label])}
          value={profile.goal}
          onChange={(goal) => updateProfile({ goal })}
          style={{ marginTop: 8 }}
        />
      )}

      <View style={styles.planCard}>
        <UI size={16} color={colors.muted}>
          {t('Training plan')}
        </UI>
        <Display size={40} weight={900} lh={0.95} style={{ marginTop: 6 }}>
          {workoutsText(profile.plan)}
        </Display>
        <View style={{ marginTop: 16 }}>
          <WeekStrip cells={planCells(profile.plan)} size={34} fontSize={14} labelSize={14} labelWeight={400} gap={4} innerGap={6} />
        </View>
        <Pressable onPress={() => router.push('/plan')} accessibilityRole="button" style={styles.planBtn}>
          <UI size={16} weight={600}>
            {t('Edit plan and routines')}
          </UI>
        </Pressable>
      </View>

      <Display size={32} weight={800} style={{ marginTop: 32 }}>
        {t('Settings')}
      </Display>
      <UI size={16} color={colors.muted} style={{ marginTop: 16 }}>
        {t('Language')}
      </UI>
      <Segmented<Lang> options={LANGS} value={settings.language} onChange={(language) => setSettings({ language })} style={{ marginTop: 8 }} />
      {THEME_SWITCH && (
        <>
          <UI size={16} color={colors.muted} style={{ marginTop: 24 }}>
            {t('Appearance')}
          </UI>
          <Segmented<ThemePref>
            options={[
              ['auto', 'Auto'],
              ['light', 'Light'],
              ['dark', 'Dark'],
            ]}
            value={theme}
            onChange={(t) => {
              setThemePref(t);
              setTheme(t);
            }}
            style={{ marginTop: 8 }}
          />
          <UI size={14} color={colors.muted} style={{ marginTop: 8, paddingLeft: 4 }}>
            {t("Auto follows your phone's light or dark setting.")}
          </UI>
        </>
      )}
      <UI size={16} color={colors.muted} style={{ marginTop: 24 }}>
        {t('Weight step')}
      </UI>
      <Segmented<Step>
        options={STEPS.map((v) => [String(v) as Step, `${fmt(v)} kg`])}
        value={String(settings.weightStep) as Step}
        onChange={(v) => setSettings({ weightStep: Number(v) as Settings['weightStep'] })}
        style={{ marginTop: 8 }}
      />

      <View style={{ marginTop: 24 }}>
        <StepperCard
          label={t('Rest between sets')}
          value={restText(settings.restSeconds)}
          unit=""
          onDec={() => setSettings({ restSeconds: Math.max(REST_MIN, settings.restSeconds - REST_STEP) })}
          onInc={() => setSettings({ restSeconds: Math.min(REST_MAX, settings.restSeconds + REST_STEP) })}
          input={{
            min: REST_MIN,
            max: REST_MAX,
            kind: 'duration',
            value: settings.restSeconds,
            onSet: (restSeconds) => setSettings({ restSeconds }),
          }}
          valueSize={24}
          button={52}
          buttonFont={22}
          labelSize={14}
          unitSize={14}
          valueGap={2}
          padding={[10, 10, 10, 18]}
          gap={8}
        />
      </View>
      <UI size={14} color={colors.muted} style={{ marginTop: 8, paddingLeft: 4 }}>
        {t('Used when an exercise has no rest of its own.')}
      </UI>

      <UI size={16} color={colors.muted} style={{ marginTop: 24 }}>
        {t('Workout buttons')}
      </UI>
      <Segmented<Settings['handedness']>
        options={[
          ['right', 'Right hand'],
          ['left', 'Left hand'],
        ]}
        value={settings.handedness}
        onChange={(handedness) => setSettings({ handedness })}
        style={{ marginTop: 8 }}
      />
      <UI size={14} color={colors.muted} style={{ marginTop: 8, paddingLeft: 4 }}>
        {t('Which side the + button sits on during a workout.')}
      </UI>

      <Pressable onPress={removeProfile} accessibilityRole="button" style={styles.delete}>
        <UI size={16} weight={600} color={colors.red}>
          {t('Delete profile')}
        </UI>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: 16, paddingBottom: 32 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  switch: { height: 40, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, borderColor: colors.line, justifyContent: 'center' },
  identity: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 24 },
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
  rows: { gap: 8, marginTop: 24 },
  pickerCard: { backgroundColor: colors.surface, borderRadius: 22, paddingHorizontal: 16 },
  nameCard: { backgroundColor: colors.surface, borderRadius: 22, paddingTop: 10, paddingBottom: 6, paddingHorizontal: 18 },
  nameInput: { color: colors.ink, fontFamily: fonts.ui600, fontSize: 24, paddingVertical: 4, paddingHorizontal: 0 },
  goalChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  goalChip: { height: 44, paddingHorizontal: 16, borderRadius: 22, borderWidth: 1.5, borderColor: colors.border, justifyContent: 'center' },
  goalChipOn: { backgroundColor: colors.accentFill, borderColor: colors.accentFill },
  planCard: { backgroundColor: colors.surface, borderRadius: 24, padding: 16, marginTop: 24 },
  delete: { height: 48, marginTop: 32, alignItems: 'center', justifyContent: 'center' },
  planBtn: { height: 48, marginTop: 16, borderRadius: 24, backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
});
