// Progress toward the target weight shown on Home (GoalCard).

/** Progress from `start` toward `target` at `now`, 0–100 (any direction). */
export function goalProgress(start: number, now: number, target: number): number {
  if (!target || start === target) return now === target ? 100 : 0;
  return Math.max(0, Math.min(100, ((start - now) / (start - target)) * 100));
}
