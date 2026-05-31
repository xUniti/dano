<script lang="ts">
  let {
    icon = "▢",
    title,
    message = "",
    actionLabel = null,
    onAction,
    color = "var(--fg-faint)",
  }: {
    icon?: string;
    title: string;
    message?: string;
    actionLabel?: string | null;
    onAction?: () => void;
    color?: string;
  } = $props();
</script>

<div class="empty" style="--c: {color}">
  <div class="ring"><span class="ico">{icon}</span></div>
  <h3>{title}</h3>
  {#if message}<p>{message}</p>{/if}
  {#if actionLabel && onAction}
    <button class="cta" onclick={onAction}>{actionLabel}</button>
  {/if}
</div>

<style>
  .empty {
    display: flex; flex-direction: column; align-items: center; text-align: center;
    gap: 8px; padding: 56px 24px; max-width: 360px; margin: 24px auto 0;
  }
  .ring {
    width: 52px; height: 52px; border-radius: 14px;
    display: flex; align-items: center; justify-content: center;
    background: color-mix(in srgb, var(--c) 12%, transparent);
    border: 1px solid color-mix(in srgb, var(--c) 30%, transparent);
    margin-bottom: 4px;
  }
  .ico { font-size: 20px; color: var(--c); }
  h3 { margin: 0; font-size: 15px; font-weight: 700; color: var(--fg); }
  p { margin: 0; font-size: 12.5px; color: var(--fg-faint); line-height: 1.55; }
  .cta {
    margin-top: 10px; font-size: 12.5px; color: var(--c);
    border: 1px solid color-mix(in srgb, var(--c) 40%, transparent);
    border-radius: 8px; padding: 8px 16px; transition: background 0.12s;
  }
  .cta:hover { background: color-mix(in srgb, var(--c) 12%, transparent); }
</style>
