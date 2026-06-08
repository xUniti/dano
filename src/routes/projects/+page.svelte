<script lang="ts">
  import { onMount } from "svelte";
  import PageHeader from "$lib/components/PageHeader.svelte";
  import ProjectCard from "$lib/components/projects/ProjectCard.svelte";
  import { areas as areaDb, projects as projectDb } from "$lib/db";
  import { isTauri } from "$lib/platform";
  import type { Area, Project } from "$lib/types";

  const desktop = isTauri();

  let areas = $state<Area[]>([]);
  let projectsByArea = $state<Record<string, Project[]>>({});
  let loading = $state(true);
  let error = $state<string | null>(null);

  // inline create state
  let newAreaOpen = $state(false);
  let newAreaName = $state("");
  let projectInputFor = $state<string | null>(null); // areaId
  let newProjectName = $state("");

  async function load() {
    if (!desktop) {
      loading = false;
      return;
    }
    try {
      loading = true;
      const as = await areaDb.list();
      const map: Record<string, Project[]> = {};
      await Promise.all(
        as.map(async (a) => {
          map[a.id] = await projectDb.listByArea(a.id);
        }),
      );
      areas = as;
      projectsByArea = map;
      error = null;
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
    } finally {
      loading = false;
    }
  }

  async function addArea() {
    const name = newAreaName.trim();
    if (!name) return;
    newAreaName = "";
    newAreaOpen = false;
    await areaDb.create(name);
    await load();
  }

  async function addProject(areaId: string) {
    const name = newProjectName.trim();
    if (!name) return;
    newProjectName = "";
    projectInputFor = null;
    await projectDb.create(areaId, name);
    await load();
  }

  onMount(load);
</script>

<PageHeader title="Projects" subtitle="Outcomes inside life areas">
  {#if desktop}
    <button
      type="button"
      onclick={() => ((newAreaOpen = !newAreaOpen), (newAreaName = ""))}
      class="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/70 hover:bg-white/5 hover:text-white"
    >
      + New area
    </button>
  {/if}
</PageHeader>

{#if !desktop}
  <div class="m-6 rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-200/80">
    Projects live in the local database. Launch the desktop app with
    <code class="rounded bg-black/30 px-1">npm run tauri dev</code> to use them.
  </div>
{:else if error}
  <div class="m-6 rounded-lg border border-red-500/20 bg-red-500/5 p-3 text-sm text-red-300">{error}</div>
{:else if loading}
  <div class="p-6 text-sm text-white/40">Loading…</div>
{:else}
  <div class="space-y-8 p-6">
    {#if newAreaOpen}
      <div class="flex gap-2">
        <!-- svelte-ignore a11y_autofocus -->
        <input
          bind:value={newAreaName}
          autofocus
          onkeydown={(e) => e.key === "Enter" && addArea()}
          placeholder="Area name (e.g. Health, Career)…"
          class="flex-1 rounded-lg border border-white/15 bg-white/[0.03] px-3 py-2 text-sm outline-none placeholder:text-white/30 focus:border-white/30"
        />
        <button type="button" onclick={addArea} class="rounded-lg bg-sky-500/80 px-3 py-2 text-sm font-medium text-white hover:bg-sky-500">Add</button>
      </div>
    {/if}

    {#if areas.length === 0}
      <div class="rounded-xl border border-dashed border-white/10 p-10 text-center text-sm text-white/40">
        No areas yet. Create your first life area (Health, Career, Finance…) to hold projects.
      </div>
    {/if}

    {#each areas as area (area.id)}
      <section>
        <div class="mb-3 flex items-center gap-2">
          <span class="h-2.5 w-2.5 rounded-full" style="background: {area.color ?? '#64748b'}"></span>
          <h2 class="text-sm font-semibold tracking-tight text-white/85">{area.name}</h2>
          <span class="text-[11px] text-white/30">{projectsByArea[area.id]?.length ?? 0}</span>
          <button
            type="button"
            onclick={() => ((projectInputFor = projectInputFor === area.id ? null : area.id), (newProjectName = ""))}
            class="ml-auto rounded-md px-2 py-1 text-xs text-white/50 hover:bg-white/5 hover:text-white/80"
          >
            + Project
          </button>
        </div>

        {#if projectInputFor === area.id}
          <div class="mb-3 flex gap-2">
            <!-- svelte-ignore a11y_autofocus -->
            <input
              bind:value={newProjectName}
              autofocus
              onkeydown={(e) => e.key === "Enter" && addProject(area.id)}
              placeholder="Project name…"
              class="flex-1 rounded-lg border border-white/15 bg-white/[0.03] px-3 py-2 text-sm outline-none placeholder:text-white/30 focus:border-white/30"
            />
            <button type="button" onclick={() => addProject(area.id)} class="rounded-lg bg-sky-500/80 px-3 py-2 text-sm font-medium text-white hover:bg-sky-500">Add</button>
          </div>
        {/if}

        {#if (projectsByArea[area.id]?.length ?? 0) === 0}
          <p class="text-xs text-white/30">No projects in this area yet.</p>
        {:else}
          <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {#each projectsByArea[area.id] as project (project.id)}
              <ProjectCard {project} />
            {/each}
          </div>
        {/if}
      </section>
    {/each}
  </div>
{/if}
