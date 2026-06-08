<script lang="ts">
  import { onMount } from "svelte";
  import PageHeader from "$lib/components/PageHeader.svelte";
  import { habits as habitDb, habitCompletions, archiveEntity, restoreEntity } from "$lib/db";
  import { toasts } from "$lib/stores/toast.svelte";
  import { isTauri } from "$lib/platform";
  import { todayKey } from "$lib/date";
  import { streak, completionRate, recentDays } from "$lib/habits";
  import type { Habit, HabitFrequency } from "$lib/types";

  const desktop = isTauri();
  const key = todayKey();
  const days = recentDays(14);
  const palette = ["#34d399", "#38bdf8", "#fbbf24", "#f87171", "#a78bfa", "#f472b6"];

  let habits = $state<Habit[]>([]);
  let sets = $state<Record<string, Set<string>>>({});
  let loading = $state(true);
  let error = $state<string | null>(null);
  let newName = $state("");
  let editingId = $state<string | null>(null);
  let editName = $state("");

  async function load() {
    if (!desktop) {
      loading = false;
      return;
    }
    try {
      loading = true;
      const hs = await habitDb.list();
      const map: Record<string, Set<string>> = {};
      await Promise.all(
        hs.map(async (h) => {
          const comps = await habitCompletions.forHabit(h.id);
          map[h.id] = new Set(comps.map((c) => c.date));
        }),
      );
      habits = hs;
      sets = map;
      error = null;
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
    } finally {
      loading = false;
    }
  }

  async function add() {
    const name = newName.trim();
    if (!name) return;
    newName = "";
    const h = await habitDb.create(name);
    await habitDb.update(h.id, { color: palette[habits.length % palette.length] });
    await load();
  }
  async function toggle(h: Habit, date: string) {
    if (sets[h.id]?.has(date)) await habitCompletions.unset(h.id, date);
    else await habitCompletions.set(h.id, date);
    await load();
  }
  async function commitRename() {
    const id = editingId;
    editingId = null;
    if (id && editName.trim()) {
      await habitDb.update(id, { name: editName.trim() });
      await load();
    }
  }
  async function setColor(h: Habit, color: string) {
    await habitDb.update(h.id, { color });
    await load();
  }
  async function setFreq(h: Habit, frequency: HabitFrequency) {
    await habitDb.update(h.id, { frequency });
    await load();
  }
  async function remove(h: Habit) {
    await archiveEntity("habit", h.id);
    await load();
    toasts.show("Habit archived", {
      action: { label: "Undo", run: async () => { await restoreEntity("habit", h.id); await load(); } },
    });
  }
</script>

<PageHeader title="Habits" subtitle="Streaks &amp; completion" />

{#if !desktop}
  <div class="m-6 rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-200/80">
    Habits live in the local database. Launch the desktop app with
    <code class="rounded bg-black/30 px-1">npm run tauri dev</code> to use them.
  </div>
{:else if error}
  <div class="m-6 rounded-lg border border-red-500/20 bg-red-500/5 p-3 text-sm text-red-300">{error}</div>
{:else if loading}
  <div class="p-6 text-sm text-fg/40">Loading…</div>
{:else}
  <div class="p-6">
    <div class="mb-6 flex gap-2">
      <input
        bind:value={newName}
        onkeydown={(e) => e.key === "Enter" && add()}
        placeholder="New habit (Meditate, Read, Workout…)"
        class="flex-1 rounded-lg border border-fg/10 bg-fg/[0.03] px-3 py-2 text-sm outline-none placeholder:text-fg/30 focus:border-fg/25"
      />
      <button type="button" onclick={add} class="rounded-lg bg-emerald-500/80 px-4 py-2 text-sm font-medium text-fg hover:bg-emerald-500">Add</button>
    </div>

    {#if habits.length === 0}
      <div class="rounded-xl border border-dashed border-fg/10 p-10 text-center text-sm text-fg/40">
        No habits yet. Add one and check it off each day to build a streak.
      </div>
    {:else}
      <div class="space-y-3">
        {#each habits as h (h.id)}
          {@const done = sets[h.id] ?? new Set()}
          {@const doneToday = done.has(key)}
          <div class="rounded-2xl border border-fg/10 bg-fg/[0.02] p-4">
            <div class="flex items-center gap-3">
              <button
                type="button"
                onclick={() => toggle(h, key)}
                aria-label="Toggle today"
                class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-colors {doneToday ? 'border-transparent text-fg' : 'border-fg/20 text-fg/40 hover:border-fg/40'}"
                style={doneToday ? `background:${h.color ?? "#34d399"}` : ""}
              >
                ✓
              </button>

              <div class="min-w-0 flex-1">
                {#if editingId === h.id}
                  <!-- svelte-ignore a11y_autofocus -->
                  <input bind:value={editName} autofocus onblur={commitRename} onkeydown={(e) => e.key === "Enter" && commitRename()} class="rounded bg-fg/10 px-1.5 py-0.5 text-sm outline-none" />
                {:else}
                  <button type="button" ondblclick={() => ((editingId = h.id), (editName = h.name))} class="block truncate text-left text-sm font-medium text-fg/90">{h.name}</button>
                {/if}
                <div class="mt-0.5 flex items-center gap-3 text-[11px] text-fg/40">
                  <span>🔥 {streak(done)}d streak</span>
                  <span>{completionRate(done)}% / 30d</span>
                  <select value={h.frequency} onchange={(e) => setFreq(h, (e.currentTarget as HTMLSelectElement).value as HabitFrequency)} class="rounded bg-fg/5 px-1 py-0.5 text-[11px] text-fg/55 outline-none">
                    <option value="daily">daily</option>
                    <option value="weekly">weekly</option>
                    <option value="custom">custom</option>
                  </select>
                </div>
              </div>

              <!-- color -->
              <div class="hidden items-center gap-1 sm:flex">
                {#each palette as c (c)}
                  <button type="button" onclick={() => setColor(h, c)} aria-label="color" class="h-3.5 w-3.5 rounded-full {h.color === c ? 'ring-2 ring-fg/70' : ''}" style="background:{c}"></button>
                {/each}
              </div>

              <button type="button" onclick={() => remove(h)} class="shrink-0 rounded px-2 py-1 text-[11px] text-fg/35 hover:text-amber-300">Archive</button>
            </div>

            <!-- 14-day heatmap -->
            <div class="mt-3 flex gap-1">
              {#each days as d (d)}
                <button
                  type="button"
                  onclick={() => toggle(h, d)}
                  title={d}
                  aria-label={d}
                  class="h-5 flex-1 rounded {done.has(d) ? '' : 'bg-fg/8 hover:bg-fg/15'}"
                  style={done.has(d) ? `background:${h.color ?? "#34d399"}` : ""}
                ></button>
              {/each}
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
{/if}
