import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  type ScrollViewInstance,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AvatarPicker } from '@/components/AvatarPicker';
import { BodyMap } from '@/components/BodyMap';
import { Segmented } from '@/components/Segmented';
import { Display, Mono, UI } from '@/components/Txt';
import { BackCircle, PrimaryButton, Ring, StepperCard } from '@/components/ui';
import { DAYS_FULL, exercise } from '@/data/catalog';
import { BODY_LIMITS } from '@/domain/numberEntry';
import { fmt, plural, r2 } from '@/domain/format';
import { FOCUS_OPTIONS, GOAL_OPTIONS, generatePlan, legacyGoal, suggestFocus, weekDays } from '@/domain/generate';
import { ownPlan, schemeText } from '@/domain/plan';
import type { DayType, Equipment, Experience, Focus, MainGoal, Setup, Sex } from '@/domain/types';
import { FOCUS_MUSCLES } from '@/domain/muscles';
import { DAY_INITIALS, DAY_LETTERS } from '@/domain/week';
import { useStore } from '@/state/store';
import { useTop } from '@/theme/layout';
import { PROFILE_COLORS, colors, fonts, plate } from '@/theme/tokens';
import { LANGS, getLang, setLang, t, type Lang } from '@/i18n';

/** Steps: making a plan asks about goals and training; building your own skips straight to the days. */
type StepKey = 'about' | 'mode' | 'body' | 'goals' | 'focus' | 'experience' | 'equipment' | 'week' | 'schedule' | 'plan' | 'days';
const FLOW_SUGGESTED: StepKey[] = ['about', 'mode', 'body', 'goals', 'focus', 'experience', 'equipment', 'week', 'schedule', 'plan'];
const FLOW_OWN: StepKey[] = ['about', 'mode', 'body', 'days'];

const TITLES: Record<StepKey, string> = {
  about: 'What should we call you?',
  mode: 'How do you want to start?',
  body: 'Your body',
  goals: 'What do you want to achieve?',
  focus: 'What should we focus on?',
  experience: 'Your experience',
  equipment: 'Where do you train?',
  week: 'Your training week',
  schedule: 'Your days',
  plan: 'Your plan is ready',
  days: 'Your training days',
};
const SUBS: Record<StepKey, string> = {
  about: 'Your name shows on the profile screen.',
  mode: 'Let us build a plan from a few questions, or set up your own routines.',
  body: 'Where you are now, and where you want to be. Both can change later.',
  goals: 'Pick a main goal. A second one is optional.',
  focus: 'We suggest a focus; add anything else you want to work on.',
  experience: 'So the plan starts at the right level.',
  equipment: 'We only pick exercises you can do there.',
  week: 'How often you train. Rest days are part of the plan.',
  schedule: 'When you train and for how long.',
  plan: 'Built from your answers. You can change anything later.',
  days: 'Pick the days you train. You add the exercises next.',
};

/** How the plan is made: the app builds it, or the user does. */
const MODES = [
  { key: 'suggested', label: 'Make my plan', description: 'We build your routines from your answers.' },
  { key: 'own', label: 'Build my own', description: 'Choose your days, then add your own exercises.' },
] as const;
type Mode = (typeof MODES)[number]['key'];

const EXPERIENCE: { key: Experience; label: string; description: string }[] = [
  { key: 'beginner', label: 'Beginner', description: 'New to the gym, or back after a long break' },
  { key: 'intermediate', label: 'Intermediate', description: 'Training regularly for a few months' },
  { key: 'advanced', label: 'Advanced', description: 'Years of training, comfortable with heavy lifts' },
];
const EQUIPMENT: { key: Equipment; label: string; description: string }[] = [
  { key: 'gym', label: 'Gym', description: 'Machines, cables, barbells and dumbbells' },
  { key: 'dumbbells', label: 'Home with dumbbells', description: 'Dumbbells, maybe a bench or a kettlebell' },
  { key: 'none', label: 'No equipment', description: 'Body weight only' },
];
/** How long a strength workout usually takes; people who stay longer than an hour pick "Long". */
const LENGTHS: { key: Setup['minutes']; label: string; description: string }[] = [
  { key: 45, label: 'Short', description: 'Up to 45 minutes' },
  { key: 60, label: 'About an hour', description: '45 to 75 minutes' },
  { key: 90, label: 'Long', description: 'More than an hour' },
];
type DayPick = 'auto' | 'own';
const DAY_PICKS: [DayPick, string][] = [
  ['auto', 'Spread them for me'],
  ['own', 'I pick'],
];

