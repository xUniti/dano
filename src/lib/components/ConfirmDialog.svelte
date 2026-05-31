<script lang="ts">
  import { store } from "$lib/store.svelte";

  const c = $derived(store.confirm);

  function onKey(e: KeyboardEvent) {
    if (!store.confirm) return;
    if (e.key === "Escape") { e.preventDefault(); store.cancelConfirm(); }
    else if (e.key === "Enter") { e.preventDefault(); store.runConfirm(); }
  }
</script>

<svelte:window onkeydown={onKey} />

{#if c}
  <div
    class="overlay"
    role="button"
    tabindex="-1"
    aria-label="Cancel"
    onclick={() => store.cancelConfirm()}
    onkeydown={() => {}}
  >
    <div class="dialog" role="alertdialog" aria-modal="true" aria-label={c.title} onclick={(e) => e.stopPropagation()}>
      <h3>{c.title}</h3>
      <p>{c.message}</p>
      <div class="actions">
        <button class="cancel" onclick={() => store.cancelConfirm()}>Cancel</button>
        <button class="danger" onclick={() => store.runConfirm()}>{c.confirmLabel}</button>
      </div>
    </div>
  </div>
{/if}

<style>
  .overlay {
    position: fixed; inset: 0; z-index: 100;
    display: flex; align-items: center; justify-content: center;
    background: rgba(0, 0, 0, 0.45); padding: 24px;
  }
  .dialog {
    width: 100%; max-width: 380px;
    background: var(--bg-elev); border: 1px solid var(--border); border-radius: 12px;
    padding: 20px; box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4);
  }
  h3 { margin: 0 0 8px; font-size: 15px; font-weight: 700; color: var(--fg); }
  p { margin: 0 0 18px; font-size: 13px; line-height: 1.55; color: var(--fg-dim); }
  .actions { display: flex; justify-content: flex-end; gap: 8px; }
  .cancel {
    font-size: 12.5px; color: var(--fg-dim); background: var(--bg);
    border: 1px solid var(--border); border-radius: 8px; padding: 7px 14px;
    transition: background 0.12s, color 0.12s;
  }
  .cancel:hover { background: var(--bg-inset); color: var(--fg); }
  .danger {
    font-size: 12.5px; color: #fff; background: var(--danger);
    border: 1px solid var(--danger); border-radius: 8px; padding: 7px 14px; font-weight: 600;
    transition: filter 0.12s;
  }
  .danger:hover { filter: brightness(1.08); }
</style>
