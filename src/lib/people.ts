// People engine — relationship strength, follow-up detection, birthdays.
// Pure functions over Person rows + a link count; no DB access here.

import type { Person } from "./types";

const DAY = 86_400_000;

export function fullName(p: Person): string {
  return `${p.first_name} ${p.last_name}`.trim() || "Unnamed";
}

export function initials(p: Person): string {
  const a = p.first_name.trim()[0] ?? "";
  const b = p.last_name.trim()[0] ?? "";
  return (a + b).toUpperCase() || "?";
}

export function daysSinceInteraction(p: Person): number | null {
  if (p.last_interaction_at == null) return null;
  return Math.floor((Date.now() - p.last_interaction_at) / DAY);
}

export interface Strength {
  score: number; // 0..100
  label: "Strong" | "Warm" | "Cooling" | "Cold";
}

/** Strength = interaction frequency (link count) + recency of last interaction. */
export function strength(p: Person, linkCount: number): Strength {
  const freq = Math.min(linkCount, 10) * 6; // up to 60
  const days = daysSinceInteraction(p);
  let recency = 0;
  if (days != null) {
    if (days <= 7) recency = 40;
    else if (days <= 30) recency = 25;
    else if (days <= 90) recency = 10;
  }
  const score = Math.min(100, freq + recency);
  const label = score >= 70 ? "Strong" : score >= 45 ? "Warm" : score >= 20 ? "Cooling" : "Cold";
  return { score, label };
}

/** Days until the next occurrence of a 'YYYY-MM-DD' birthday, or null. */
export function daysUntilBirthday(birthday: string | null): number | null {
  if (!birthday) return null;
  const parts = birthday.split("-").map(Number);
  if (parts.length < 3 || Number.isNaN(parts[1]) || Number.isNaN(parts[2])) return null;
  const [, month, day] = parts;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let next = new Date(today.getFullYear(), month - 1, day);
  if (next < today) next = new Date(today.getFullYear() + 1, month - 1, day);
  return Math.round((next.getTime() - today.getTime()) / DAY);
}

/** A relationship is "overdue" if never contacted or quiet for > threshold days. */
export function isFollowUpDue(p: Person, thresholdDays = 30): boolean {
  if (p.archived) return false;
  const days = daysSinceInteraction(p);
  return days == null || days > thresholdDays;
}
