<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import PersonProfile from "$lib/components/people/PersonProfile.svelte";
  import { people as peopleDb } from "$lib/db";
  import { isTauri } from "$lib/platform";
  import { fullName, initials, isFollowUpDue, daysUntilBirthday } from "$lib/people";
  import type { Person } from "$lib/types";

  const desktop = isTauri();

  // Deep-link from the command palette: /people?id=…
  $effect(() => {
    const id = $page.url.searchParams.get("id");
    if (id) selectedId = id;
  });

  let people = $state<Person[]>([]);
  let selectedId = $state<string | null>(null);
  let query = $state("");
  let loading = $state(true);
  let error = $state<string | null>(null);

  const filtered = $derived(
    people.filter((p) => {
      const q = query.toLowerCase();
      return !q || fullName(p).toLowerCase().includes(q) || p.relationship_tags.toLowerCase().includes(q);
    }),
  );
  const followUps = $derived(people.filter((p) => isFollowUpDue(p)));
  const birthdaysSoon = $derived(
    people
      .map((p) => ({ p, d: daysUntilBirthday(p.birthday) }))
      .filter((x): x is { p: Person; d: number } => x.d != null && x.d <= 14)
      .sort((a, b) => a.d - b.d),
  );

  async function load() {
    if (!desktop) {
      loading = false;
      return;
    }
    try {
      loading = true;
      people = await peopleDb.list();
      if (!selectedId && people.length) selectedId = people[0].id;
      error = null;
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
    } finally {
      loading = false;
    }
  }

  async function newPerson() {
    const p = await peopleDb.create("New");
    selectedId = p.id;
    await load();
  }

  onMount(load);
</script>

{#if !desktop}
  <div class="m-6 rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-200/80">
    People live in the local database. Launch the desktop app with
    <code class="rounded bg-black/30 px-1">npm run tauri dev</code> to use them.
  </div>
{:else}
  <div class="grid h-full grid-cols-[280px_1fr]">
    <!-- List -->
    <aside class="flex min-h-0 flex-col border-r border-fg/10">
      <div class="flex items-center gap-2 px-4 py-3">
        <h1 class="text-sm font-semibold tracking-tight">People</h1>
        <button type="button" onclick={newPerson} class="ml-auto rounded-md border border-fg/10 px-2 py-1 text-xs text-fg/70 hover:bg-fg/5 hover:text-fg">+ New</button>
      </div>
      <div class="px-3 pb-2">
        <input bind:value={query} placeholder="Search people…" class="w-full rounded-md border border-fg/10 bg-fg/[0.03] px-2.5 py-1.5 text-xs outline-none placeholder:text-fg/30 focus:border-fg/25" />
      </div>

      <div class="min-h-0 flex-1 overflow-y-auto px-2 pb-4">
        {#if loading}
          <p class="px-2 py-3 text-xs text-fg/35">Loading…</p>
        {:else}
          <!-- Follow-up engine -->
          {#if followUps.length > 0 || birthdaysSoon.length > 0}
            <div class="mb-3 rounded-lg border border-fg/10 bg-fg/[0.02] p-2">
              <div class="px-1 pb-1 text-[10px] uppercase tracking-wide text-fg/35">Follow-ups</div>
              {#each birthdaysSoon as b (b.p.id)}
                <button type="button" onclick={() => (selectedId = b.p.id)} class="block w-full truncate rounded px-2 py-1 text-left text-xs text-amber-200/80 hover:bg-fg/5">
                  🎂 {fullName(b.p)} · {b.d === 0 ? "today" : `${b.d}d`}
                </button>
              {/each}
              {#each followUps.slice(0, 5) as p (p.id)}
                <button type="button" onclick={() => (selectedId = p.id)} class="block w-full truncate rounded px-2 py-1 text-left text-xs text-fg/55 hover:bg-fg/5">
                  ↻ {fullName(p)}
                </button>
              {/each}
            </div>
          {/if}

          {#if filtered.length === 0}
            <p class="px-2 py-3 text-xs text-fg/35">No people yet.</p>
          {:else}
            {#each filtered as p (p.id)}
              <button
                type="button"
                onclick={() => (selectedId = p.id)}
                class="mb-0.5 flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left transition-colors
                  {selectedId === p.id ? 'bg-fg/10' : 'hover:bg-fg/5'}"
              >
                <span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-fg/10 text-[11px] font-medium text-fg/70">{initials(p)}</span>
                <span class="min-w-0 flex-1 truncate text-sm {selectedId === p.id ? 'text-fg' : 'text-fg/70'}">{fullName(p)}</span>
                {#if isFollowUpDue(p)}<span class="h-1.5 w-1.5 shrink-0 rounded-full bg-red-400/70"></span>{/if}
              </button>
            {/each}
          {/if}
        {/if}
      </div>
    </aside>

    <!-- Profile -->
    <section class="min-h-0">
      {#if error}
        <div class="m-6 rounded-lg border border-red-500/20 bg-red-500/5 p-3 text-sm text-red-300">{error}</div>
      {:else if selectedId}
        {#key selectedId}
          <PersonProfile personId={selectedId} onChange={load} />
        {/key}
      {:else}
        <div class="flex h-full items-center justify-center text-sm text-fg/30">Select a person, or add one.</div>
      {/if}
    </section>
  </div>
{/if}
