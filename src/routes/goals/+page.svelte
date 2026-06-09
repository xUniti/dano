<script lang="ts">
  import { onMount } from "svelte";
  import PageHeader from "$lib/components/PageHeader.svelte";
  import { goals as goalDb, projects as projectDb, habits as habitDb, archiveEntity, restoreEntity } from "$lib/db";
  import { toasts } from "$lib/stores/toast.svelte";
  import { isTauri } from "$lib/platform";
  import type { Goal, Project, Habit, GoalStatus } from "$lib/types";

  const desktop = isTauri();
  const statuses: GoalStatus[] = ["active", "paused", "completed"];

  let goals = $state<Goal[]>([]);
  let projects = $state<Project[]>([]);
  let habits = $state<Habit[]>([]);
  let loading = $state(true);
  let newTitle = $state("");

  async function load() {
    if (!desktop) { loading = false; return; }
    loading = true;
    [goals, projects, habits] = await Promise.all([goalDb.list(), projectDb.listAll(), habitDb.list()]);
    loading = false;
  }
  onMount(load);

  // Progress per goal = average progress of its linked projects.
  const rows = $derived(
    goals.map((g) => {
      const ps = projects.filter((p) => p.goal_id === g.id);
      const hs = habits.filter((h) => h.goal_id === g.id);
      const progress = ps.length ? Math.round(ps.reduce((s, p) => s + p.progress, 0) / ps.length) : 0;
      return { g, projects: ps, habits: hs, progress };
    }),
  );

  async function add() {
    const t = newTitle.trim();
    if (!t) return;
    newTitle = "";
    await goalDb.create(t);
    await load();
  }
  async function setStatus(g: Goal, status: GoalStatus) {
    await goalDb.update(g.id, { status });
    await load();
  }
  async function rename(g: Goal, title: string) {
    if (title.trim() && title !== g.title) await goalDb.update(g.id, { title: title.trim() });
    await load();
  }
  async function remove(g: Goal) {
    await archiveEntity("goal", g.id);
    await load();
    toasts.show("Goal archived", {
      action: { label: "Undo", run: async () => { await restoreEntity("goal", g.id); await load(); } },
    });
  }

  const statusPill: Record<GoalStatus, string> = {
    active: "bg-emerald-500/15 text-emerald-300",
    paused: "bg-amber-500/15 text-amber-300",
    completed: "bg-fg/10 text-fg/45",
  };
</script>

<PageHeader title="Goals" subtitle="Direction · projects & habits roll up here" />

{#if !desktop}
  <div class="m-6 rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-200/80">
    Goals live in the local database. Launch the desktop app with
    <code class="rounded bg-black/30 px-1">npm run tauri dev</code> to use them.
  </div>
{:else if loading}
  <div class="p-6 text-sm text-fg/40">Loading…</div>
{:else}
  <div class="mx-auto max-w-3xl p-6">
    <div class="mb-6 flex gap-2">
      <input
        bind:value={newTitle}
        onkeydown={(e) => e.key === "Enter" && add()}
        placeholder="New goal (Run a marathon, Launch the product…)"
        class="flex-1 rounded-lg border border-fg/10 bg-fg/[0.03] px-3 py-2 text-sm outline-none placeholder:text-fg/30 focus:border-fg/25"
      />
      <button type="button" onclick={add} class="rounded-lg bg-accent/80 px-4 py-2 text-sm font-medium text-fg hover:bg-accent">Add</button>
    </div>

    {#if rows.length === 0}
      <div class="rounded-xl border border-dashed border-fg/10 p-10 text-center text-sm text-fg/40">
        No goals yet. A goal gives projects and habits a shared direction.
      </div>
    {:else}
      <div class="space-y-3">
        {#each rows as r (r.g.id)}
          <div class="rounded-2xl border border-fg/10 bg-fg/[0.02] p-4">
            <div class="flex items-center gap-3">
              <span class="text-lg">🎯</span>
              <input
                value={r.g.title}
                onchange={(e) => rename(r.g, (e.currentTarget as HTMLInputElement).value)}
                class="min-w-0 flex-1 bg-transparent text-sm font-medium text-fg/90 outline-none"
              />
              <select
                value={r.g.status}
                onchange={(e) => setStatus(r.g, (e.currentTarget as HTMLSelectElement).value as GoalStatus)}
                class="rounded px-2 py-0.5 text-[11px] capitalize outline-none {statusPill[r.g.status]}"
              >
                {#each statuses as s (s)}<option value={s}>{s}</option>{/each}
              </select>
              <button type="button" onclick={() => remove(r.g)} class="rounded px-2 py-1 text-[11px] text-fg/35 hover:text-amber-300">Archive</button>
            </div>

            <div class="mt-3">
              <div class="mb-1 flex items-center justify-between text-[11px] text-fg/40">
                <span>{r.projects.length} project{r.projects.length === 1 ? "" : "s"} · {r.habits.length} habit{r.habits.length === 1 ? "" : "s"}</span>
                <span class="tabular-nums">{r.progress}%</span>
              </div>
              <div class="h-1.5 overflow-hidden rounded-full bg-fg/10">
                <div class="h-full rounded-full bg-accent/80 transition-all" style="width:{r.progress}%"></div>
              </div>
            </div>

            {#if r.projects.length || r.habits.length}
              <div class="mt-3 flex flex-wrap gap-1.5">
                {#each r.projects as p (p.id)}
                  <a href="/projects/{p.id}" class="rounded-md bg-fg/5 px-2 py-1 text-xs text-fg/70 hover:bg-fg/10">{p.name} · {p.progress}%</a>
                {/each}
                {#each r.habits as h (h.id)}
                  <a href="/habits" class="rounded-md bg-emerald-500/10 px-2 py-1 text-xs text-emerald-300/80 hover:bg-emerald-500/20">🔁 {h.name}</a>
                {/each}
              </div>
            {/if}
          </div>
        {/each}
      </div>
    {/if}
  </div>
{/if}
