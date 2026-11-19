// Light / dark / auto (follows the phone). Stored on this device, not per
// profile. Applying a theme only flips `data-theme` on <html>; the colors are
// CSS variables (see tokens.ts and public/index.html). Web only: the native
// build stays dark.

import { useSyncExternalStore } from 'react';
import { Platform } from 'react-native';

export type ThemePref = 'auto' | 'light' | 'dark';

const KEY = 'liftlog-theme';

export const THEME_SWITCH = Platform.OS === 'web';

export function getThemePref(): ThemePref {
  if (!THEME_SWITCH) return 'dark';
  try {
    const v = localStorage.getItem(KEY);
    return v === 'light' || v === 'dark' ? v : 'auto';
  } catch {
    return 'auto';
  }
}

const listeners = new Set<() => void>();
const LIGHT_QUERY = '(prefers-color-scheme: light)';

/** True when the app is showing the light theme (the choice, or the phone's setting on Auto). */
function lightNow(): boolean {
  if (!THEME_SWITCH) return false;
  const pref = getThemePref();
  return pref === 'light' || (pref === 'auto' && !!window.matchMedia?.(LIGHT_QUERY).matches);
}

function subscribe(onChange: () => void) {
  if (!THEME_SWITCH) return () => {};
  listeners.add(onChange);
  const mq = window.matchMedia?.(LIGHT_QUERY);
  mq?.addEventListener?.('change', onChange);
  return () => {
    listeners.delete(onChange);
    mq?.removeEventListener?.('change', onChange);
  };
}

/** Re-renders when the theme changes (switch in Profile, or the phone on Auto). */
export const useIsLight = () => useSyncExternalStore(subscribe, lightNow, () => false);

export function setThemePref(pref: ThemePref) {
  if (!THEME_SWITCH) return;
  try {
    localStorage.setItem(KEY, pref);
  } catch {
    // Private mode: the choice lasts until the app is closed.
  }
  document.documentElement.setAttribute('data-theme', pref);
  const dark = pref === 'dark' || (pref === 'auto' && !window.matchMedia?.('(prefers-color-scheme: light)').matches);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#1C1C1A' : '#E8EAEE');
  // iOS only reads this when the home-screen app opens; it takes effect next launch.
  document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]')?.setAttribute('content', dark ? 'black-translucent' : 'default');
  listeners.forEach((l) => l());
}
