<script lang="ts">
  import { store } from "$lib/store.svelte";
  import { relativeDue, relativeAgo } from "$lib/date";
  import EmptyState from "$lib/components/EmptyState.svelte";

  let capture = $state("");
  let filterOpen = $state(false);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  })();
  const today = new Date().toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });

  function displayTitle(title: string, content = ""): string {
    if (title.trim()) return title.trim();
    const first = content.split("\n").find((l) => l.trim());
    return first?.replace(/^#+\s*/, "").trim() || "Untitled";
  }

  async function submitCapture(e: KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      await store.quickCapture(capture);
      capture = "";
    }
  }

  const filterName = $derived(
    store.dashFilterArea ? (store.areas.find((a) => a.id === store.dashFilterArea)?.name ?? "Filter") : "Filter",
  );
  const shownProjects = $derived(
    store.dashFilterArea
      ? store.dashboard.activeProjects.filter((p) => p.area_id === store.dashFilterArea)
      : store.dashboard.activeProjects,
  );

  const recentGlyph = (k: string) => (k === "resource" ? "▤" : k === "project" ? "▸" : "◆");

  // True when the user has no content at all (fresh install).
  const isFresh = $derived(
    store.counts.projects === 0 && store.counts.areas === 0 &&
    store.counts.resources === 0 && store.counts.archive === 0,
  );
</script>

