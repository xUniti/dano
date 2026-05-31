<script lang="ts">
  import { store } from "$lib/store.svelte";
  import { relativeDue } from "$lib/date";
  import DatePicker from "$lib/components/DatePicker.svelte";

  const contact = $derived(store.activeContact);

  let newLabel = $state("Birthday");
  let pickProject = $state("");

  function onName(e: Event) {
    store.updateContact({ name: (e.target as HTMLInputElement).value });
  }
  function onNotes(e: Event) {
    store.updateContact({ notes: (e.target as HTMLTextAreaElement).value });
  }
  function addDate(ms: number | null) {
    if (ms == null) return;
    store.addContactDate(newLabel.trim() || "Date", ms);
    newLabel = "Birthday";
  }
  // Next annual occurrence label, e.g. "in 12d".
  function nextOcc(ms: number): number {
    const d = new Date(ms);
    const now = new Date();
    let occ = new Date(now.getFullYear(), d.getMonth(), d.getDate()).getTime();
    if (occ < new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime())
      occ = new Date(now.getFullYear() + 1, d.getMonth(), d.getDate()).getTime();
    return occ;
  }
</script>

{#if contact}
  <section class="ct">
    <div class="bar">
      <button class="back" onclick={() => store.backFromContact()}>‹ back</button>
      <input class="name" placeholder="Contact name" value={contact.name} oninput={onName} />
      <button class="act" onclick={() => store.archiveContact()}>archive</button>
      <button class="act danger" onclick={() => store.deleteContact()}>delete</button>
    </div>

    <div class="body">
      <div class="block">
        <div class="b-head"><span class="b-title">Important dates</span></div>
        {#if store.contactDates.length === 0}
          <p class="muted">No dates yet.</p>
        {:else}
          <ul class="dates">
            {#each store.contactDates as d (d.id)}
              {@const due = relativeDue(nextOcc(d.date_at))}
              <li class="drow">
                <input
                  class="dlabel"
                  value={d.label}
                  oninput={(e) => store.updateContactDate(d.id, { label: (e.target as HTMLInputElement).value })}
                />
                <DatePicker value={d.date_at} onpick={(ms) => { if (ms != null) store.updateContactDate(d.id, { date_at: ms }); }} />
                <span class="dnext {due.tone}">{due.label}</span>
                <button class="ddel" onclick={() => store.deleteContactDate(d.id)} title="Remove">×</button>
              </li>
            {/each}
          </ul>
        {/if}
        <div class="adder">
          <input class="dlabel" bind:value={newLabel} placeholder="Label (e.g. Birthday)" />
          <DatePicker value={null} placeholder="+ add date" onpick={addDate} />
        </div>
      </div>

      <div class="block">
        <div class="b-head"><span class="b-title">Linked projects</span></div>
        {#if store.contactProjects.length === 0}
          <p class="muted">Not linked to any project.</p>
        {:else}
          <div class="chips">
            {#each store.contactProjects as p (p.link_id)}
              <span class="chip">
                {p.area_name} / {p.name || "Untitled"}
                <button class="chip-x" onclick={() => store.removeContactProject(p.link_id)}>×</button>
              </span>
            {/each}
          </div>
        {/if}
        <div class="adder">
          <select bind:value={pickProject}>
            <option value="">link a project…</option>
            {#each store.pickProjects as p (p.id)}
              <option value={p.id}>{p.area_name} / {p.name || "Untitled"}</option>
            {/each}
          </select>
          <button class="add-btn" disabled={!pickProject} onclick={() => { store.addContactProject(pickProject); pickProject = ""; }}>+ link</button>
        </div>
      </div>

      <div class="block">
        <div class="b-head"><span class="b-title">Notes</span></div>
        <textarea class="notes" placeholder="Notes about this contact…" value={contact.notes} oninput={onNotes}></textarea>
      </div>

      {#if store.contactNotes.length}
        <div class="block">
          <div class="b-head"><span class="b-title">Linked resources</span></div>
          <ul class="rlist">
            {#each store.contactNotes as r (r.id)}
              <li><button class="rrow" onclick={() => store.openResource(r.id, "contact")}>
                <span class="rg">▤</span>
                <span class="rname">{r.title.trim() || "Untitled"}</span>
              </button></li>
            {/each}
          </ul>
        </div>
      {/if}
    </div>
  </section>
{/if}

<style>
  .ct { flex: 1; height: 100%; display: flex; flex-direction: column; background: var(--bg); min-width: 0; }
  .bar { display: flex; align-items: center; gap: 8px; padding: 12px 18px; border-bottom: 1px solid var(--border-soft); }
  .back { color: var(--fg-dim); font-size: 12px; padding: 4px 8px; border-radius: var(--radius); flex: 0 0 auto; }
  .back:hover { background: var(--bg-elev); color: var(--fg); }
  .name { flex: 1; min-width: 0; background: transparent; border: none; outline: none; font-size: 18px; font-weight: 700; color: var(--fg); padding: 2px 0; }
  .name::placeholder { color: var(--fg-faint); }
  .act { color: var(--fg-faint); font-size: 11px; padding: 5px 9px; border-radius: var(--radius); border: 1px solid transparent; transition: color 0.12s, border-color 0.12s; flex: 0 0 auto; }
  .act:hover { color: var(--fg); border-color: var(--border); }
  .act.danger:hover { color: var(--danger); border-color: var(--danger); }

  .body { flex: 1; overflow-y: auto; padding: 18px 24px 28px; max-width: 720px; }
  .block { margin-bottom: 24px; }
  .b-head { margin-bottom: 8px; }
  .b-title { font-weight: 700; font-size: 13px; }
  .muted { color: var(--fg-faint); font-size: 12px; }

  .dates { list-style: none; margin: 0 0 8px; padding: 0; display: flex; flex-direction: column; gap: 4px; }
  .drow { display: flex; align-items: center; gap: 8px; }
  .dlabel { background: var(--bg-inset); border: 1px solid var(--border); border-radius: var(--radius); padding: 4px 8px; font-size: 12px; color: var(--fg); outline: none; width: 160px; }
  .dlabel::placeholder { color: var(--fg-faint); }
  .dnext { font-size: 11px; color: var(--fg-dim); }
  .dnext.soon { color: var(--accent); }
  .dnext.over { color: var(--danger); }
  .ddel { color: var(--fg-faint); font-size: 16px; width: 20px; margin-left: auto; }
  .ddel:hover { color: var(--danger); }
  .adder { display: flex; align-items: center; gap: 8px; margin-top: 6px; }

  .chips { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 8px; }
  .chip { display: inline-flex; align-items: center; gap: 6px; padding: 3px 4px 3px 10px; font-size: 11px; color: var(--fg); background: var(--bg-inset); border: 1px solid var(--border); border-radius: 12px; }
  .chip-x { color: var(--fg-faint); font-size: 13px; width: 16px; border-radius: 50%; }
  .chip-x:hover { color: var(--danger); }
  select { background: var(--bg-inset); color: var(--fg-dim); border: 1px solid var(--border); border-radius: var(--radius); padding: 4px 8px; font-size: 12px; outline: none; max-width: 260px; }
  .add-btn { color: var(--accent); font-size: 12px; padding: 4px 10px; border-radius: var(--radius); }
  .add-btn:disabled { color: var(--fg-faint); cursor: default; }
  .add-btn:not(:disabled):hover { background: var(--bg-elev); }

  .notes { width: 100%; min-height: 90px; resize: vertical; background: var(--bg-inset); border: 1px solid var(--border); border-radius: var(--radius); padding: 10px; font-size: 12.5px; color: var(--fg); font-family: inherit; outline: none; }
  .notes::placeholder { color: var(--fg-faint); }

  .rlist { list-style: none; margin: 0; padding: 0; }
  .rrow { display: flex; align-items: center; gap: 9px; width: 100%; padding: 7px 8px; border-radius: var(--radius); text-align: left; }
  .rrow:hover { background: var(--bg-elev); }
  .rg { color: var(--fg-faint); font-size: 11px; }
  .rname { color: var(--fg); font-size: 13px; }
</style>