const SEXES: [Sex, string][] = [
  ['female', 'Female'],
  ['male', 'Male'],
];

/**
 * Answers typed so far. They live outside the screen so nothing is lost when
 * the screen is rebuilt (choosing a language remounts every screen); cleared
 * when the profile is made or onboarding is left (owner, 2026-11-20).
 */
type Draft = {
  step: number;
  name: string;
  color: string;
  avatar: string | null;
  sex: Sex | null;
  weight: number;
  target: number;
  goal: MainGoal;
  goal2: MainGoal | null;
  focus: Focus[];
  focusTouched: boolean;
  experience: Experience;
  equipment: Equipment;
  minutes: Setup['minutes'];
  strengthDays: number;
  cardioDays: number;
  mode: Mode;
  ownDays: number[];
  dayPick: DayPick;
  pickedDays: DayType[];
  savedAt: number;
};
let draft: Draft | null = null;
/** A draft older than this is from an earlier visit, not a language change. */
const DRAFT_TTL = 30 * 60 * 1000;
const clearDraft = () => {
  draft = null;
};

/**
 * New profile in seven steps: about you, body, goals, focus, experience and
 * equipment, the training week, and the plan the app builds (or your own days).
 */
export default function Onboarding() {
  const { createProfile, order } = useStore();
  const top = useTop();
  const insets = useSafeAreaInsets();

  // Pick up where the user was if the screen was just rebuilt (e.g. a language change).
  const [d0] = useState(() => (draft && Date.now() - draft.savedAt < DRAFT_TTL ? draft : null));
  const [step, setStep] = useState(d0?.step ?? 1);
  const [name, setName] = useState(d0?.name ?? '');
  const [color, setColor] = useState<string>(d0?.color ?? PROFILE_COLORS[0]);
  const [avatar, setAvatar] = useState<string | null>(d0?.avatar ?? null);
  const [sex, setSex] = useState<Sex | null>(d0?.sex ?? null);
  const [weight, setWeight] = useState(d0?.weight ?? 80);
  const [target, setTarget] = useState(d0?.target ?? 78);
  const [goal, setGoal] = useState<MainGoal>(d0?.goal ?? 'muscle');
  const [goal2, setGoal2] = useState<MainGoal | null>(d0?.goal2 ?? null);
  const [focus, setFocus] = useState<Focus[]>(d0?.focus ?? []);
  // Once the user picks a focus, changing sex no longer replaces it with the suggestion.
  const [focusTouched, setFocusTouched] = useState(d0?.focusTouched ?? false);
  const [experience, setExperience] = useState<Experience>(d0?.experience ?? 'beginner');
  const [equipment, setEquipment] = useState<Equipment>(d0?.equipment ?? 'gym');
  const [minutes, setMinutes] = useState<Setup['minutes']>(d0?.minutes ?? 60);
  const [strengthDays, setStrengthDays] = useState(d0?.strengthDays ?? 3);
  const [cardioDays, setCardioDays] = useState(d0?.cardioDays ?? 1);
  const [mode, setMode] = useState<Mode>(d0?.mode ?? 'suggested');
  const [ownDays, setOwnDays] = useState<number[]>(d0?.ownDays ?? []);
  // "Your days": the app spreads the days, or the user taps each day's type.
  const [dayPick, setDayPick] = useState<DayPick>(d0?.dayPick ?? 'auto');
  const [pickedDays, setPickedDays] = useState<DayType[]>(d0?.pickedDays ?? []);
  useEffect(() => {
    draft = {
      step, name, color, avatar, sex, weight, target, goal, goal2, focus, focusTouched,
      experience, equipment, minutes, strengthDays, cardioDays, mode, ownDays, dayPick, pickedDays, savedAt: Date.now(),
    };
  }, [step, name, color, avatar, sex, weight, target, goal, goal2, focus, focusTouched, experience, equipment, minutes, strengthDays, cardioDays, mode, ownDays, dayPick, pickedDays]);
  const [saving, setSaving] = useState(false);
  const scroller = useRef<ScrollViewInstance>(null);
  // Each step starts at the top.
  useEffect(() => {
    scroller.current?.scrollTo({ y: 0, animated: false });
  }, [step]);

  const flow = mode === 'own' ? FLOW_OWN : FLOW_SUGGESTED;
  const last = flow.length;
  const key = flow[step - 1];
  // The second goal opens like a menu; it starts open when one is already chosen.
  const [goal2Open, setGoal2Open] = useState(false);
  // The focus is suggested from sex and the main goal chosen before it; once the
  // user changes it on the focus step it is theirs and stays.
  const suggested = sex ? suggestFocus(sex, goal) : [];
  const chosenFocus = focusTouched ? focus : suggested;
  const setup: Setup = {
    sex: sex ?? 'female',
    goal,
    goal2,
    focus: chosenFocus.length ? chosenFocus : ['full'],
    experience,
    equipment,
    minutes,
    strengthDays,
    cardioDays,
    ...(dayPick === 'own' ? { days: pickedDays } : {}),
  };
  const plan = generatePlan(setup);
  const pickedStrength = pickedDays.filter((d) => d === 'strength').length;
  const pickedCardio = pickedDays.filter((d) => d === 'cardio').length;

  const canContinue =
    (key !== 'about' || (name.trim().length > 0 && sex != null)) &&
    (key !== 'days' || ownDays.length > 0) &&
    (key !== 'schedule' || dayPick === 'auto' || (pickedStrength === strengthDays && pickedCardio === cardioDays));

  const chooseSex = (s: Sex) => setSex(s);

  const toggleFocus = (f: Focus) => {
    const l = chosenFocus;
    setFocusTouched(true);
    setFocus(l.includes(f) ? l.filter((x) => x !== f) : [...l, f]);
  };
  // The app's spread for the chosen counts, as day types (starting point for "I pick").
  const spread = (sCount: number, cCount: number): DayType[] => {
    const w = weekDays(sCount, cCount);
    return [0, 1, 2, 3, 4, 5, 6].map((i) => (w.strength.includes(i) ? 'strength' : w.cardio.includes(i) ? 'cardio' : null));
  };
  const choosePick = (p: DayPick) => {
    if (p === 'own' && pickedDays.length !== 7) setPickedDays(spread(strengthDays, cardioDays));
    setDayPick(p);
  };
  // Tap a day: strength → cardio → rest, skipping a type whose count from the
  // week step is already used up (3 strength + 2 cardio means exactly that; owner, 2026-11-20).
  const cycleDay = (i: number) => {
    const order: DayType[] = ['strength', 'cardio', null];
    const cur = pickedDays[i] ?? null;
    const full = (type: DayType) =>
      (type === 'strength' && pickedStrength >= strengthDays) || (type === 'cardio' && pickedCardio >= cardioDays);
    let nextType: DayType = null;
    for (let step = 1; step <= 3; step++) {
      const cand = order[(order.indexOf(cur) + step) % 3];
      if (cand === cur || !full(cand)) {
        nextType = cand;
        break;
      }
    }
    setPickedDays(pickedDays.map((d, j) => (j === i ? nextType : d)));
  };
  // Changing the counts on the week step starts the picked days over from the app's spread.
  const setCounts = (sN: number, cN: number) => {
    setStrengthDays(sN);
    setCardioDays(cN);
    if (dayPick === 'own') setPickedDays(spread(sN, cN));
  };
  const toggleDay = (i: number) => setOwnDays((d) => (d.includes(i) ? d.filter((x) => x !== i) : [...d, i]));

  const back = () => {
    if (step > 1) setStep(step - 1);
    else {
      clearDraft();
      // After a language change the screen below may be gone; then go to the start screen.
      if (router.canGoBack()) router.back();
      else router.replace(order.length ? '/profiles' : '/welcome');
    }
  };

  // Android back button steps back through onboarding before leaving it.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (step > 1) {
        setStep(step - 1);
        return true;
      }
      clearDraft();
      return false;
    });
    return () => sub.remove();
  }, [step]);

  const next = async () => {
    if (!canContinue || saving) return;
    if (step < last) {
      setStep(step + 1);
      return;
    }
    setSaving(true);
    try {
      // Selecting the new profile unlocks the app; the router moves to Home.
      const chosen = mode === 'own' ? ownPlan(ownDays, DAYS_FULL) : plan;
      await createProfile(
        { name: name.trim(), color, height: 0, weight, goal: legacyGoal(goal), target, plan: chosen, setup, avatar },
        getLang(),
      );
      clearDraft();
      // Your own plan starts with empty days: go straight to adding exercises.
      if (mode === 'own') setTimeout(() => router.push('/plan'), 50);
    } catch (e) {
      console.error('[liftlog] could not create profile', e);
      setSaving(false);
    }
  };

  const initial = (name.trim()[0] || '?').toUpperCase();

  return (
    <KeyboardAvoidingView style={[styles.screen, { paddingTop: top(50) }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <BackCircle onPress={back} />
        <View style={styles.segs}>
          {Array.from({ length: last }, (_, i) => i + 1).map((i) => (
            <View key={i} style={[styles.seg, { backgroundColor: i <= step ? colors.accentFill : colors.surface2 }]} />
          ))}
        </View>
        <Mono size={14} color={colors.muted}>{`${step}/${last}`}</Mono>
      </View>

      <ScrollView ref={scroller} style={{ flex: 1 }} contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <Display size={40} weight={900} lh={0.92}>
          {t(TITLES[key])}
        </Display>
        <UI size={16} lh={1.45} color={colors.muted} style={{ marginTop: 16 }}>
          {t(SUBS[key])}
        </UI>

        {key === 'about' && (
          <>
            {/* Language first: picking it redraws the screens in that language. */}
            <UI size={16} color={colors.muted} style={{ marginTop: 32 }}>
              {t('Language')}
            </UI>
            <Segmented<Lang> options={LANGS} value={getLang()} onChange={setLang} style={{ marginTop: 8 }} />
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder={t('Your name')}
              placeholderTextColor={colors.placeholder}
              autoCapitalize="words"
              autoCorrect={false}
              returnKeyType="next"
              onSubmitEditing={next}
              maxFontSizeMultiplier={1.2}
              style={styles.nameInput}
            />
            <UI size={16} color={colors.muted} style={{ marginTop: 32 }}>
              {t('I am')}
            </UI>
            <Segmented<Sex> options={SEXES} value={sex ?? ('' as Sex)} onChange={chooseSex} style={{ marginTop: 8 }} />
            <AvatarPicker color={color} icon={avatar} initial={initial} onColor={setColor} onIcon={setAvatar} />
          </>
        )}

        {key === 'body' && (
          <View style={{ gap: 8, marginTop: 32 }}>
            <StepperCard
              label={t('Weight')}
              value={fmt(weight)}
              unit="kg"
              onDec={() => setWeight((w) => r2(w - 0.5))}
              onInc={() => setWeight((w) => r2(w + 0.5))}
              input={{ ...BODY_LIMITS.weight, value: weight, onSet: setWeight }}
            />
            <StepperCard
              label={t('Target weight')}
              value={fmt(target)}
              unit="kg"
              onDec={() => setTarget((v) => r2(v - 0.5))}
              onInc={() => setTarget((v) => r2(v + 0.5))}
              input={{ ...BODY_LIMITS.target, value: target, onSet: setTarget }}
            />
          </View>
        )}

        {key === 'mode' && (
          <View style={[styles.cards, { marginTop: 24 }]}>
            {MODES.map((m) => (
              <Choice key={m.key} on={m.key === mode} onPress={() => setMode(m.key)} title={m.label} sub={m.description} />
            ))}
          </View>
        )}

        {key === 'goals' && (
          <>
            <Label text="Main goal" />
            <View style={styles.cards}>
              {GOAL_OPTIONS.map((g) => (
                <Choice key={g.key} on={g.key === goal} onPress={() => { setGoal(g.key); if (goal2 === g.key) setGoal2(null); }} title={g.label} sub={g.description} />
              ))}
            </View>
            {/* Second goal: a closed row until opened, so the main choice stays the focus. */}
            <Pressable
              onPress={() => {
                // Minus closes the list and clears a chosen second goal (owner, 2026-11-20).
                if (goal2Open || goal2 != null) {
                  setGoal2(null);
                  setGoal2Open(false);
                } else setGoal2Open(true);
              }}
              accessibilityRole="button"
              accessibilityState={{ expanded: goal2Open || goal2 != null }}
              style={({ pressed }) => [styles.more, pressed && { opacity: 0.8 }]}>
              <View style={styles.plus}>
                <Mono size={20} color={colors.ink}>
                  {goal2Open || goal2 != null ? '−' : '+'}
                </Mono>
              </View>
              <View style={{ flex: 1 }}>
                <UI size={16} weight={700}>
                  {goal2 ? t('Second goal: {goal}', { goal: t(GOAL_OPTIONS.find((g) => g.key === goal2)!.label) }) : t('Add a second goal')}
                </UI>
                <UI size={14} lh={1.4} color={colors.muted} style={{ marginTop: 4 }}>
                  {t('Optional. It adds a little to your plan, like a short conditioning finisher for fat loss or fitness.')}
                </UI>
              </View>
            </Pressable>
            {(goal2Open || goal2 != null) && (
              <View style={styles.chips}>
                {GOAL_OPTIONS.filter((g) => g.key !== goal).map((g) => (
                  <Chip key={g.key} on={goal2 === g.key} label={g.label} onPress={() => setGoal2(goal2 === g.key ? null : g.key)} />
                ))}
              </View>
            )}
          </>
        )}

        {key === 'focus' && (
          <>
            {/* The picked areas light up on the figure as they are tapped (owner, 2026-11-20). */}
            <View style={styles.focusFigure} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
              <BodyMap primary={[...new Set(chosenFocus.flatMap((f) => FOCUS_MUSCLES[f] ?? []))]} secondary={[]} width={88} />
            </View>
            <View style={[styles.chips, { marginTop: 24 }]}>
              {FOCUS_OPTIONS.map((f) => (
                <Chip
                  key={f.key}
                  on={chosenFocus.includes(f.key)}
                  label={f.label}
                  tag={suggested.includes(f.key) ? t('Suggested') : undefined}
                  onPress={() => toggleFocus(f.key)}
                />
              ))}
            </View>
            <UI size={16} lh={1.45} color={colors.muted} style={{ marginTop: 24 }}>
              {chosenFocus.length
                ? t('Extra exercises go to: {list}.', { list: chosenFocus.map((f) => t(FOCUS_OPTIONS.find((o) => o.key === f)!.label).toLowerCase()).join(', ') })
                : t('Nothing picked: the plan works the whole body evenly.')}
            </UI>
          </>
        )}

        {key === 'experience' && (
          <>
            <View style={[styles.cards, { marginTop: 24 }]}>
              {EXPERIENCE.map((x) => (
                <Choice key={x.key} on={x.key === experience} onPress={() => setExperience(x.key)} title={x.label} sub={x.description} />
              ))}
            </View>
          </>
        )}

        {key === 'equipment' && (
          <>
            <View style={[styles.cards, { marginTop: 24 }]}>
              {EQUIPMENT.map((x) => (
                <Choice key={x.key} on={x.key === equipment} onPress={() => setEquipment(x.key)} title={x.label} sub={x.description} />
              ))}
            </View>
          </>
        )}

        {key === 'week' && (
          <>
                <Label text="Strength workouts a week" />
                <NumberRow values={[1, 2, 3, 4, 5, 6]} value={strengthDays} max={7 - cardioDays} onChange={(n) => setCounts(n, cardioDays)} />
                <Label text="Cardio workouts a week" />
                <NumberRow values={[0, 1, 2, 3, 4]} value={cardioDays} max={7 - strengthDays} onChange={(n) => setCounts(strengthDays, n)} />
          </>
        )}

        {key === 'schedule' && (
          <>
            <Label text="Training days" />
            <Segmented<DayPick> options={DAY_PICKS.map(([k, l]) => [k, t(l)])} value={dayPick} onChange={choosePick} style={{ marginTop: 8 }} />
            {dayPick === 'auto' ? (
              <>
                <PlanDays days={spread(strengthDays, cardioDays)} />
                <UI size={14} color={colors.muted} style={{ marginTop: 16 }}>
                  {t('We spread your workouts so muscles get a day to recover.')}
                </UI>
              </>
            ) : (
              <>
                <PlanDays days={pickedDays} onPress={cycleDay} />
                {(() => {
                  const complete = pickedStrength === strengthDays && pickedCardio === cardioDays;
                  return (
                    <UI size={14} weight={complete ? 400 : 600} color={complete ? colors.muted : colors.accent} style={{ marginTop: 16 }}>
                      {t('Strength {s} of {sMax} · cardio {c} of {cMax}. Tap a day to change it.', {
                        s: pickedStrength,
                        sMax: strengthDays,
                        c: pickedCardio,
                        cMax: cardioDays,
                      })}
                    </UI>
                  );
                })()}
              </>
            )}
            <Label text="How long do you usually train?" />
            <View style={styles.cards}>
              {LENGTHS.map((l) => (
                <Choice key={l.key} on={l.key === minutes} onPress={() => setMinutes(l.key)} title={l.label} sub={l.description} />
              ))}
            </View>
          </>
        )}

        {key === 'days' && (
          <>
                <Label text="Tap the days you train" />
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
                        <View style={[styles.ownDay, { backgroundColor: on ? colors.accentFill : 'transparent' }]}>
                          {!on && <Ring width={1} color={colors.line} radius={999} />}
                          <Mono size={16} weight={500} color={on ? colors.accentInk : colors.muted}>
                            {d}
                          </Mono>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
                <UI size={16} lh={1.45} color={colors.muted} style={{ marginTop: 24 }}>
                  {ownDays.length
                    ? t('{count} a week. Each day gets its own routine, ready for your exercises.', { count: plural(ownDays.length, 'workout') })
                    : t('You can change days and routines any time from your profile.')}
                </UI>
          </>
        )}

        {key === 'plan' && <PlanPreview plan={plan} />}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: 16 + insets.bottom }]}>
        <PrimaryButton label={step === last ? t('CREATE PROFILE') : t('NEXT')} dimmed={!canContinue} onPress={next} />
      </View>
    </KeyboardAvoidingView>
  );
}

