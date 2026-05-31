// List display mode for the Projects & Areas pages: "compact" (dense rows)
// vs "cards" (preview cards). A single shared choice for both pages,
// persisted to localStorage.

type Mode = "compact" | "cards";

class ViewMode {
  mode = $state<Mode>("cards");
  #ready = false;

  init() {
    if (this.#ready) return;
    try {
      const v = localStorage.getItem("dano-view-mode");
      if (v === "compact" || v === "cards") this.mode = v;
    } catch { /* ignore */ }
    this.#ready = true;
  }

  set(v: Mode) {
    this.mode = v;
    try { localStorage.setItem("dano-view-mode", v); } catch { /* ignore */ }
  }

  toggle() {
    this.set(this.mode === "cards" ? "compact" : "cards");
  }
}

export const viewMode = new ViewMode();
