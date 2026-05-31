<script lang="ts">
  import { store } from "$lib/store.svelte";
  import { relativeDue, relativeAgo } from "$lib/date";
  import { viewMode } from "$lib/viewmode.svelte";
  import PageHeader from "$lib/components/PageHeader.svelte";
  import EmptyState from "$lib/components/EmptyState.svelte";
  import type { ProjectStatus } from "$lib/types";

  const statusLabel: Record<ProjectStatus, string> = {
    planned: "Planned", in_progress: "In Progress", ongoing: "Ongoing", done: "Done",
  };

  async function addProject() {
    const area = store.areas[0];
    if (!area) { await store.openAreasList(); return; }
    await store.addProject(area.id);
  }

  function displayTitle(title: string, content: string): string {
    if (title.trim()) return title.trim();
    const first = content.split("\n").find((l) => l.trim());
    return first?.replace(/^#+\s*/, "").trim() || "Untitled";
  }

  // Filter + sort controls
  let fStatus = $state<"all" | ProjectStatus>("all");
  let fArea = $state<string>("all");
  let sortBy = $state<"recent" | "due" | "priority" | "name">("recent");

  const prioRank: Record<string, number> = { high: 0, medium: 1, low: 2 };

  const displayed = $derived.by(() => {
    let list = store.projectPreviews.filter((b) => {
      if (fStatus !== "all" && b.project.status !== fStatus) return false;
      if (fArea !== "all" && b.project.area_id !== fArea) return false;
      return true;
    });
    const sorted = [...list];
    if (sortBy === "due") {
      sorted.sort((a, b) => {
        const da = a.project.due_at, db_ = b.project.due_at;
        if (da == null && db_ == null) return 0;
        if (da == null) return 1;
        if (db_ == null) return -1;
        return da - db_;
      });
    } else if (sortBy === "priority") {
      sorted.sort((a, b) => prioRank[a.project.priority] - prioRank[b.project.priority]);
    } else if (sortBy === "name") {
      sorted.sort((a, b) => (a.project.name || "").localeCompare(b.project.name || ""));
    } else {
      sorted.sort((a, b) => b.project.updated_at - a.project.updated_at);
    }
    return sorted;
  });
</script>

<section class="view">
  <PageHeader
    icon="▸" title="Projects" color="var(--proj)" count={store.counts.projects}
    actionLabel="▸ New Project" onAction={addProject}
    view={viewMode.mode} onView={(v) => viewMode.set(v)}
  />

  <div class="toolbar">
    <div class="filters">
      <button class="chip" class:on={fStatus === "all"} onclick={() => (fStatus = "all")}>All</button>
      <button class="chip" class:on={fStatus === "in_progress"} onclick={() => (fStatus = "in_progress")}>In Progress</button>
      <button class="chip" class:on={fStatus === "planned"} onclick={() => (fStatus = "planned")}>Planned</button>
      <button class="chip" class:on={fStatus === "ongoing"} onclick={() => (fStatus = "ongoing")}>Ongoing</button>
      <button class="chip" class:on={fStatus === "done"} onclick={() => (fStatus = "done")}>Done</button>
    </div>
    <div class="selects">
      <select bind:value={fArea} title="Filter by area">
        <option value="all">All areas</option>
        {#each store.areas as a (a.id)}<option value={a.id}>{a.name || "Untitled"}</option>{/each}
      </select>
      <select bind:value={sortBy} title="Sort">
        <option value="recent">Recent</option>
        <option value="due">Deadline</option>
        <option value="priority">Priority</option>
        <option value="name">Name</option>
      </select>
    </div>
  </div>

  <div class="scroll">
    {#if store.loading}
      <p class="muted">loading…</p>
    {:else if store.projectPreviews.length === 0}
      <EmptyState
        icon="▸" color="var(--proj)" title="No projects yet"
        message="Projects have a goal and a deadline, and live inside an area. Create your first one to get started."
        actionLabel="▸ New Project" onAction={addProject}
      />
    {:else if displayed.length === 0}
      <p class="muted">No projects match this filter.</p>
    {:else if viewMode.mode === "compact"}
      <ul class="clist">
        {#each displayed as bundle (bundle.project.id)}
          {@const p = bundle.project}
          {@const c = bundle.taskCounts}
          <li class="crow-wrap">
            <button class="cpin" class:on={p.pinned} title={p.pinned ? "Unpin" : "Pin"} onclick={() => store.toggleProjectPinned(p.id)}>{p.pinned ? "★" : "☆"}</button>
            <button class="crow" class:done={p.status === "done"} onclick={() => store.openProject(p.id, p.area_id)}>
              <span class="cg">▸</span>
              <span class="cname">{p.name || "Untitled"}</span>
              <span class="carea">◆ {p.area_name}</span>
              {#if c.total > 0}<span class="ctasks">{c.done}/{c.total}</span>{/if}
              {#if p.due_at != null}{@const d = relativeDue(p.due_at)}<span class="cdue {d.tone}">{d.label}</span>{/if}
              <span class="cpill {p.status}">{statusLabel[p.status]}</span>
            </button>
          </li>
        {/each}
      </ul>
    {:else}
      {#each displayed as bundle (bundle.project.id)}
        {@const p = bundle.project}
        {@const c = bundle.taskCounts}
        {@const pct = c.total ? Math.round((c.done / c.total) * 100) : 0}
        <div class="pcard">
          <div class="p-head">
            <button class="p-name" onclick={() => store.openProject(p.id, p.area_id)}>
              <span class="g">▸</span>{p.name || "Untitled"}
            </button>
            <div class="p-meta">
              <button class="pcardpin" class:on={p.pinned} title={p.pinned ? "Unpin" : "Pin"} onclick={() => store.toggleProjectPinned(p.id)}>{p.pinned ? "★" : "☆"}</button>
              <button class="area-tag" onclick={() => store.openArea(p.area_id)}>◆ {p.area_name}</button>
              {#if p.due_at != null}{@const d = relativeDue(p.due_at)}<span class="due {d.tone}">▦ {d.label}</span>{/if}
              <span class="pill {p.status}">{statusLabel[p.status]}</span>
            </div>
          </div>

          {#if bundle.contacts.length}
            {@const ct = bundle.contacts[0]}
            <button class="contact-row" onclick={() => store.openContact(ct.id, "projects")}>
              <span class="avatar">{(ct.name.trim()[0] || "?").toUpperCase()}</span>
              <span class="c-name">{ct.name.trim() || "Unnamed"}</span>
              <span class="c-role">contact</span>
              {#if bundle.contacts.length > 1}<span class="c-more">+{bundle.contacts.length - 1}</span>{/if}
            </button>
          {/if}

          {#if c.total > 0}
            <div class="bar"><div class="fill" style="width:{pct}%"></div></div>
          {/if}

          <div class="cols">
            <div class="col">
              <div class="col-head">☑ Tasks <span class="c">{c.done}/{c.total}</span></div>
              {#if bundle.tasks.length === 0}
                <p class="empty">No tasks.</p>
              {:else}
                {#each bundle.tasks as t (t.id)}
                  <div class="trow" class:done={t.status === "done"}>
                    <button class="tcheck" onclick={() => store.toggleProjectPreviewTask(p.id, t.id)}>{t.status === "done" ? "☑" : "☐"}</button>
                    <span class="t-name">{t.title || "Untitled"}</span>
                    {#if t.due_at != null && t.status !== "done"}{@const d = relativeDue(t.due_at)}<span class="t-due {d.tone}">{d.label}</span>{/if}
                  </div>
                {/each}
                {#if c.total > bundle.tasks.length}
                  <button class="more" onclick={() => store.openProject(p.id, p.area_id)}>+{c.total - bundle.tasks.length} more</button>
                {/if}
              {/if}
            </div>

            <div class="col">
              <div class="col-head">▤ Notes <span class="c">{bundle.notes.length}</span></div>
              {#if bundle.notes.length === 0}
                <p class="empty">No notes.</p>
              {:else}
                {#each bundle.notes as n (n.id)}
                  <button class="nrow" onclick={() => store.openResource(n.id, "projects")}>
                    <span class="ng">▤</span>
                    <span class="n-name">{displayTitle(n.title, n.content)}</span>
                    <span class="n-ago">{relativeAgo(n.updated_at)}</span>
                  </button>
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
  .view { flex: 1; height: 100%; display: flex; flex-direction: column; background: var(--bg); min-width: 0; --c: var(--proj); }
  .toolbar { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 28px 4px; flex-wrap: wrap; }
  .filters { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
  .chip { font-size: 12px; color: var(--fg-dim); background: var(--bg-inset); border: 1px solid var(--border-soft); border-radius: 8px; padding: 5px 11px; transition: border-color 0.12s, color 0.12s, background 0.12s; }
  .chip:hover { color: var(--fg); border-color: var(--border); }
  .chip.on { color: var(--proj); border-color: var(--proj); background: var(--proj-soft); }
  .selects { display: flex; gap: 6px; flex: 0 0 auto; }
  .selects select { background: var(--bg-inset); color: var(--fg-dim); border: 1px solid var(--border); border-radius: 8px; padding: 5px 8px; font-size: 12px; outline: none; }
  .scroll { flex: 1; overflow-y: auto; padding: 12px 28px 32px; }
  .muted { color: var(--fg-faint); font-size: 12px; padding: 10px 2px; }

  /* compact list */
  .clist { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 2px; }
  .crow-wrap { display: flex; align-items: center; gap: 4px; }
  .crow { flex: 1; min-width: 0; display: flex; align-items: center; gap: 12px; text-align: left; padding: 9px 12px; border-radius: 9px; background: var(--bg-inset); border: 1px solid var(--border-soft); transition: border-color 0.12s, background 0.12s; }
  .crow:hover { border-color: var(--border); background: var(--bg-elev); }
  .cg { color: var(--c); font-size: 11px; flex: 0 0 auto; }
  .cpin { font-size: 12px; color: var(--fg-faint); flex: 0 0 auto; padding: 0 2px; } .cpin:hover { color: var(--res); } .cpin.on { color: var(--res); }
  .cname { flex: 1; min-width: 0; color: var(--fg); font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .crow.done .cname { color: var(--fg-faint); text-decoration: line-through; }
  .carea { font-size: 11px; color: var(--area); flex: 0 0 auto; }
  .ctasks { font-size: 10.5px; color: var(--fg-faint); flex: 0 0 auto; font-variant-numeric: tabular-nums; }
  .cdue { font-size: 10.5px; color: var(--fg-dim); flex: 0 0 auto; min-width: 48px; text-align: right; }
  .cdue.soon { color: var(--accent); } .cdue.over { color: var(--danger); }
  .cpill { font-size: 9.5px; padding: 2px 8px; border-radius: 9px; font-weight: 600; flex: 0 0 auto; }
  .cpill.planned { color: var(--fg-faint); background: var(--bg-elev); }
  .cpill.in_progress { color: var(--proj); background: color-mix(in srgb, var(--proj) 16%, transparent); }
  .cpill.ongoing { color: var(--accent); background: color-mix(in srgb, var(--accent) 16%, transparent); }
  .cpill.done { color: var(--fg-faint); background: var(--bg-elev); }

  .pcard { background: var(--bg-inset); border: 1px solid var(--border); border-radius: 12px; margin-bottom: 16px; overflow: hidden; }
  .p-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 14px 16px 12px; flex-wrap: wrap; }
  .p-name { display: inline-flex; align-items: center; gap: 9px; font-size: 15px; font-weight: 700; color: var(--fg); min-width: 0; }
  .p-name .g { color: var(--c); font-size: 12px; }
  .p-name:hover { color: var(--c); }
  .p-meta { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
  .pcardpin { font-size: 13px; color: var(--fg-faint); padding: 0 2px; } .pcardpin:hover { color: var(--res); } .pcardpin.on { color: var(--res); }
  .area-tag { font-size: 11px; color: var(--area); border: 1px solid color-mix(in srgb, var(--area) 35%, transparent); border-radius: 12px; padding: 3px 9px; }
  .area-tag:hover { background: color-mix(in srgb, var(--area) 12%, transparent); }
  .due { font-size: 11px; color: var(--fg-dim); } .due.soon { color: var(--accent); } .due.over { color: var(--danger); }
  .pill { font-size: 10px; padding: 3px 9px; border-radius: 10px; font-weight: 600; }
  .pill.planned { color: var(--fg-faint); background: var(--bg-elev); }
  .pill.in_progress { color: var(--proj); background: color-mix(in srgb, var(--proj) 16%, transparent); }
  .pill.ongoing { color: var(--accent); background: color-mix(in srgb, var(--accent) 16%, transparent); }
  .pill.done { color: var(--fg-faint); background: var(--bg-elev); }

  .contact-row { display: flex; align-items: center; gap: 9px; margin: 0 16px 12px; padding: 7px 10px; width: calc(100% - 32px); background: var(--bg); border: 1px solid var(--border-soft); border-radius: 8px; text-align: left; }
  .contact-row:hover { border-color: var(--border); }
  .avatar { width: 24px; height: 24px; flex: 0 0 auto; border-radius: 50%; background: var(--bg-elev); border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; color: var(--accent); font-weight: 700; font-size: 11px; }
  .c-name { color: var(--fg); font-size: 12.5px; font-weight: 600; }
  .c-role { color: var(--fg-faint); font-size: 10.5px; }
  .c-more { margin-left: auto; color: var(--fg-faint); font-size: 10.5px; }

  .bar { height: 4px; background: var(--bg-elev); margin: 0 16px 12px; border-radius: 3px; overflow: hidden; }
  .fill { height: 100%; background: var(--accent); border-radius: 3px; transition: width 0.25s; }

  .cols { display: grid; grid-template-columns: 1fr 1fr; border-top: 1px solid var(--border-soft); }
  @media (max-width: 720px) { .cols { grid-template-columns: 1fr; } }
  .col { padding: 12px 14px; }
  .col:first-child { border-right: 1px solid var(--border-soft); }
  .col-head { display: flex; align-items: center; gap: 7px; font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.6px; color: var(--fg-faint); margin-bottom: 8px; font-weight: 600; }
  .empty { font-size: 11.5px; color: var(--fg-faint); padding: 2px; }

  .trow { display: flex; align-items: center; gap: 9px; padding: 6px 8px; border-radius: 7px; }
  .trow:hover { background: var(--bg-elev); }
  .tcheck { color: var(--fg-faint); font-size: 14px; flex: 0 0 auto; }
  .trow.done .tcheck { color: var(--accent); }
  .t-name { flex: 1; min-width: 0; color: var(--fg); font-size: 12.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .trow.done .t-name { color: var(--fg-faint); text-decoration: line-through; }
  .t-due { font-size: 10.5px; color: var(--fg-dim); flex: 0 0 auto; } .t-due.soon { color: var(--accent); } .t-due.over { color: var(--danger); }
  .more { font-size: 11px; color: var(--fg-faint); padding: 5px 8px; } .more:hover { color: var(--fg); }

  .nrow { display: flex; align-items: center; gap: 9px; width: 100%; text-align: left; padding: 6px 8px; border-radius: 7px; }
  .nrow:hover { background: var(--bg-elev); }
  .ng { color: var(--res); font-size: 11px; flex: 0 0 auto; }
  .n-name { flex: 1; min-width: 0; color: var(--fg); font-size: 12.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .n-ago { font-size: 10.5px; color: var(--fg-faint); flex: 0 0 auto; }
</style>
