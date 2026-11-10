import { Alert, Platform } from 'react-native';

/** Native two-button confirm. Resolves true when the user picks `confirmLabel`. */
export function confirm(title: string, confirmLabel: string, message?: string): Promise<boolean> {
  if (Platform.OS === 'web') return Promise.resolve(globalThis.confirm?.(message ? `${title}\n\n${message}` : title) ?? true);
  return new Promise((resolve) =>
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
      { text: confirmLabel, style: 'destructive', onPress: () => resolve(true) },
    ], { cancelable: true, onDismiss: () => resolve(false) }),
  );
}
