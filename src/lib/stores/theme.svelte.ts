// Theme store (Svelte 5 runes): dark/light mode + accent color, persisted locally
// and applied to <html> (class `light` + inline `--accent`).

export type Mode = "dark" | "light";

export const ACCENTS: { id: string; label: string; value: string }[] = [
  { id: "sky", label: "Sky", value: "#38bdf8" },
  { id: "mint", label: "Mint", value: "#6ee7a8" },
  { id: "indigo", label: "Indigo", value: "#818cf8" },
  { id: "violet", label: "Violet", value: "#a78bfa" },
  { id: "rose", label: "Rose", value: "#fb7185" },
  { id: "amber", label: "Amber", value: "#fbbf24" },
];

const MODE_KEY = "dano.theme.mode";
const ACCENT_KEY = "dano.theme.accent";

function accentValue(id: string): string {
  return ACCENTS.find((a) => a.id === id)?.value ?? ACCENTS[0].value;
}

class ThemeStore {
  mode = $state<Mode>("dark");
  accent = $state<string>("sky"); // accent id

  /** Read persisted prefs and apply to <html>. Call once on app start (browser only). */
  init() {
    if (typeof localStorage === "undefined") return;
    this.mode = (localStorage.getItem(MODE_KEY) as Mode) ?? "dark";
    this.accent = localStorage.getItem(ACCENT_KEY) ?? "sky";
    this.apply();
  }

  apply() {
    if (typeof document === "undefined") return;
    document.documentElement.classList.toggle("light", this.mode === "light");
    document.documentElement.style.setProperty("--accent", accentValue(this.accent));
  }

  setMode(m: Mode) {
    this.mode = m;
    if (typeof localStorage !== "undefined") localStorage.setItem(MODE_KEY, m);
    this.apply();
  }
  toggleMode() {
    this.setMode(this.mode === "dark" ? "light" : "dark");
  }
  setAccent(id: string) {
    this.accent = id;
    if (typeof localStorage !== "undefined") localStorage.setItem(ACCENT_KEY, id);
    this.apply();
  }
}

export const theme = new ThemeStore();
