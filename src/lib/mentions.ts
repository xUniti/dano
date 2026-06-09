// Shared @mention / #ref detection for journal & note editors.
// `@` links people, `#` links tasks. Pure string logic — no DB access.

export interface MentionMatch {
  trigger: "@" | "#";
  query: string;
  /** Index in the full text where the trigger character starts. */
  start: number;
}

/** Detect an in-progress @/# mention immediately before the caret, or null. */
export function detectMention(textBeforeCaret: string): MentionMatch | null {
  const m = textBeforeCaret.match(/([@#])([^\s@#]{0,40})$/);
  if (!m) return null;
  return {
    trigger: m[1] as "@" | "#",
    query: m[2],
    start: textBeforeCaret.length - m[0].length,
  };
}
