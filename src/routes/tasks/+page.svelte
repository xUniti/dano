<script lang="ts">
  import { onMount } from "svelte";
  import PageHeader from "$lib/components/PageHeader.svelte";
  import TaskRow from "$lib/components/tasks/TaskRow.svelte";
  import TaskBoard from "$lib/components/tasks/TaskBoard.svelte";
  import { tasks as taskDb, projects as projectDb } from "$lib/db";
  import { isTauri } from "$lib/platform";
  import { startOfDayMs, endOfDayMs } from "$lib/date";
  import type { Task } from "$lib/types";

  type View = "today" | "upcoming" | "board" | "list";
  const views: { id: View; label: string }[] = [
    { id: "today", label: "Today" },
    { id: "upcoming", label: "Upcoming" },
    { id: "board", label: "Board" },
    { id: "list", label: "List" },
  ];

  let view = $state<View>("today");
  let all = $state<Task[]>([]);
  let projectNames = $state<Record<string, string>>({});
  let newTitle = $state("");
  let loading = $state(true);
  let error = $state<string | null>(null);

  const desktop = isTauri();

  // Derived views from the single source list.
  const todayTasks = $derived(
    all.filter((t) => t.status !== "done" && t.due_at != null && t.due_at <= endOfDayMs()),
  );
  const upcomingTasks = $derived(
    all.filter((t) => t.status !== "done" && t.due_at != null && t.due_at > endOfDayMs()),
  );

  async function load() {
    if (!desktop) {
      loading = false;
      return;
    }
    try {
      loading = true;
      const [t, ps] = await Promise.all([taskDb.listAll(), projectDb.listAll()]);
      all = t;
      projectNames = Object.fromEntries(ps.map((p) => [p.id, p.name]));
      error = null;
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
    } finally {
      loading = false;
    }
  }

  async function add() {
    const title = newTitle.trim();
    if (!title) return;
    newTitle = "";
    // New tasks default to due today so they show up in the Today view immediately.
    const task = await taskDb.create(title);
    await taskDb.update(task.id, { due_at: endOfDayMs() });
    await load();
  }

  // touch startOfDayMs import so it stays used by date helpers if refactored
  void startOfDayMs;

  onMount(load);
</script>

<PageHeader title="Tasks" subtitle="Today · Upcoming · Board · List">
  <div class="flex rounded-lg border border-fg/10 p-0.5">
    {#each views as v (v.id)}
      <button
        type="button"
        onclick={() => (view = v.id)}
        class="rounded-md px-2.5 py-1 text-xs transition-colors
          {view === v.id ? 'bg-fg/10 text-fg' : 'text-fg/50 hover:text-fg/80'}"
      >
        {v.label}
      </button>
    {/each}
  </div>
</PageHeader>

{#if !desktop}
  <div class="m-6 rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-200/80">
    Tasks are stored in the local database, which only runs in the desktop app.
    Launch it with <code class="rounded bg-black/30 px-1">npm run tauri dev</code> to add and see tasks.
  </div>
{:else}
  <!-- Quick add -->
  <div class="px-6 pt-4">
    <input
      bind:value={newTitle}
      onkeydown={(e) => e.key === "Enter" && add()}
      placeholder="Add a task and press Enter…"
      class="w-full rounded-lg border border-fg/10 bg-fg/[0.03] px-3 py-2 text-sm outline-none placeholder:text-fg/30 focus:border-fg/25"
    />
  </div>

  {#if error}
    <div class="m-6 rounded-lg border border-red-500/20 bg-red-500/5 p-3 text-sm text-red-300">{error}</div>
  {:else if loading}
    <div class="p-6 text-sm text-fg/40">Loading…</div>
  {:else if view === "board"}
    <TaskBoard items={all} reload={load} />
  {:else}
    {@const list = view === "today" ? todayTasks : view === "upcoming" ? upcomingTasks : all}
    {#if list.length === 0}
      <div class="p-6 text-sm text-fg/35">
        {view === "today" ? "Nothing due today. Enjoy it." : "No tasks here yet."}
      </div>
    {:else}
      <div class="flex flex-col gap-1.5 p-6">
        {#each list as task (task.id)}
          <TaskRow {task} projectName={task.project_id ? projectNames[task.project_id] : null} reload={load} />
        {/each}
      </div>
    {/if}
  {/if}
{/if}
