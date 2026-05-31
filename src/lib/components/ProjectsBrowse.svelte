<script lang="ts">
  import { store } from "$lib/store.svelte";
  import { relativeDue, relativeAgo } from "$lib/date";
  import PageHeader from "$lib/components/PageHeader.svelte";
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
</script>

<section class="view">
  <PageHeader icon="▸" title="Projects" color="var(--proj)" count={store.counts.projects} actionLabel="▸ New Project" onAction={addProject} />

  <div class="scroll">
    {#if store.loading}
      <p class="muted">loading…</p>
    {:else if store.projectPreviews.length === 0}
      <p class="muted">No projects yet. Create one inside an area.</p>
    {:else}
      {#each store.projectPreviews as bundle (bundle.project.id)}
        {@const p = bundle.project}
        {@const c = bundle.taskCounts}
        {@const pct = c.total ? Math.round((c.done / c.total) * 100) : 0}
        <div class="pcard">
          <div class="p-head">
            <button class="p-name" onclick={() => store.openProject(p.id, p.area_id)}>
              <span class="g">▸</span>{p.name || "Untitled"}
            </button>
            <div class="p-meta">
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
  .scroll { flex: 1; overflow-y: auto; padding: 16px 28px 32px; max-width: 1100px; }
  .muted { color: var(--fg-faint); font-size: 12px; padding: 10px 2px; }

  .pcard { background: var(--bg-inset); border: 1px solid var(--border); border-radius: 12px; margin-bottom: 16px; overflow: hidden; }
  .p-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 14px 16px 12px; flex-wrap: wrap; }
  .p-name { display: inline-flex; align-items: center; gap: 9px; font-size: 15px; font-weight: 700; color: var(--fg); min-width: 0; }
  .p-name .g { color: var(--c); font-size: 12px; }
  .p-name:hover { color: var(--c); }
  .p-meta { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
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
