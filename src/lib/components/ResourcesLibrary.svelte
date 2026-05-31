<script lang="ts">
  import { store } from "$lib/store.svelte";
  import PageHeader from "$lib/components/PageHeader.svelte";

  let q = $state("");

  function preview(title: string, content: string): string {
    const body = title.trim() ? content : content.split("\n").slice(1).join(" ");
    return body.replace(/[#*`>_\-]/g, "").replace(/\s+/g, " ").trim();
  }
  function displayTitle(title: string, content: string): string {
    if (title.trim()) return title.trim();
    const first = content.split("\n").find((l) => l.trim());
    return first?.replace(/^#+\s*/, "").trim() || "Untitled";
  }

  const filtered = $derived(
    q.trim()
      ? store.library.filter((r) =>
          (r.title + " " + r.content).toLowerCase().includes(q.trim().toLowerCase()),
        )
      : store.library,
  );
</script>

<section class="lib">
  <PageHeader icon="▤" title="Resources" color="var(--res)" count={store.counts.resources} actionLabel="▤ New Note" onAction={() => store.addResource()} />
  <div class="search-bar">
    <input class="search" placeholder="Search resources…" bind:value={q} />
  </div>

  <div class="scroll">
    {#if store.loading}
      <p class="muted">loading…</p>
    {:else if filtered.length === 0}
      <p class="muted">{q.trim() ? "No matches." : "No resources yet. Create one."}</p>
    {:else}
      <ul class="list">
        {#each filtered as r (r.id)}
          <li>
            <button class="row" onclick={() => store.openResource(r.id, "resources")}>
              <span class="r-title">{displayTitle(r.title, r.content)}</span>
              <span class="r-prev">{preview(r.title, r.content) || "…"}</span>
            </button>
          </li>
        {/each}
      </ul>
    {/if}
  </div>
</section>

<style>
  .lib { flex: 1; height: 100%; display: flex; flex-direction: column; background: var(--bg); min-width: 0; }
  .search-bar { padding: 12px 28px 4px; }
  .search { width: 100%; max-width: 760px; background: var(--bg-inset); border: 1px solid var(--border); border-radius: var(--radius); padding: 7px 10px; font-size: 12px; color: var(--fg); outline: none; }
  .search::placeholder { color: var(--fg-faint); }

  .scroll { flex: 1; overflow-y: auto; padding: 12px 20px 24px; }
  .muted { color: var(--fg-faint); font-size: 12px; padding: 12px 8px; }
  .list { list-style: none; margin: 0; padding: 0; max-width: 760px; }
  .row { display: block; width: 100%; text-align: left; padding: 10px 12px; border-radius: var(--radius); border: 1px solid transparent; transition: background 0.12s, border-color 0.12s; }
  .row:hover { background: var(--bg-elev); border-color: var(--border); }
  .r-title { display: block; color: var(--fg); font-weight: 600; font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .r-prev { display: block; color: var(--fg-dim); font-size: 11.5px; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
</style>
