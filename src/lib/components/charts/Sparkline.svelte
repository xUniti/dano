<script lang="ts">
  // Line + soft area for a series. Nulls create gaps (e.g. days with no entry).
  interface Props {
    data: (number | null)[];
    color?: string;
    height?: number;
    min?: number;
    max?: number;
  }
  let { data, color = "#38bdf8", height = 56, min = 0, max = 10 }: Props = $props();

  const W = 100;
  const H = 32;
  const pts = $derived(
    data.map((v, i) => {
      const x = data.length <= 1 ? 0 : (i / (data.length - 1)) * W;
      const y = v == null ? null : H - ((v - min) / Math.max(1, max - min)) * H;
      return { x, y };
    }),
  );
  // build line segments, breaking on nulls
  const line = $derived(
    pts
      .map((p) => (p.y == null ? "" : `${p.x.toFixed(1)},${p.y.toFixed(1)}`))
      .reduce((acc, cur) => (cur === "" ? acc + " | " : acc + " " + cur), "")
      .split("|")
      .map((seg) => seg.trim())
      .filter((seg) => seg.length > 0),
  );
</script>

<svg viewBox="0 0 {W} {H}" preserveAspectRatio="none" style="width:100%;height:{height}px" aria-hidden="true">
  {#each line as seg (seg)}
    <polyline points={seg} fill="none" stroke={color} stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke" />
  {/each}
  {#each pts as p (p.x)}
    {#if p.y != null}
      <circle cx={p.x} cy={p.y} r="1.4" fill={color} vector-effect="non-scaling-stroke" />
    {/if}
  {/each}
</svg>
