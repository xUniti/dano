<script lang="ts">
  import { store } from "$lib/store.svelte";
  import { theme } from "$lib/theme.svelte";

  function isActiveArea(id: string): boolean {
    return store.view === "area" && store.activeAreaId === id;
  }
  function isActiveProject(id: string): boolean {
    return store.view === "project" && store.activeProjectId === id;
  }
</script>

<aside class="sidebar">
  <div class="brand">
    <span class="prompt">$</span><span class="name">dano</span>
    <span class="cursor"></span>
  </div>

  <nav class="tree">
    <button
      class="row lvl0"
      class:active={store.view === "dashboard"}
      onclick={() => store.openDashboard()}
    >
      <span class="chev"></span>
      <span class="glyph">⌂</span>
      <span class="label">Dashboard</span>
    </button>

    <div class="section-head">
      <span>Areas</span>
      <button class="add" title="New area" onclick={() => store.addArea()}>+</button>
    </div>

    {#each store.areas as area (area.id)}
      <div class="area">
        <div class="row lvl0 cat-row">
          <button
            class="chev"
            class:open={store.expandedAreas[area.id]}
            title="Expand"
            onclick={() => store.toggleArea(area.id)}
          >▸</button>
          <button class="cat-main" class:active={isActiveArea(area.id)} onclick={() => store.openArea(area.id)}>
            <span class="glyph">◆</span>
            <span class="label">{area.name || "Untitled"}</span>
          </button>
          <button class="add" title="New project" onclick={() => store.addProject(area.id)}>+</button>
        </div>

        {#if store.expandedAreas[area.id]}
          {#each store.projectsByArea[area.id] ?? [] as p (p.id)}
            <button
              class="row lvl1 project"
              class:active={isActiveProject(p.id)}
              class:done={p.status === "done"}
              onclick={() => store.openProject(p.id, area.id)}
            >
              <span class="dot" class:due={p.due_at != null}></span>
              <span class="label">{p.name || "Untitled"}</span>
              {#if p.status === "done"}<span class="tag">done</span>{/if}
            </button>
          {/each}
          {#if (store.projectsByArea[area.id] ?? []).length === 0}
            <div class="empty-row">no projects</div>
          {/if}
        {/if}
      </div>
    {/each}
    {#if store.areas.length === 0}
      <div class="empty-row lvl0e">no areas yet — add one</div>
    {/if}

    <button
      class="row lvl0"
      class:active={store.view === "resources" || store.view === "resource"}
      onclick={() => store.openResources()}
    >
      <span class="chev"></span>
      <span class="glyph">▤</span>
      <span class="label">Resources</span>
    </button>

    <button
      class="row lvl0"
      class:active={store.view === "archive"}
      onclick={() => store.openArchive()}
    >
      <span class="chev"></span>
      <span class="glyph">#</span>
      <span class="label">Archive</span>
    </button>
  </nav>

  <div class="foot">
    <button class="theme" onclick={() => theme.toggle()} title="Toggle theme">
      <span class="glyph">{theme.value === "dark" ? "☾" : "☀"}</span>
      <span class="label">{theme.value === "dark" ? "Dark" : "Light"}</span>
    </button>
    <div class="version">v0.3 · xUniti</div>
  </div>
</aside>

<style>
  .sidebar {
    width: var(--sidebar-w); flex: 0 0 var(--sidebar-w); height: 100%;
    display: flex; flex-direction: column;
    background: var(--bg-inset); border-right: 1px solid var(--border); overflow: hidden;
  }
  .brand {
    display: flex; align-items: center; gap: 6px;
    padding: 16px 16px 12px; font-size: 15px; font-weight: 700; letter-spacing: 0.5px;
  }
  .brand .prompt { color: var(--accent); }
  .brand .cursor { width: 8px; height: 15px; background: var(--accent); animation: blink 1.1s steps(1) infinite; }
  @keyframes blink { 50% { opacity: 0; } }

  .tree { flex: 1; overflow-y: auto; padding: 2px 8px 8px; }

  .section-head {
    display: flex; align-items: center; justify-content: space-between;
    padding: 12px 9px 4px; font-size: 10px; letter-spacing: 0.8px;
    text-transform: uppercase; color: var(--fg-faint);
  }

  .row {
    display: flex; align-items: center; gap: 8px; width: 100%;
    padding: 6px 8px; border-radius: var(--radius);
    color: var(--fg-dim); text-align: left;
    transition: background 0.12s, color 0.12s;
  }
  .row:hover { background: var(--bg-elev); color: var(--fg); }
  .row.active { background: var(--bg-elev); color: var(--fg); }
  .row.active .glyph { color: var(--accent); }

  .cat-row { padding: 0; gap: 0; }
  .cat-row > .chev { margin-left: 6px; border-radius: var(--radius); }
  .cat-row > .chev:hover { background: var(--bg-elev); color: var(--fg); }
  .cat-main {
    display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0;
    padding: 6px 8px; border-radius: var(--radius); color: var(--fg-dim);
    text-align: left; transition: background 0.12s, color 0.12s;
  }
  .cat-main:hover { background: var(--bg-elev); color: var(--fg); }
  .cat-main.active { background: var(--bg-elev); color: var(--fg); }
  .cat-main.active .glyph { color: var(--accent); }

  .chev {
    display: inline-flex; justify-content: center; align-items: center;
    width: 12px; height: 16px; font-size: 9px; color: var(--fg-faint);
    transition: transform 0.12s; flex: 0 0 auto;
  }
  .chev.open { transform: rotate(90deg); }

  .glyph { display: inline-flex; justify-content: center; width: 14px; color: var(--fg-faint); font-size: 11px; }
  .label { flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

  .add {
    width: 24px; color: var(--fg-faint); font-size: 15px;
    border-radius: var(--radius); transition: background 0.12s, color 0.12s; flex: 0 0 auto;
  }
  .add:hover { background: var(--bg-elev); color: var(--accent); }

  .project { padding-left: 28px; }
  .project .dot { width: 5px; height: 5px; border-radius: 50%; background: var(--fg-faint); flex: 0 0 auto; }
  .project .dot.due { background: var(--accent); }
  .project.active .label { color: var(--accent); }
  .project.done .label { color: var(--fg-faint); text-decoration: line-through; }

  .tag { font-size: 9px; color: var(--fg-faint); border: 1px solid var(--border); border-radius: 4px; padding: 0 4px; flex: 0 0 auto; }

  .empty-row { padding: 5px 8px 5px 32px; font-size: 10.5px; color: var(--fg-faint); }
  .empty-row.lvl0e { padding-left: 12px; }

  .foot { padding: 8px; border-top: 1px solid var(--border-soft); }
  .theme {
    display: flex; align-items: center; gap: 10px; width: 100%;
    padding: 7px 9px; border-radius: var(--radius); color: var(--fg-dim);
    text-align: left; transition: background 0.12s, color 0.12s;
  }
  .theme:hover { background: var(--bg-elev); color: var(--fg); }
  .version { padding: 8px 9px 4px; font-size: 10px; color: var(--fg-faint); letter-spacing: 0.4px; }
</style>
