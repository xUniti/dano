<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { EditorView, keymap, placeholder } from "@codemirror/view";
  import { EditorState } from "@codemirror/state";
  import { markdown } from "@codemirror/lang-markdown";
  import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
  import { store } from "$lib/store.svelte";
  import type { LinkTargetType } from "$lib/types";

  let host: HTMLDivElement;
  let view: EditorView | null = null;
  let currentId: string | null = null;

  let pickType = $state<LinkTargetType>("project");
  let pickId = $state("");

  const resource = $derived(store.activeResource);

  function buildState(doc: string): EditorState {
    return EditorState.create({
      doc,
      extensions: [
        history(),
        keymap.of([...defaultKeymap, ...historyKeymap]),
        markdown(),
        EditorView.lineWrapping,
        placeholder("Write… (Markdown supported)"),
        EditorView.updateListener.of((u) => {
          if (u.docChanged) store.updateResource({ content: u.state.doc.toString() });
        }),
      ],
    });
  }

  onMount(() => {
    view = new EditorView({ parent: host, state: buildState(resource?.content ?? "") });
    currentId = resource?.id ?? null;
    store.loadPickers();
  });
  onDestroy(() => view?.destroy());

  $effect(() => {
    const r = store.activeResource;
    const id = r?.id ?? null;
    if (view && id !== currentId) {
      currentId = id;
      view.setState(buildState(r?.content ?? ""));
    }
  });

  const pickOptions = $derived(
    pickType === "area"
      ? store.areas.map((a) => ({ id: a.id, label: a.name || "Untitled" }))
      : pickType === "project"
        ? store.pickProjects.map((p) => ({ id: p.id, label: `${p.area_name} / ${p.name || "Untitled"}` }))
        : pickType === "task"
          ? store.pickTasks.map((t) => ({ id: t.id, label: `${t.context} / ${t.title || "Untitled"}` }))
          : store.pickContacts.map((c) => ({ id: c.id, label: c.name || "Unnamed" })),
  );

  function onTitle(e: Event) {
    store.updateResource({ title: (e.target as HTMLInputElement).value });
  }
  function doAdd() {
    if (!pickId) return;
    store.addLink(pickType, pickId);
    pickId = "";
  }
  const glyph = (t: LinkTargetType) => (t === "area" ? "◆" : t === "project" ? "▸" : t === "contact" ? "☻" : "□");
</script>

{#if resource}
  <section class="res">
    <div class="bar">
      <button class="back" onclick={() => store.backFromResource()}>‹ back</button>
      <input class="title" placeholder="Untitled" value={resource.title} oninput={onTitle} />
      <button class="act" onclick={() => store.archiveResource()}>archive</button>
      <button class="act danger" onclick={() => store.deleteResource()}>delete</button>
    </div>

    <div class="links">
      <span class="links-label">Linked to</span>
      {#each store.resourceLinks as l (l.id)}
        <span class="chip">
          <span class="chip-glyph">{glyph(l.target_type)}</span>
          {l.label || "—"}
          <button class="chip-x" onclick={() => store.removeLink(l.id)} title="Unlink">×</button>
        </span>
      {/each}
      {#if store.resourceLinks.length === 0}
        <span class="links-empty">nothing — in Inbox</span>
      {/if}

      <span class="adder">
        <select bind:value={pickType} onchange={() => (pickId = "")}>
          <option value="area">Area</option>
          <option value="project">Project</option>
          <option value="task">Task</option>
          <option value="contact">Contact</option>
        </select>
        <select bind:value={pickId}>
          <option value="">choose…</option>
          {#each pickOptions as o (o.id)}
            <option value={o.id}>{o.label}</option>
          {/each}
        </select>
        <button class="add-link" onclick={doAdd} disabled={!pickId}>+ link</button>
      </span>
    </div>

    <div class="surface" bind:this={host}></div>

    <div class="status">
      <span class="dot"></span><span>saved locally</span>
      <span class="sep">·</span><span>{resource.content.length} chars</span>
    </div>
  </section>
{/if}

<style>
  .res { flex: 1; height: 100%; display: flex; flex-direction: column; background: var(--bg); min-width: 0; }
  .bar { display: flex; align-items: center; gap: 8px; padding: 12px 18px; border-bottom: 1px solid var(--border-soft); }
  .back { color: var(--fg-dim); font-size: 12px; padding: 4px 8px; border-radius: var(--radius); flex: 0 0 auto; }
  .back:hover { background: var(--bg-elev); color: var(--fg); }
  .title { flex: 1; min-width: 0; background: transparent; border: none; outline: none; font-size: 18px; font-weight: 700; color: var(--fg); padding: 2px 0; }
  .title::placeholder { color: var(--fg-faint); }
  .act { color: var(--fg-faint); font-size: 11px; padding: 5px 9px; border-radius: var(--radius); border: 1px solid transparent; transition: color 0.12s, border-color 0.12s; flex: 0 0 auto; }
  .act:hover { color: var(--fg); border-color: var(--border); }
  .act.danger:hover { color: var(--danger); border-color: var(--danger); }

  .links { display: flex; align-items: center; flex-wrap: wrap; gap: 6px; padding: 10px 18px; border-bottom: 1px solid var(--border-soft); }
  .links-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.6px; color: var(--fg-faint); margin-right: 2px; }
  .links-empty { font-size: 11px; color: var(--fg-faint); font-style: italic; }
  .chip { display: inline-flex; align-items: center; gap: 5px; padding: 3px 4px 3px 8px; font-size: 11px; color: var(--fg); background: var(--bg-inset); border: 1px solid var(--border); border-radius: 12px; }
  .chip-glyph { color: var(--accent); font-size: 9px; }
  .chip-x { color: var(--fg-faint); font-size: 13px; width: 16px; border-radius: 50%; }
  .chip-x:hover { color: var(--danger); }
  .adder { display: inline-flex; align-items: center; gap: 4px; margin-left: auto; }
  .adder select { background: var(--bg-inset); color: var(--fg-dim); border: 1px solid var(--border); border-radius: var(--radius); padding: 3px 6px; font-size: 11px; outline: none; max-width: 180px; }
  .add-link { color: var(--accent); font-size: 11px; padding: 3px 8px; border-radius: var(--radius); }
  .add-link:disabled { color: var(--fg-faint); cursor: default; }
  .add-link:not(:disabled):hover { background: var(--bg-elev); }

  .surface { flex: 1; overflow-y: auto; padding: 18px; }
  .status { display: flex; align-items: center; gap: 7px; padding: 7px 18px; border-top: 1px solid var(--border-soft); color: var(--fg-faint); font-size: 10.5px; }
  .status .dot { width: 6px; height: 6px; border-radius: 50%; background: var(--accent); }
  .status .sep { opacity: 0.5; }
</style>
