<script lang="ts">
  import { store } from "$lib/store.svelte";
  import { relativeDue } from "$lib/date";

  const area = $derived(store.activeArea);
  const projects = $derived(area ? (store.projectsByArea[area.id] ?? []) : []);

  function onName(e: Event) {
    if (area) store.renameArea(area.id, (e.target as HTMLInputElement).value);
  }
</script>

{#if area}
  <section class="area-view">
    <header class="head">
      <input class="aname" value={area.name} oninput={onName} placeholder="Area name" />
      <div class="actions">
        <button class="act" onclick={() => store.archiveArea(area.id)}>archive</button>
        <button class="act danger" onclick={() => store.deleteArea(area.id)}>delete</button>
      </div>
    </header>

    <div class="body">
      <div class="p-head">
        <span class="p-title">Projects</span>
        <button class="new" onclick={() => store.addProject(area.id)}>+ project</button>
      </div>

      {#if projects.length === 0}
        <p class="muted">No projects in this area yet.</p>
      {:else}
        <ul class="plist">
          {#each projects as p (p.id)}
            <li>
              <button class="prow" class:done={p.status === "done"} onclick={() => store.openProject(p.id, area.id)}>
                <span class="dot" class:due={p.due_at != null}></span>
                <span class="pname-row">{p.name || "Untitled"}</span>
                {#if p.status === "done"}<span class="tag">done</span>{/if}
                {#if p.due_at != null}
                  {@const due = relativeDue(p.due_at)}
                  <span class="due {due.tone}">{due.label}</span>
                {/if}
              </button>
            </li>
          {/each}
        </ul>
      {/if}

      {#if store.areaTasks.length}
        <div class="tasks-sec">
          <div class="r-head"><span class="r-title-h">All tasks in this area</span></div>
          <ul class="tlist">
            {#each store.areaTasks as t (t.id)}
              <li class="trow" class:done={t.status === "done"}>
                <span class="tbox">{t.status === "done" ? "☑" : "☐"}</span>
                <span class="ttitle">{t.title || "Untitled"}</span>
                <span class="tproj">{t.project_name}</span>
                {#if t.due_at != null && t.status !== "done"}
                  {@const due = relativeDue(t.due_at)}
                  <span class="tdue {due.tone}">{due.label}</span>
                {/if}
              </li>
            {/each}
          </ul>
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
                <button class="rrow" onclick={() => store.openResource(r.id, "area")}>
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
  .area-view { flex: 1; height: 100%; overflow-y: auto; background: var(--bg); min-width: 0; }
  .head { display: flex; align-items: center; gap: 10px; padding: 22px 28px 16px; border-bottom: 1px solid var(--border-soft); }
  .aname {
    flex: 1; min-width: 0; background: transparent; border: none; outline: none;
    font-size: 22px; font-weight: 700; color: var(--fg); padding: 2px 0;
  }
  .aname::placeholder { color: var(--fg-faint); }
  .actions { display: flex; gap: 4px; }
  .act { font-size: 11px; color: var(--fg-faint); padding: 5px 9px; border-radius: var(--radius); border: 1px solid transparent; transition: color 0.12s, border-color 0.12s; }
  .act:hover { color: var(--fg); border-color: var(--border); }
  .act.danger:hover { color: var(--danger); border-color: var(--danger); }

  .body { padding: 18px 28px 28px; max-width: 760px; }
  .p-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
  .p-title { font-weight: 700; font-size: 13px; }
  .new { color: var(--accent); font-size: 12px; padding: 3px 7px; border-radius: var(--radius); transition: background 0.12s; }
  .new:hover { background: var(--bg-elev); }
  .muted { color: var(--fg-faint); font-size: 12px; }

  .plist { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 1px; }
  .prow {
    display: flex; align-items: center; gap: 10px; width: 100%;
    padding: 9px 8px; border-radius: var(--radius); text-align: left; transition: background 0.12s;
  }
  .prow:hover { background: var(--bg-elev); }
  .dot { width: 6px; height: 6px; border-radius: 50%; background: var(--fg-faint); flex: 0 0 auto; }
  .dot.due { background: var(--accent); }
  .pname-row { flex: 1; min-width: 0; color: var(--fg); font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .prow.done .pname-row { color: var(--fg-faint); text-decoration: line-through; }
  .tag { font-size: 9px; color: var(--fg-faint); border: 1px solid var(--border); border-radius: 4px; padding: 0 5px; }
  .due { font-size: 10.5px; color: var(--fg-dim); flex: 0 0 auto; }
  .due.soon { color: var(--accent); }
  .due.over { color: var(--danger); }

  .resources { margin-top: 28px; }
  .tasks-sec { margin-top: 28px; }
  .tlist { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 1px; }
  .trow { display: flex; align-items: center; gap: 9px; padding: 6px 8px; border-radius: var(--radius); }
  .trow:hover { background: var(--bg-elev); }
  .tbox { color: var(--fg-faint); font-size: 14px; flex: 0 0 auto; }
  .trow.done .tbox { color: var(--accent); }
  .ttitle { flex: 1; min-width: 0; color: var(--fg); font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .trow.done .ttitle { color: var(--fg-faint); text-decoration: line-through; }
  .tproj { font-size: 10.5px; color: var(--fg-faint); flex: 0 0 auto; }
  .tdue { font-size: 10.5px; color: var(--fg-dim); flex: 0 0 auto; }
  .tdue.soon { color: var(--accent); }
  .tdue.over { color: var(--danger); }
  .r-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
  .r-title-h { font-weight: 700; font-size: 13px; }
  .rlist { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 1px; }
  .rrow { display: flex; align-items: center; gap: 9px; width: 100%; padding: 7px 8px; border-radius: var(--radius); text-align: left; transition: background 0.12s; }
  .rrow:hover { background: var(--bg-elev); }
  .rg { color: var(--fg-faint); font-size: 11px; width: 14px; text-align: center; flex: 0 0 auto; }
  .rname { flex: 1; min-width: 0; color: var(--fg); font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
</style>
