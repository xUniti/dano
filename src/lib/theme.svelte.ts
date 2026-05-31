// Theme controller. Three modes: "system" follows the OS color scheme (and
// updates live), "light"/"dark" pin a choice. Persists the *choice* to
// localStorage; the resolved scheme drives [data-theme] on <html>, which
// app.css keys off.

type Choice = "system" | "light" | "dark";
type Resolved = "light" | "dark";

class Theme {
  choice = $state<Choice>("system");
  resolved = $state<Resolved>("dark"); // the scheme actually applied

  #mq: MediaQueryList | null = null;
  #onChange: (() => void) | null = null;

  init() {
    let initial: Choice = "system";
    try {
      const saved = localStorage.getItem("dano-theme");
      if (saved === "system" || saved === "light" || saved === "dark") initial = saved;
    } catch {
      /* localStorage unavailable — default system */
    }
    this.set(initial);
  }

  #systemScheme(): Resolved {
    try {
      return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
    } catch {
      return "dark";
    }
  }

  #apply(scheme: Resolved) {
    this.resolved = scheme;
    document.documentElement.setAttribute("data-theme", scheme);
  }

  set(c: Choice) {
    this.choice = c;
    try {
      localStorage.setItem("dano-theme", c);
    } catch {
      /* ignore */
    }

    // Tear down any previous system listener.
    if (this.#mq && this.#onChange) this.#mq.removeEventListener("change", this.#onChange);
    this.#mq = null;
    this.#onChange = null;

    if (c === "system") {
      this.#apply(this.#systemScheme());
      try {
        this.#mq = window.matchMedia("(prefers-color-scheme: light)");
        this.#onChange = () => this.#apply(this.#systemScheme());
        this.#mq.addEventListener("change", this.#onChange);
      } catch {
        /* matchMedia unavailable */
      }
    } else {
      this.#apply(c);
    }
  }

  // Cycle for the sidebar/quick toggle: system → light → dark → system.
  toggle() {
    this.set(this.choice === "system" ? "light" : this.choice === "light" ? "dark" : "system");
  }
}

export const theme = new Theme();
