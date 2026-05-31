<script lang="ts">
  import "../app.css";
  import { onMount } from "svelte";
  import { theme } from "$lib/theme.svelte";
  import { zoom } from "$lib/zoom.svelte";
  import { font } from "$lib/font.svelte";
  import { viewMode } from "$lib/viewmode.svelte";
  import { store } from "$lib/store.svelte";

  let { children } = $props();

  onMount(() => {
    theme.init();
    zoom.init();
    font.init();
    viewMode.init();
    store.init();

    // True when focus is in a field where typing should not trigger shortcuts.
    function isTyping(e: KeyboardEvent): boolean {
      const t = e.target as HTMLElement | null;
      if (!t) return false;
      const tag = t.tagName;
      return (
        tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" ||
        t.isContentEditable || !!t.closest(".cm-editor")
      );
    }

    // "g" starts a navigation sequence (g then d/p/a/r/c/i/s). Resets after 1s.
    let gPending = false;
    let gTimer: ReturnType<typeof setTimeout> | null = null;
    function clearG() { gPending = false; if (gTimer) { clearTimeout(gTimer); gTimer = null; } }

    function onKey(e: KeyboardEvent) {
      // --- Zoom (Ctrl/Cmd) — works everywhere ---
      if (e.ctrlKey || e.metaKey) {
        if (e.key === "+" || e.key === "=" || e.code === "NumpadAdd") { e.preventDefault(); zoom.in(); }
        else if (e.key === "-" || e.code === "NumpadSubtract") { e.preventDefault(); zoom.out(); }
        else if (e.key === "0" || e.code === "Numpad0") { e.preventDefault(); zoom.reset(); }
        return;
      }

      // Don't hijack typing, and ignore when a modifier is held.
      if (isTyping(e) || e.altKey) { clearG(); return; }

      // Escape closes an open confirm dialog (handled there too) — also clears g.
      if (e.key === "Escape") { clearG(); return; }

      // --- "g" navigation prefix ---
      if (gPending) {
        const map: Record<string, () => void> = {
          d: () => store.openDashboard(),
          p: () => store.openProjects(),
          a: () => store.openAreasList(),
          r: () => store.openResources(),
          c: () => store.openContacts(),
          k: () => store.openCalendar(),
          s: () => store.openSettings(),
        };
        const fn = map[e.key.toLowerCase()];
        clearG();
        if (fn) { e.preventDefault(); fn(); }
        return;
      }
      if (e.key === "g") { gPending = true; gTimer = setTimeout(clearG, 1000); return; }

      // --- single-key shortcuts ---
      if (e.key === "n") { e.preventDefault(); store.newNote(); }
      else if (e.key === "/") { e.preventDefault(); store.openSearch(); }
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });
</script>

{@render children()}
