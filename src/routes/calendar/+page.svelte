<script lang="ts">
  import { onMount } from "svelte";
  import PageHeader from "$lib/components/PageHeader.svelte";
  import { events as eventDb, tasks as taskDb, people as peopleDb } from "$lib/db";
  import { isTauri } from "$lib/platform";
  import { todayKey, startOfDayMs, endOfDayMs } from "$lib/date";
  import { fullName } from "$lib/people";
  import type { CalEvent, Task, Person } from "$lib/types";

  const desktop = isTauri();
  type View = "month" | "week" | "agenda" | "day";
  const views: View[] = ["month", "week", "agenda", "day"];

  interface Item { kind: "event" | "task" | "birthday"; id: string; title: string; at: number; }
  const kindColor: Record<Item["kind"], string> = { event: "#38bdf8", task: "#fbbf24", birthday: "#f472b6" };

  let view = $state<View>("month");
  let anchor = $state(new Date());
  let loading = $state(true);

  let events = $state<CalEvent[]>([]);
  let tasks = $state<Task[]>([]);
  let people = $state<Person[]>([]);

  // new event
  let evTitle = $state("");
  let evDate = $state(todayKey());

  function startOfWeek(d: Date): Date {
    const x = new Date(d);
    const day = (x.getDay() + 6) % 7; // Monday = 0
    x.setDate(x.getDate() - day);
    x.setHours(0, 0, 0, 0);
    return x;
  }

  const range = $derived.by(() => {
    if (view === "month") {
      const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
      const gridStart = startOfWeek(first);
      const gridEnd = new Date(gridStart);
      gridEnd.setDate(gridStart.getDate() + 41);
      gridEnd.setHours(23, 59, 59, 999);
      return { start: gridStart.getTime(), end: gridEnd.getTime() };
    }
    if (view === "week") {
      const s = startOfWeek(anchor);
      const e = new Date(s);
      e.setDate(s.getDate() + 6);
      e.setHours(23, 59, 59, 999);
      return { start: s.getTime(), end: e.getTime() };
    }
    if (view === "day") return { start: startOfDayMs(anchor), end: endOfDayMs(anchor) };
    // agenda: next 30 days from today
    return { start: startOfDayMs(), end: endOfDayMs(new Date(Date.now() + 30 * 86400000)) };
  });

  async function load() {
    if (!desktop) {
      loading = false;
      return;
    }
    loading = true;
    [events, tasks, people] = await Promise.all([
      eventDb.between(range.start, range.end),
      taskDb.listAll(),
      peopleDb.list(),
    ]);
    loading = false;
  }

  $effect(() => {
    range;
    if (desktop) load();
  });
  onMount(() => { if (desktop) load(); });

  function birthdayItems(): Item[] {
    const out: Item[] = [];
    const sY = new Date(range.start).getFullYear();
    const eY = new Date(range.end).getFullYear();
    for (const p of people) {
      if (!p.birthday) continue;
      const parts = p.birthday.split("-").map(Number);
      if (parts.length < 3) continue;
      for (let y = sY; y <= eY; y++) {
        const at = new Date(y, parts[1] - 1, parts[2]).getTime();
        if (at >= range.start && at <= range.end) out.push({ kind: "birthday", id: p.id + y, title: `🎂 ${fullName(p)}`, at });
      }
    }
    return out;
  }

  const items = $derived.by<Item[]>(() => {
    const evItems: Item[] = events.map((e) => ({ kind: "event", id: e.id, title: e.title, at: e.start_at }));
    const taskItems: Item[] = tasks
      .filter((t) => t.due_at != null && t.due_at >= range.start && t.due_at <= range.end)
      .map((t) => ({ kind: "task", id: t.id, title: t.title, at: t.due_at as number }));
    return [...evItems, ...taskItems, ...birthdayItems()].sort((a, b) => a.at - b.at);
  });

  function itemsOn(dayMs: number): Item[] {
    const s = startOfDayMs(new Date(dayMs));
    const e = endOfDayMs(new Date(dayMs));
    return items.filter((i) => i.at >= s && i.at <= e);
  }

  // month grid cells
  const monthCells = $derived.by(() => {
    const cells: Date[] = [];
    const start = new Date(range.start);
    for (let i = 0; i < 42; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      cells.push(d);
    }
    return cells;
  });

  // agenda/week/day grouped days
  const listDays = $derived.by(() => {
    const out: { label: string; ms: number; items: Item[] }[] = [];
    const start = new Date(range.start);
    const total = view === "day" ? 1 : view === "week" ? 7 : 31;
    for (let i = 0; i < total; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      if (d.getTime() > range.end) break;
      const its = itemsOn(d.getTime());
      if (view === "agenda" && its.length === 0) continue;
      out.push({
        label: new Intl.DateTimeFormat(undefined, { weekday: "short", month: "short", day: "numeric" }).format(d),
        ms: d.getTime(),
        items: its,
      });
    }
    return out;
  });

  const heading = $derived(
    view === "month"
      ? new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" }).format(anchor)
      : view === "agenda"
        ? "Next 30 days"
        : new Intl.DateTimeFormat(undefined, { month: "long", day: "numeric", year: "numeric" }).format(anchor),
  );

  function shift(delta: number) {
    const d = new Date(anchor);
    if (view === "month") d.setMonth(d.getMonth() + delta);
    else if (view === "week") d.setDate(d.getDate() + delta * 7);
    else d.setDate(d.getDate() + delta);
    anchor = d;
  }

  async function addEvent() {
    if (!evTitle.trim()) return;
    const [y, m, d] = evDate.split("-").map(Number);
    const at = new Date(y, m - 1, d, 9, 0).getTime();
    await eventDb.create(evTitle.trim(), at);
    evTitle = "";
    await load();
  }

  const todayK = todayKey();
