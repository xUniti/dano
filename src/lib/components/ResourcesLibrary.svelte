<script lang="ts">
  import { store } from "$lib/store.svelte";
  import { relativeAgo } from "$lib/date";
  import PageHeader from "$lib/components/PageHeader.svelte";

  let q = $state("");
  // filter: "all" | "inbox" | area id
  let filter = $state<string>("all");

  function displayTitle(title: string, content: string): string {
    if (title.trim()) return title.trim();
    const first = content.split("\n").find((l) => l.trim());
    return first?.replace(/^#+\s*/, "").trim() || "Untitled";
  }

  const rows = $derived.by(() => {
    const term = q.trim().toLowerCase();
    return store.resourceRows.filter((r) => {
      if (filter === "inbox" && r.linkCount > 0) return false;
      if (filter !== "all" && filter !== "inbox" && !r.areaIds.includes(filter)) return false;
      if (term && !(r.title + " " + r.content).toLowerCase().includes(term)) return false;
      return true;
    });
  });

  const inboxCount = $derived(store.resourceRows.filter((r) => r.linkCount === 0).length);
</script>

<section class="lib">
  <PageHeader icon="▤" title="Resources" color="var(--res)" count={store.counts.resources} actionLabel="▤ New Note" onAction={() => store.addResource()} />

  <div class="toolbar">
    <div class="filters">
      <button class="chip" class:on={filter === "all"} onclick={() => (filter = "all")}>All <span class="n">{store.resourceRows.length}</span></button>
      <button class="chip" class:on={filter === "inbox"} onclick={() => (filter = "inbox")}>Inbox <span class="n">{inboxCount}</span></button>
      {#each store.areas as a (a.id)}
        <button class="chip area" class:on={filter === a.id} onclick={() => (filter = a.id)}>◆ {a.name || "Untitled"}</button>
      {/each}
    </div>
    <input class="search" placeholder="Search…" bind:value={q} />
  </div>

  <div class="scroll">
    {#if store.loading}
      <p class="muted">loading…</p>
    {:else if rows.length === 0}
      <p class="muted">{q.trim() || filter !== "all" ? "No matches for this filter." : "No resources yet. Create one."}</p>
    {:else}
      <div class="table" role="table">
        <div class="thead" role="row">
          <span class="th title-col">Title</span>
          <span class="th ctx-col">Context</span>
          <span class="th mod-col">Modified</span>
        </div>
        {#each rows as r (r.id)}
          <button class="trow" role="row" onclick={() => store.openResource(r.id, "resources")}>
            <span class="td title-col">
              <span class="rg">▤</span>
              <span class="rt">{displayTitle(r.title, r.content)}</span>
            </span>
            <span class="td ctx-col">
              {#if r.linkCount === 0}
                <span class="tag inbox">Inbox</span>
              {:else}
                <span class="tag link">{r.context}</span>
              {/if}
            </span>
            <span class="td mod-col">{relativeAgo(r.updated_at)}</span>
          </button>
        {/each}
      </div>
    {/if}
  </div>
</section>

<style>
  .lib { flex: 1; height: 100%; display: flex; flex-direction: column; background: var(--bg); min-width: 0; }

  .toolbar { display: flex; align-items: center; gap: 12px; padding: 12px 28px 8px; flex-wrap: wrap; }
  .filters { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; flex: 1; min-width: 0; }
  .chip {
    display: inline-flex; align-items: center; gap: 6px; font-size: 12px; color: var(--fg-dim);
    background: var(--bg-inset); border: 1px solid var(--border-soft); border-radius: 8px; padding: 5px 11px;
    transition: border-color 0.12s, color 0.12s, background 0.12s;
  }
  .chip:hover { color: var(--fg); border-color: var(--border); }
  .chip.on { color: var(--fg); border-color: var(--res); background: var(--res-soft); }
  .chip.area.on { border-color: var(--area); background: color-mix(in srgb, var(--area) 12%, transparent); color: var(--area); }
  .chip .n { font-size: 10.5px; color: var(--fg-faint); font-variant-numeric: tabular-nums; }
  .chip.on .n { color: inherit; }
  .search { width: 200px; background: var(--bg-inset); border: 1px solid var(--border); border-radius: 8px; padding: 6px 10px; font-size: 12px; color: var(--fg); outline: none; flex: 0 0 auto; }
  .search::placeholder { color: var(--fg-faint); }

  .scroll { flex: 1; overflow-y: auto; padding: 6px 22px 28px; }
  .muted { color: var(--fg-faint); font-size: 12px; padding: 14px 8px; }

  .table { display: flex; flex-direction: column; }
  .thead {
    display: grid; grid-template-columns: 1fr 240px 110px; gap: 16px; align-items: center;
    padding: 6px 12px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.7px;
    color: var(--fg-faint); font-weight: 600; border-bottom: 1px solid var(--border-soft); position: sticky; top: 0;
    background: var(--bg);
  }
  .trow {
    display: grid; grid-template-columns: 1fr 240px 110px; gap: 16px; align-items: center;
    width: 100%; text-align: left; padding: 10px 12px; border-bottom: 1px solid var(--border-soft);
    transition: background 0.12s;
  }
  .trow:hover { background: var(--bg-elev); }
  @media (max-width: 720px) {
    .thead { grid-template-columns: 1fr 90px; }
    .trow { grid-template-columns: 1fr 90px; }
    .ctx-col { display: none; }
  }
  .td { min-width: 0; }
  .title-col { display: flex; align-items: center; gap: 9px; }
  .rg { color: var(--res); font-size: 11px; flex: 0 0 auto; }
  .rt { color: var(--fg); font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .ctx-col { overflow: hidden; }
  .tag { font-size: 10.5px; padding: 2px 9px; border-radius: 10px; white-space: nowrap; }
  .tag.inbox { color: var(--accent); background: color-mix(in srgb, var(--accent) 14%, transparent); }
  .tag.link { color: var(--fg-dim); background: var(--bg-inset); border: 1px solid var(--border-soft); }
  .mod-col { font-size: 11px; color: var(--fg-faint); text-align: right; font-variant-numeric: tabular-nums; }
</style>
