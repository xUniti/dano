<script lang="ts">
  import { store } from "$lib/store.svelte";

  let {
    icon,
    title,
    color = "var(--fg-dim)",
    count = null,
    actionLabel = null,
    onAction,
  }: {
    icon: string;
    title: string;
    color?: string;
    count?: number | null;
    actionLabel?: string | null;
    onAction?: () => void;
  } = $props();
</script>

<header class="head" style="--c: {color}">
  <div class="crumbs">
    <button class="crumb" onclick={() => store.openDashboard()}>Dashboard</button>
    <span class="sep">›</span>
    <span class="here"><span class="ico">{icon}</span>{title}</span>
    {#if count != null}<span class="cnt">{count}</span>{/if}
  </div>
  {#if actionLabel && onAction}
    <button class="new" onclick={onAction}>{actionLabel}</button>
  {/if}
</header>

<style>
  .head { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 20px 28px 14px; border-bottom: 1px solid var(--border-soft); flex: 0 0 auto; }
  .crumbs { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--fg-faint); min-width: 0; }
  .crumb { color: var(--fg-faint); }
  .crumb:hover { color: var(--fg); }
  .sep { color: var(--fg-faint); }
  .here { display: inline-flex; align-items: center; gap: 8px; color: var(--fg); font-weight: 700; font-size: 15px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .ico { color: var(--c); font-size: 13px; flex: 0 0 auto; }
  .cnt { font-size: 11px; color: var(--fg-faint); border: 1px solid var(--border); border-radius: 10px; padding: 0 7px; flex: 0 0 auto; }
  .new { color: var(--c); font-size: 12.5px; padding: 7px 13px; border: 1px solid color-mix(in srgb, var(--c) 40%, transparent); border-radius: 8px; white-space: nowrap; flex: 0 0 auto; }
  .new:hover { background: color-mix(in srgb, var(--c) 12%, transparent); }
</style>
