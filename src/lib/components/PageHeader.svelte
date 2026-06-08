<script lang="ts">
  interface Props {
    title: string;
    subtitle?: string;
    children?: import("svelte").Snippet;
  }
  let { title, subtitle, children }: Props = $props();
</script>

<div class="flex items-end justify-between gap-4 border-b border-fg/10 px-6 py-4">
  <div>
    <h1 class="text-lg font-semibold tracking-tight">{title}</h1>
    {#if subtitle}
      <p class="mt-0.5 text-xs text-fg/45">{subtitle}</p>
    {/if}
  </div>
  {#if children}
    <div class="flex items-center gap-2">{@render children()}</div>
  {/if}
</div>
