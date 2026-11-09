import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Display, Mono, UI } from '@/components/Txt';
import { Avatar, BackCircle, PrimaryButton, Ring, StepperCard } from '@/components/ui';
import { DAYS_FULL, GOALS } from '@/data/catalog';
import { fmt, r2 } from '@/domain/format';
import { mkPlan, ownPlan } from '@/domain/plan';
import type { GoalKey } from '@/domain/types';
import { DAY_LETTERS } from '@/domain/week';
import { useStore } from '@/state/store';
import { useTop } from '@/theme/layout';
import { PROFILE_COLORS, colors, fonts, plate } from '@/theme/tokens';

const TITLES = ['What should we call you?', 'Your body', 'Your goal', 'How often will you train?'];
const SUBS = [
  'Your name shows on the profile screen.',
  'We use this to track progress against your goal.',
  'This shapes your progress screen and suggestions.',
  'Pick workouts per week. We build a schedule from it.',
];
/** Step 4 subtitle when building your own plan. */
const SUB_OWN = 'Pick the days you train. You add the exercises next.';

/** Step 4: a suggested plan (the design's flow) or one you build yourself. */
const MODES = [
  { key: 'suggested', label: 'Suggested plan', description: 'We pick the days and routines for you.' },
  { key: 'own', label: 'Build my own', description: 'Choose your days, then add your own exercises.' },
] as const;
type Mode = (typeof MODES)[number]['key'];

