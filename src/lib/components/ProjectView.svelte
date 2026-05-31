<script lang="ts">
  import { store } from "$lib/store.svelte";
  import { relativeDue } from "$lib/date";
  import DatePicker from "$lib/components/DatePicker.svelte";

  const project = $derived(store.activeProject);

  function onName(e: Event) {
    if (project) store.renameProject(project.id, (e.target as HTMLInputElement).value);
  }
  function onTaskTitle(id: string, e: Event) {
    store.renameTask(id, (e.target as HTMLInputElement).value);
  }
</script>

{#if project}
  <section class="proj-view">
    <header class="head">
      <div class="head-top">
        <input class="pname" value={project.name} oninput={onName} placeholder="Project name" />
        <div class="actions">
          <button class="act" onclick={() => store.archiveProject(project.id)}>archive</button>
          <button class="act danger" onclick={() => store.deleteProject(project.id)}>delete</button>
        </div>
      </div>
      <div class="meta">
        <button
          class="status"
          class:done={project.status === "done"}
          onclick={() => store.setProjectStatus(project.id, project.status === "done" ? "active" : "done")}
        >
          <span class="box"></span>{project.status === "done" ? "Done" : "Active"}
        </button>
        <label class="due-field">
          due
          <DatePicker value={project.due_at} onpick={(ms) => store.setProjectDue(project.id, ms)} />
        </label>
      </div>
    </header>

    <div class="body">
      <div class="tasks-head">
        <span class="t-title">Tasks</span>
        <button class="new" onclick={() => store.addTask()}>+ task</button>
      </div>

      {#if store.loading}
        <p class="muted">loading…</p>
      {:else if store.tasks.length === 0}
        <p class="muted">No tasks yet. Add one to get started.</p>
      {:else}
        <ul class="tasks">
          {#each store.tasks as t (t.id)}
            <li class="task" class:done={t.status === "done"}>
              <button class="check" onclick={() => store.toggleTask(t.id)} title="Toggle done">
                {t.status === "done" ? "☑" : "☐"}
              </button>
              <input
                class="ttitle"
                value={t.title}
                placeholder="Task…"
                oninput={(e) => onTaskTitle(t.id, e)}
              />
              {#if t.due_at != null && t.status !== "done"}
                {@const due = relativeDue(t.due_at)}
                <span class="tdue {due.tone}">{due.label}</span>
              {/if}
              <DatePicker compact value={t.due_at} onpick={(ms) => store.setTaskDue(t.id, ms)} />
              <button class="tdel" onclick={() => store.deleteTask(t.id)} title="Delete task">×</button>
            </li>
          {/each}
        </ul>
      {/if}

      {#if store.projectContacts.length}
        <div class="people">
          <div class="r-head"><span class="r-title-h">People</span></div>
          <div class="ppl">
            {#each store.projectContacts as c (c.id)}
              <button class="pchip" onclick={() => store.openContact(c.id, "project")}>
                <span class="pav">{(c.name.trim()[0] || "?").toUpperCase()}</span>{c.name.trim() || "Unnamed"}
              </button>
            {/each}
          </div>
        </div>
      {/if}

      <div class="resources">
        <div class="r-head">
          <span class="r-title-h">Notes & resources</span>
          <button class="new" onclick={() => store.addResourceHere()}>+ note</button>
        </div>
        {#if store.contextResources.length === 0}
          <p class="muted">No linked notes yet.</p>
        {:else}
          <ul class="rlist">
            {#each store.contextResources as r (r.id)}
              <li>
                <button class="rrow" onclick={() => store.openResource(r.id, "project")}>
                  <span class="rg">▤</span>
                  <span class="rname">{r.title.trim() || (r.content.split("\n").find((l) => l.trim()) ?? "Untitled").replace(/^#+\s*/, "")}</span>
                </button>
              </li>
            {/each}
          </ul>
        {/if}
      </div>
    </div>
  </section>
{/if}

<style>
  .proj-view { flex: 1; height: 100%; overflow-y: auto; background: var(--bg); min-width: 0; }
  .head { padding: 22px 28px 16px; border-bottom: 1px solid var(--border-soft); }
  .head-top { display: flex; align-items: center; gap: 10px; }
  .pname {
    flex: 1; min-width: 0; background: transparent; border: none; outline: none;
    font-size: 22px; font-weight: 700; color: var(--fg); padding: 2px 0;
  }
  .pname::placeholder { color: var(--fg-faint); }
  .actions { display: flex; gap: 4px; }
  .act {
    font-size: 11px; color: var(--fg-faint); padding: 5px 9px;
    border-radius: var(--radius); border: 1px solid transparent;
    transition: color 0.12s, border-color 0.12s;
  }
  .act:hover { color: var(--fg); border-color: var(--border); }
  .act.danger:hover { color: var(--danger); border-color: var(--danger); }

  .meta { display: flex; align-items: center; gap: 16px; margin-top: 12px; }
  .status { display: flex; align-items: center; gap: 7px; font-size: 12px; color: var(--fg-dim); }
  .status .box { width: 12px; height: 12px; border-radius: 3px; border: 1.5px solid var(--fg-faint); }
  .status.done { color: var(--accent); }
  .status.done .box { background: var(--accent); border-color: var(--accent); }
  .due-field { display: flex; align-items: center; gap: 7px; font-size: 12px; color: var(--fg-faint); }
  .due-field input {
    background: var(--bg-inset); color: var(--fg-dim); border: 1px solid var(--border);
    border-radius: var(--radius); padding: 3px 7px; font-size: 11px; outline: none;
  }

  .body { padding: 18px 28px 28px; max-width: 760px; }
  .tasks-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
  .t-title { font-weight: 700; font-size: 13px; }
  .new { color: var(--accent); font-size: 12px; padding: 3px 7px; border-radius: var(--radius); transition: background 0.12s; }
  .new:hover { background: var(--bg-elev); }
  .muted { color: var(--fg-faint); font-size: 12px; }

  .tasks { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 1px; }
  .task {
    display: flex; align-items: center; gap: 8px; padding: 5px 6px;
    border-radius: var(--radius); transition: background 0.12s;
  }
  .task:hover { background: var(--bg-elev); }
  .task:hover .tdel { opacity: 1; }
  .check { color: var(--fg-faint); font-size: 15px; width: 20px; flex: 0 0 auto; }
  .task.done .check { color: var(--accent); }
  .ttitle {
    flex: 1; min-width: 0; background: transparent; border: none; outline: none;
    font-size: 13px; color: var(--fg); padding: 2px 0;
  }
  .ttitle::placeholder { color: var(--fg-faint); }
  .task.done .ttitle { color: var(--fg-faint); text-decoration: line-through; }
  .tdue { font-size: 10.5px; color: var(--fg-dim); flex: 0 0 auto; }
  .tdue.soon { color: var(--accent); }
  .tdue.over { color: var(--danger); }
  .tdel { color: var(--fg-faint); font-size: 16px; width: 20px; opacity: 0; transition: opacity 0.12s, color 0.12s; flex: 0 0 auto; }
  .tdel:hover { color: var(--danger); }

  .resources { margin-top: 28px; }
  .people { margin-top: 28px; }
  .ppl { display: flex; flex-wrap: wrap; gap: 6px; }
  .pchip { display: inline-flex; align-items: center; gap: 7px; padding: 4px 10px 4px 4px; font-size: 12px; color: var(--fg); background: var(--bg-inset); border: 1px solid var(--border); border-radius: 14px; transition: border-color 0.12s; }
  .pchip:hover { border-color: var(--fg-faint); }
  .pav { width: 20px; height: 20px; display: inline-flex; align-items: center; justify-content: center; border-radius: 50%; background: var(--bg-elev); color: var(--accent); font-size: 10px; font-weight: 700; }
  .r-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
  .r-title-h { font-weight: 700; font-size: 13px; }
  .rlist { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 1px; }
  .rrow { display: flex; align-items: center; gap: 9px; width: 100%; padding: 7px 8px; border-radius: var(--radius); text-align: left; transition: background 0.12s; }
  .rrow:hover { background: var(--bg-elev); }
  .rg { color: var(--fg-faint); font-size: 11px; width: 14px; text-align: center; flex: 0 0 auto; }
  .rname { flex: 1; min-width: 0; color: var(--fg); font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
</style>
