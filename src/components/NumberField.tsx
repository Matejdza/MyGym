// A stepper's number that can be tapped and typed. It is always a text field, so
// the phone opens its number keyboard from the tap itself (iOS Safari only opens
// the keyboard for a field focused directly by the user).
//
// States: default (thin line under the number), focus (accent line; the field
// starts empty with the old value greyed out as a hint, so typing replaces it —
// browsers don't reliably keep a selection after a tap), error (red line; the
// owner shows `onError`'s message in its label), empty (the grey hint), disabled
// (`editable={false}`: no line, muted). Valid values are applied while typing;
// leaving the field empty or invalid puts the old value back.

import { useRef, useState } from 'react';
import { Platform, TextInput, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';

import { editText, parseEntry, type NumberSpec } from '@/domain/numberEntry';
import { useScale } from '@/theme/layout';
import { t } from '@/i18n';
import { colors, em, fonts } from '@/theme/tokens';

/** What a stepper needs to make its number typeable. */
export type NumberInput = NumberSpec & {
  value: number;
  onSet: (value: number) => void;
};

/** Smallest font iOS Safari accepts in a focused field without zooming the page. */
const MIN_INPUT_FONT = 16;
/** Archivo tabular digit width per character. */
const CHAR_EM = 0.6;

export function NumberField({
  input,
  display,
  size,
  label,
  onError,
  editable = true,
  style,
}: {
  input: NumberInput;
  /** The value as shown when not editing ("82.5", "2:00", "90 s"). */
  display: string;
  /** Design font size, scaled like Mono. */
  size: number;
  /** Spoken name, e.g. "Weight in kg". */
  label: string;
  onError?: (message: string | null) => void;
  editable?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const { s } = useScale();
  const fontSize = Math.max(MIN_INPUT_FONT, Math.round(size * s * 10) / 10);
  const [draft, setDraft] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Value before editing started, restored when the field is left empty or invalid.
  const original = useRef(input.value);

  const report = (msg: string | null) => {
    setError(msg);
    onError?.(msg);
  };

  const onFocus = () => {
    original.current = input.value;
    setDraft('');
  };

  const onChangeText = (text: string) => {
    setDraft(text);
    const entry = parseEntry(text, input);
    if ('value' in entry) {
      report(null);
      if (entry.value !== input.value) input.onSet(entry.value);
    } else report('error' in entry ? entry.error : null);
  };

  const finish = () => {
    if (draft != null && !('value' in parseEntry(draft, input)) && input.value !== original.current) {
      input.onSet(original.current);
    }
    setDraft(null);
    report(null);
  };

  const editing = draft != null;
  const hint = editText(input.value, input);
  const shown = draft || (editing ? hint : display);
  const line = !editable ? 'transparent' : error ? colors.red : editing ? colors.accent : colors.line;
  // Fixed width from the largest value the field takes (plus room for ".5" when it
  // allows decimals), so the underline does not grow or shrink while the number changes.
  const slots = Math.max(2, editText(input.max, input).length + (input.decimals ? 2 : 0), shown.length);
  const width = slots * fontSize * CHAR_EM + 6;

  const textStyle: TextStyle = {
    width,
    fontFamily: fonts.mono500,
    fontSize,
    letterSpacing: em(-0.01, fontSize),
    fontVariant: ['tabular-nums'],
    color: editable ? colors.ink : colors.muted,
    textAlign: 'center',
    padding: 0,
    margin: 0,
    height: Math.round(fontSize * 1.2),
    // The browser's focus outline is replaced by the accent line under the field.
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none', outlineWidth: 0 } as unknown as TextStyle) : null),
  };

  return (
    <View style={[{ borderBottomWidth: 2, borderBottomColor: line, paddingBottom: 2 }, style]}>
      <TextInput
        value={draft ?? display}
        onChangeText={onChangeText}
        onFocus={onFocus}
        onBlur={finish}
        onSubmitEditing={finish}
        editable={editable}
        placeholder={editing ? hint : undefined}
        placeholderTextColor={colors.placeholder}
        inputMode="decimal"
        keyboardType="decimal-pad"
        returnKeyType="done"
        selectionColor={colors.accent}
        maxLength={8}
        maxFontSizeMultiplier={1.2}
        accessibilityLabel={label}
        accessibilityHint={t('Type a number, or use the minus and plus buttons')}
        style={textStyle}
      />
    </View>
  );
}
