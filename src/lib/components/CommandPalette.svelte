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
    habits as habitDb,
    events as eventDb,
    goals as goalDb,
    dailyHubs,
  } from "$lib/db";
  import { isTauri } from "$lib/platform";
  import { fullName } from "$lib/people";
  import Icon, { type IconName } from "$lib/components/Icon.svelte";
  import type { EntityType } from "$lib/types";

  const desktop = isTauri();

  const NAV: { label: string; href: string; icon: IconName }[] = [
    { label: "Dashboard", href: "/", icon: "dashboard" },
    { label: "Tasks", href: "/tasks", icon: "tasks" },
    { label: "Daily Hub", href: "/daily", icon: "today" },
    { label: "Notes", href: "/notes", icon: "notes" },
    { label: "Calendar", href: "/calendar", icon: "calendar" },
    { label: "Projects", href: "/projects", icon: "projects" },
    { label: "Goals", href: "/goals", icon: "goal" },
    { label: "Areas", href: "/areas", icon: "areas" },
    { label: "Habits", href: "/habits", icon: "habits" },
    { label: "People", href: "/people", icon: "people" },
    { label: "Notifications", href: "/notifications", icon: "bell" },
    { label: "Settings", href: "/settings", icon: "user" },
    { label: "Archive", href: "/archive", icon: "archive" },
  ];

  /** Subsequence fuzzy match: chars of q appear in order within text. */
  function fuzzy(q: string, text: string): boolean {
    if (!q) return true;
    const t = text.toLowerCase();
    let i = 0;
    for (const ch of q.toLowerCase()) {
      i = t.indexOf(ch, i);
      if (i === -1) return false;
      i++;
    }
    return true;
  }

  interface Item {
    kind: "nav" | "jump" | "create";
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
    const [ts, ps, ns, pe, ar, hb, ev, gl, dh] = await Promise.all([
      taskDb.listAll(),
      projectDb.listAll(),
      noteDb.list(),
      peopleDb.list(),
      areaDb.list(),
      habitDb.list(),
      eventDb.listAll(),
      goalDb.list(),
      dailyHubs.listAll(),
    ]);
    const hubLabel = (key: string) =>
      new Intl.DateTimeFormat(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" }).format(
        new Date(`${key}T00:00:00`),
      );
    index = [
      ...ts.map((t) => ({ type: "task" as EntityType, icon: "tasks" as IconName, label: t.title, href: "/tasks" })),
      ...ps.map((p) => ({ type: "project" as EntityType, icon: "projects" as IconName, label: p.name, href: `/projects/${p.id}` })),
      ...ns.map((n) => ({ type: "note" as EntityType, icon: "notes" as IconName, label: n.title || "Untitled", href: `/notes?id=${n.id}` })),
      ...pe.map((p) => ({ type: "person" as EntityType, icon: "people" as IconName, label: fullName(p), href: `/people?id=${p.id}` })),
      ...ar.map((a) => ({ type: "area" as EntityType, icon: "areas" as IconName, label: a.name, href: "/areas" })),
      ...hb.map((h) => ({ type: "habit" as EntityType, icon: "habits" as IconName, label: h.name, href: "/habits" })),
      ...ev.map((e) => ({ type: "event" as EntityType, icon: "event" as IconName, label: e.title, href: "/calendar" })),
      ...gl.map((g) => ({ type: "goal" as EntityType, icon: "goal" as IconName, label: g.title, href: "/goals" })),
      ...dh.map((d) => ({ type: "daily_hub" as EntityType, icon: "today" as IconName, label: hubLabel(d.date), href: `/daily?date=${d.date}` })),
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
    const q = query.trim();

    const navs: Item[] = NAV
      .filter((n) => fuzzy(q, "go to " + n.label) || fuzzy(q, n.label))
      .slice(0, q ? 5 : 13)
      .map((n) => ({ kind: "nav", icon: n.icon, label: `Go to ${n.label}`, sub: "navigate", run: () => go(n.href) }));

    const jumps: Item[] = q
      ? index.filter((e) => fuzzy(q, e.label)).slice(0, 8).map((e) => ({
          kind: "jump", icon: e.icon, label: e.label, sub: e.type, run: () => go(e.href),
        }))
      : [];

    const creates: Item[] = [];
    if (q) {
      const title = q;
      creates.push(
        { kind: "create", icon: "tasks", label: `Create task “${title}”`, run: async () => { await taskDb.create(title); go("/tasks"); } },
        { kind: "create", icon: "notes", label: `Create note “${title}”`, run: async () => { const n = await noteDb.create(title); go(`/notes?id=${n.id}`); } },
        { kind: "create", icon: "people", label: `Add person “${title}”`, run: async () => { const p = await peopleDb.create(title); go(`/people?id=${p.id}`); } },
      );
    }
    return [...jumps, ...navs, ...creates];
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
      class="w-full max-w-xl overflow-hidden rounded-2xl border border-fg/15 bg-surface/95 shadow-2xl backdrop-blur-2xl"
    >
      <div class="flex items-center gap-2 border-b border-fg/10 px-4">
        <span class="text-fg/40"><Icon name="search" size={18} /></span>
        <input
          bind:this={input}
          bind:value={query}
          onkeydown={onKey}
          placeholder="Search or create…"
          class="w-full bg-transparent py-3.5 text-sm outline-none placeholder:text-fg/30"
        />
        <kbd class="rounded bg-fg/10 px-1.5 py-0.5 text-[10px] text-fg/45">esc</kbd>
      </div>

      <div class="max-h-[50vh] overflow-y-auto p-1.5">
        {#if !desktop}
          <p class="px-3 py-6 text-center text-sm text-fg/35">Search needs the desktop app (local database).</p>
        {:else if !loaded}
          <p class="px-3 py-6 text-center text-sm text-fg/35">Loading…</p>
        {:else if results.length === 0}
          <p class="px-3 py-6 text-center text-sm text-fg/35">No matches. Type to create something.</p>
        {:else}
          {#each results as item, i (item.kind + item.label)}
            <button
              type="button"
              onmouseenter={() => (active = i)}
              onclick={() => item.run()}
              class="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left {active === i ? 'bg-fg/10' : 'hover:bg-fg/5'}"
            >
              <span class="text-fg/45"><Icon name={item.icon} size={16} /></span>
              <span class="min-w-0 flex-1 truncate text-sm {item.kind === 'create' ? 'text-accent' : 'text-fg/85'}">{item.label}</span>
              {#if item.sub}<span class="shrink-0 text-[10px] capitalize text-fg/30">{item.sub}</span>{/if}
            </button>
          {/each}
        {/if}
      </div>
    </div>
  </div>
{/if}
