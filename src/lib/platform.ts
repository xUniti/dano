// Platform seam. Nothing outside this file should branch on the runtime directly,
// so mobile (iOS/Android) can swap implementations later without touching screens.

/** Running inside the Tauri runtime (desktop today, native mobile later). */
export function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

/** Treat as desktop unless we detect a small/touch viewport. */
export function isMobileViewport(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(max-width: 768px)").matches;
}

export function isDesktop(): boolean {
  return !isMobileViewport();
}
