<script lang="ts">
  import { store } from "$lib/store.svelte";
  import { theme } from "$lib/theme.svelte";

  const nav = $derived(store.view);
</script>

<aside class="sidebar">
  <div class="brand">
    <span class="prompt">$</span><span class="name">dano</span>
    <span class="cursor"></span>
  </div>

  <nav class="nav">
    <button class="row" class:active={nav === "dashboard"} onclick={() => store.openDashboard()}>
      <span class="glyph">▦</span><span class="label">Dashboard</span>
    </button>
    <button class="row" class:active={nav === "calendar"} onclick={() => store.openCalendar()}>
      <span class="glyph">▣</span><span class="label">Calendar</span>
    </button>
    <button class="row" class:active={nav === "search"} onclick={() => store.openSearch()}>
      <span class="glyph">⌕</span><span class="label">Search</span>
    </button>

    <div class="section-head">
      <span>PARA</span>
      <button class="add" title="New area" onclick={() => store.addArea()}>+</button>
    </div>

    <button class="row para proj" class:active={nav === "projects" || nav === "project"} onclick={() => store.openProjects()}>
      <span class="glyph">▸</span><span class="label">Projects</span>
      <span class="count">{store.counts.projects}</span>
    </button>
    <button class="row para area" class:active={nav === "areas" || nav === "area"} onclick={() => store.openAreasList()}>
      <span class="glyph">◆</span><span class="label">Areas</span>
      <span class="count">{store.counts.areas}</span>
    </button>
    <button class="row para res" class:active={nav === "resources" || nav === "resource"} onclick={() => store.openResources()}>
      <span class="glyph">▤</span><span class="label">Resources</span>
      <span class="count">{store.counts.resources}</span>
    </button>
    <button class="row para arch" class:active={nav === "archive"} onclick={() => store.openArchive()}>
      <span class="glyph">▥</span><span class="label">Archive</span>
      <span class="count">{store.counts.archive}</span>
    </button>

    <div class="section-head"><span>People</span></div>
    <button class="row" class:active={nav === "contacts" || nav === "contact"} onclick={() => store.openContacts()}>
      <span class="glyph">☻</span><span class="label">Contacts</span>
    </button>
  </nav>

  <div class="foot">
    <button class="theme" onclick={() => theme.toggle()} title="Toggle theme">
      <span class="glyph">{theme.value === "dark" ? "☾" : "☀"}</span>
      <span class="label">{theme.value === "dark" ? "Dark" : "Light"}</span>
    </button>
    <div class="version">v0.4 · xUniti</div>
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
    padding: 18px 18px 14px; font-family: var(--font-mono);
    font-size: 15px; font-weight: 700; letter-spacing: 0.5px;
  }
  .brand .prompt { color: var(--accent); }
  .brand .cursor { width: 8px; height: 15px; background: var(--accent); animation: blink 1.1s steps(1) infinite; }
  @keyframes blink { 50% { opacity: 0; } }

  .nav { flex: 1; overflow-y: auto; padding: 2px 10px 8px; }

  .section-head {
    display: flex; align-items: center; justify-content: space-between;
    padding: 16px 8px 6px; font-size: 10px; letter-spacing: 0.9px;
    text-transform: uppercase; color: var(--fg-faint); font-weight: 600;
  }

  .row {
    display: flex; align-items: center; gap: 10px; width: 100%;
    padding: 7px 9px; border-radius: 8px; margin-bottom: 1px;
    color: var(--fg-dim); text-align: left;
    transition: background 0.12s, color 0.12s;
  }
  .row:hover { background: var(--bg-elev); color: var(--fg); }
  .row.active { background: var(--bg-elev); color: var(--fg); }

  .glyph { display: inline-flex; justify-content: center; width: 16px; color: var(--fg-faint); font-size: 12px; flex: 0 0 auto; }
  .label { flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 13px; }

  .count {
    flex: 0 0 auto; min-width: 20px; text-align: center; font-size: 10.5px;
    color: var(--fg-faint); background: var(--bg); border: 1px solid var(--border);
    border-radius: 10px; padding: 0 6px; font-variant-numeric: tabular-nums;
  }

  .para .glyph { color: var(--c); }
  .para.proj { --c: var(--proj); }
  .para.area { --c: var(--area); }
  .para.res { --c: var(--res); }
  .para.arch { --c: var(--arch); }
  .para.active { background: color-mix(in srgb, var(--c) 12%, transparent); }
  .para.active .count { color: var(--c); border-color: var(--c); }

  .add {
    width: 22px; height: 22px; color: var(--fg-faint); font-size: 15px;
    border-radius: 6px; transition: background 0.12s, color 0.12s; flex: 0 0 auto;
  }
  .add:hover { background: var(--bg-elev); color: var(--accent); }

  .foot { padding: 10px; border-top: 1px solid var(--border-soft); }
  .theme {
    display: flex; align-items: center; gap: 10px; width: 100%;
    padding: 7px 9px; border-radius: 8px; color: var(--fg-dim);
    text-align: left; transition: background 0.12s, color 0.12s;
  }
  .theme:hover { background: var(--bg-elev); color: var(--fg); }
  .version { padding: 8px 9px 4px; font-family: var(--font-mono); font-size: 10px; color: var(--fg-faint); letter-spacing: 0.4px; }
</style>
