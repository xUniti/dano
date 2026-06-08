<script lang="ts">
  import { tick } from "svelte";
  import { notes as noteDb, people as peopleDb, tasks as taskDb, projects as projectDb, archiveEntity, restoreEntity } from "$lib/db";
  import { toasts } from "$lib/stores/toast.svelte";
  import { link as gLink, neighbors } from "$lib/graph";
  import { renderMarkdown } from "$lib/markdown";
  import type { Note, Person, Task, EntityType } from "$lib/types";

  interface Props {
    noteId: string;
    onChange: () => void; // notify list (title may have changed)
  }
  let { noteId, onChange }: Props = $props();

  let note = $state<Note | null>(null);
  let title = $state("");
  let content = $state("");
  let tags = $state("");
  let preview = $state(false);

  let people = $state<Person[]>([]);
  let tasks = $state<Task[]>([]);
  let backlinks = $state<{ type: EntityType; id: string; label: string; href?: string }[]>([]);

  let titleEl = $state<HTMLInputElement | null>(null);

  // mention autocomplete
  let textarea = $state<HTMLTextAreaElement | null>(null);
  let mention = $state<{ trigger: "@" | "#"; query: string; start: number } | null>(null);

  const suggestions = $derived.by(() => {
    if (!mention) return [] as { id: string; label: string; type: EntityType }[];
    const q = mention.query.toLowerCase();
    if (mention.trigger === "@") {
      return people
        .map((p) => ({ id: p.id, label: `${p.first_name} ${p.last_name}`.trim() || "Unnamed", type: "person" as EntityType }))
        .filter((s) => s.label.toLowerCase().includes(q))
        .slice(0, 6);
    }
    return tasks
      .map((t) => ({ id: t.id, label: t.title, type: "task" as EntityType }))
      .filter((s) => s.label.toLowerCase().includes(q))
      .slice(0, 6);
  });

  async function loadNote() {
    const n = await noteDb.get(noteId);
    if (!n) return;
    note = n;
    title = n.title;
    content = n.content;
    tags = n.tags;
    await refreshBacklinks();
    // Fresh note → jump straight into editing the title.
    if (n.title === "Untitled") {
      await tick();
      titleEl?.focus();
      titleEl?.select();
    }
  }

  async function loadRefs() {
    [people, tasks] = await Promise.all([peopleDb.list(), taskDb.listAll()]);
  }

  async function refreshBacklinks() {
    const ns = await neighbors({ type: "note", id: noteId });
    const resolved = await Promise.all(
      ns.map(async (n) => {
        let label = n.id;
        let href: string | undefined;
        if (n.type === "person") {
          const p = await peopleDb.get(n.id);
          label = p ? `${p.first_name} ${p.last_name}`.trim() || "Unnamed" : "Person";
        } else if (n.type === "task") {
          const t = await taskDb.get(n.id);
          label = t?.title ?? "Task";
        } else if (n.type === "project") {
          const p = await projectDb.get(n.id);
          label = p?.name ?? "Project";
          href = `/projects/${n.id}`;
        } else {
          label = n.type;
        }
        return { type: n.type, id: n.id, label, href };
      }),
    );
    backlinks = resolved;
  }

  // Reload everything when the selected note changes.
  $effect(() => {
    noteId;
    loadNote();
  });
  $effect(() => {
    loadRefs();
  });

  async function saveTitle() {
    if (!note || title === note.title) return;
    await noteDb.update(noteId, { title: title.trim() || "Untitled" });
    note.title = title;
    onChange();
  }
  async function saveTags() {
    if (!note || tags === note.tags) return;
    await noteDb.update(noteId, { tags });
    note.tags = tags;
  }
  async function saveContent() {
    if (!note || content === note.content) return;
    await noteDb.update(noteId, { content });
    note.content = content;
  }

  function detectMention() {
    if (!textarea) return;
    const pos = textarea.selectionStart;
    const before = content.slice(0, pos);
    const m = before.match(/([@#])([^\s@#]{0,40})$/);
    if (m) {
      mention = { trigger: m[1] as "@" | "#", query: m[2], start: pos - m[0].length };
    } else {
      mention = null;
    }
  }

  async function choose(s: { id: string; label: string; type: EntityType }) {
    if (!mention || !textarea) return;
    const pos = textarea.selectionStart;
    const insert = `${mention.trigger}${s.label} `;
    content = content.slice(0, mention.start) + insert + content.slice(pos);
    const caret = mention.start + insert.length;
    mention = null;
    await saveContent();
    await gLink({ type: "note", id: noteId }, { type: s.type, id: s.id }, "mentioned_in");
    await refreshBacklinks();
    await tick();
    textarea.focus();
    textarea.setSelectionRange(caret, caret);
  }

  async function del() {
    const archivedId = noteId;
    await archiveEntity("note", archivedId);
    onChange();
    toasts.show("Note archived", {
      action: { label: "Undo", run: async () => { await restoreEntity("note", archivedId); onChange(); } },
    });
  }
</script>

{#if note}
  <div class="flex h-full flex-col">
    <!-- Title + toolbar -->
    <div class="flex items-center gap-2 border-b border-fg/10 px-5 py-3">
      <input
        bind:this={titleEl}
        bind:value={title}
        onblur={saveTitle}
        placeholder="Untitled"
        class="flex-1 bg-transparent text-lg font-semibold tracking-tight outline-none placeholder:text-fg/30"
      />
      <button
        type="button"
        onclick={() => (preview = !preview)}
        class="rounded-md border border-fg/10 px-2.5 py-1 text-xs text-fg/60 hover:bg-fg/5 hover:text-fg"
      >
        {preview ? "Edit" : "Preview"}
      </button>
      <button type="button" onclick={del} class="rounded-md px-2 py-1 text-xs text-fg/40 hover:bg-amber-500/15 hover:text-amber-300">Archive</button>
    </div>

    <!-- Tags -->
    <div class="border-b border-fg/10 px-5 py-2">
      <input
        bind:value={tags}
        onblur={saveTags}
        placeholder="tags, comma, separated"
        class="w-full bg-transparent text-xs text-fg/60 outline-none placeholder:text-fg/25"
      />
    </div>

    <!-- Body -->
    <div class="relative min-h-0 flex-1 overflow-y-auto">
      {#if preview}
        <!-- eslint-disable-next-line svelte/no-at-html-tags -->
        <div class="selectable prose-invert px-5 py-4 text-sm leading-relaxed text-fg/85">{@html renderMarkdown(content)}</div>
      {:else}
        <textarea
          bind:this={textarea}
          bind:value={content}
          oninput={detectMention}
          onblur={saveContent}
          onkeydown={(e) => e.key === "Escape" && (mention = null)}
          placeholder="Write in markdown… type @ to mention a person, # to link a task"
          class="selectable h-full w-full resize-none bg-transparent px-5 py-4 font-mono text-sm leading-relaxed outline-none placeholder:text-fg/25"
        ></textarea>

        {#if mention && suggestions.length > 0}
          <div class="absolute left-5 top-3 z-20 w-72 overflow-hidden rounded-lg border border-fg/15 bg-surface shadow-2xl">
            <div class="border-b border-fg/10 px-3 py-1.5 text-[10px] uppercase tracking-wide text-fg/35">
              {mention.trigger === "@" ? "People" : "Tasks"}
            </div>
            {#each suggestions as s (s.id)}
              <button
                type="button"
                onmousedown={(e) => (e.preventDefault(), choose(s))}
                class="block w-full truncate px-3 py-2 text-left text-sm text-fg/80 hover:bg-fg/10"
              >
                {s.label}
              </button>
            {/each}
          </div>
        {/if}
      {/if}
    </div>

    <!-- Backlinks -->
    {#if backlinks.length > 0}
      <div class="border-t border-fg/10 px-5 py-3">
        <div class="mb-1.5 text-[10px] uppercase tracking-wide text-fg/35">Linked</div>
        <div class="flex flex-wrap gap-1.5">
          {#each backlinks as b (b.type + b.id)}
            {#if b.href}
              <a href={b.href} class="rounded-md bg-fg/5 px-2 py-1 text-xs text-accent hover:bg-fg/10">{b.label}</a>
            {:else}
              <span class="rounded-md bg-fg/5 px-2 py-1 text-xs text-fg/60">
                <span class="text-fg/35">{b.type}:</span> {b.label}
              </span>
            {/if}
          {/each}
        </div>
      </div>
    {/if}
  </div>
{:else}
  <div class="flex h-full items-center justify-center text-sm text-fg/30">Loading…</div>
{/if}
