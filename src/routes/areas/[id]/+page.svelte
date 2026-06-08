<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import PageHeader from "$lib/components/PageHeader.svelte";
  import ProjectCard from "$lib/components/projects/ProjectCard.svelte";
  import { areas as areaDb, projects as projectDb, tasks as taskDb, archiveEntity } from "$lib/db";
  import { isTauri } from "$lib/platform";
  import type { Area, Project, Task } from "$lib/types";

  const desktop = isTauri();
  const id = $derived($page.params.id ?? "");
  const palette = ["#38bdf8", "#34d399", "#fbbf24", "#f87171", "#a78bfa", "#f472b6", "#64748b"];

  let area = $state<Area | null>(null);
  let projects = $state<Project[]>([]);
  let areaTasks = $state<Task[]>([]);
  let loading = $state(true);
  let notFound = $state(false);
  let newProject = $state("");

  const stats = $derived.by(() => {
    const total = areaTasks.length;
    const done = areaTasks.filter((t) => t.status === "done").length;
    const avg = projects.length ? Math.round(projects.reduce((s, p) => s + p.progress, 0) / projects.length) : 0;
    return { projects: projects.length, total, done, avg };
  });

  async function load() {
    if (!desktop) { loading = false; return; }
    loading = true;
    const a = await areaDb.get(id);
    if (!a) { notFound = true; loading = false; return; }
    area = a;
    projects = await projectDb.listByArea(id);
    const allTasks = await taskDb.listAll();
    const pids = new Set(projects.map((p) => p.id));
    areaTasks = allTasks.filter((t) => t.project_id && pids.has(t.project_id));
    loading = false;
  }

  async function rename(e: Event) {
    await areaDb.update(id, { name: (e.currentTarget as HTMLInputElement).value });
    await load();
  }
  async function setColor(color: string) {
    await areaDb.update(id, { color });
    await load();
  }
  async function addProject() {
    const n = newProject.trim();
    if (!n) return;
    newProject = "";
    await projectDb.create(id, n);
    await load();
  }
  async function archive() {
    if (!area) return;
    if (!confirm(`Archive area “${area.name}”? You can restore it later from Archive.`)) return;
    await archiveEntity("area", id);
    goto("/areas");
  }

  onMount(load);
</script>

<PageHeader title={area?.name ?? "Area"} subtitle="Life area">
  <a href="/areas" class="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/70 hover:bg-white/5 hover:text-white">← Areas</a>
</PageHeader>

{#if !desktop}
  <div class="m-6 rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-200/80">
    Launch the desktop app with <code class="rounded bg-black/30 px-1">npm run tauri dev</code> to view this area.
  </div>
{:else if loading}
  <div class="p-6 text-sm text-white/40">Loading…</div>
{:else if notFound || !area}
  <div class="p-6 text-sm text-white/40">Area not found. <a class="text-sky-400" href="/areas">Back to areas</a></div>
{:else}
  <div class="p-6">
    <!-- header row -->
    <div class="mb-6 flex items-center gap-3">
      <span class="h-4 w-4 shrink-0 rounded-full" style="background: {area.color ?? '#64748b'}"></span>
      <input value={area.name} onchange={rename} class="flex-1 bg-transparent text-xl font-semibold tracking-tight outline-none" />
      <div class="flex items-center gap-1">
        {#each palette as c (c)}
          <button type="button" onclick={() => setColor(c)} aria-label="color" class="h-4 w-4 rounded-full {area.color === c ? 'ring-2 ring-white/70' : ''}" style="background:{c}"></button>
        {/each}
      </div>
      <button type="button" onclick={archive} class="rounded-md px-2 py-1 text-xs text-white/40 hover:bg-amber-500/15 hover:text-amber-300">Archive</button>
    </div>

    <!-- stats -->
    <div class="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
      {#each [["Projects", stats.projects], ["Tasks", stats.total], ["Done", stats.done], ["Avg progress", stats.avg + "%"]] as [label, value] (label)}
        <div class="rounded-xl border border-white/10 bg-white/[0.02] p-3">
          <div class="text-lg font-semibold text-white/90">{value}</div>
          <div class="text-[11px] text-white/40">{label}</div>
        </div>
      {/each}
    </div>

    <!-- projects -->
    <div class="mb-3 flex items-center gap-2">
      <h2 class="text-sm font-semibold tracking-tight text-white/85">Projects</h2>
    </div>
    <div class="mb-3 flex gap-2">
      <input bind:value={newProject} onkeydown={(e) => e.key === "Enter" && addProject()} placeholder="New project in this area…"
        class="flex-1 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm outline-none placeholder:text-white/30 focus:border-white/25" />
      <button type="button" onclick={addProject} class="rounded-lg bg-sky-500/80 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500">Add</button>
    </div>
    {#if projects.length === 0}
      <p class="text-sm text-white/35">No projects in this area yet.</p>
    {:else}
      <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {#each projects as p (p.id)}<ProjectCard project={p} />{/each}
      </div>
    {/if}
  </div>
{/if}
