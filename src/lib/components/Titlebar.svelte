<script lang="ts">
  import { getCurrentWindow } from "@tauri-apps/api/window";
  import { isTauri } from "$lib/platform";

  const win = isTauri() ? getCurrentWindow() : null;
</script>

<!-- Custom window chrome. The bar is the drag region; buttons (no drag attr) stay clickable. -->
<div
  data-tauri-drag-region
  class="relative z-20 flex h-8 shrink-0 items-center justify-between border-b border-fg/5 px-3 select-none"
>
  <span data-tauri-drag-region class="text-[11px] font-medium tracking-wide text-fg/40">DANO</span>

  <div class="flex items-center gap-0.5">
    <button
      type="button"
      onclick={() => win?.minimize()}
      aria-label="Minimize"
      class="flex h-6 w-7 items-center justify-center rounded text-fg/45 hover:bg-fg/10 hover:text-fg/80"
    >
      <svg width="10" height="10" viewBox="0 0 10 10"><line x1="1" y1="5" x2="9" y2="5" stroke="currentColor" stroke-width="1.2" /></svg>
    </button>
    <button
      type="button"
      onclick={() => win?.toggleMaximize()}
      aria-label="Maximize"
      class="flex h-6 w-7 items-center justify-center rounded text-fg/45 hover:bg-fg/10 hover:text-fg/80"
    >
      <svg width="10" height="10" viewBox="0 0 10 10"><rect x="1.5" y="1.5" width="7" height="7" rx="1" fill="none" stroke="currentColor" stroke-width="1.2" /></svg>
    </button>
    <button
      type="button"
      onclick={() => win?.close()}
      aria-label="Close"
      class="flex h-6 w-7 items-center justify-center rounded text-fg/45 hover:bg-red-500/80 hover:text-white"
    >
      <svg width="10" height="10" viewBox="0 0 10 10"><line x1="1.5" y1="1.5" x2="8.5" y2="8.5" stroke="currentColor" stroke-width="1.2" /><line x1="8.5" y1="1.5" x2="1.5" y2="8.5" stroke="currentColor" stroke-width="1.2" /></svg>
    </button>
  </div>
</div>
