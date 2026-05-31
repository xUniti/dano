// Zoom controller. Persists to localStorage and reflects the level via the CSS
// `zoom` property on <html>, which scales the whole UI uniformly. Useful on
// very large/hi-dpi screens where the default text feels too small.

const MIN = 0.8;
const MAX = 1.8;
const STEP = 0.1;
const DEFAULT = 1;

function clamp(v: number): number {
  return Math.min(MAX, Math.max(MIN, Math.round(v * 100) / 100));
}

class Zoom {
  value = $state<number>(DEFAULT);

  init() {
    let initial = DEFAULT;
    try {
      const saved = parseFloat(localStorage.getItem("dano-zoom") ?? "");
      if (!Number.isNaN(saved)) initial = clamp(saved);
    } catch {
      /* localStorage unavailable — default zoom */
    }
    this.set(initial);
  }

  set(v: number) {
    this.value = clamp(v);
    // `zoom` is well supported in WebKitGTK and scales layout + text together.
    document.documentElement.style.zoom = String(this.value);
    try {
      localStorage.setItem("dano-zoom", String(this.value));
    } catch {
      /* ignore */
    }
  }

  in() { this.set(this.value + STEP); }
  out() { this.set(this.value - STEP); }
  reset() { this.set(DEFAULT); }

  get percent(): number { return Math.round(this.value * 100); }
  get atMin(): boolean { return this.value <= MIN + 0.001; }
  get atMax(): boolean { return this.value >= MAX - 0.001; }
}

export const zoom = new Zoom();
