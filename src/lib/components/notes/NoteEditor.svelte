<script lang="ts">
  import { tick } from "svelte";
  import { notes as noteDb, people as peopleDb, tasks as taskDb, projects as projectDb, attachments as attachDb, archiveEntity, restoreEntity } from "$lib/db";
  import { toasts } from "$lib/stores/toast.svelte";
  import { link as gLink, neighbors } from "$lib/graph";
  import { renderMarkdown } from "$lib/markdown";
  import { detectMention, type MentionMatch } from "$lib/mentions";
  import { saveAttachmentFile, openAttachment } from "$lib/platform";
  import type { Note, Person, Task, Attachment, EntityType } from "$lib/types";

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
  let noteList = $state<Note[]>([]);
  let attachList = $state<Attachment[]>([]);
  let backlinks = $state<{ type: EntityType; id: string; label: string; href?: string }[]>([]);
  let uploading = $state(false);

  let titleEl = $state<HTMLInputElement | null>(null);
  let fileInput = $state<HTMLInputElement | null>(null);

  // mention autocomplete
  let textarea = $state<HTMLTextAreaElement | null>(null);
  let mention = $state<MentionMatch | null>(null);
  // [[wiki-link]] autocomplete (links one note to another)
  let wiki = $state<{ query: string; start: number } | null>(null);

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

  const wikiSuggestions = $derived.by(() => {
    if (!wiki) return [] as Note[];
    const q = wiki.query.toLowerCase();
    return noteList.filter((n) => n.id !== noteId && (n.title || "Untitled").toLowerCase().includes(q)).slice(0, 6);
  });

  async function loadNote() {
    const n = await noteDb.get(noteId);
    if (!n) return;
    note = n;
    title = n.title;
    content = n.content;
    tags = n.tags;
    await refreshBacklinks();
    attachList = await attachDb.forEntity("note", noteId);
    // Fresh note → jump straight into editing the title.
    if (n.title === "Untitled") {
      await tick();
      titleEl?.focus();
      titleEl?.select();
    }
  }

  async function loadRefs() {
    [people, tasks, noteList] = await Promise.all([peopleDb.list(), taskDb.listAll(), noteDb.list()]);
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
        } else if (n.type === "note") {
          const other = await noteDb.get(n.id);
          label = other?.title || "Untitled";
          href = `/notes?id=${n.id}`;
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

  function onMentionInput() {
    if (!textarea) return;
    const before = content.slice(0, textarea.selectionStart);
    const w = before.match(/\[\[([^\]\n]{0,60})$/);
    if (w) {
      wiki = { query: w[1], start: textarea.selectionStart - w[0].length };
      mention = null;
      return;
    }
    wiki = null;
    mention = detectMention(before);
  }

  async function chooseWiki(other: Note) {
    if (!wiki || !textarea) return;
    const pos = textarea.selectionStart;
    const insert = `[[${other.title || "Untitled"}]] `;
    content = content.slice(0, wiki.start) + insert + content.slice(pos);
    const caret = wiki.start + insert.length;
    wiki = null;
    await saveContent();
    await gLink({ type: "note", id: noteId }, { type: "note", id: other.id }, "related_to");
    await refreshBacklinks();
    await tick();
    textarea.focus();
    textarea.setSelectionRange(caret, caret);
  }

  async function onPickFile(e: Event) {
    const input = e.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    uploading = true;
    try {
      const path = await saveAttachmentFile(file);
      await attachDb.create("note", noteId, { name: file.name, mime: file.type, size: file.size, path });
      attachList = await attachDb.forEntity("note", noteId);
    } catch (err) {
      toasts.show(`Attach failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      uploading = false;
      input.value = "";
    }
  }
  async function open(a: Attachment) {
    try {
      await openAttachment(a.path);
    } catch (err) {
      toasts.show(`Couldn’t open: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  async function removeAttachment(a: Attachment) {
    await attachDb.remove(a.id);
    attachList = await attachDb.forEntity("note", noteId);
  }
  function fmtSize(n: number): string {
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
    return `${(n / 1024 / 1024).toFixed(1)} MB`;
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
      <input bind:this={fileInput} type="file" class="hidden" onchange={onPickFile} />
      <button
        type="button"
        onclick={() => fileInput?.click()}
        disabled={uploading}
        class="rounded-md border border-fg/10 px-2.5 py-1 text-xs text-fg/60 hover:bg-fg/5 hover:text-fg disabled:opacity-50"
      >
        {uploading ? "Uploading…" : "📎 Attach"}
      </button>
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
          oninput={onMentionInput}
          onblur={saveContent}
          onkeydown={(e) => e.key === "Escape" && ((mention = null), (wiki = null))}
          placeholder="Write in markdown… @ mentions a person, # links a task, [[ links a note"
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
        {:else if wiki && wikiSuggestions.length > 0}
          <div class="absolute left-5 top-3 z-20 w-72 overflow-hidden rounded-lg border border-fg/15 bg-surface shadow-2xl">
            <div class="border-b border-fg/10 px-3 py-1.5 text-[10px] uppercase tracking-wide text-fg/35">Link a note</div>
            {#each wikiSuggestions as n (n.id)}
              <button
                type="button"
                onmousedown={(e) => (e.preventDefault(), chooseWiki(n))}
                class="block w-full truncate px-3 py-2 text-left text-sm text-fg/80 hover:bg-fg/10"
              >
                {n.title || "Untitled"}
              </button>
            {/each}
          </div>
        {/if}
      {/if}
    </div>

    <!-- Attachments -->
    {#if attachList.length > 0}
      <div class="border-t border-fg/10 px-5 py-3">
        <div class="mb-1.5 text-[10px] uppercase tracking-wide text-fg/35">Attachments</div>
        <div class="flex flex-wrap gap-1.5">
          {#each attachList as a (a.id)}
            <span class="flex items-center gap-1.5 rounded-md bg-fg/5 px-2 py-1 text-xs text-fg/75">
              <button type="button" onclick={() => open(a)} class="max-w-48 truncate hover:text-accent" title={a.name}>📎 {a.name}</button>
              <span class="text-fg/30">{fmtSize(a.size)}</span>
              <button type="button" onclick={() => removeAttachment(a)} aria-label="Remove attachment" class="text-fg/30 hover:text-red-300">✕</button>
            </span>
          {/each}
        </div>
      </div>
    {/if}

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
