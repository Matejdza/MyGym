// Light / dark / auto (follows the phone). Stored on this device, not per
// profile. Applying a theme only flips `data-theme` on <html>; the colors are
// CSS variables (see tokens.ts and public/index.html). Web only: the native
// build stays dark.

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

export function setThemePref(pref: ThemePref) {
  if (!THEME_SWITCH) return;
  try {
    localStorage.setItem(KEY, pref);
  } catch {
    // Private mode: the choice lasts until the app is closed.
  }
  document.documentElement.setAttribute('data-theme', pref);
  const dark = pref === 'dark' || (pref === 'auto' && !window.matchMedia?.('(prefers-color-scheme: light)').matches);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#1C1C1A' : '#F4F2EC');
  // iOS only reads this when the home-screen app opens; it takes effect next launch.
  document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]')?.setAttribute('content', dark ? 'black-translucent' : 'default');
}
