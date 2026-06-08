<script lang="ts">
  import { onMount } from "svelte";
  import PageHeader from "$lib/components/PageHeader.svelte";
  import { listArchived, restoreEntity, purgeEntity } from "$lib/db";
  import { isTauri } from "$lib/platform";
  import type { EntityType } from "$lib/types";

  const desktop = isTauri();
  let items = $state<{ type: EntityType; id: string; label: string; updated_at: number }[]>([]);
  let loading = $state(true);

  const typeLabel: Record<string, string> = {
    area: "Area", goal: "Goal", project: "Project", task: "Task",
    note: "Note", habit: "Habit", event: "Event", person: "Person",
  };

  async function load() {
    if (!desktop) {
      loading = false;
      return;
    }
    loading = true;
    items = await listArchived();
    loading = false;
  }

  async function restore(type: EntityType, id: string) {
    await restoreEntity(type, id);
    await load();
  }
  async function purge(type: EntityType, id: string, label: string) {
    if (!confirm(`Permanently delete “${label}”? This cannot be undone.`)) return;
    await purgeEntity(type, id);
    await load();
  }

  onMount(load);
</script>

<PageHeader title="Archive" subtitle="Restore items, or delete them permanently" />

{#if !desktop}
  <div class="m-6 rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-200/80">
    Archive lives in the local database. Launch the desktop app with
    <code class="rounded bg-black/30 px-1">npm run tauri dev</code> to use it.
  </div>
{:else if loading}
  <div class="p-6 text-sm text-fg/40">Loading…</div>
{:else if items.length === 0}
  <div class="m-6 rounded-xl border border-dashed border-fg/10 p-10 text-center text-sm text-fg/40">
    Nothing archived. Items you archive will appear here, ready to restore or permanently delete.
  </div>
{:else}
  <div class="space-y-1.5 p-6">
    {#each items as it (it.type + it.id)}
      <div class="flex items-center gap-3 rounded-lg border border-fg/5 bg-fg/[0.02] px-3 py-2">
        <span class="w-16 shrink-0 text-[10px] uppercase tracking-wide text-fg/35">{typeLabel[it.type] ?? it.type}</span>
        <span class="min-w-0 flex-1 truncate text-sm text-fg/85">{it.label}</span>
        <button type="button" onclick={() => restore(it.type, it.id)} class="rounded-md border border-fg/10 px-2.5 py-1 text-xs text-fg/70 hover:bg-fg/5 hover:text-fg">Restore</button>
        <button type="button" onclick={() => purge(it.type, it.id, it.label)} class="rounded-md px-2.5 py-1 text-xs text-red-300/80 hover:bg-red-500/15 hover:text-red-300">Delete</button>
      </div>
    {/each}
  </div>
{/if}
