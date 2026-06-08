<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import PageHeader from "$lib/components/PageHeader.svelte";
  import TaskRow from "$lib/components/tasks/TaskRow.svelte";
  import { statusPill } from "$lib/components/projects/ProjectCard.svelte";
  import {
    projects as projectDb, tasks as taskDb, areas as areaDb,
    notes as noteDb, people as peopleDb, goals as goalDb,
    archiveEntity, restoreEntity, entityLabel,
  } from "$lib/db";
  import { toasts } from "$lib/stores/toast.svelte";
  import { link as gLink, unlink as gUnlink, neighbors, linksFor } from "$lib/graph";
  import { fullName } from "$lib/people";
  import { isTauri } from "$lib/platform";
  import { msToDateInput, dateInputToMs } from "$lib/date";
  import type { Project, Task, Area, ProjectStatus, Goal, Person, EntityType } from "$lib/types";

  const desktop = isTauri();
  const id = $derived($page.params.id ?? "");

  type Tab = "overview" | "tasks" | "notes" | "people" | "timeline" | "goals";
  const tabs: [Tab, string][] = [
    ["overview", "Overview"], ["tasks", "Tasks"], ["notes", "Notes"],
    ["people", "People"], ["timeline", "Timeline"], ["goals", "Goals"],
  ];

  let project = $state<Project | null>(null);
  let area = $state<Area | null>(null);
  let tasks = $state<Task[]>([]);
  let linkedNotes = $state<{ id: string; label: string }[]>([]);
  let linkedPeople = $state<{ id: string; label: string }[]>([]);
  let timeline = $state<{ type: EntityType; id: string; label: string; relation: string; at: number; href?: string }[]>([]);
  let allPeople = $state<Person[]>([]);
  let allGoals = $state<Goal[]>([]);
  let loading = $state(true);
  let notFound = $state(false);
  let tab = $state<Tab>("overview");
  let newTask = $state("");
  let newGoalTitle = $state("");

  const statuses: ProjectStatus[] = ["active", "planned", "completed", "archived"];
  const self = $derived({ type: "project" as EntityType, id });
  const goal = $derived(allGoals.find((g) => g.id === project?.goal_id) ?? null);
  const unlinkedPeople = $derived(allPeople.filter((p) => !linkedPeople.some((l) => l.id === p.id)));

  async function load() {
    if (!desktop) { loading = false; return; }
    loading = true;
    await projectDb.recomputeProgress(id);
    const p = await projectDb.get(id);
    if (!p) { notFound = true; loading = false; return; }
    project = p;
    area = await areaDb.get(p.area_id);
    tasks = await taskDb.listByProject(id);

    const [nb, pb, links, ppl, gls] = await Promise.all([
      neighbors({ type: "project", id }, { type: "note" }),
      neighbors({ type: "project", id }, { type: "person" }),
      linksFor({ type: "project", id }),
      peopleDb.list(),
      goalDb.list(),
    ]);
    linkedNotes = await Promise.all(nb.map(async (n) => ({ id: n.id, label: await entityLabel("note", n.id) })));
    linkedPeople = await Promise.all(pb.map(async (n) => ({ id: n.id, label: await entityLabel("person", n.id) })));
    timeline = await Promise.all(
      links.map(async (l) => {
        const isSrc = l.source_type === "project" && l.source_id === id;
        const t = (isSrc ? l.target_type : l.source_type) as EntityType;
        const tid = isSrc ? l.target_id : l.source_id;
        return {
          type: t, id: tid, label: await entityLabel(t, tid), relation: l.relation_type, at: l.created_at,
          href: t === "note" ? `/notes?id=${tid}` : t === "person" ? `/people?id=${tid}` : undefined,
        };
      }),
    );
    allPeople = ppl;
    allGoals = gls;
    loading = false;
  }

  async function save(patch: Partial<Project>) {
    if (!project) return;
    await projectDb.update(project.id, patch);
    await load();
  }
  async function addTask() {
    const t = newTask.trim();
    if (!t) return;
    newTask = "";
    await taskDb.create(t, id);
    await load();
  }
  async function newLinkedNote() {
    const n = await noteDb.create("Untitled");
    await gLink(self, { type: "note", id: n.id }, "related_to");
    goto(`/notes?id=${n.id}`);
  }
  async function linkPerson(e: Event) {
    const pid = (e.currentTarget as HTMLSelectElement).value;
    if (!pid) return;
    await gLink(self, { type: "person", id: pid }, "related_to");
    await load();
  }
  async function unlinkRef(type: EntityType, refId: string) {
    await gUnlink(self, { type, id: refId });
    await gUnlink({ type, id: refId }, self);
    await load();
  }
  async function createGoal() {
    const t = newGoalTitle.trim();
    if (!t) return;
    newGoalTitle = "";
    const g = await goalDb.create(t);
    await save({ goal_id: g.id });
  }
  async function removeProject() {
    if (!project) return;
    const pid = project.id;
    await archiveEntity("project", pid);
    goto("/projects");
    toasts.show("Project archived", {
      action: { label: "Undo", run: async () => { await restoreEntity("project", pid); goto(`/projects/${pid}`); } },
    });
  }
  function fmtDate(ms: number): string {
    return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(ms);
  }

  onMount(load);
