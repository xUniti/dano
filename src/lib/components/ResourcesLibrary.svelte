<script lang="ts">
  import { store } from "$lib/store.svelte";
  import { relativeAgo } from "$lib/date";
  import PageHeader from "$lib/components/PageHeader.svelte";
  import EmptyState from "$lib/components/EmptyState.svelte";

  let q = $state("");
  // scope: "all" | "inbox" | "__pinned" | area id ; tagFilter: "" (any) | tag
  let scope = $state<string>("all");
  let tagFilter = $state<string>("");
  // sort: column + direction
  let sortCol = $state<"title" | "context" | "modified">("modified");
  let sortDir = $state<"asc" | "desc">("desc");

  function displayTitle(title: string, content: string): string {
    if (title.trim()) return title.trim();
    const first = content.split("\n").find((l) => l.trim());
    return first?.replace(/^#+\s*/, "").trim() || "Untitled";
  }

  function toggleSort(col: "title" | "context" | "modified") {
    if (sortCol === col) { sortDir = sortDir === "asc" ? "desc" : "asc"; }
    else { sortCol = col; sortDir = col === "modified" ? "desc" : "asc"; }
  }
  const arrow = (col: string) => (sortCol === col ? (sortDir === "asc" ? " ↑" : " ↓") : "");

  const rows = $derived.by(() => {
    const term = q.trim().toLowerCase();
    const filtered = store.resourceRows.filter((r) => {
      if (scope === "inbox" && r.linkCount > 0) return false;
      if (scope === "__pinned" && !r.pinned) return false;
      if (scope !== "all" && scope !== "inbox" && scope !== "__pinned" && !r.areaIds.includes(scope)) return false;
      if (tagFilter && !tagList(r.tags).includes(tagFilter)) return false;
      if (term && !(r.title + " " + r.content + " " + r.tags).toLowerCase().includes(term)) return false;
      return true;
    });
    const dir = sortDir === "asc" ? 1 : -1;
    const sorted = [...filtered];
    sorted.sort((a, b) => {
      if (sortCol === "title") return dir * displayTitle(a.title, a.content).localeCompare(displayTitle(b.title, b.content));
      if (sortCol === "context") return dir * a.context.localeCompare(b.context);
      return dir * (a.updated_at - b.updated_at);
    });
    return sorted;
  });

  function tagList(tags: string): string[] {
    return tags.split(",").map((t) => t.trim()).filter(Boolean);
  }
  // All distinct tags across resources (for the tag filter select).
  const allTags = $derived.by(() => {
    const set = new Set<string>();
    for (const r of store.resourceRows) for (const t of tagList(r.tags)) set.add(t);
    return [...set].sort((a, b) => a.localeCompare(b));
  });

  const inboxCount = $derived(store.resourceRows.filter((r) => r.linkCount === 0).length);
  const pinnedCount = $derived(store.resourceRows.filter((r) => r.pinned).length);
</script>

<section class="lib">
  <PageHeader icon="▤" title="Resources" color="var(--res)" count={store.counts.resources} actionLabel="▤ New Note" onAction={() => store.addResource()} />

  <div class="toolbar">
    <div class="filters">
      <select class="fsel" bind:value={scope} title="Filter">
        <option value="all">All ({store.resourceRows.length})</option>
        <option value="inbox">Inbox ({inboxCount})</option>
        {#if pinnedCount > 0}<option value="__pinned">★ Pinned ({pinnedCount})</option>{/if}
        {#each store.areas as a (a.id)}<option value={a.id}>◆ {a.name || "Untitled"}</option>{/each}
      </select>
      {#if allTags.length}
        <select class="fsel" bind:value={tagFilter} title="Filter by tag">
          <option value="">All tags</option>
          {#each allTags as t (t)}<option value={t}># {t}</option>{/each}
        </select>
      {/if}
    </div>
    <input class="search" placeholder="Search…" bind:value={q} />
  </div>

  <div class="scroll">
    {#if store.loading}
      <p class="muted">loading…</p>
    {:else if store.resourceRows.length === 0}
      <EmptyState
        icon="▤" color="var(--res)" title="No resources yet"
        message="Resources are your notes and reference material. Capture anything — link it to a project or area, or leave it in the Inbox."
        actionLabel="▤ New Note" onAction={() => store.addResource()}
      />
    {:else if rows.length === 0}
      <p class="muted">No matches for this filter.</p>
    {:else}
      <div class="table" role="table">
        <div class="thead" role="row">
          <span class="th pin-col"></span>
          <button class="th title-col" onclick={() => toggleSort("title")}>Title{arrow("title")}</button>
          <button class="th ctx-col" onclick={() => toggleSort("context")}>Context{arrow("context")}</button>
          <button class="th mod-col" onclick={() => toggleSort("modified")}>Modified{arrow("modified")}</button>
        </div>
        {#each rows as r (r.id)}
          <div class="trow" role="row">
            <button class="pin-col rpin" class:on={r.pinned} title={r.pinned ? "Unpin" : "Pin"} onclick={() => store.toggleResourcePinned(r.id)}>{r.pinned ? "★" : "☆"}</button>
            <button class="open title-col" onclick={() => store.openResource(r.id, "resources")}>
              <span class="rg">▤</span>
              <span class="rt-wrap">
                <span class="rt">{displayTitle(r.title, r.content)}</span>
                {#if tagList(r.tags).length}
                  <span class="rtags">{#each tagList(r.tags) as t (t)}<span class="rtag">#{t}</span>{/each}</span>
                {/if}
              </span>
            </button>
            <button class="open ctx-col" onclick={() => store.openResource(r.id, "resources")}>
              {#if r.linkCount === 0}
                <span class="tag inbox">Inbox</span>
              {:else}
                <span class="tag link">{r.context}</span>
              {/if}
            </button>
            <button class="open mod-col" onclick={() => store.openResource(r.id, "resources")}>{relativeAgo(r.updated_at)}</button>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</section>

<style>
  .lib { flex: 1; height: 100%; display: flex; flex-direction: column; background: var(--bg); min-width: 0; }

  .toolbar { display: flex; align-items: center; gap: 12px; padding: 12px 28px 8px; flex-wrap: wrap; }
  .filters { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; flex: 1; min-width: 0; }
  .fsel { background: var(--bg-inset); color: var(--fg-dim); border: 1px solid var(--border); border-radius: 8px; padding: 6px 10px; font-size: 12px; outline: none; }
  .fsel:hover { border-color: var(--fg-faint); color: var(--fg); }
  .search { width: 200px; background: var(--bg-inset); border: 1px solid var(--border); border-radius: 8px; padding: 6px 10px; font-size: 12px; color: var(--fg); outline: none; flex: 0 0 auto; }
  .search::placeholder { color: var(--fg-faint); }

  .scroll { flex: 1; overflow-y: auto; padding: 6px 22px 28px; }
  .muted { color: var(--fg-faint); font-size: 12px; padding: 14px 8px; }

  .table { display: flex; flex-direction: column; }
  .thead {
    display: grid; grid-template-columns: 28px 1fr 240px 110px; gap: 12px; align-items: center;
    padding: 6px 12px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.7px;
    color: var(--fg-faint); font-weight: 600; border-bottom: 1px solid var(--border-soft); position: sticky; top: 0;
    background: var(--bg);
  }
  .th { text-align: left; color: var(--fg-faint); font: inherit; text-transform: uppercase; letter-spacing: 0.7px; }
  .th:hover { color: var(--fg); }
  .th.mod-col { text-align: right; }
  .trow {
    display: grid; grid-template-columns: 28px 1fr 240px 110px; gap: 12px; align-items: center;
    width: 100%; border-bottom: 1px solid var(--border-soft); transition: background 0.12s;
  }
  .trow:hover { background: var(--bg-elev); }
  .open { text-align: left; padding: 10px 0; min-width: 0; align-self: stretch; }
  .pin-col { flex: 0 0 auto; }
  .rpin { font-size: 13px; color: var(--fg-faint); padding: 8px 2px; } .rpin:hover { color: var(--res); } .rpin.on { color: var(--res); }
  @media (max-width: 720px) {
    .thead { grid-template-columns: 28px 1fr 90px; }
    .trow { grid-template-columns: 28px 1fr 90px; }
    .ctx-col { display: none; }
  }
  .title-col { display: flex; align-items: center; gap: 9px; }
  .rg { color: var(--res); font-size: 11px; flex: 0 0 auto; }
  .rt-wrap { min-width: 0; display: flex; flex-direction: column; gap: 2px; }
  .rt { color: var(--fg); font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .rtags { display: flex; flex-wrap: wrap; gap: 5px; }
  .rtag { font-size: 9.5px; color: var(--fg-faint); background: var(--bg-elev); border-radius: 5px; padding: 1px 5px; }
  .ctx-col { overflow: hidden; }
  .tag { font-size: 10.5px; padding: 2px 9px; border-radius: 10px; white-space: nowrap; }
  .tag.inbox { color: var(--accent); background: color-mix(in srgb, var(--accent) 14%, transparent); }
  .tag.link { color: var(--fg-dim); background: var(--bg-inset); border: 1px solid var(--border-soft); }
  .mod-col { font-size: 11px; color: var(--fg-faint); text-align: right; font-variant-numeric: tabular-nums; }
</style>
