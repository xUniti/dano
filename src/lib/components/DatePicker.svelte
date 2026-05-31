<script lang="ts">
  // Custom date picker — avoids the native <input type="date"> popup, which is
  // unreliable in the WebKitGTK webview (Tauri/Linux) and on mobile.
  import { startOfDay, isToday, sameDay, weekdayLabels } from "$lib/date";

  let {
    value = null,
    onpick,
    compact = false,
    placeholder = "set date",
  }: {
    value: number | null;
    onpick: (ms: number | null) => void;
    compact?: boolean;
    placeholder?: string;
  } = $props();

  let open = $state(false);
  let anchor = $state<number>(value ?? Date.now());
  let root: HTMLDivElement;

  function toggle() {
    if (!open) anchor = value ?? Date.now();
    open = !open;
  }

  const label = $derived(
    value == null
      ? placeholder
      : new Date(value).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" }),
  );

  const monthLabel = $derived(
    new Date(anchor).toLocaleDateString([], { month: "long", year: "numeric" }),
  );

  const days = $derived.by(() => {
    const a = new Date(anchor);
    const first = new Date(a.getFullYear(), a.getMonth(), 1);
    const startDow = (first.getDay() + 6) % 7;
    const start = new Date(first.getFullYear(), first.getMonth(), 1 - startDow);
    return Array.from({ length: 42 }, (_, i) =>
      new Date(start.getFullYear(), start.getMonth(), start.getDate() + i).getTime(),
    );
  });

  function inMonth(ms: number): boolean {
    return new Date(ms).getMonth() === new Date(anchor).getMonth();
  }
  function step(dir: -1 | 1) {
    const a = new Date(anchor);
    a.setMonth(a.getMonth() + dir);
    anchor = a.getTime();
  }
  function pick(ms: number) {
    onpick(startOfDay(ms));
    open = false;
  }
  function clear() {
    onpick(null);
    open = false;
  }

  $effect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (root && !root.contains(e.target as Node)) open = false;
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") open = false;
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  });
</script>

<div class="dp" bind:this={root}>
  {#if compact}
    <button class="trigger compact" class:set={value != null} onclick={toggle} title="Set date">▦</button>
  {:else}
    <button class="trigger" class:placeholder={value == null} onclick={toggle}>{label}</button>
  {/if}

  {#if open}
    <div class="pop">
      <div class="pop-head">
        <button class="nav" onclick={() => step(-1)} title="Previous month">‹</button>
        <span class="ml">{monthLabel}</span>
        <button class="nav" onclick={() => step(1)} title="Next month">›</button>
      </div>
      <div class="wk">
        {#each weekdayLabels as w (w)}<span>{w[0]}</span>{/each}
      </div>
      <div class="grid">
        {#each days as d (d)}
          <button
            class="day"
            class:dim={!inMonth(d)}
            class:today={isToday(d)}
            class:sel={value != null && sameDay(d, value)}
            onclick={() => pick(d)}
          >{new Date(d).getDate()}</button>
        {/each}
      </div>
      <div class="pop-foot">
        <button class="clear" onclick={clear}>clear</button>
        <button class="today-btn" onclick={() => pick(Date.now())}>today</button>
      </div>
    </div>
  {/if}
</div>

<style>
  .dp { position: relative; display: inline-flex; }

  .trigger {
    background: var(--bg-inset); color: var(--fg-dim);
    border: 1px solid var(--border); border-radius: var(--radius);
    padding: 3px 8px; font-size: 11px; outline: none; cursor: pointer;
    transition: color 0.12s, border-color 0.12s;
  }
  .trigger:hover { color: var(--fg); border-color: var(--fg-faint); }
  .trigger.placeholder { color: var(--fg-faint); }
  .trigger.compact { padding: 2px 6px; border-color: transparent; background: transparent; color: var(--fg-faint); }
  .trigger.compact:hover { background: var(--bg-inset); border-color: var(--border); }
  .trigger.compact.set { color: var(--fg-dim); }

  .pop {
    position: absolute; top: calc(100% + 4px); left: 0; z-index: 60;
    width: 224px; padding: 10px; background: var(--bg-inset);
    border: 1px solid var(--border); border-radius: 8px;
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.35);
  }
  .pop-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
  .nav { width: 22px; height: 22px; border-radius: var(--radius); color: var(--fg-dim); font-size: 14px; }
  .nav:hover { background: var(--bg-elev); color: var(--fg); }
  .ml { font-size: 12px; font-weight: 700; color: var(--fg); }

  .wk { display: grid; grid-template-columns: repeat(7, 1fr); margin-bottom: 2px; }
  .wk span { text-align: center; font-size: 9px; color: var(--fg-faint); }

  .grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 1px; }
  .day {
    aspect-ratio: 1; display: flex; align-items: center; justify-content: center;
    font-size: 11px; color: var(--fg-dim); border-radius: var(--radius);
    transition: background 0.1s, color 0.1s;
  }
  .day:hover { background: var(--bg-elev); color: var(--fg); }
  .day.dim { color: var(--fg-faint); opacity: 0.5; }
  .day.today { color: var(--accent); font-weight: 700; }
  .day.sel { background: var(--accent); color: var(--bg); }
  .day.sel.today { color: var(--bg); }

  .pop-foot { display: flex; align-items: center; justify-content: space-between; margin-top: 8px; padding-top: 8px; border-top: 1px solid var(--border-soft); }
  .clear { font-size: 11px; color: var(--fg-faint); padding: 3px 8px; border-radius: var(--radius); }
  .clear:hover { color: var(--danger); }
  .today-btn { font-size: 11px; color: var(--accent); padding: 3px 8px; border-radius: var(--radius); }
  .today-btn:hover { background: var(--bg-elev); }
</style>