/** New profile in four steps: name and color, body, goal, and a suggested or own plan. */
export default function Onboarding() {
  const { createProfile } = useStore();
  const top = useTop();
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [color, setColor] = useState<string>(PROFILE_COLORS[0]);
  const [height, setHeight] = useState(178);
  const [weight, setWeight] = useState(80);
  const [goal, setGoal] = useState<GoalKey>('muscle');
  const [target, setTarget] = useState(78);
  const [weekly, setWeekly] = useState(3);
  const [mode, setMode] = useState<Mode>('suggested');
  const [ownDays, setOwnDays] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);

  const canContinue = (step !== 1 || name.trim().length > 0) && (step !== 4 || mode === 'suggested' || ownDays.length > 0);

  const toggleDay = (i: number) => setOwnDays((d) => (d.includes(i) ? d.filter((x) => x !== i) : [...d, i]));

  const back = () => {
    if (step > 1) setStep(step - 1);
    else router.back();
  };

  // Android back button steps back through onboarding before leaving it.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (step > 1) {
        setStep(step - 1);
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [step]);

  const next = async () => {
    if (!canContinue || saving) return;
    if (step < 4) {
      setStep(step + 1);
      return;
    }
    setSaving(true);
    try {
      // Selecting the new profile unlocks the app; the router moves to Home.
      const plan = mode === 'own' ? ownPlan(ownDays, DAYS_FULL) : mkPlan(weekly);
      await createProfile({ name: name.trim(), color, height, weight, goal, target, plan });
      // Your own plan starts with empty days: go straight to adding exercises.
      if (mode === 'own') setTimeout(() => router.push('/plan'), 50);
    } catch (e) {
      console.error('[liftlog] could not create profile', e);
      setSaving(false);
    }
  };

  const initial = (name.trim()[0] || '?').toUpperCase();
  const preview = mkPlan(weekly);

  return (
    <KeyboardAvoidingView style={[styles.screen, { paddingTop: top(50) }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <BackCircle onPress={back} />
        <View style={styles.segs}>
          {[1, 2, 3, 4].map((i) => (
            <View key={i} style={[styles.seg, { backgroundColor: i <= step ? colors.accent : colors.surface2 }]} />
          ))}
        </View>
        <Mono size={13} color={colors.muted}>{`${step}/4`}</Mono>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <Display size={52} weight={900} lh={0.92}>
          {TITLES[step - 1]}
        </Display>
        <UI size={16} lh={1.45} color={colors.muted} style={{ marginTop: 12 }}>
          {step === 4 && mode === 'own' ? SUB_OWN : SUBS[step - 1]}
        </UI>

        {step === 1 && (
          <>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Your name"
              placeholderTextColor={colors.placeholder}
              autoCapitalize="words"
              autoCorrect={false}
              returnKeyType="next"
              onSubmitEditing={next}
              maxFontSizeMultiplier={1.2}
              style={styles.nameInput}
            />
            <UI size={15} color={colors.muted} style={{ marginTop: 30 }}>
              Profile color
            </UI>
            <View style={styles.swatches}>
              {PROFILE_COLORS.map((c) => (
                <Pressable
                  key={c}
                  onPress={() => setColor(c)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: c === color }}
                  style={[styles.swatch, { backgroundColor: c }]}>
                  {/* 0 0 0 3px bg, 0 0 0 5px ink */}
                  {c === color && <Ring width={2} color={colors.ink} radius={26} offset={5} />}
                </Pressable>
              ))}
            </View>
            <View style={styles.previewRow}>
              <Avatar size={84} color={color} initial={initial} fontSize={46}>
                <Ring width={9} color="rgba(0,0,0,0.16)" radius={42} />
              </Avatar>
              <UI size={15} lh={1.4} color={colors.muted} style={{ flex: 1 }}>
                You can add a photo later on your profile.
              </UI>
            </View>
          </>
        )}

        {step === 2 && (
          <View style={{ gap: 12, marginTop: 30 }}>
            <StepperCard
              label="Height"
              value={String(height)}
              unit="cm"
              onDec={() => setHeight((h) => h - 1)}
              onInc={() => setHeight((h) => h + 1)}
            />
            <StepperCard
              label="Weight"
              value={fmt(weight)}
              unit="kg"
              onDec={() => setWeight((w) => r2(w - 0.5))}
              onInc={() => setWeight((w) => r2(w + 0.5))}
            />
          </View>
        )}

        {step === 3 && (
          <>
            <View style={{ gap: 10, marginTop: 26 }}>
              {GOALS.map((g) => (
                <Pressable
                  key={g.key}
                  onPress={() => setGoal(g.key)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: g.key === goal }}
                  style={styles.goal}>
                  {g.key === goal && <Ring width={2} color={colors.accent} radius={20} />}
                  <View style={[styles.goalDot, { backgroundColor: g.color }]} />
                  <View style={{ flex: 1 }}>
                    <Display size={26} weight={800}>
                      {g.label}
                    </Display>
                    <UI size={14} color={colors.muted} style={{ marginTop: 2 }}>
                      {g.description}
                    </UI>
                  </View>
                </Pressable>
              ))}
            </View>
            <View style={{ marginTop: 18 }}>
              <StepperCard
                label="Target weight"
                value={fmt(target)}
                unit="kg"
                valueSize={36}
                onDec={() => setTarget((t) => r2(t - 0.5))}
                onInc={() => setTarget((t) => r2(t + 0.5))}
              />
            </View>
          </>
        )}

        {step === 4 && (
          <View style={{ gap: 10, marginTop: 26 }}>
            {MODES.map((m) => (
              <Pressable
                key={m.key}
                onPress={() => setMode(m.key)}
                accessibilityRole="button"
                accessibilityState={{ selected: m.key === mode }}
                style={styles.goal}>
                {m.key === mode && <Ring width={2} color={colors.accent} radius={20} />}
                <View style={{ flex: 1 }}>
                  <Display size={26} weight={800}>
                    {m.label}
                  </Display>
                  <UI size={14} color={colors.muted} style={{ marginTop: 2 }}>
                    {m.description}
                  </UI>
                </View>
              </Pressable>
            ))}
          </View>
        )}

        {step === 4 && mode === 'own' && (
          <>
            <UI size={15} color={colors.muted} style={{ marginTop: 28 }}>
              Tap the days you train
            </UI>
            <View style={styles.week}>
              {DAY_LETTERS.map((d, i) => {
                const on = ownDays.includes(i);
                return (
                  <Pressable
                    key={i}
                    onPress={() => toggleDay(i)}
                    accessibilityRole="button"
                    accessibilityLabel={DAYS_FULL[i]}
                    accessibilityState={{ selected: on }}
                    style={styles.weekCell}>
                    <View style={[styles.ownDay, { backgroundColor: on ? colors.accent : 'transparent' }]}>
                      {!on && <Ring width={1} color={colors.line} radius={999} />}
                      <Mono size={15} weight={500} color={on ? colors.accentInk : colors.muted}>
                        {d}
                      </Mono>
                    </View>
                  </Pressable>
                );
              })}
            </View>
            <UI size={15} lh={1.45} color={colors.muted} style={{ marginTop: 22 }}>
              {ownDays.length
                ? `${ownDays.length} ${ownDays.length === 1 ? 'workout' : 'workouts'} a week. Each day gets its own routine, ready for your exercises.`
                : 'You can change days and routines any time from your profile.'}
            </UI>
          </>
        )}

        {step === 4 && mode === 'suggested' && (
          <>
            <View style={[styles.weeklyRow, { marginTop: 22 }]}>
              {[2, 3, 4, 5, 6].map((n) => {
                const on = n === weekly;
                return (
                  <Pressable
                    key={n}
                    onPress={() => setWeekly(n)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: on }}
                    style={[styles.weeklyOpt, { backgroundColor: on ? colors.accent : colors.surface }]}>
                    <Mono size={26} weight={500} color={on ? colors.accentInk : colors.ink}>
                      {String(n)}
                    </Mono>
                  </Pressable>
                );
              })}
            </View>
            <UI size={15} color={colors.muted} style={{ marginTop: 28 }}>
              Your starting schedule
            </UI>
            <View style={styles.week}>
              {preview.days.map((k, i) => (
                <View key={i} style={styles.weekCell}>
                  <UI size={13} weight={600} color={colors.muted}>
                    {DAY_LETTERS[i]}
                  </UI>
                  <View style={[styles.dayCircle, { backgroundColor: k ? plate(k) : 'transparent' }]}>
                    {!k && <Ring width={1} color={colors.line} radius={999} />}
                    <Mono size={15} weight={500} color={colors.bg}>
                      {k ?? '·'}
                    </Mono>
                  </View>
                </View>
              ))}
            </View>
            <UI size={15} lh={1.45} color={colors.muted} style={{ marginTop: 22 }}>
              You can change days and routines any time from your profile.
            </UI>
          </>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: 14 + insets.bottom }]}>
        <PrimaryButton label={step === 4 ? 'CREATE PROFILE' : 'NEXT'} dimmed={!canContinue} onPress={next} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 8, paddingHorizontal: 20 },
  segs: { flex: 1, flexDirection: 'row', gap: 6 },
  seg: { flex: 1, height: 5, borderRadius: 3 },
  body: { paddingTop: 28, paddingHorizontal: 24, paddingBottom: 20 },
  nameInput: {
    marginTop: 30,
    borderBottomWidth: 2,
    borderBottomColor: colors.accent,
    color: colors.ink,
    fontFamily: fonts.display800,
    fontSize: 44,
    paddingTop: 4,
    paddingBottom: 8,
    paddingHorizontal: 0,
  },
  swatches: { flexDirection: 'row', gap: 12, marginTop: 12 },
  swatch: { width: 52, height: 52, borderRadius: 26 },
  previewRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 34 },
  goal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.surface,
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 18,
  },
  goalDot: { width: 20, height: 20, borderRadius: 10 },
  weeklyRow: { flexDirection: 'row', gap: 8, marginTop: 30 },
  weeklyOpt: { flex: 1, aspectRatio: 1, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  week: { flexDirection: 'row', gap: 6, marginTop: 12 },
  weekCell: { flex: 1, alignItems: 'center', gap: 8 },
  ownDay: { width: 44, maxWidth: '100%', aspectRatio: 1, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  dayCircle: { width: 40, maxWidth: '100%', aspectRatio: 1, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  footer: { paddingTop: 12, paddingHorizontal: 20 },
});