</script>

<PageHeader title={project?.name ?? "Project"} subtitle={area ? area.name : ""}>
  <a href="/projects" class="rounded-lg border border-fg/10 px-3 py-1.5 text-xs text-fg/70 hover:bg-fg/5 hover:text-fg">← Projects</a>
</PageHeader>

{#if !desktop}
  <div class="m-6 rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-200/80">
    Launch the desktop app with <code class="rounded bg-black/30 px-1">npm run tauri dev</code> to view this project.
  </div>
{:else if loading}
  <div class="p-6 text-sm text-fg/40">Loading…</div>
{:else if notFound || !project}
  <div class="p-6 text-sm text-fg/40">Project not found. <a class="text-accent" href="/projects">Back to projects</a></div>
{:else}
  <!-- Tabs -->
  <div class="flex gap-1 border-b border-fg/10 px-6">
    {#each tabs as [t, label] (t)}
      <button type="button" onclick={() => (tab = t)}
        class="-mb-px border-b-2 px-3 py-2.5 text-sm transition-colors {tab === t ? 'border-accent text-fg' : 'border-transparent text-fg/50 hover:text-fg/80'}">
        {label}
        {#if t === "tasks" && tasks.length}<span class="ml-1 text-[10px] text-fg/30">{tasks.length}</span>{/if}
        {#if t === "notes" && linkedNotes.length}<span class="ml-1 text-[10px] text-fg/30">{linkedNotes.length}</span>{/if}
        {#if t === "people" && linkedPeople.length}<span class="ml-1 text-[10px] text-fg/30">{linkedPeople.length}</span>{/if}
      </button>
    {/each}
  </div>

  {#if tab === "overview"}
    <div class="max-w-2xl space-y-5 p-6">
      <label class="block"><span class="mb-1 block text-xs text-fg/45">Name</span>
        <input value={project.name} onchange={(e) => save({ name: (e.currentTarget as HTMLInputElement).value })}
          class="w-full rounded-lg border border-fg/10 bg-fg/[0.03] px-3 py-2 text-sm outline-none focus:border-fg/30" /></label>
      <label class="block"><span class="mb-1 block text-xs text-fg/45">Description</span>
        <textarea value={project.description} onchange={(e) => save({ description: (e.currentTarget as HTMLTextAreaElement).value })} rows="3"
          class="w-full resize-y rounded-lg border border-fg/10 bg-fg/[0.03] px-3 py-2 text-sm outline-none focus:border-fg/30"></textarea></label>
      <div class="flex flex-wrap gap-5">
        <label class="block"><span class="mb-1 block text-xs text-fg/45">Status</span>
          <select value={project.status} onchange={(e) => save({ status: (e.currentTarget as HTMLSelectElement).value as ProjectStatus })}
            class="rounded-lg border border-fg/10 bg-fg/[0.03] px-3 py-2 text-sm capitalize outline-none focus:border-fg/30">
            {#each statuses as s (s)}<option value={s}>{s}</option>{/each}
          </select></label>
        <label class="block"><span class="mb-1 block text-xs text-fg/45">Due date</span>
          <input type="date" value={msToDateInput(project.due_at)} onchange={(e) => save({ due_at: dateInputToMs((e.currentTarget as HTMLInputElement).value) })}
            class="rounded-lg border border-fg/10 bg-fg/[0.03] px-3 py-2 text-sm outline-none [color-scheme:dark] focus:border-fg/30" /></label>
      </div>
      <div>
        <div class="mb-1 flex items-center justify-between"><span class="text-xs text-fg/45">Progress (auto from tasks)</span><span class="text-xs tabular-nums text-fg/60">{project.progress}%</span></div>
        <div class="h-2 overflow-hidden rounded-full bg-fg/10"><div class="h-full rounded-full bg-accent/80 transition-all" style="width: {project.progress}%"></div></div>
      </div>
      <div class="flex items-center gap-3 pt-2">
        <span class="rounded px-2 py-1 text-xs capitalize {statusPill[project.status]}">{project.status}</span>
        {#if goal}<span class="rounded bg-indigo-500/15 px-2 py-1 text-xs text-indigo-300">🎯 {goal.title}</span>{/if}
        <button type="button" onclick={removeProject} class="ml-auto rounded-lg border border-amber-500/20 px-3 py-1.5 text-xs text-amber-300 hover:bg-amber-500/10">Archive project</button>
      </div>
    </div>
  {:else if tab === "tasks"}
    <div class="p-6">
      <input bind:value={newTask} onkeydown={(e) => e.key === "Enter" && addTask()} placeholder="Add a task to this project and press Enter…"
        class="mb-4 w-full rounded-lg border border-fg/10 bg-fg/[0.03] px-3 py-2 text-sm outline-none placeholder:text-fg/30 focus:border-fg/25" />
      {#if tasks.length === 0}<p class="text-sm text-fg/35">No tasks yet.</p>
      {:else}<div class="flex flex-col gap-1.5">{#each tasks as task (task.id)}<TaskRow {task} reload={load} />{/each}</div>{/if}
    </div>
  {:else if tab === "notes"}
    <div class="p-6">
      <button type="button" onclick={newLinkedNote} class="mb-4 rounded-lg border border-fg/10 px-3 py-1.5 text-xs text-fg/70 hover:bg-fg/5 hover:text-fg">+ New linked note</button>
      {#if linkedNotes.length === 0}<p class="text-sm text-fg/35">No notes linked. Create one, or mention this project from a note.</p>
      {:else}<div class="space-y-1.5">{#each linkedNotes as n (n.id)}
        <div class="flex items-center gap-2 rounded-lg border border-fg/5 bg-fg/[0.02] px-3 py-2">
          <a href="/notes?id={n.id}" class="flex-1 truncate text-sm text-fg/85 hover:text-fg">{n.label}</a>
          <button type="button" onclick={() => unlinkRef("note", n.id)} class="text-[11px] text-fg/30 hover:text-red-300">unlink</button>
        </div>{/each}</div>{/if}
    </div>
  {:else if tab === "people"}
    <div class="p-6">
      {#if unlinkedPeople.length}
        <select onchange={linkPerson} class="mb-4 rounded-lg border border-fg/10 bg-fg/[0.03] px-3 py-2 text-sm outline-none focus:border-fg/30">
          <option value="">+ Link a person…</option>
          {#each unlinkedPeople as p (p.id)}<option value={p.id}>{fullName(p)}</option>{/each}
        </select>
      {/if}
      {#if linkedPeople.length === 0}<p class="text-sm text-fg/35">No people linked yet.</p>
      {:else}<div class="space-y-1.5">{#each linkedPeople as p (p.id)}
        <div class="flex items-center gap-2 rounded-lg border border-fg/5 bg-fg/[0.02] px-3 py-2">
          <a href="/people?id={p.id}" class="flex-1 truncate text-sm text-fg/85 hover:text-fg">{p.label}</a>
          <button type="button" onclick={() => unlinkRef("person", p.id)} class="text-[11px] text-fg/30 hover:text-red-300">unlink</button>
        </div>{/each}</div>{/if}
    </div>
  {:else if tab === "timeline"}
    <div class="p-6">
      {#if timeline.length === 0}<p class="text-sm text-fg/35">No activity yet. Linked notes, people, and tasks will appear here over time.</p>
      {:else}<ol class="relative space-y-3 border-l border-fg/10 pl-4">
        {#each timeline as e (e.type + e.id + e.at)}
          <li class="relative">
            <span class="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-accent/70"></span>
            <div class="text-sm text-fg/85"><span class="text-fg/40">{e.relation.replace("_", " ")}</span>
              {#if e.href}<a href={e.href} class="text-accent hover:underline">{e.label}</a>{:else}<span class="text-fg/40">{e.type}:</span> {e.label}{/if}</div>
            <div class="text-[11px] text-fg/35">{fmtDate(e.at)}</div>
          </li>{/each}</ol>{/if}
    </div>
  {:else if tab === "goals"}
    <div class="max-w-lg space-y-4 p-6">
      <label class="block"><span class="mb-1 block text-xs text-fg/45">Linked goal</span>
        <select value={project.goal_id ?? ""} onchange={(e) => save({ goal_id: (e.currentTarget as HTMLSelectElement).value || null })}
          class="w-full rounded-lg border border-fg/10 bg-fg/[0.03] px-3 py-2 text-sm outline-none focus:border-fg/30">
          <option value="">No goal</option>
          {#each allGoals as g (g.id)}<option value={g.id}>{g.title}</option>{/each}
        </select></label>
      <div class="flex gap-2">
        <input bind:value={newGoalTitle} onkeydown={(e) => e.key === "Enter" && createGoal()} placeholder="…or create a new goal"
          class="flex-1 rounded-lg border border-fg/10 bg-fg/[0.03] px-3 py-2 text-sm outline-none placeholder:text-fg/30 focus:border-fg/25" />
        <button type="button" onclick={createGoal} class="rounded-lg bg-indigo-500/80 px-3 py-2 text-sm font-medium text-fg hover:bg-indigo-500">Add</button>
      </div>
      {#if goal}<p class="text-sm text-fg/60">This project contributes to <span class="text-indigo-300">🎯 {goal.title}</span>.</p>{/if}
    </div>
  {/if}
{/if}
