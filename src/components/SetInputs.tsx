// Set entry in the strength log sheet: − value + rows, with a typeable number.
// (The keypad and scale variants were removed: typing covers both.)

import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { sheetRow } from '@/components/LogChrome';
import { NumberField, type NumberInput } from '@/components/NumberField';
import { Mono, UI } from '@/components/Txt';
import { RoundButton } from '@/components/ui';
import { useScale } from '@/theme/layout';
import { colors } from '@/theme/tokens';

/** Big − value + row (74 pt buttons). */
export function StepRow({
  value,
  label,
  onDec,
  onInc,
  mirrored,
  input,
}: {
  value: string;
  label: string;
  onDec: () => void;
  onInc: () => void;
  mirrored: boolean;
  /** Makes the number typeable; its error replaces the label while shown. */
  input?: NumberInput;
}) {
  const { fit } = useScale();
  const b = fit(74);
  const [error, setError] = useState<string | null>(null);
  return (
    <View style={[sheetRow(mirrored), { height: b }]}>
      <RoundButton sign="−" size={74} fitHeight fontSize={28} onPress={onDec} />
      <View style={styles.stepValue}>
        {input ? (
          <NumberField input={input} display={value} size={42} label={label} onError={setError} />
        ) : (
          <Mono size={42} weight={500} lh={1} spacing={-0.05}>
            {value}
          </Mono>
        )}
        <UI size={13} color={error ? colors.red : colors.muted} numberOfLines={1} style={{ marginTop: input ? 2 : 6 }}>
          {error ?? label}
        </UI>
      </View>
      <RoundButton sign="+" size={74} fitHeight fontSize={28} onPress={onInc} />
    </View>
  );
}

const styles = StyleSheet.create({
  stepValue: { flex: 1, minWidth: 0, alignItems: 'center' },
});