<section class="dash">
  <header class="top">
    <div>
      <h1>{greeting}.</h1>
      <p class="date">{today}</p>
    </div>
    <div class="top-actions">
      <button class="btn" onclick={() => store.newNote()}><span class="bi">＋</span> New Note</button>
      <div class="filter-wrap">
        <button class="btn ghost" class:on={store.dashFilterArea} onclick={() => (filterOpen = !filterOpen)}>
          <span class="bi">≡</span> {filterName}
        </button>
        {#if filterOpen}
          <div class="filter-menu">
            <button class="fitem" onclick={() => { store.dashFilterArea = null; filterOpen = false; }}>All areas</button>
            {#each store.areas as a (a.id)}
              <button class="fitem" onclick={() => { store.dashFilterArea = a.id; filterOpen = false; }}>{a.name || "Untitled"}</button>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  </header>

  <div class="capture">
    <span class="caret">›</span>
    <input class="capture-in" placeholder="Quick capture — type and press Enter…" bind:value={capture} onkeydown={submitCapture} />
  </div>

  {#if isFresh}
    <EmptyState
      icon="◆" color="var(--area)" title="Welcome to DANO"
      message="Start by creating an Area — a part of your life like Health, Work, or Finance. Then add projects and notes inside it."
      actionLabel="◆ Create your first Area" onAction={() => store.addArea()}
    />
  {:else}
  <div class="stats">
    <button class="stat proj" onclick={() => store.openProjects()}>
      <span class="s-ico">▸</span><span class="s-num">{store.counts.projects}</span><span class="s-lbl">Projects</span>
    </button>
    <button class="stat area" onclick={() => store.openAreasList()}>
      <span class="s-ico">◆</span><span class="s-num">{store.counts.areas}</span><span class="s-lbl">Areas</span>
    </button>
    <button class="stat res" onclick={() => store.openResources()}>
      <span class="s-ico">▤</span><span class="s-num">{store.counts.resources}</span><span class="s-lbl">Resources</span>
    </button>
    <button class="stat arch" onclick={() => store.openArchive()}>
      <span class="s-ico">▥</span><span class="s-num">{store.counts.archive}</span><span class="s-lbl">Archive</span>
    </button>
    <button class="stat inbox" onclick={() => {}}>
      <span class="s-ico">⌖</span><span class="s-num">{store.counts.inbox}</span><span class="s-lbl">In Inbox</span>
    </button>
  </div>

  <div class="grid">
    <!-- Projects -->
    <div class="card proj">
      <button class="card-head" onclick={() => store.openProjects()}>
        <span class="ch-title"><span class="cd"></span>Projects</span>
        <span class="ch-sub">Has a goal &amp; deadline</span>
        <span class="ch-count">{shownProjects.length}</span>
      </button>
      {#if shownProjects.length === 0}
        <p class="muted">No active projects.</p>
      {:else}
        <ul class="list">
          {#each shownProjects.slice(0, 5) as p (p.id)}
            <li><button class="item" onclick={() => store.openProject(p.id, p.area_id)}>
              <span class="it-name">{p.name || "Untitled"}</span>
              <span class="it-tag">{p.area_name}</span>
              {#if p.due_at != null}{@const d = relativeDue(p.due_at)}<span class="it-due {d.tone}">{d.label}</span>{/if}
            </button></li>
          {/each}
        </ul>
      {/if}
    </div>

    <!-- Areas -->
    <div class="card area">
      <button class="card-head" onclick={() => store.openAreasList()}>
        <span class="ch-title"><span class="cd"></span>Areas</span>
        <span class="ch-sub">Ongoing responsibility</span>
        <span class="ch-count">{store.counts.areas}</span>
      </button>
      {#if store.areas.length === 0}
        <p class="muted">No areas yet.</p>
      {:else}
        <ul class="list">
          {#each store.areas.slice(0, 5) as a (a.id)}
            <li><button class="item" onclick={() => store.openArea(a.id)}>
              <span class="it-name">{a.name || "Untitled"}</span>
            </button></li>
          {/each}
        </ul>
      {/if}
    </div>

    <!-- Resources -->
    <div class="card res">
      <button class="card-head" onclick={() => store.openResources()}>
        <span class="ch-title"><span class="cd"></span>Resources</span>
        <span class="ch-sub">Topics of interest</span>
        <span class="ch-count">{store.counts.resources}</span>
      </button>
      {#if store.dashboard.resources.length === 0}
        <p class="muted">No resources yet.</p>
      {:else}
        <ul class="list">
          {#each store.dashboard.resources as r (r.id)}
            <li><button class="item" onclick={() => store.openResource(r.id, "dashboard")}>
              <span class="it-name">{displayTitle(r.title, r.content)}</span>
            </button></li>
          {/each}
        </ul>
      {/if}
    </div>

    <!-- Archive -->
    <div class="card arch">
      <button class="card-head" onclick={() => store.openArchive()}>
        <span class="ch-title"><span class="cd"></span>Archive</span>
        <span class="ch-sub">Completed or inactive</span>
        <span class="ch-count">{store.counts.archive}</span>
      </button>
      {#if store.dashboard.archived.length === 0}
        <p class="muted">Nothing archived.</p>
      {:else}
        <ul class="list">
          {#each store.dashboard.archived as a (a.kind + a.id)}
            <li><button class="item" onclick={() => store.openArchive()}>
              <span class="it-name">{a.title || "Untitled"}</span>
              <span class="it-tag">{a.context}</span>
            </button></li>
          {/each}
        </ul>
      {/if}
    </div>

    <!-- Inbox -->
    <div class="card inbox">
      <button class="card-head" onclick={() => {}}>
        <span class="ch-title"><span class="cd"></span>Inbox</span>
        <span class="ch-sub">Unprocessed captures</span>
        <span class="ch-count">{store.dashboard.inbox.length}</span>
      </button>
      {#if store.dashboard.inbox.length === 0}
        <p class="muted">No unprocessed captures. Nice.</p>
      {:else}
        <ul class="list">
          {#each store.dashboard.inbox as r (r.id)}
            <li><button class="item" onclick={() => store.openResource(r.id, "dashboard")}>
              <span class="it-name">{displayTitle(r.title, r.content)}</span>
              <span class="it-due">{relativeAgo(r.updated_at)}</span>
            </button></li>
          {/each}
        </ul>
      {/if}
    </div>

    <!-- Recently edited -->
    <div class="card recent">
      <div class="card-head static">
        <span class="ch-title"><span class="cd clock">◷</span>Recently edited</span>
      </div>
      {#if store.dashboard.recent.length === 0}
        <p class="muted">Nothing yet.</p>
      {:else}
        <ul class="list">
          {#each store.dashboard.recent as it (it.kind + it.id)}
            <li><button class="item" onclick={() => store.openHit(it)}>
              <span class="rg {it.kind}">{recentGlyph(it.kind)}</span>
              <span class="it-name">{it.title || "Untitled"}</span>
              <span class="it-tag">{it.context}</span>
              <span class="it-due">{relativeAgo(it.updated_at)}</span>
            </button></li>
          {/each}
        </ul>
      {/if}
    </div>
  </div>
  {/if}
</section>

<style>
  .dash { flex: 1; height: 100%; overflow-y: auto; background: var(--bg); padding: 26px 30px 40px; min-width: 0; }
  .top { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 18px; }
  h1 { margin: 0; font-size: 24px; font-weight: 700; color: var(--fg); letter-spacing: -0.3px; }
  .date { margin: 3px 0 0; color: var(--fg-faint); font-size: 12.5px; }
  .top-actions { display: flex; gap: 8px; align-items: center; }
  .btn { display: inline-flex; align-items: center; gap: 7px; font-size: 12.5px; color: var(--fg); background: var(--bg-inset); border: 1px solid var(--border); border-radius: 8px; padding: 7px 12px; transition: background 0.12s, border-color 0.12s; }
  .btn:hover { background: var(--bg-elev); }
  .btn .bi { color: var(--accent); font-size: 13px; }
  .btn.ghost { color: var(--fg-dim); }
  .btn.ghost .bi { color: var(--fg-faint); }
  .btn.ghost.on { color: var(--fg); border-color: var(--fg-faint); }
  .filter-wrap { position: relative; }
  .filter-menu { position: absolute; top: calc(100% + 4px); right: 0; z-index: 30; min-width: 180px; background: var(--bg-inset); border: 1px solid var(--border); border-radius: 8px; padding: 4px; box-shadow: 0 12px 32px rgba(0,0,0,0.3); display: flex; flex-direction: column; max-height: 300px; overflow-y: auto; }
  .fitem { text-align: left; font-size: 12.5px; color: var(--fg-dim); padding: 7px 10px; border-radius: 6px; }
  .fitem:hover { background: var(--bg-elev); color: var(--fg); }

  .capture { display: flex; align-items: center; gap: 10px; padding: 12px 16px; margin-bottom: 18px; background: var(--bg-inset); border: 1px solid var(--border); border-radius: 10px; }
  .capture .caret { color: var(--accent); font-weight: 700; }
  .capture-in { flex: 1; background: transparent; border: none; outline: none; color: var(--fg); font-size: 13.5px; }
  .capture-in::placeholder { color: var(--fg-faint); }

  .stats { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; margin-bottom: 18px; }
  @media (max-width: 900px) { .stats { grid-template-columns: repeat(2, 1fr); } }
  .stat { --c: var(--fg-faint); display: grid; grid-template-columns: auto 1fr; grid-template-rows: auto auto; column-gap: 10px; align-items: center; text-align: left; padding: 14px 16px; background: var(--bg-inset); border: 1px solid var(--border); border-radius: 12px; transition: border-color 0.12s, background 0.12s; }
  .stat:hover { border-color: var(--c); }
  .stat.proj { --c: var(--proj); } .stat.area { --c: var(--area); }
  .stat.res { --c: var(--res); } .stat.arch { --c: var(--arch); } .stat.inbox { --c: var(--accent); }
  .s-ico { grid-row: 1 / 3; width: 30px; height: 30px; display: inline-flex; align-items: center; justify-content: center; border-radius: 8px; color: var(--c); background: color-mix(in srgb, var(--c) 14%, transparent); font-size: 13px; }
  .s-num { font-size: 22px; font-weight: 700; color: var(--fg); line-height: 1; }
  .s-lbl { font-size: 11px; color: var(--fg-faint); }

  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  @media (max-width: 900px) { .grid { grid-template-columns: 1fr; } }
  .card { --c: var(--fg-faint); background: var(--bg-inset); border: 1px solid var(--border); border-radius: 12px; padding: 6px; }
  .card.proj { --c: var(--proj); } .card.area { --c: var(--area); }
  .card.res { --c: var(--res); } .card.arch { --c: var(--arch); } .card.inbox { --c: var(--accent); } .card.recent { --c: var(--fg-dim); }
  .card-head { display: flex; align-items: center; gap: 8px; width: 100%; text-align: left; padding: 10px 12px 8px; border-radius: 8px; }
  .card-head:not(.static):hover { background: var(--bg-elev); }
  .ch-title { display: inline-flex; align-items: center; gap: 8px; font-weight: 700; font-size: 13.5px; color: var(--fg); }
  .cd { width: 8px; height: 8px; border-radius: 3px; background: var(--c); }
  .cd.clock { width: auto; height: auto; background: none; color: var(--fg-faint); font-size: 12px; }
  .ch-sub { flex: 1; color: var(--fg-faint); font-size: 11px; }
  .ch-count { font-size: 11px; color: var(--fg-faint); border: 1px solid var(--border); border-radius: 10px; padding: 0 7px; }

  .list { list-style: none; margin: 0; padding: 2px; display: flex; flex-direction: column; gap: 1px; }
  .item { display: flex; align-items: center; gap: 9px; width: 100%; text-align: left; padding: 8px 10px; border-radius: 7px; transition: background 0.12s; }
  .item:hover { background: var(--bg-elev); }
  .it-name { flex: 1; min-width: 0; color: var(--fg); font-size: 12.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .it-tag { font-size: 10.5px; color: var(--fg-faint); flex: 0 0 auto; }
  .it-due { font-size: 10.5px; color: var(--fg-dim); flex: 0 0 auto; min-width: 46px; text-align: right; }
  .it-due.soon { color: var(--accent); } .it-due.over { color: var(--danger); }
  .rg { width: 14px; text-align: center; flex: 0 0 auto; font-size: 11px; color: var(--fg-faint); }
  .rg.resource { color: var(--res); } .rg.project { color: var(--proj); } .rg.area { color: var(--area); }
  .muted { color: var(--fg-faint); font-size: 12px; padding: 4px 12px 10px; }
</style>
