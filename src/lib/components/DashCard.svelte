<script lang="ts">
  interface Props {
    title: string;
    href?: string;
    children: import("svelte").Snippet;
  }
  let { title, href, children }: Props = $props();
</script>

<div class="flex flex-col rounded-2xl border border-white/10 bg-white/[0.02] p-4">
  <div class="mb-3 flex items-center justify-between">
    <h2 class="text-sm font-semibold tracking-tight text-white/85">{title}</h2>
    {#if href}
      <a href={href} class="text-[11px] text-white/35 hover:text-sky-300">Open →</a>
    {/if}
  </div>
  <div class="min-h-0 flex-1">
    {@render children()}
  </div>
</div>
