<script lang="ts">
  import { store } from "$lib/store.svelte";
  import { relativeDue } from "$lib/date";
  import PageHeader from "$lib/components/PageHeader.svelte";
  import type { ProjectStatus } from "$lib/types";

  let taskMenu = $state<string | null>(null); // area id with open "add task" menu

  const statusLabel: Record<ProjectStatus, string> = {
    planned: "Planned", in_progress: "In Progress", ongoing: "Ongoing", done: "Done",
  };

  function projectsOf(areaId: string) {
    return store.allProjects.filter((p) => p.area_id === areaId);
  }
  function tasksOf(areaId: string) {
    return store.areaTasksAll.filter((t) => t.area_id === areaId);
  }
  function addTask(projectId: string) {
    store.addTaskToProject(projectId);
    taskMenu = null;
  }
</script>

<section class="view">
  <PageHeader icon="◆" title="Areas" color="var(--area)" count={store.counts.areas} actionLabel="◆ New Area" onAction={() => store.addArea()} />

  <div class="scroll">
    <div class="note">Areas are ongoing responsibilities with no end date — they contain Projects and their Tasks.</div>

    {#if store.areas.length === 0}
      <p class="muted">No areas yet. Create one to organize your projects.</p>
    {:else}
      {#each store.areas as area (area.id)}
        {@const projects = projectsOf(area.id)}
        {@const tasks = tasksOf(area.id)}
        <div class="acard">
          <div class="a-head">
            <button class="a-name" onclick={() => store.openArea(area.id)}>◆ {area.name || "Untitled"}</button>
            <div class="a-actions">
              <button class="mini" onclick={() => store.addProject(area.id)}>▸ Add Project</button>
              <div class="menu-wrap">
                <button class="mini" disabled={projects.length === 0} onclick={() => (taskMenu = taskMenu === area.id ? null : area.id)}>＋ Add Task</button>
                {#if taskMenu === area.id}
                  <div class="menu">
                    <div class="menu-label">Add task to…</div>
                    {#each projects as p (p.id)}
                      <button class="menu-item" onclick={() => addTask(p.id)}>{p.name || "Untitled"}</button>
                    {/each}
                  </div>
                {/if}
              </div>
            </div>
          </div>

          <div class="cols">
            <div class="col">
              <div class="col-head">▸ Projects <span class="c">{projects.length}</span></div>
              {#if projects.length === 0}
                <p class="empty">No projects.</p>
              {:else}
                {#each projects as p (p.id)}
                  <button class="prow" onclick={() => store.openProject(p.id, area.id)}>
                    <span class="p-main">
                      <span class="p-name">{p.name || "Untitled"}</span>
                      <span class="p-sub">{p.due_at != null ? "Due " + relativeDue(p.due_at).label : statusLabel[p.status]}</span>
                    </span>
                    <span class="pill {p.status}">{statusLabel[p.status]}</span>
                  </button>
                {/each}
              {/if}
            </div>

            <div class="col">
              <div class="col-head">☑ Tasks <span class="c">{tasks.length}</span></div>
              {#if tasks.length === 0}
                <p class="empty">No tasks.</p>
              {:else}
                {#each tasks as t (t.id)}
                  <div class="trow" class:done={t.status === "done"}>
                    <button class="tcheck" onclick={() => store.toggleAreaTask(t.id)}>{t.status === "done" ? "☑" : "☐"}</button>
                    <span class="t-name">{t.title || "Untitled"}</span>
                    {#if t.due_at != null && t.status !== "done"}{@const d = relativeDue(t.due_at)}<span class="t-due {d.tone}">{d.label}</span>{/if}
                  </div>
                {/each}
              {/if}
            </div>
          </div>
        </div>
      {/each}
    {/if}
  </div>
</section>

<style>
  .view { flex: 1; height: 100%; display: flex; flex-direction: column; background: var(--bg); min-width: 0; --c: var(--area); }

  .scroll { flex: 1; overflow-y: auto; padding: 16px 28px 32px; max-width: 1100px; }
  .note { display: flex; align-items: center; gap: 8px; padding: 12px 14px; margin-bottom: 16px; background: var(--bg-inset); border: 1px solid var(--border-soft); border-radius: 10px; color: var(--fg-faint); font-size: 12px; }
  .muted { color: var(--fg-faint); font-size: 12px; }

  .acard { background: var(--bg-inset); border: 1px solid var(--border); border-radius: 12px; margin-bottom: 16px; overflow: hidden; }
  .a-head { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; border-bottom: 1px solid var(--border-soft); }
  .a-name { font-size: 15px; font-weight: 700; color: var(--fg); }
  .a-name:hover { color: var(--c); }
  .a-actions { display: flex; gap: 6px; }
  .mini { font-size: 11.5px; color: var(--fg-dim); padding: 5px 10px; border: 1px solid var(--border); border-radius: 7px; }
  .mini:hover:not(:disabled) { background: var(--bg-elev); color: var(--fg); }
  .mini:disabled { color: var(--fg-faint); opacity: 0.5; cursor: default; }
  .menu-wrap { position: relative; }
  .menu { position: absolute; top: calc(100% + 4px); right: 0; z-index: 20; min-width: 180px; background: var(--bg-elev); border: 1px solid var(--border); border-radius: 8px; padding: 4px; box-shadow: 0 12px 32px rgba(0,0,0,0.3); }
  .menu-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: var(--fg-faint); padding: 6px 8px 4px; }
  .menu-item { display: block; width: 100%; text-align: left; font-size: 12px; color: var(--fg-dim); padding: 6px 8px; border-radius: 6px; }
  .menu-item:hover { background: var(--bg-inset); color: var(--fg); }

  .cols { display: grid; grid-template-columns: 1fr 1fr; }
  @media (max-width: 720px) { .cols { grid-template-columns: 1fr; } }
  .col { padding: 12px 14px; }
  .col:first-child { border-right: 1px solid var(--border-soft); }
  .col-head { display: flex; align-items: center; gap: 7px; font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.6px; color: var(--fg-faint); margin-bottom: 8px; font-weight: 600; }
  .col-head .c { color: var(--fg-faint); }
  .empty { font-size: 11.5px; color: var(--fg-faint); padding: 2px; }

  .prow { display: flex; align-items: center; gap: 10px; width: 100%; text-align: left; padding: 9px 10px; border-radius: 8px; background: var(--bg); border: 1px solid var(--border-soft); margin-bottom: 4px; }
  .prow:hover { border-color: var(--border); }
  .p-main { flex: 1; min-width: 0; display: flex; flex-direction: column; }
  .p-name { color: var(--fg); font-size: 12.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .p-sub { color: var(--fg-faint); font-size: 10.5px; }
  .pill { flex: 0 0 auto; font-size: 10px; padding: 3px 9px; border-radius: 10px; font-weight: 600; }
  .pill.planned { color: var(--fg-faint); background: var(--bg-elev); }
  .pill.in_progress { color: var(--proj); background: color-mix(in srgb, var(--proj) 16%, transparent); }
  .pill.ongoing { color: var(--accent); background: color-mix(in srgb, var(--accent) 16%, transparent); }
  .pill.done { color: var(--fg-faint); background: var(--bg-elev); }

  .trow { display: flex; align-items: center; gap: 9px; padding: 7px 8px; border-radius: 7px; }
  .trow:hover { background: var(--bg-elev); }
  .tcheck { color: var(--fg-faint); font-size: 14px; flex: 0 0 auto; }
  .trow.done .tcheck { color: var(--accent); }
  .t-name { flex: 1; min-width: 0; color: var(--fg); font-size: 12.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .trow.done .t-name { color: var(--fg-faint); text-decoration: line-through; }
  .t-due { font-size: 10.5px; color: var(--fg-dim); flex: 0 0 auto; } .t-due.soon { color: var(--accent); } .t-due.over { color: var(--danger); }
</style>
