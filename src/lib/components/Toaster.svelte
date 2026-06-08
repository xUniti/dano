<script lang="ts">
  import { toasts } from "$lib/stores/toast.svelte";
  import { fly } from "svelte/transition";
</script>

<div class="pointer-events-none fixed bottom-24 left-1/2 z-[120] flex -translate-x-1/2 flex-col items-center gap-2">
  {#each toasts.items as t (t.id)}
    <div
      in:fly={{ y: 12, duration: 180 }}
      out:fly={{ y: 12, duration: 150 }}
      class="pointer-events-auto flex items-center gap-3 rounded-xl border border-fg/10 bg-surface/95 px-4 py-2.5 text-sm text-fg/90 shadow-2xl shadow-black/40 backdrop-blur-2xl"
    >
      <span>{t.message}</span>
      {#if t.action}
        <button
          type="button"
          onclick={() => toasts.runAction(t)}
          class="rounded-md bg-accent/20 px-2 py-0.5 text-xs font-medium text-accent hover:bg-accent/30"
        >
          {t.action.label}
        </button>
      {/if}
      <button type="button" onclick={() => toasts.dismiss(t.id)} aria-label="Dismiss" class="text-fg/30 hover:text-fg/60">✕</button>
    </div>
  {/each}
</div>
