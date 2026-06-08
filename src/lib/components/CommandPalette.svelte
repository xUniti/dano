<script lang="ts">
  import { tick } from "svelte";
  import { goto } from "$app/navigation";
  import { ui } from "$lib/stores/ui.svelte";
  import {
    tasks as taskDb,
    projects as projectDb,
    notes as noteDb,
    people as peopleDb,
    areas as areaDb,
  } from "$lib/db";
  import { isTauri } from "$lib/platform";
  import { fullName } from "$lib/people";
  import Icon, { type IconName } from "$lib/components/Icon.svelte";
  import type { EntityType } from "$lib/types";

  const desktop = isTauri();

  interface Item {
    kind: "jump" | "create";
    icon: IconName;
    label: string;
    sub?: string;
    run: () => void | Promise<void>;
  }

  let query = $state("");
  let active = $state(0);
  let input = $state<HTMLInputElement | null>(null);
  let index = $state<{ type: EntityType; icon: IconName; label: string; href: string }[]>([]);
  let loaded = $state(false);

  async function buildIndex() {
    if (!desktop) {
      loaded = true;
      return;
    }
    const [ts, ps, ns, pe, ar] = await Promise.all([
      taskDb.listAll(),
      projectDb.listAll(),
      noteDb.list(),
      peopleDb.list(),
      areaDb.list(),
    ]);
    index = [
      ...ts.map((t) => ({ type: "task" as EntityType, icon: "tasks" as IconName, label: t.title, href: "/tasks" })),
      ...ps.map((p) => ({ type: "project" as EntityType, icon: "projects" as IconName, label: p.name, href: `/projects/${p.id}` })),
      ...ns.map((n) => ({ type: "note" as EntityType, icon: "notes" as IconName, label: n.title || "Untitled", href: `/notes?id=${n.id}` })),
      ...pe.map((p) => ({ type: "person" as EntityType, icon: "people" as IconName, label: fullName(p), href: `/people?id=${p.id}` })),
      ...ar.map((a) => ({ type: "area" as EntityType, icon: "areas" as IconName, label: a.name, href: "/areas" })),
    ];
    loaded = true;
  }

  // Open: load index, focus, reset.
  $effect(() => {
    if (ui.commandOpen) {
      query = "";
      active = 0;
      loaded = false;
      buildIndex();
      tick().then(() => input?.focus());
    }
  });

  function go(href: string) {
    ui.closeCommand();
    goto(href);
  }

  const results = $derived.by<Item[]>(() => {
    const q = query.trim().toLowerCase();
    const jumps: Item[] = index
      .filter((e) => !q || e.label.toLowerCase().includes(q))
      .slice(0, 8)
      .map((e) => ({
        kind: "jump",
        icon: e.icon,
        label: e.label,
        sub: e.type,
        run: () => go(e.href),
      }));

    const creates: Item[] = [];
    if (q) {
      const title = query.trim();
      creates.push(
        { kind: "create", icon: "tasks", label: `Create task “${title}”`, run: async () => { await taskDb.create(title); go("/tasks"); } },
        { kind: "create", icon: "notes", label: `Create note “${title}”`, run: async () => { const n = await noteDb.create(title); go(`/notes?id=${n.id}`); } },
        { kind: "create", icon: "people", label: `Add person “${title}”`, run: async () => { const p = await peopleDb.create(title); go(`/people?id=${p.id}`); } },
      );
    }
    return [...jumps, ...creates];
  });

  // keep active index in range
  $effect(() => {
    if (active >= results.length) active = Math.max(0, results.length - 1);
  });

  function onKey(e: KeyboardEvent) {
    if (e.key === "Escape") {
      ui.closeCommand();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      active = Math.min(active + 1, results.length - 1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      active = Math.max(active - 1, 0);
    } else if (e.key === "Enter") {
      e.preventDefault();
      results[active]?.run();
    }
  }
</script>

{#if ui.commandOpen}
  <!-- backdrop -->
  <div
    class="fixed inset-0 z-[100] flex items-start justify-center bg-black/50 pt-[12vh] backdrop-blur-sm"
    role="button"
    tabindex="-1"
    onclick={() => ui.closeCommand()}
    onkeydown={(e) => e.key === "Escape" && ui.closeCommand()}
  >
    <!-- panel -->
    <div
      role="dialog"
      tabindex="-1"
      onclick={(e) => e.stopPropagation()}
      onkeydown={() => {}}
      class="w-full max-w-xl overflow-hidden rounded-2xl border border-white/15 bg-[#15171c]/95 shadow-2xl backdrop-blur-2xl"
    >
      <div class="flex items-center gap-2 border-b border-white/10 px-4">
        <span class="text-white/40"><Icon name="search" size={18} /></span>
        <input
          bind:this={input}
          bind:value={query}
          onkeydown={onKey}
          placeholder="Search or create…"
          class="w-full bg-transparent py-3.5 text-sm outline-none placeholder:text-white/30"
        />
        <kbd class="rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-white/45">esc</kbd>
      </div>

      <div class="max-h-[50vh] overflow-y-auto p-1.5">
        {#if !desktop}
          <p class="px-3 py-6 text-center text-sm text-white/35">Search needs the desktop app (local database).</p>
        {:else if !loaded}
          <p class="px-3 py-6 text-center text-sm text-white/35">Loading…</p>
        {:else if results.length === 0}
          <p class="px-3 py-6 text-center text-sm text-white/35">No matches. Type to create something.</p>
        {:else}
          {#each results as item, i (item.kind + item.label)}
            <button
              type="button"
              onmouseenter={() => (active = i)}
              onclick={() => item.run()}
              class="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left {active === i ? 'bg-white/10' : 'hover:bg-white/5'}"
            >
              <span class="text-white/45"><Icon name={item.icon} size={16} /></span>
              <span class="min-w-0 flex-1 truncate text-sm {item.kind === 'create' ? 'text-sky-300' : 'text-white/85'}">{item.label}</span>
              {#if item.sub}<span class="shrink-0 text-[10px] capitalize text-white/30">{item.sub}</span>{/if}
            </button>
          {/each}
        {/if}
      </div>
    </div>
  </div>
{/if}
