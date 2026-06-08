// Habits engine — streak & completion rate derived from habit_completions.
// Dates are 'YYYY-MM-DD'. Truth lives in the rows; these are pure computations.

import { todayKey } from "./date";

function shiftKey(key: string, deltaDays: number): string {
  const [y, m, d] = key.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + deltaDays);
  return todayKey(dt);
}

/** Current daily streak: consecutive days with a completion, ending today or yesterday. */
export function streak(done: Set<string>): number {
  let count = 0;
  let cursor = todayKey();
  // Allow the streak to still count if today isn't logged yet but yesterday was.
  if (!done.has(cursor)) cursor = shiftKey(cursor, -1);
  while (done.has(cursor)) {
    count++;
    cursor = shiftKey(cursor, -1);
  }
  return count;
}

/** Completion rate over the last `days` days (inclusive of today), 0..100. */
export function completionRate(done: Set<string>, days = 30): number {
  let hit = 0;
  let cursor = todayKey();
  for (let i = 0; i < days; i++) {
    if (done.has(cursor)) hit++;
    cursor = shiftKey(cursor, -1);
  }
  return Math.round((hit / days) * 100);
}

/** The last `days` day-keys, oldest→newest, for rendering a heatmap row. */
export function recentDays(days = 14): string[] {
  const out: string[] = [];
  for (let i = days - 1; i >= 0; i--) out.push(shiftKey(todayKey(), -i));
  return out;
}
