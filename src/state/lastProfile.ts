// Remembers which profile was open, so the app reopens straight into it
// instead of asking "Who's lifting today?" every time. Web only (the app is
// used as a home-screen web app); storage may be blocked, so every call is guarded.

const KEY = 'liftlog-profile';

export function getLastProfile(): string | null {
  try {
    return globalThis.localStorage?.getItem(KEY) ?? null;
  } catch {
    return null;
  }
}

export function setLastProfile(id: string | null): void {
  try {
    if (id) globalThis.localStorage?.setItem(KEY, id);
    else globalThis.localStorage?.removeItem(KEY);
  } catch {
    // Private mode or blocked storage: the picker is shown next time.
  }
}
