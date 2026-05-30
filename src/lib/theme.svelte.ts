// Theme controller. Persists to localStorage (reliable in the webview) and
// reflects the choice via [data-theme] on <html>, which app.css keys off.

class Theme {
  value = $state<"dark" | "light">("dark");

  init() {
    let initial: "dark" | "light" = "dark";
    try {
      const saved = localStorage.getItem("dano-theme");
      if (saved === "light" || saved === "dark") {
        initial = saved;
      } else if (
        window.matchMedia("(prefers-color-scheme: light)").matches
      ) {
        initial = "light";
      }
    } catch {
      /* localStorage unavailable — fall back to dark */
    }
    this.set(initial);
  }

  set(v: "dark" | "light") {
    this.value = v;
    document.documentElement.setAttribute("data-theme", v);
    try {
      localStorage.setItem("dano-theme", v);
    } catch {
      /* ignore */
    }
  }

  toggle() {
    this.set(this.value === "dark" ? "light" : "dark");
  }
}

export const theme = new Theme();
