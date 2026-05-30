<script lang="ts">
  import { store } from "$lib/store.svelte";

  function displayTitle(title: string, content: string): string {
    if (title.trim()) return title.trim();
    const first = content.split("\n").find((l) => l.trim());
    return first?.replace(/^#+\s*/, "").trim() || "Untitled";
  }
</script>

<section class="arch">
  <header class="head"><h1>Archive</h1><p class="sub">Finished items, kept for reference.</p></header>

  <div class="scroll">
    {#if store.loading}
      <p class="muted">loading…</p>
    {:else}
      <div class="group">
        <div class="g-head">Areas <span class="c">{store.archive.areas.length}</span></div>
        {#if store.archive.areas.length === 0}<p class="muted">none</p>{/if}
        {#each store.archive.areas as a (a.id)}
          <div class="row">
            <span class="glyph">◆</span>
            <span class="r-title">{a.name || "Untitled"}</span>
            <button class="restore" onclick={() => store.unarchiveArea(a.id)}>restore</button>
          </div>
        {/each}
      </div>

      <div class="group">
        <div class="g-head">Projects <span class="c">{store.archive.projects.length}</span></div>
        {#if store.archive.projects.length === 0}<p class="muted">none</p>{/if}
        {#each store.archive.projects as p (p.id)}
          <div class="row">
            <span class="glyph">▸</span>
            <span class="r-title">{p.name || "Untitled"}</span>
            <span class="ctx">{p.area_name}</span>
            <button class="restore" onclick={() => store.unarchiveProject(p.id)}>restore</button>
          </div>
        {/each}
      </div>

      <div class="group">
        <div class="g-head">Resources <span class="c">{store.archive.resources.length}</span></div>
        {#if store.archive.resources.length === 0}<p class="muted">none</p>{/if}
        {#each store.archive.resources as r (r.id)}
          <div class="row">
            <span class="glyph">▤</span>
            <span class="r-title">{displayTitle(r.title, r.content)}</span>
            <button class="restore" onclick={() => store.unarchiveResource(r.id)}>restore</button>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</section>

<style>
  .arch { flex: 1; height: 100%; display: flex; flex-direction: column; background: var(--bg); min-width: 0; }
  .head { padding: 22px 28px 14px; border-bottom: 1px solid var(--border-soft); }
  h1 { margin: 0; font-size: 22px; font-weight: 700; color: var(--fg); }
  .sub { margin: 2px 0 0; color: var(--fg-faint); font-size: 12px; }
  .scroll { flex: 1; overflow-y: auto; padding: 16px 28px 28px; max-width: 760px; }
  .group { margin-bottom: 22px; }
  .g-head { font-size: 11px; text-transform: uppercase; letter-spacing: 0.7px; color: var(--fg-faint); margin-bottom: 6px; }
  .g-head .c { border: 1px solid var(--border); border-radius: 8px; padding: 0 6px; margin-left: 4px; }
  .muted { color: var(--fg-faint); font-size: 12px; margin: 2px 0 0; }
  .row { display: flex; align-items: center; gap: 10px; padding: 8px 8px; border-radius: var(--radius); }
  .row:hover { background: var(--bg-elev); }
  .glyph { color: var(--fg-faint); font-size: 11px; width: 14px; text-align: center; }
  .r-title { flex: 1; min-width: 0; color: var(--fg); font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .ctx { color: var(--fg-faint); font-size: 10.5px; }
  .restore { color: var(--accent); font-size: 11px; padding: 4px 9px; border-radius: var(--radius); }
  .restore:hover { background: var(--bg); border: 1px solid var(--border); }
</style>