function Label({ text }: { text: string }) {
  return (
    <UI size={16} color={colors.muted} style={{ marginTop: 32 }}>
      {t(text)}
    </UI>
  );
}

/** A selectable card: title and one line; the selected one has an accent outline. */
function Choice({ on, onPress, title, sub }: { on: boolean; onPress: () => void; title: string; sub: string }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: on }}
      style={({ pressed }) => [styles.choice, pressed && { opacity: 0.8 }]}>
      {on && <Ring width={2} color={colors.accent} radius={20} />}
      <View style={{ flex: 1 }}>
        <UI size={20} weight={700}>
          {t(title)}
        </UI>
        <UI size={14} color={colors.muted} style={{ marginTop: 4 }}>
          {t(sub)}
        </UI>
      </View>
      <View style={[styles.radio, on && { borderColor: colors.accent }]}>{on && <View style={styles.radioDot} />}</View>
    </Pressable>
  );
}

/** A toggle pill; `tag` marks suggested ones. */
function Chip({ on, label, tag, onPress }: { on: boolean; label: string; tag?: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: on }}
      style={({ pressed }) => [styles.chip, on ? styles.chipOn : null, pressed && { opacity: 0.8 }]}>
      <UI size={16} weight={600} color={on ? colors.accentInk : colors.ink}>
        {t(label)}
      </UI>
      {tag && (
        <UI size={14} color={on ? colors.accentInk : colors.accent} style={{ opacity: on ? 0.8 : 1 }}>
          {`· ${tag}`}
        </UI>
      )}
    </Pressable>
  );
}

