import { Alert, Platform } from 'react-native';
import { t } from '@/i18n';

/** A question waiting for an answer in the in-app dialog (web). */
export type ConfirmRequest = {
  title: string;
  confirmLabel: string;
  message?: string;
  /** Deleting something: the confirm button is red. */
  danger?: boolean;
  resolve: (ok: boolean) => void;
};

let show: ((r: ConfirmRequest) => void) | null = null;

/** Called by <ConfirmHost/> so web confirms open the in-app dialog. */
export function setConfirmHost(fn: ((r: ConfirmRequest) => void) | null) {
  show = fn;
}

/**
 * Two-button confirm. Resolves true when the user picks `confirmLabel`.
 * Web: the app's own dialog (ConfirmHost), not the browser's "site says" popup.
 * Phone apps: the system alert.
 */
export function confirm(title: string, confirmLabel: string, message?: string, danger = false): Promise<boolean> {
  if (Platform.OS === 'web') {
    if (show) return new Promise((resolve) => show!({ title, confirmLabel, message, danger, resolve }));
    return Promise.resolve(globalThis.confirm?.(message ? `${title}\n\n${message}` : title) ?? true);
  }
  return new Promise((resolve) =>
    Alert.alert(title, message, [
      { text: t('Cancel'), style: 'cancel', onPress: () => resolve(false) },
      { text: confirmLabel, style: 'destructive', onPress: () => resolve(true) },
    ], { cancelable: true, onDismiss: () => resolve(false) }),
  );
}
