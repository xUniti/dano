<script lang="ts">
  import { store } from "$lib/store.svelte";
  import PageHeader from "$lib/components/PageHeader.svelte";

  let q = $state(store.searchQuery);
  let timer: ReturnType<typeof setTimeout> | null = null;

  function onInput(e: Event) {
    q = (e.target as HTMLInputElement).value;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => store.doSearch(q), 180);
  }

  const glyph = (k: string) =>
    k === "resource" ? "▤" : k === "project" ? "▸" : k === "area" ? "◆" : k === "task" ? "□" : "☻";
  const kindLabel = (k: string) =>
    k === "resource" ? "Resource" : k === "project" ? "Project" : k === "area" ? "Area" : k === "task" ? "Task" : "Contact";
</script>

<section class="view">
  <PageHeader icon="⌕" title="Search" color="var(--fg-dim)" />
  <div class="head">
    <div class="search-box">
      <span class="ico">⌕</span>
      <!-- svelte-ignore a11y_autofocus -->
      <input
        class="search"
        placeholder="Search everything…"
        value={q}
        oninput={onInput}
        autofocus
      />
    </div>
  </div>

  <div class="scroll">
    {#if store.searchQuery.trim().length < 2}
      <p class="muted">Type at least two characters to search across projects, areas, resources, tasks and contacts.</p>
    {:else if store.searchHits.length === 0}
      <p class="muted">No matches for “{store.searchQuery.trim()}”.</p>
    {:else}
      <ul class="list">
        {#each store.searchHits as h (h.kind + h.id)}
          <li>
            <button class="row" onclick={() => store.openHit(h)}>
              <span class="g {h.kind}">{glyph(h.kind)}</span>
              <span class="main">
                <span class="name">{h.title || "Untitled"}</span>
                <span class="ctx">{h.context}</span>
              </span>
              <span class="kind">{kindLabel(h.kind)}</span>
            </button>
          </li>
        {/each}
      </ul>
    {/if}
  </div>
</section>

<style>
  .view { flex: 1; height: 100%; display: flex; flex-direction: column; background: var(--bg); min-width: 0; }
  .head { padding: 14px 28px 16px; }
  .search-box { display: flex; align-items: center; gap: 10px; background: var(--bg-inset); border: 1px solid var(--border); border-radius: 10px; padding: 10px 14px; max-width: 620px; }
  .ico { color: var(--fg-faint); font-size: 15px; }
  .search { flex: 1; background: transparent; border: none; outline: none; color: var(--fg); font-size: 15px; }
  .search::placeholder { color: var(--fg-faint); }

  .scroll { flex: 1; overflow-y: auto; padding: 14px 22px 28px; }
  .muted { color: var(--fg-faint); font-size: 12.5px; padding: 10px 8px; max-width: 560px; }
  .list { list-style: none; margin: 0; padding: 0; max-width: 720px; display: flex; flex-direction: column; gap: 2px; }
  .row { display: flex; align-items: center; gap: 12px; width: 100%; text-align: left; padding: 10px 12px; border-radius: 10px; transition: background 0.12s; }
  .row:hover { background: var(--bg-elev); }
  .g { width: 16px; text-align: center; flex: 0 0 auto; font-size: 12px; color: var(--fg-faint); }
  .g.resource { color: var(--res); }
  .g.project { color: var(--proj); }
  .g.area { color: var(--area); }
  .g.contact { color: var(--accent); }
  .main { flex: 1; min-width: 0; display: flex; flex-direction: column; }
  .name { color: var(--fg); font-size: 13.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .ctx { color: var(--fg-faint); font-size: 11px; }
  .kind { font-size: 10px; color: var(--fg-faint); text-transform: uppercase; letter-spacing: 0.5px; flex: 0 0 auto; border: 1px solid var(--border); border-radius: 5px; padding: 1px 6px; }
</style>
