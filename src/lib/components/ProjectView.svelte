<script lang="ts">
  import { store } from "$lib/store.svelte";
  import { relativeDue, relativeAgo } from "$lib/date";
  import DatePicker from "$lib/components/DatePicker.svelte";
  import type { ProjectStatus, ProjectPriority } from "$lib/types";

  const project = $derived(store.activeProject);
  const progress = $derived(store.projectProgress);
  const pct = $derived(progress.total ? Math.round((progress.done / progress.total) * 100) : 0);

  let linking = $state(false);
  let pickContact = $state("");
  // Contacts not already linked to this project.
  const availableContacts = $derived(
    store.pickContacts.filter((c) => !store.projectContacts.some((pc) => pc.id === c.id)),
  );
  async function startLink() {
    await store.ensureContactsLoaded();
    linking = true;
  }
  async function doLink() {
    if (!pickContact) return;
    await store.linkContactToProject(pickContact);
    pickContact = "";
    linking = false;
  }

  const statusLabel: Record<ProjectStatus, string> = {
    planned: "Planned", in_progress: "In Progress", ongoing: "Ongoing", done: "Done",
  };
  const prioLabel: Record<ProjectPriority, string> = { low: "Low", medium: "Medium", high: "High" };

  function onName(e: Event) { if (project) store.renameProject(project.id, (e.target as HTMLInputElement).value); }
  function onDesc(e: Event) { if (project) store.setProjectDescription(project.id, (e.target as HTMLTextAreaElement).value); }
  function onTaskTitle(id: string, e: Event) { store.renameTask(id, (e.target as HTMLInputElement).value); }

  // Drag-to-reorder tasks
  let dragId = $state<string | null>(null);
  let overId = $state<string | null>(null);
  function onDragStart(id: string) { dragId = id; }
  function onDragOver(id: string, e: DragEvent) { e.preventDefault(); overId = id; }
  function onDrop(targetId: string) {
    if (!dragId || dragId === targetId) { dragId = null; overId = null; return; }
    const ids = store.tasks.map((t) => t.id);
    const from = ids.indexOf(dragId);
    const to = ids.indexOf(targetId);
    if (from < 0 || to < 0) { dragId = null; overId = null; return; }
    ids.splice(to, 0, ids.splice(from, 1)[0]);
    store.reorderTasks(ids);
    dragId = null; overId = null;
  }
  function onDragEnd() { dragId = null; overId = null; }

  const activityIcon = (k: string) =>
    k === "task_completed" ? "✓" : k === "note_added" ? "▤" : k === "deadline_updated" ? "◷"
      : k === "status_changed" ? "✦" : k === "priority_changed" ? "!" : "＋";
</script>