/** Round number options in a row; ones over `max` are disabled. */
function NumberRow({ values, value, max, onChange }: { values: number[]; value: number; max: number; onChange: (n: number) => void }) {
  return (
    <View style={styles.weeklyRow}>
      {values.map((n) => {
        const on = n === value;
        const off = n > max;
        return (
          <Pressable
            key={n}
            onPress={() => onChange(n)}
            disabled={off}
            accessibilityRole="button"
            accessibilityState={{ selected: on, disabled: off }}
            style={[styles.weeklyOpt, { backgroundColor: on ? colors.accentFill : colors.surface, opacity: off ? 0.35 : 1 }]}>
            <Mono size={24} weight={500} color={on ? colors.accentInk : colors.ink}>
              {String(n)}
            </Mono>
          </Pressable>
        );
      })}
    </View>
  );
}

/**
 * Mon–Sun for "Your days": strength = filled accent, cardio = accent outline,
 * rest = thin line. With `onPress` each day can be tapped; the legend says which is which.
 */
function PlanDays({ days, onPress }: { days: DayType[]; onPress?: (i: number) => void }) {
  return (
    <>
      <View style={styles.week}>
        {DAY_LETTERS.map((d, i) => {
          const type = days[i] ?? null;
          const label = `${DAYS_FULL[i]}, ${type === 'strength' ? t('Strength') : type === 'cardio' ? t('Cardio') : t('Rest')}`;
          const circle = (
            <View style={[styles.ownDay, { backgroundColor: type === 'strength' ? colors.accentFill : 'transparent' }]}>
              {type === 'cardio' && <Ring width={2} color={colors.accent} radius={999} />}
              {type == null && <Ring width={1} color={colors.line} radius={999} />}
              <Mono size={16} weight={500} color={type === 'strength' ? colors.accentInk : type === 'cardio' ? colors.ink : colors.muted}>
                {d}
              </Mono>
            </View>
          );
          return onPress ? (
            <Pressable key={i} onPress={() => onPress(i)} accessibilityRole="button" accessibilityLabel={label} style={styles.weekCell}>
              {circle}
            </Pressable>
          ) : (
            <View key={i} accessibilityLabel={label} style={styles.weekCell}>
              {circle}
            </View>
          );
        })}
      </View>
      <View style={styles.legend}>
        <View style={[styles.swatch, { backgroundColor: colors.accentFill }]} />
        <UI size={14} color={colors.muted}>
          {t('Strength')}
        </UI>
        <View style={[styles.swatch, { borderWidth: 2, borderColor: colors.accent, marginLeft: 16 }]} />
        <UI size={14} color={colors.muted}>
          {t('Cardio')}
        </UI>
        <View style={[styles.swatch, { borderWidth: 1, borderColor: colors.line, marginLeft: 16 }]} />
        <UI size={14} color={colors.muted}>
          {t('Rest')}
        </UI>
      </View>
    </>
  );
}

