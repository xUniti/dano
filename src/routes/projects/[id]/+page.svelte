<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import PageHeader from "$lib/components/PageHeader.svelte";
  import TaskRow from "$lib/components/tasks/TaskRow.svelte";
  import { statusPill } from "$lib/components/projects/ProjectCard.svelte";
  import { projects as projectDb, tasks as taskDb, areas as areaDb } from "$lib/db";
  import { isTauri } from "$lib/platform";
  import { msToDateInput, dateInputToMs } from "$lib/date";
  import type { Project, Task, Area, ProjectStatus } from "$lib/types";

  const desktop = isTauri();
  const id = $derived($page.params.id ?? "");

  let project = $state<Project | null>(null);
  let area = $state<Area | null>(null);
  let tasks = $state<Task[]>([]);
  let loading = $state(true);
  let notFound = $state(false);
  let tab = $state<"overview" | "tasks">("overview");
  let newTask = $state("");

  const statuses: ProjectStatus[] = ["active", "planned", "completed", "archived"];

  async function load() {
    if (!desktop) {
      loading = false;
      return;
    }
    loading = true;
    await projectDb.recomputeProgress(id);
    const p = await projectDb.get(id);
    if (!p) {
      notFound = true;
      loading = false;
      return;
    }
    project = p;
    area = await areaDb.get(p.area_id);
    tasks = await taskDb.listByProject(id);
    loading = false;
  }

  async function save(patch: Partial<Project>) {
    if (!project) return;
    await projectDb.update(project.id, patch);
    await load();
  }

  async function addTask() {
    const title = newTask.trim();
    if (!title) return;
    newTask = "";
    await taskDb.create(title, id);
    await load();
  }

  async function removeProject() {
    if (!project) return;
    if (!confirm(`Delete project “${project.name}” and its tasks?`)) return;
    await projectDb.remove(project.id);
    goto("/projects");
  }

  onMount(load);
</script>

<PageHeader title={project?.name ?? "Project"} subtitle={area ? area.name : ""}>
  <a href="/projects" class="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/70 hover:bg-white/5 hover:text-white">← Projects</a>
</PageHeader>

{#if !desktop}
  <div class="m-6 rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-200/80">
    Launch the desktop app with <code class="rounded bg-black/30 px-1">npm run tauri dev</code> to view this project.
  </div>
{:else if loading}
  <div class="p-6 text-sm text-white/40">Loading…</div>
{:else if notFound || !project}
  <div class="p-6 text-sm text-white/40">Project not found. <a class="text-sky-400" href="/projects">Back to projects</a></div>
{:else}
  <!-- Tabs -->
  <div class="flex gap-1 border-b border-white/10 px-6">
    {#each [["overview", "Overview"], ["tasks", "Tasks"]] as [id_, label] (id_)}
      <button
        type="button"
        onclick={() => (tab = id_ as typeof tab)}
        class="-mb-px border-b-2 px-3 py-2.5 text-sm transition-colors
          {tab === id_ ? 'border-sky-400 text-white' : 'border-transparent text-white/50 hover:text-white/80'}"
      >
        {label}
      </button>
    {/each}
    <span class="ml-2 self-center text-[11px] text-white/25">Notes · People · Timeline · Goals arrive with later modules</span>
  </div>

  {#if tab === "overview"}
    <div class="max-w-2xl space-y-5 p-6">
      <label class="block">
        <span class="mb-1 block text-xs text-white/45">Name</span>
        <input
          value={project.name}
          onchange={(e) => save({ name: (e.currentTarget as HTMLInputElement).value })}
          class="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm outline-none focus:border-white/30"
        />
      </label>

      <label class="block">
        <span class="mb-1 block text-xs text-white/45">Description</span>
        <textarea
          value={project.description}
          onchange={(e) => save({ description: (e.currentTarget as HTMLTextAreaElement).value })}
          rows="3"
          class="w-full resize-y rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm outline-none focus:border-white/30"
        ></textarea>
      </label>

      <div class="flex flex-wrap gap-5">
        <label class="block">
          <span class="mb-1 block text-xs text-white/45">Status</span>
          <select
            value={project.status}
            onchange={(e) => save({ status: (e.currentTarget as HTMLSelectElement).value as ProjectStatus })}
            class="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm capitalize outline-none focus:border-white/30"
          >
            {#each statuses as s (s)}<option value={s}>{s}</option>{/each}
          </select>
        </label>

        <label class="block">
          <span class="mb-1 block text-xs text-white/45">Due date</span>
          <input
            type="date"
            value={msToDateInput(project.due_at)}
            onchange={(e) => save({ due_at: dateInputToMs((e.currentTarget as HTMLInputElement).value) })}
            class="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm outline-none [color-scheme:dark] focus:border-white/30"
          />
        </label>
      </div>

      <div>
        <div class="mb-1 flex items-center justify-between">
          <span class="text-xs text-white/45">Progress (auto from tasks)</span>
          <span class="text-xs tabular-nums text-white/60">{project.progress}%</span>
        </div>
        <div class="h-2 overflow-hidden rounded-full bg-white/10">
          <div class="h-full rounded-full bg-sky-400/80 transition-all" style="width: {project.progress}%"></div>
        </div>
      </div>

      <div class="flex items-center gap-3 pt-2">
        <span class="rounded px-2 py-1 text-xs capitalize {statusPill[project.status]}">{project.status}</span>
        <button
          type="button"
          onclick={removeProject}
          class="ml-auto rounded-lg border border-red-500/20 px-3 py-1.5 text-xs text-red-300 hover:bg-red-500/10"
        >
          Delete project
        </button>
      </div>
    </div>
  {:else}
    <div class="p-6">
      <input
        bind:value={newTask}
        onkeydown={(e) => e.key === "Enter" && addTask()}
        placeholder="Add a task to this project and press Enter…"
        class="mb-4 w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm outline-none placeholder:text-white/30 focus:border-white/25"
      />
      {#if tasks.length === 0}
        <p class="text-sm text-white/35">No tasks yet.</p>
      {:else}
        <div class="flex flex-col gap-1.5">
          {#each tasks as task (task.id)}
            <TaskRow {task} reload={load} />
          {/each}
        </div>
      {/if}
    </div>
  {/if}
{/if}
