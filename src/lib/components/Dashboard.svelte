<script lang="ts">
  import { store } from "$lib/store.svelte";
  import { relativeDue } from "$lib/date";

  let capture = $state("");

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  })();
  const today = new Date().toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });

  function displayTitle(title: string, content: string): string {
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
</script>

<section class="dash">
  <header class="top">
    <h1>{greeting}.</h1>
    <p class="date">{today}</p>
  </header>

  <div class="capture">
    <span class="caret">›</span>
    <input
      class="capture-in"
      placeholder="Quick capture — type and press Enter…"
      bind:value={capture}
      onkeydown={submitCapture}
    />
  </div>

  <div class="grid">
    <div class="card">
      <div class="card-head"><span class="card-title">Inbox</span><span class="card-count">{store.dashboard.inbox.length}</span></div>
      {#if store.dashboard.inbox.length === 0}
        <p class="muted">No unprocessed captures. Nice.</p>
      {:else}
        <ul class="list">
          {#each store.dashboard.inbox as r (r.id)}
            <li>
              <button class="item proc" onclick={() => store.openResource(r.id, "dashboard")}>
                <span class="kind">▤</span>
                <span class="it-main"><span class="it-title">{displayTitle(r.title, r.content)}</span><span class="it-ctx">unlinked — click to process</span></span>
              </button>
            </li>
          {/each}
        </ul>
      {/if}
    </div>

    <div class="card">
      <div class="card-head"><span class="card-title">Upcoming</span><span class="card-count">{store.dashboard.upcoming.length}</span></div>
      {#if store.dashboard.upcoming.length === 0}
        <p class="muted">Nothing with a due date.</p>
      {:else}
        <ul class="list">
          {#each store.dashboard.upcoming as it (it.kind + it.id)}
            {@const due = relativeDue(it.due_at)}
            <li>
              <button class="item proc" onclick={() => { if (it.kind === "contactdate" && it.contactId) store.openContact(it.contactId, "dashboard"); }} disabled={it.kind !== "contactdate"}>
                <span class="kind {it.kind}">{it.kind === "task" ? "□" : it.kind === "contactdate" ? "♥" : "◆"}</span>
                <span class="it-main"><span class="it-title">{it.title || "Untitled"}</span><span class="it-ctx">{it.context}</span></span>
                <span class="due {due.tone}">{due.label}</span>
              </button>
            </li>
          {/each}
        </ul>
      {/if}
    </div>

    <div class="card wide">
      <div class="card-head"><span class="card-title">Active projects</span><span class="card-count">{store.dashboard.activeProjects.length}</span></div>
      {#if store.dashboard.activeProjects.length === 0}
        <p class="muted">No active projects.</p>
      {:else}
        <ul class="list">
          {#each store.dashboard.activeProjects as p (p.id)}
            <li>
              <button class="item proc" onclick={() => store.openProject(p.id, p.area_id)}>
                <span class="kind project">◆</span>
                <span class="it-main"><span class="it-title">{p.name || "Untitled"}</span><span class="it-ctx">{p.area_name}</span></span>
                {#if p.due_at != null}{@const due = relativeDue(p.due_at)}<span class="due {due.tone}">{due.label}</span>{/if}
              </button>
            </li>
          {/each}
        </ul>
      {/if}
    </div>
  </div>
</section>

<style>
  .dash { flex: 1; height: 100%; overflow-y: auto; background: var(--bg); padding: 28px 32px; min-width: 0; }
  .top { margin-bottom: 18px; }
  h1 { margin: 0; font-size: 22px; font-weight: 700; color: var(--fg); }
  .date { margin: 2px 0 0; color: var(--fg-faint); font-size: 12px; }

  .capture { display: flex; align-items: center; gap: 10px; padding: 10px 14px; margin-bottom: 22px; background: var(--bg-inset); border: 1px solid var(--border); border-radius: var(--radius); }
  .capture .caret { color: var(--accent); font-weight: 700; }
  .capture-in { flex: 1; background: transparent; border: none; outline: none; color: var(--fg); font-size: 13px; }
  .capture-in::placeholder { color: var(--fg-faint); }

  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; max-width: 880px; }
  @media (max-width: 760px) { .grid { grid-template-columns: 1fr; } }
  .card { background: var(--bg-inset); border: 1px solid var(--border); border-radius: var(--radius); padding: 14px 16px; }
  .card.wide { grid-column: 1 / -1; }
  .card-head { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 10px; }
  .card-title { font-weight: 700; font-size: 13px; }
  .card-count { font-size: 11px; color: var(--fg-faint); border: 1px solid var(--border); border-radius: 10px; padding: 0 7px; }
  .muted { color: var(--fg-faint); font-size: 12px; margin: 4px 0 2px; }

  .list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 2px; }
  .item { display: flex; align-items: center; gap: 10px; width: 100%; padding: 7px 8px; border-radius: var(--radius); text-align: left; }
  .proc { transition: background 0.12s; }
  .proc:hover { background: var(--bg-elev); }
  .kind { width: 14px; text-align: center; color: var(--fg-faint); flex: 0 0 auto; }
  .kind.project { color: var(--accent); }
  .it-main { flex: 1; min-width: 0; display: flex; flex-direction: column; }
  .it-title { color: var(--fg); font-size: 12.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .it-ctx { color: var(--fg-faint); font-size: 10.5px; }
  .due { font-size: 10.5px; flex: 0 0 auto; color: var(--fg-dim); }
  .due.soon { color: var(--accent); }
  .due.over { color: var(--danger); }
</style>
