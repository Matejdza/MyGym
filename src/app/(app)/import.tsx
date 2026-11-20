import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Display, Mono, UI } from '@/components/Txt';
import { BackPill, PrimaryButton } from '@/components/ui';
import { DAYS, exercise } from '@/data/catalog';
import { plural } from '@/domain/format';
import { parseRoutineText, withImportedRoutine } from '@/domain/importText';
import { nextRoutineKey, schemeText, restText } from '@/domain/plan';
import { useActive, useStore } from '@/state/store';
import { useTop } from '@/theme/layout';
import { colors, fonts } from '@/theme/tokens';
import { t } from '@/i18n';

const EXAMPLE = ['Push day', 'Monday, Thursday', 'Bench press 4 x 8, 90 s rest', 'Incline dumbbell press 3 x 10-12', 'Lateral raise 3 sets, 15 reps'].join('\n');

/**
 * Import a routine from text (e.g. a plan from a coach or another app).
 * One goal: turn the pasted text into a routine. One CTA: Create routine.
 * States: empty (example as placeholder, no preview), typing (live preview),
 * nothing recognised (message, CTA disabled), lines skipped (listed in red),
 * full (8 routines: message, CTA disabled), focus (accent border on the field).
 */
export default function ImportRoutine() {
  const { profile, settings } = useActive();
  const { setPlan } = useStore();
  const top = useTop();
  const insets = useSafeAreaInsets();
  const [text, setText] = useState('');
  const [focused, setFocused] = useState(false);

  const parsed = parseRoutineText(text);
  const full = nextRoutineKey(profile.plan) == null;
  const canCreate = parsed.items.length > 0 && !full;

  const create = () => {
    const res = withImportedRoutine(profile.plan, parsed);
    if (!res) return;
    setPlan(res.plan);
    router.replace(`/routine/${res.key}`);
  };

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: top(58) }]} keyboardShouldPersistTaps="handled">
        <BackPill onPress={() => router.back()} style={{ alignSelf: 'flex-start' }} />
        <Display size={56} weight={900} lh={0.9} style={{ marginTop: 24 }}>
          {t('Import routine')}
        </Display>
        <UI size={16} color={colors.muted} lh={1.5} style={{ marginTop: 16 }}>
          {t('Paste a routine, one exercise per line. Sets, reps, rest and days are picked up; weights are skipped.')}
        </UI>

        <TextInput
          value={text}
          onChangeText={setText}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          multiline
          placeholder={EXAMPLE}
          placeholderTextColor={colors.placeholder}
          autoCapitalize="sentences"
          autoCorrect={false}
          accessibilityLabel={t('Routine text')}
          textAlignVertical="top"
          style={[styles.input, { borderColor: focused ? colors.accent : colors.line }]}
        />

        {text.trim().length > 0 && (
          <View style={{ marginTop: 32 }}>
            <Display size={32} weight={800}>
              {t('Preview')}
            </Display>

            {parsed.items.length === 0 ? (
              <UI size={16} color={colors.muted} lh={1.5} style={{ marginTop: 16 }}>
                {t('No exercises recognised yet. Use the names from the exercise library, e.g. “Bench press 4 x 8”.')}
              </UI>
            ) : (
              <View style={styles.card}>
                <UI size={20} weight={600}>
                  {parsed.name ?? t('Imported routine')}
                </UI>
                <UI size={14} color={colors.muted} style={{ marginTop: 4 }}>
                  {parsed.days.length ? parsed.days.map((d) => DAYS[d]).join(', ') : t('No days yet: pick them in Training plan')}
                </UI>
                <View style={{ marginTop: 16 }}>
                  {parsed.items.map((it, i) => (
                    <View key={i} style={[styles.row, i < parsed.items.length - 1 && styles.rowLine]}>
                      <UI size={16} style={{ flex: 1, minWidth: 0 }} numberOfLines={1}>
                        {exercise(it.ex).name}
                      </UI>
                      <Mono size={16} color={colors.muted}>
                        {`${schemeText(it)} · ${restText(it.rest ?? settings.restSeconds)}`}
                      </Mono>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {parsed.unknown.length > 0 && (
              <View style={{ marginTop: 16, gap: 8 }}>
                <UI size={16} weight={600} color={colors.red}>
                  {t('Skipped {count}', { count: plural(parsed.unknown.length, 'line') })}
                </UI>
                {parsed.unknown.map((u, i) => (
                  <UI key={i} size={16} color={colors.muted}>{`“${u.line}”: ${t(u.reason)}`}</UI>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: 16 + insets.bottom }]}>
        {full && (
          <UI size={16} color={colors.red} align="center" style={{ marginBottom: 8 }}>
            {t('You already have 8 routines. Delete one first.')}
          </UI>
        )}
        <PrimaryButton label={t('CREATE ROUTINE')} onPress={canCreate ? create : undefined} dimmed={!canCreate} disabled={!canCreate} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: 16, paddingBottom: 32 },
  input: {
    minHeight: 200,
    marginTop: 24,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    backgroundColor: colors.surface,
    color: colors.ink,
    fontFamily: fonts.ui400,
    fontSize: 16,
    lineHeight: 24,
  },
  card: { marginTop: 16, padding: 16, borderRadius: 16, backgroundColor: colors.surface },
  row: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 8 },
  rowLine: { borderBottomWidth: 1, borderBottomColor: colors.line },
  footer: { paddingHorizontal: 16, paddingTop: 8 },
});
