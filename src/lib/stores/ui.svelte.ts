// Global UI state (Svelte 5 runes). Keep this small — most state is local or in TanStack-free
// per-screen runes. This holds cross-cutting flags like the command palette.

class UiStore {
  /** CMD+K command palette visibility (wired up in Phase 9). */
  commandOpen = $state(false);

  openCommand() {
    this.commandOpen = true;
  }
  closeCommand() {
    this.commandOpen = false;
  }
  toggleCommand() {
    this.commandOpen = !this.commandOpen;
  }
}

export const ui = new UiStore();
