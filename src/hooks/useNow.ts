import { useEffect, useState } from 'react';

/** Current time in ms, refreshed every `intervalMs` while `active`. */
export function useNow(intervalMs = 500, active = true) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs, active]);
  return now;
}
