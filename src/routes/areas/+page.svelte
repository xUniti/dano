<script lang="ts">
  import { onMount } from "svelte";
  import PageHeader from "$lib/components/PageHeader.svelte";
  import { areas as areaDb, projects as projectDb, archiveEntity } from "$lib/db";
  import { isTauri } from "$lib/platform";
  import type { Area } from "$lib/types";

  const desktop = isTauri();
  const palette = ["#38bdf8", "#34d399", "#fbbf24", "#f87171", "#a78bfa", "#f472b6", "#64748b"];

  let areas = $state<Area[]>([]);
  let counts = $state<Record<string, number>>({});
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
      const [as, ps] = await Promise.all([areaDb.list(), projectDb.listAll()]);
      const c: Record<string, number> = {};
      for (const p of ps) c[p.area_id] = (c[p.area_id] ?? 0) + 1;
      areas = as;
      counts = c;
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
    await areaDb.create(name, palette[areas.length % palette.length]);
    await load();
  }
  async function setColor(area: Area, color: string) {
    await areaDb.update(area.id, { color });
    await load();
  }
  async function commitRename() {
    const id = editingId;
    editingId = null;
    const name = editName.trim();
    if (id && name) {
      await areaDb.update(id, { name });
      await load();
    }
  }
  async function remove(area: Area) {
    if (!confirm(`Archive area “${area.name}”? You can restore it later from Archive.`)) return;
    await archiveEntity("area", area.id);
    await load();
  }

  onMount(load);
</script>

<PageHeader title="Areas" subtitle="Permanent life domains — the backbone" />

{#if !desktop}
  <div class="m-6 rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-200/80">
    Areas live in the local database. Launch the desktop app with
    <code class="rounded bg-black/30 px-1">npm run tauri dev</code> to use them.
  </div>
{:else if error}
  <div class="m-6 rounded-lg border border-red-500/20 bg-red-500/5 p-3 text-sm text-red-300">{error}</div>
{:else if loading}
  <div class="p-6 text-sm text-white/40">Loading…</div>
{:else}
  <div class="p-6">
    <div class="mb-6 flex gap-2">
      <input
        bind:value={newName}
        onkeydown={(e) => e.key === "Enter" && add()}
        placeholder="New life area (Health, Career, Finance…)"
        class="flex-1 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm outline-none placeholder:text-white/30 focus:border-white/25"
      />
      <button type="button" onclick={add} class="rounded-lg bg-sky-500/80 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500">Add</button>
    </div>

    {#if areas.length === 0}
      <div class="rounded-xl border border-dashed border-white/10 p-10 text-center text-sm text-white/40">
        No areas yet. Areas are the permanent domains of your life and hold all your projects.
      </div>
    {:else}
      <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {#each areas as area (area.id)}
          <div class="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <div class="flex items-center gap-2.5">
              <span class="h-3 w-3 shrink-0 rounded-full" style="background: {area.color ?? '#64748b'}"></span>
              {#if editingId === area.id}
                <!-- svelte-ignore a11y_autofocus -->
                <input
                  bind:value={editName}
                  autofocus
                  onblur={commitRename}
                  onkeydown={(e) => e.key === "Enter" && commitRename()}
                  class="flex-1 rounded bg-white/10 px-1.5 py-0.5 text-sm outline-none"
                />
              {:else}
                <button
                  type="button"
                  ondblclick={() => ((editingId = area.id), (editName = area.name))}
                  class="flex-1 truncate text-left text-sm font-medium text-white/90"
                >
                  {area.name}
                </button>
              {/if}
              <span class="shrink-0 text-[11px] text-white/35">{counts[area.id] ?? 0} proj</span>
            </div>

            <!-- color swatches -->
            <div class="mt-3 flex items-center gap-1.5">
              {#each palette as c (c)}
                <button
                  type="button"
                  onclick={() => setColor(area, c)}
                  aria-label="Set color"
                  class="h-4 w-4 rounded-full ring-offset-1 ring-offset-[#0c0d10] transition-transform hover:scale-110 {area.color === c ? 'ring-2 ring-white/70' : ''}"
                  style="background: {c}"
                ></button>
              {/each}
            </div>

            <div class="mt-3 flex items-center gap-3">
              <a href="/areas/{area.id}" class="text-[11px] text-sky-400 hover:underline">Open area →</a>
              <button
                type="button"
                onclick={() => remove(area)}
                class="ml-auto text-[11px] text-white/35 hover:text-amber-300"
              >
                Archive
              </button>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
{/if}
