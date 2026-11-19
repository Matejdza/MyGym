// The app's own confirm dialog on the web (owner, 2026-11-20): a card over the
// dimmed, blurred screen, in the app's fonts, colors and language, instead of
// the browser's "matejdza.github.io says" popup. One question at a time.
// Cancel, the backdrop and the Escape/back gesture all answer "no".

import { useEffect, useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { setConfirmHost, type ConfirmRequest } from '@/components/confirm';
import { Display, UI } from '@/components/Txt';
import { t } from '@/i18n';
import { colors } from '@/theme/tokens';

const BLUR = (Platform.OS === 'web' ? { backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)' } : {}) as ViewStyle;

export function ConfirmHost() {
  const [req, setReq] = useState<ConfirmRequest | null>(null);

  useEffect(() => {
    setConfirmHost((r) =>
      setReq((cur) => {
        cur?.resolve(false);
        return r;
      }),
    );
    return () => setConfirmHost(null);
  }, []);

  const answer = (ok: boolean) => {
    req?.resolve(ok);
    setReq(null);
  };

  return (
    <Modal visible={!!req} transparent animationType="fade" onRequestClose={() => answer(false)}>
      <View style={[styles.backdrop, BLUR]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={() => answer(false)} accessibilityLabel={t('Cancel')} />
        {req && (
          <View style={styles.card} accessibilityViewIsModal accessibilityRole="alert">
            <Display size={32} weight={900} lh={1}>
              {req.title}
            </Display>
            {req.message && (
              <UI size={16} lh={1.5} color={colors.muted} style={{ marginTop: 8 }}>
                {req.message}
              </UI>
            )}
            <View style={styles.actions}>
              <Pressable
                onPress={() => answer(false)}
                accessibilityRole="button"
                style={({ pressed }) => [styles.btn, styles.cancel, pressed && { backgroundColor: colors.line }]}>
                <UI size={16} weight={600}>
                  {t('Cancel')}
                </UI>
              </Pressable>
              <Pressable
                onPress={() => answer(true)}
                accessibilityRole="button"
                style={({ pressed }) => [
                  styles.btn,
                  req.danger ? styles.danger : { backgroundColor: pressed ? colors.press : colors.accentFill },
                  pressed && req.danger && { backgroundColor: colors.line },
                ]}>
                <UI size={16} weight={700} color={req.danger ? colors.red : colors.accentInk}>
                  {req.confirmLabel}
                </UI>
              </Pressable>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'center', padding: 16, backgroundColor: 'rgba(10,12,16,0.45)' },
  card: { width: '100%', maxWidth: 420, alignSelf: 'center', padding: 24, borderRadius: 32, backgroundColor: colors.bg },
  actions: { flexDirection: 'row', gap: 8, marginTop: 24 },
  btn: { flex: 1, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  cancel: { borderWidth: 1.5, borderColor: colors.border },
  danger: { borderWidth: 1.5, borderColor: colors.red },
});
