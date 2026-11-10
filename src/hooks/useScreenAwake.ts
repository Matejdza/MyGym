import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { useEffect } from 'react';
import { Platform } from 'react-native';

const TAG = 'liftlog-workout';

type WakeLock = { release: () => Promise<void> };
type WakeLockApi = { request: (type: 'screen') => Promise<WakeLock> };

/**
 * Keeps the screen on while the calling screen is open (the live workout), so the
 * phone doesn't lock between sets. On the web the browser drops the lock whenever
 * the page is hidden, so it is asked for again each time the app comes back.
 */
export function useScreenAwake() {
  useEffect(() => {
    if (Platform.OS !== 'web') {
      activateKeepAwakeAsync(TAG).catch(() => {});
      return () => {
        deactivateKeepAwake(TAG).catch(() => {});
      };
    }

    const api = (navigator as Navigator & { wakeLock?: WakeLockApi }).wakeLock;
    if (!api) return; // Older browsers: the screen follows the phone's own setting.
    let lock: WakeLock | null = null;
    let alive = true;
    const acquire = () => {
      if (document.visibilityState !== 'visible') return;
      api
        .request('screen')
        .then((l) => {
          if (alive) lock = l;
          else l.release().catch(() => {});
        })
        .catch(() => {}); // Refused (e.g. low battery mode); nothing to do.
    };
    acquire();
    document.addEventListener('visibilitychange', acquire);
    return () => {
      alive = false;
      document.removeEventListener('visibilitychange', acquire);
      lock?.release().catch(() => {});
    };
  }, []);
}
