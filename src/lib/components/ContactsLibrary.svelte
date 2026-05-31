<script lang="ts">
  import { store } from "$lib/store.svelte";
  import PageHeader from "$lib/components/PageHeader.svelte";

  let q = $state("");
  const filtered = $derived(
    q.trim()
      ? store.contacts.filter((c) => c.name.toLowerCase().includes(q.trim().toLowerCase()))
      : store.contacts,
  );
</script>

<section class="lib">
  <PageHeader icon="☻" title="Contacts" color="var(--accent)" count={store.contacts.length} actionLabel="☻ New Contact" onAction={() => store.addContact()} />
  <div class="search-bar">
    <input class="search" placeholder="Search contacts…" bind:value={q} />
  </div>

  <div class="scroll">
    {#if store.loading}
      <p class="muted">loading…</p>
    {:else if filtered.length === 0}
      <p class="muted">{q.trim() ? "No matches." : "No contacts yet. Add one."}</p>
    {:else}
      <ul class="list">
        {#each filtered as c (c.id)}
          <li>
            <button class="row" onclick={() => store.openContact(c.id, "contacts")}>
              <span class="av">{(c.name.trim()[0] || "?").toUpperCase()}</span>
              <span class="nm">{c.name.trim() || "Unnamed"}</span>
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
  .search { width: 100%; max-width: 720px; background: var(--bg-inset); border: 1px solid var(--border); border-radius: var(--radius); padding: 7px 10px; font-size: 12px; color: var(--fg); outline: none; }
  .search::placeholder { color: var(--fg-faint); }
  .scroll { flex: 1; overflow-y: auto; padding: 12px 20px 24px; }
  .muted { color: var(--fg-faint); font-size: 12px; padding: 12px 8px; }
  .list { list-style: none; margin: 0; padding: 0; max-width: 720px; }
  .row { display: flex; align-items: center; gap: 12px; width: 100%; text-align: left; padding: 9px 12px; border-radius: var(--radius); border: 1px solid transparent; transition: background 0.12s, border-color 0.12s; }
  .row:hover { background: var(--bg-elev); border-color: var(--border); }
  .av { width: 26px; height: 26px; flex: 0 0 auto; display: flex; align-items: center; justify-content: center; border-radius: 50%; background: var(--bg-elev); border: 1px solid var(--border); color: var(--accent); font-size: 12px; font-weight: 700; }
  .nm { color: var(--fg); font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
</style>