{#if project}
  <section class="pv">
    <div class="main">
      <div class="crumbs">
        <button onclick={() => store.openDashboard()}>Dashboard</button><span>›</span>
        <button onclick={() => store.openProjects()}>Projects</button><span>›</span>
        <span class="here">{project.name || "Untitled"}</span>
        <button class="pin" class:on={project.pinned} title={project.pinned ? "Unpin" : "Pin"} onclick={() => store.toggleProjectPinned(project.id)}>{project.pinned ? "★" : "☆"}</button>
        <span class="status-badge {project.status}">{statusLabel[project.status]}</span>
      </div>

      <input class="pname" value={project.name} oninput={onName} placeholder="Project name" />
      <textarea class="pdesc" placeholder="Add a description…" value={project.description} oninput={onDesc}></textarea>

      <div class="tagrow">
        <button class="tag area" onclick={() => store.openArea(project.area_id)}>◆ {project.area_name ?? "Area"}</button>
        {#if project.due_at != null}{@const d = relativeDue(project.due_at)}<span class="tag {d.tone}">▦ Due {d.label}</span>{/if}
        <span class="tag prio {project.priority}">⚑ {prioLabel[project.priority]} priority</span>
      </div>

      <div class="progress">
        <div class="p-top"><span>PROGRESS</span><span>{progress.done}/{progress.total} tasks</span></div>
        <div class="bar"><div class="fill" style="width:{pct}%"></div></div>
      </div>

      <div class="section">
        <div class="s-head"><span class="s-title">☑ Tasks</span><button class="ghost" onclick={() => store.addTask()}>＋ Add task</button></div>
        {#if store.tasks.length === 0}
          <p class="muted">No tasks yet.</p>
        {:else}
          <ul class="tasks">
            {#each store.tasks as t (t.id)}
              <li
                class="task"
                class:done={t.status === "done"}
                class:dragging={dragId === t.id}
                class:over={overId === t.id && dragId !== t.id}
                draggable="true"
                ondragstart={() => onDragStart(t.id)}
                ondragover={(e) => onDragOver(t.id, e)}
                ondrop={() => onDrop(t.id)}
                ondragend={onDragEnd}
              >
                <span class="grip" title="Drag to reorder">∷</span>
                <button class="check" onclick={() => store.toggleTask(t.id)}>{t.status === "done" ? "☑" : "☐"}</button>
                <input class="ttitle" value={t.title} placeholder="Task…" oninput={(e) => onTaskTitle(t.id, e)} />
                {#if t.due_at != null && t.status !== "done"}{@const d = relativeDue(t.due_at)}<span class="tdue {d.tone}">{d.label}</span>{/if}
                <DatePicker compact value={t.due_at} onpick={(ms) => store.setTaskDue(t.id, ms)} />
                <button class="tdel" onclick={() => store.deleteTask(t.id)}>×</button>
              </li>
            {/each}
          </ul>
        {/if}
      </div>

      <div class="section">
        <div class="s-head"><span class="s-title">▤ Notes</span><button class="ghost" onclick={() => store.addResourceHere()}>＋ New note</button></div>
        {#if store.contextResources.length === 0}
          <p class="muted">No linked notes yet.</p>
        {:else}
          <ul class="notes">
            {#each store.contextResources as r (r.id)}
              <li><button class="note" onclick={() => store.openResource(r.id, "project")}>
                <span class="rg">▤</span>
                <span class="rn">{r.title.trim() || "Untitled"}</span>
                <span class="ra">{relativeAgo(r.updated_at)}</span>
                <span class="chev">›</span>
              </button></li>
            {/each}
          </ul>
        {/if}
      </div>
    </div>

    <aside class="rail">
      <div class="r-card">
        <div class="r-label">Contact / CRM</div>
        {#if store.projectContacts.length}
          <ul class="people">
            {#each store.projectContacts as c (c.id)}
              <li class="person">
                <span class="avatar">{(c.name.trim()[0] || "?").toUpperCase()}</span>
                <button class="c-main" onclick={() => store.openContact(c.id, "project")}>
                  <span class="c-name">{c.name.trim() || "Unnamed"}</span>
                </button>
                <button class="unlink" title="Unlink" onclick={() => store.unlinkContactFromProject(c.id)}>×</button>
              </li>
            {/each}
          </ul>
        {:else}
          <p class="muted small">No contact linked yet.</p>
        {/if}

        {#if linking}
          <div class="link-row">
            <select bind:value={pickContact}>
              <option value="">choose contact…</option>
              {#each availableContacts as c (c.id)}
                <option value={c.id}>{c.name || "Unnamed"}</option>
              {/each}
            </select>
            <button class="link-go" disabled={!pickContact} onclick={doLink}>Link</button>
          </div>
          {#if availableContacts.length === 0}
            <p class="muted small">No more contacts. Create one in Contacts.</p>
          {/if}
        {:else}
          <button class="crm-btn" onclick={startLink}>+ Link contact</button>
        {/if}
      </div>

      <div class="r-card">
        <div class="r-label">Details</div>
        <div class="d-row"><span class="d-k">◆ Area</span><button class="d-link" onclick={() => store.openArea(project.area_id)}>{project.area_name ?? "—"}</button></div>
        <div class="d-row"><span class="d-k">▦ Deadline</span><DatePicker value={project.due_at} onpick={(ms) => store.setProjectDue(project.id, ms)} placeholder="set date" /></div>
        <div class="d-row"><span class="d-k">⚑ Priority</span>
          <select value={project.priority} onchange={(e) => store.setProjectPriority(project.id, (e.target as HTMLSelectElement).value as ProjectPriority)}>
            <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
          </select>
        </div>
        <div class="d-row"><span class="d-k">✦ Status</span>
          <select value={project.status} onchange={(e) => store.setProjectStatus(project.id, (e.target as HTMLSelectElement).value as ProjectStatus)}>
            <option value="planned">Planned</option><option value="in_progress">In Progress</option><option value="ongoing">Ongoing</option><option value="done">Done</option>
          </select>
        </div>
        <div class="d-actions">
          <button class="act" onclick={() => store.archiveProject(project.id)}>archive</button>
          <button class="act danger" onclick={() => store.confirmDeleteProject(project.id, project.name)}>delete</button>
        </div>
      </div>

      <div class="r-card">
        <div class="r-label">Activity</div>
        {#if store.projectActivity.length === 0}
          <p class="muted small">No activity yet.</p>
        {:else}
          <ul class="activity">
            {#each store.projectActivity as a (a.id)}
              <li class="ev">
                <span class="ev-ico {a.kind}">{activityIcon(a.kind)}</span>
                <span class="ev-main">
                  <span class="ev-title">{a.title}</span>
                  {#if a.detail}<span class="ev-detail">{a.detail}</span>{/if}
                  <span class="ev-time">{relativeAgo(a.created_at)}</span>
                </span>
              </li>
            {/each}
          </ul>
        {/if}
      </div>
    </aside>
  </section>
{/if}

<style>
  .pv { flex: 1; height: 100%; overflow-y: auto; background: var(--bg); min-width: 0; display: flex; gap: 0; align-items: flex-start; }
  .main { flex: 1; min-width: 0; padding: 20px 28px 40px; }
  .rail { flex: 0 0 300px; align-self: stretch; border-left: 1px solid var(--border-soft); padding: 18px; display: flex; flex-direction: column; gap: 14px; }
  @media (max-width: 980px) { .pv { flex-direction: column; } .rail { flex: none; width: 100%; border-left: none; border-top: 1px solid var(--border-soft); } }

  .crumbs { display: flex; align-items: center; gap: 7px; font-size: 12px; color: var(--fg-faint); margin-bottom: 14px; }
  .crumbs button { color: var(--fg-faint); } .crumbs button:hover { color: var(--fg); }
  .crumbs .here { color: var(--fg-dim); }
  .pin { font-size: 14px; color: var(--fg-faint); padding: 0 4px; } .pin:hover { color: var(--res); } .pin.on { color: var(--res); }
  .status-badge { margin-left: auto; font-size: 11px; padding: 2px 10px; border-radius: 12px; font-weight: 600; }
  .status-badge.planned { color: var(--fg-faint); background: var(--bg-elev); }
  .status-badge.in_progress { color: var(--proj); background: color-mix(in srgb, var(--proj) 15%, transparent); }
  .status-badge.ongoing, .status-badge.done { color: var(--accent); background: color-mix(in srgb, var(--accent) 15%, transparent); }

  .pname { width: 100%; background: transparent; border: none; outline: none; font-size: 26px; font-weight: 700; color: var(--fg); padding: 0; letter-spacing: -0.3px; }
  .pname::placeholder { color: var(--fg-faint); }
  .pdesc { width: 100%; margin-top: 8px; background: transparent; border: none; outline: none; resize: vertical; min-height: 24px; color: var(--fg-dim); font-size: 13.5px; font-family: inherit; line-height: 1.5; }
  .pdesc::placeholder { color: var(--fg-faint); }

  .tagrow { display: flex; flex-wrap: wrap; gap: 8px; margin: 14px 0 4px; }
  .tag { display: inline-flex; align-items: center; gap: 5px; font-size: 11.5px; color: var(--fg-dim); background: var(--bg-inset); border: 1px solid var(--border); border-radius: 14px; padding: 4px 10px; }
  .tag.area { color: var(--area); } .tag.area:hover { border-color: var(--area); }
  .tag.soon { color: var(--accent); } .tag.over { color: var(--danger); }
  .tag.prio.high { color: var(--res); } .tag.prio.medium { color: var(--fg-dim); } .tag.prio.low { color: var(--fg-faint); }

  .progress { margin: 20px 0 8px; }
  .p-top { display: flex; justify-content: space-between; font-size: 10.5px; letter-spacing: 0.6px; color: var(--fg-faint); text-transform: uppercase; margin-bottom: 6px; }
  .bar { height: 6px; background: var(--bg-elev); border-radius: 4px; overflow: hidden; }
  .fill { height: 100%; background: var(--accent); border-radius: 4px; transition: width 0.25s; }

  .section { margin-top: 26px; }
  .s-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
  .s-title { font-weight: 700; font-size: 14px; color: var(--fg); }
  .ghost { color: var(--fg-dim); font-size: 12px; padding: 4px 10px; border: 1px solid var(--border); border-radius: 7px; }
  .ghost:hover { background: var(--bg-elev); color: var(--fg); }
  .muted { color: var(--fg-faint); font-size: 12px; } .muted.small { font-size: 11.5px; }

  .tasks, .notes { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 1px; }
  .task { display: flex; align-items: center; gap: 8px; padding: 7px 10px; border-radius: 8px; background: var(--bg-inset); border: 1px solid var(--border-soft); }
  .task:hover { background: var(--bg-elev); }
  .task:hover .tdel { opacity: 1; }
  .task:hover .grip { opacity: 1; }
  .task.dragging { opacity: 0.85; background: var(--bg-elev); border-color: var(--accent); }
  .task.over { border-color: var(--accent); box-shadow: inset 0 2px 0 var(--accent); }
  .grip { color: var(--fg-faint); font-size: 13px; cursor: grab; opacity: 0; transition: opacity 0.12s; flex: 0 0 auto; }
  .check { color: var(--fg-faint); font-size: 15px; flex: 0 0 auto; }
  .task.done .check { color: var(--accent); }
  .ttitle { flex: 1; min-width: 0; background: transparent; border: none; outline: none; font-size: 13px; color: var(--fg); }
  .task.done .ttitle { color: var(--fg-faint); text-decoration: line-through; }
  .tdue { font-size: 10.5px; color: var(--fg-dim); flex: 0 0 auto; } .tdue.soon { color: var(--accent); } .tdue.over { color: var(--danger); }
  .tdel { color: var(--fg-faint); font-size: 16px; opacity: 0; transition: opacity 0.12s; flex: 0 0 auto; } .tdel:hover { color: var(--danger); }

  .note { display: flex; align-items: center; gap: 9px; width: 100%; text-align: left; padding: 9px 10px; border-radius: 8px; background: var(--bg-inset); border: 1px solid var(--border-soft); }
  .note:hover { background: var(--bg-elev); }
  .rg { color: var(--res); font-size: 11px; } .rn { flex: 1; min-width: 0; color: var(--fg); font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .ra { font-size: 10.5px; color: var(--fg-faint); } .chev { color: var(--fg-faint); }

  .r-card { background: var(--bg-inset); border: 1px solid var(--border); border-radius: 10px; padding: 14px; }
  .r-label { font-size: 10px; letter-spacing: 0.8px; text-transform: uppercase; color: var(--fg-faint); font-weight: 600; margin-bottom: 10px; }
  .people { list-style: none; margin: 0 0 10px; padding: 0; display: flex; flex-direction: column; gap: 6px; }
  .person { display: flex; align-items: center; gap: 10px; }
  .avatar { width: 30px; height: 30px; flex: 0 0 auto; border-radius: 50%; background: var(--bg-elev); border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; color: var(--accent); font-weight: 700; font-size: 12px; }
  .c-main { flex: 1; min-width: 0; text-align: left; }
  .c-name { color: var(--fg); font-size: 13px; font-weight: 600; } .c-main:hover .c-name { color: var(--accent); }
  .unlink { color: var(--fg-faint); font-size: 15px; width: 20px; flex: 0 0 auto; } .unlink:hover { color: var(--danger); }
  .link-row { display: flex; gap: 6px; margin-top: 4px; }
  .link-row select { flex: 1; min-width: 0; background: var(--bg); color: var(--fg-dim); border: 1px solid var(--border); border-radius: 7px; padding: 6px; font-size: 12px; outline: none; }
  .link-go { font-size: 12px; color: var(--accent); border: 1px solid color-mix(in srgb, var(--accent) 40%, transparent); border-radius: 7px; padding: 6px 12px; flex: 0 0 auto; }
  .link-go:disabled { color: var(--fg-faint); border-color: var(--border); cursor: default; }
  .crm-btn { width: 100%; font-size: 12px; color: var(--fg); background: var(--bg-elev); border: 1px solid var(--border); border-radius: 7px; padding: 7px; } .crm-btn:hover { border-color: var(--fg-faint); }

  .d-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 7px 0; border-bottom: 1px solid var(--border-soft); }
  .d-row:last-of-type { border-bottom: none; }
  .d-k { font-size: 12px; color: var(--fg-dim); flex: 0 0 auto; }
  .d-link { font-size: 12px; color: var(--area); } .d-link:hover { text-decoration: underline; }
  .d-row select { background: var(--bg); color: var(--fg-dim); border: 1px solid var(--border); border-radius: 6px; padding: 3px 6px; font-size: 12px; outline: none; }
  .d-actions { display: flex; gap: 6px; margin-top: 10px; }
  .act { flex: 1; font-size: 11px; color: var(--fg-faint); padding: 6px; border: 1px solid var(--border); border-radius: 7px; } .act:hover { color: var(--fg); } .act.danger:hover { color: var(--danger); border-color: var(--danger); }

  .activity { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 12px; }
  .ev { display: flex; gap: 10px; }
  .ev-ico { flex: 0 0 auto; width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; color: var(--fg-dim); background: var(--bg-elev); }
  .ev-ico.task_completed { color: var(--accent); } .ev-ico.deadline_updated { color: var(--res); } .ev-ico.status_changed { color: var(--proj); }
  .ev-main { display: flex; flex-direction: column; min-width: 0; }
  .ev-title { font-size: 12.5px; color: var(--fg); font-weight: 600; }
  .ev-detail { font-size: 11.5px; color: var(--fg-dim); }
  .ev-time { font-size: 10.5px; color: var(--fg-faint); margin-top: 1px; }
</style>
