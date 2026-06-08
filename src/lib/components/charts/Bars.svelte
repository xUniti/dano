<script lang="ts">
  interface Props {
    data: number[];
    labels?: string[];
    color?: string;
    height?: number;
  }
  let { data, labels = [], color = "#38bdf8", height = 56 }: Props = $props();
  const max = $derived(Math.max(1, ...data));
</script>

<div class="flex items-end gap-[2px]" style="height: {height}px">
  {#each data as v, i (i)}
    <div class="group relative flex-1" style="height: 100%">
      <div class="absolute bottom-0 w-full rounded-t-sm transition-all" style="height: {(v / max) * 100}%; background: {v > 0 ? color : 'rgba(255,255,255,0.06)'}; min-height: 2px"></div>
      {#if labels[i]}
        <span class="pointer-events-none absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-black/80 px-1 py-0.5 text-[9px] text-white/80 opacity-0 group-hover:opacity-100">{labels[i]}: {v}</span>
      {/if}
    </div>
  {/each}
</div>
