// Font controller for the UI typeface. Four choices (Notion-style), persisted
// to localStorage and applied by overriding the --font-ui CSS variable on <html>.
// Note: --font-mono (logo + editor) is intentionally left untouched.

export type FontChoice = "sans" | "serif" | "mono" | "rounded";

const STACKS: Record<FontChoice, string> = {
  sans: '"Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  serif: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif',
  mono: '"JetBrains Mono", "SFMono-Regular", "SF Mono", "Cascadia Code", "Fira Code", ui-monospace, "Liberation Mono", Menlo, Consolas, monospace',
  rounded: 'ui-rounded, "SF Pro Rounded", "Hiragino Maru Gothic ProN", "Quicksand", "Comfortaa", system-ui, sans-serif',
};

export const FONT_LABELS: Record<FontChoice, string> = {
  sans: "Sans", serif: "Serif", mono: "Mono", rounded: "Rounded",
};

class Font {
  value = $state<FontChoice>("sans");

  init() {
    let initial: FontChoice = "sans";
    try {
      const saved = localStorage.getItem("dano-font");
      if (saved === "sans" || saved === "serif" || saved === "mono" || saved === "rounded") initial = saved;
    } catch {
      /* localStorage unavailable — default sans */
    }
    this.set(initial);
  }

  set(v: FontChoice) {
    this.value = v;
    document.documentElement.style.setProperty("--font-ui", STACKS[v]);
    try {
      localStorage.setItem("dano-font", v);
    } catch {
      /* ignore */
    }
  }
}

export const font = new Font();
