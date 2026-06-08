// Small date helpers. Timestamps are ms-since-epoch; calendar days are 'YYYY-MM-DD'.

export function todayKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function startOfDayMs(d: Date = new Date()): number {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.getTime();
}

export function endOfDayMs(d: Date = new Date()): number {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x.getTime();
}

/** Compact, human due-date label relative to today. */
export function dueLabel(ms: number | null): string {
  if (ms == null) return "";
  const due = new Date(ms);
  const today = startOfDayMs();
  const dayMs = 86_400_000;
  const diff = Math.round((startOfDayMs(due) - today) / dayMs);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  if (diff < 0) return `${-diff}d overdue`;
  if (diff < 7) return `in ${diff}d`;
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(due);
}

export function isOverdue(ms: number | null): boolean {
  return ms != null && ms < startOfDayMs();
}

/** Parse a <input type="date"> value (YYYY-MM-DD) to end-of-day ms, or null. */
export function dateInputToMs(value: string): number | null {
  if (!value) return null;
  const [y, m, d] = value.split("-").map(Number);
  return endOfDayMs(new Date(y, m - 1, d));
}

/** ms → YYYY-MM-DD for <input type="date">. */
export function msToDateInput(ms: number | null): string {
  return ms == null ? "" : todayKey(new Date(ms));
}
