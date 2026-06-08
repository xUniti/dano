<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import NoteEditor from "$lib/components/notes/NoteEditor.svelte";
  import { notes as noteDb } from "$lib/db";
  import { isTauri } from "$lib/platform";
  import type { Note } from "$lib/types";

  const desktop = isTauri();

  // Deep-link from the command palette: /notes?id=…
  $effect(() => {
    const id = $page.url.searchParams.get("id");
    if (id) selectedId = id;
  });

  let notes = $state<Note[]>([]);
  let selectedId = $state<string | null>(null);
  let query = $state("");
  let loading = $state(true);
  let error = $state<string | null>(null);

  const filtered = $derived(
    notes.filter((n) => {
      const q = query.toLowerCase();
      return !q || n.title.toLowerCase().includes(q) || n.tags.toLowerCase().includes(q);
    }),
  );

  async function load() {
    if (!desktop) {
      loading = false;
      return;
    }
    try {
      loading = true;
      notes = await noteDb.list();
      if (!selectedId && notes.length) selectedId = notes[0].id;
      error = null;
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
    } finally {
      loading = false;
    }
  }

  async function newNote() {
    const n = await noteDb.create("Untitled");
    selectedId = n.id;
    await load();
  }
</script>

{#if !desktop}
  <div class="m-6 rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-200/80">
    Notes live in the local database. Launch the desktop app with
    <code class="rounded bg-black/30 px-1">npm run tauri dev</code> to use them.
  </div>
{:else}
  <div class="grid h-full grid-cols-[260px_1fr]">
    <!-- List -->
    <aside class="flex min-h-0 flex-col border-r border-fg/10">
      <div class="flex items-center gap-2 px-4 py-3">
        <h1 class="text-sm font-semibold tracking-tight">Notes</h1>
        <button
          type="button"
          onclick={newNote}
          class="ml-auto rounded-md border border-fg/10 px-2 py-1 text-xs text-fg/70 hover:bg-fg/5 hover:text-fg"
        >
          + New
        </button>
      </div>
      <div class="px-3 pb-2">
        <input
          bind:value={query}
          placeholder="Search notes…"
          class="w-full rounded-md border border-fg/10 bg-fg/[0.03] px-2.5 py-1.5 text-xs outline-none placeholder:text-fg/30 focus:border-fg/25"
        />
      </div>
      <div class="min-h-0 flex-1 overflow-y-auto px-2 pb-4">
        {#if loading}
          <p class="px-2 py-3 text-xs text-fg/35">Loading…</p>
        {:else if filtered.length === 0}
          <p class="px-2 py-3 text-xs text-fg/35">No notes yet.</p>
        {:else}
          {#each filtered as n (n.id)}
            <button
              type="button"
              onclick={() => (selectedId = n.id)}
              class="mb-0.5 block w-full truncate rounded-md px-2.5 py-2 text-left text-sm transition-colors
                {selectedId === n.id ? 'bg-fg/10 text-fg' : 'text-fg/65 hover:bg-fg/5'}"
            >
              {n.title || "Untitled"}
              {#if n.tags}<span class="ml-1 text-[10px] text-fg/30">{n.tags}</span>{/if}
            </button>
          {/each}
        {/if}
      </div>
    </aside>

    <!-- Editor -->
    <section class="min-h-0">
      {#if error}
        <div class="m-6 rounded-lg border border-red-500/20 bg-red-500/5 p-3 text-sm text-red-300">{error}</div>
      {:else if selectedId}
        {#key selectedId}
          <NoteEditor noteId={selectedId} onChange={load} />
        {/key}
      {:else}
        <div class="flex h-full items-center justify-center text-sm text-fg/30">
          Select a note, or create one.
        </div>
      {/if}
    </section>
  </div>
{/if}