/** The generated week and each routine's exercises, warm-up and stretching. */
function PlanPreview({ plan }: { plan: ReturnType<typeof generatePlan> }) {
  return (
    <>
      <View style={styles.week}>
        {plan.days.map((k, i) => (
          <View key={i} style={styles.weekCell}>
            <UI size={14} weight={600} color={colors.muted}>
              {DAY_INITIALS[i]}
            </UI>
            <View style={[styles.dayCircle, { backgroundColor: k ? plate(k) : 'transparent' }]}>
              {!k && <Ring width={1} color={colors.line} radius={999} />}
              <Mono size={16} weight={500} color={k ? colors.onPlate : colors.muted}>
                {k ?? '·'}
              </Mono>
            </View>
          </View>
        ))}
      </View>
      <View style={{ gap: 8, marginTop: 24 }}>
        {Object.entries(plan.routines).map(([k, r]) => (
          <View key={k} style={styles.planCard}>
            <View style={styles.planHead}>
              <View style={[styles.planDot, { backgroundColor: plate(k) }]}>
                <Mono size={14} weight={500} color={colors.onPlate}>
                  {k}
                </Mono>
              </View>
              <UI size={20} weight={700} style={{ flex: 1 }}>
                {r.name}
              </UI>
              <UI size={14} color={colors.muted}>
                {plural(plan.days.filter((d) => d === k).length, 'workout')}
              </UI>
            </View>
            <UI size={14} color={colors.muted} style={{ marginTop: 8 }}>
              {`${t('Warm-up')}: ${(r.warmup ?? []).map((w) => exercise(w.ex).name).join(', ')}`}
            </UI>
            <UI size={16} lh={1.45} style={{ marginTop: 8 }}>
              {r.type === 'cardio'
                ? r.items.map((it) => `${exercise(it.ex).name} ${it.min} min`).join(' · ')
                : r.items.map((it) => `${exercise(it.ex).name} ${schemeText(it)}`).join(' · ')}
            </UI>
            <UI size={14} color={colors.muted} style={{ marginTop: 8 }}>
              {`${t('Stretching')}: ${(r.stretch ?? []).map((w) => exercise(w.ex).name).join(', ')}`}
            </UI>
          </View>
        ))}
      </View>
      <UI size={16} lh={1.45} color={colors.muted} style={{ marginTop: 24 }}>
        {t('You can change days and routines any time from your profile.')}
      </UI>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 8, paddingHorizontal: 16 },
  segs: { flex: 1, flexDirection: 'row', gap: 8 },
  seg: { flex: 1, height: 5, borderRadius: 3 },
  body: { paddingTop: 32, paddingHorizontal: 24, paddingBottom: 24 },
  nameInput: {
    marginTop: 32,
    borderBottomWidth: 2,
    borderBottomColor: colors.accent,
    color: colors.ink,
    fontFamily: fonts.display800,
    fontSize: 40,
    paddingTop: 4,
    paddingBottom: 8,
    paddingHorizontal: 0,
  },
  goal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: colors.surface,
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  goalDot: { width: 20, height: 20, borderRadius: 10 },
  weeklyRow: { flexDirection: 'row', gap: 8, marginTop: 32 },
  weeklyOpt: { flex: 1, aspectRatio: 1, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  week: { flexDirection: 'row', gap: 8, marginTop: 16 },
  legend: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16 },
  swatch: { width: 16, height: 16, borderRadius: 8 },
  weekCell: { flex: 1, alignItems: 'center', gap: 8 },
  ownDay: { width: 44, maxWidth: '100%', aspectRatio: 1, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  dayCircle: { width: 40, maxWidth: '100%', aspectRatio: 1, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  footer: { paddingTop: 16, paddingHorizontal: 16 },
  cards: { gap: 8, marginTop: 8 },
  choice: { flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: colors.surface, borderRadius: 20, padding: 16 },
  radio: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.accentFill },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  focusFigure: { marginTop: 24, paddingVertical: 16, borderRadius: 20, backgroundColor: colors.surface, alignItems: 'center' },
  more: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 24, padding: 16, borderRadius: 20, borderWidth: 1.5, borderColor: colors.border, borderStyle: 'dashed' },
  plus: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center' },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, height: 44, paddingHorizontal: 16, borderRadius: 22, borderWidth: 1.5, borderColor: colors.border },
  chipOn: { backgroundColor: colors.accentFill, borderColor: colors.accentFill },
  planCard: { backgroundColor: colors.surface, borderRadius: 20, padding: 16 },
  planHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  planDot: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
});