</script>

<PageHeader title="Calendar" subtitle="Events · task deadlines · birthdays">
  <div class="flex items-center gap-2">
    <div class="flex rounded-lg border border-fg/10 p-0.5">
      {#each views as v (v)}
        <button type="button" onclick={() => (view = v)} class="rounded-md px-2.5 py-1 text-xs capitalize transition-colors {view === v ? 'bg-fg/10 text-fg' : 'text-fg/50 hover:text-fg/80'}">{v}</button>
      {/each}
    </div>
  </div>
</PageHeader>

{#if !desktop}
  <div class="m-6 rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-200/80">
    The calendar reads your local database. Launch the desktop app with
    <code class="rounded bg-black/30 px-1">npm run tauri dev</code> to use it.
  </div>
{:else}
  <!-- subheader: nav + add event -->
  <div class="flex flex-wrap items-center gap-3 px-6 py-3">
    {#if view !== "agenda"}
      <button type="button" onclick={() => shift(-1)} class="rounded-md px-2 py-1 text-fg/50 hover:bg-fg/5 hover:text-fg">←</button>
    {/if}
    <span class="text-sm font-medium text-fg/80">{heading}</span>
    {#if view !== "agenda"}
      <button type="button" onclick={() => shift(1)} class="rounded-md px-2 py-1 text-fg/50 hover:bg-fg/5 hover:text-fg">→</button>
      <button type="button" onclick={() => (anchor = new Date())} class="text-xs text-accent hover:underline">Today</button>
    {/if}
    <div class="ml-auto flex gap-2">
      <input type="date" bind:value={evDate} class="rounded-md border border-fg/10 bg-fg/[0.03] px-2 py-1 text-xs outline-none [color-scheme:dark]" />
      <input bind:value={evTitle} onkeydown={(e) => e.key === "Enter" && addEvent()} placeholder="New event…" class="rounded-md border border-fg/10 bg-fg/[0.03] px-2.5 py-1 text-xs outline-none placeholder:text-fg/30 focus:border-fg/25" />
      <button type="button" onclick={addEvent} class="rounded-md bg-accent/80 px-3 py-1 text-xs font-medium text-fg hover:bg-accent">Add</button>
    </div>
  </div>

  {#if loading}
    <div class="p-6 text-sm text-fg/40">Loading…</div>
  {:else if view === "month"}
    <div class="px-6 pb-6">
      <div class="grid grid-cols-7 gap-px text-[11px] text-fg/40">
        {#each ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as d (d)}<div class="px-2 py-1">{d}</div>{/each}
      </div>
      <div class="grid grid-cols-7 gap-1.5">
        {#each monthCells as cell (cell.getTime())}
          {@const inMonth = cell.getMonth() === anchor.getMonth()}
          {@const its = itemsOn(cell.getTime())}
          {@const isToday = todayKey(cell) === todayK}
          <div class="min-h-20 rounded-lg border p-1.5 {inMonth ? 'border-fg/10 bg-fg/[0.02]' : 'border-transparent bg-transparent opacity-40'} {isToday ? 'ring-1 ring-accent/60' : ''}">
            <div class="mb-1 text-[11px] {isToday ? 'font-semibold text-accent' : 'text-fg/45'}">{cell.getDate()}</div>
            <div class="space-y-0.5">
              {#each its.slice(0, 3) as it (it.kind + it.id)}
                <div class="flex items-center gap-1 truncate text-[10px] text-fg/75">
                  <span class="h-1.5 w-1.5 shrink-0 rounded-full" style="background:{kindColor[it.kind]}"></span>
                  <span class="truncate">{it.title}</span>
                </div>
              {/each}
              {#if its.length > 3}<div class="text-[10px] text-fg/35">+{its.length - 3} more</div>{/if}
            </div>
          </div>
        {/each}
      </div>
    </div>
  {:else}
    <div class="space-y-4 px-6 pb-6">
      {#if listDays.length === 0}
        <p class="text-sm text-fg/35">Nothing scheduled.</p>
      {:else}
        {#each listDays as day (day.ms)}
          <div>
            <div class="mb-1.5 text-xs font-medium {todayKey(new Date(day.ms)) === todayK ? 'text-accent' : 'text-fg/55'}">{day.label}</div>
            {#if day.items.length === 0}
              <p class="text-xs text-fg/25">—</p>
            {:else}
              <div class="space-y-1">
                {#each day.items as it (it.kind + it.id)}
                  <div class="flex items-center gap-2 rounded-lg border border-fg/5 bg-fg/[0.02] px-3 py-1.5">
                    <span class="h-2 w-2 shrink-0 rounded-full" style="background:{kindColor[it.kind]}"></span>
                    <span class="flex-1 truncate text-sm text-fg/85">{it.title}</span>
                    <span class="text-[10px] uppercase text-fg/30">{it.kind}</span>
                  </div>
                {/each}
              </div>
            {/if}
          </div>
        {/each}
      {/if}
    </div>
  {/if}
{/if}
