// Small date helpers shared across components.

export function toDateInput(ms: number | null): string {
  if (ms == null) return "";
  const d = new Date(ms);
  // Local YYYY-MM-DD for <input type="date">.
  const off = d.getTimezoneOffset();
  return new Date(ms - off * 60000).toISOString().slice(0, 10);
}

export function fromDateInput(v: string): number | null {
  return v ? new Date(v + "T12:00:00").getTime() : null;
}

export function relativeDue(ms: number): { label: string; tone: "over" | "soon" | "later" } {
  const d = new Date(ms);
  const today = new Date();
  const startToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const startDue = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((startDue - startToday) / 86400000);
  let label: string;
  if (days < 0) label = `${-days}d overdue`;
  else if (days === 0) label = "today";
  else if (days === 1) label = "tomorrow";
  else if (days < 7) label = `in ${days}d`;
  else label = d.toLocaleDateString([], { month: "short", day: "numeric" });
  const tone = days < 0 ? "over" : days <= 2 ? "soon" : "later";
  return { label, tone };
}
