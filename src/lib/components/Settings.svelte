<script lang="ts">
  import { store } from "$lib/store.svelte";
  import { theme } from "$lib/theme.svelte";
  import { zoom } from "$lib/zoom.svelte";
  import { font, FONT_LABELS, type FontChoice } from "$lib/font.svelte";
  import { viewMode } from "$lib/viewmode.svelte";
  import { exportSettings, applySettings, saveJSON, openJSON, backupFilename } from "$lib/backup";
  import PageHeader from "$lib/components/PageHeader.svelte";

  const fontChoices: FontChoice[] = ["sans", "serif", "mono", "rounded"];

  const shortcuts = [
    { keys: "n", desc: "New note" },
    { keys: "/", desc: "Search" },
    { keys: "g  d", desc: "Go to Dashboard" },
    { keys: "g  p", desc: "Go to Projects" },
    { keys: "g  a", desc: "Go to Areas" },
    { keys: "g  r", desc: "Go to Resources" },
    { keys: "g  c", desc: "Go to Contacts" },
    { keys: "g  k", desc: "Go to Calendar" },
    { keys: "g  s", desc: "Go to Settings" },
    { keys: "Ctrl  +", desc: "Zoom in" },
    { keys: "Ctrl  −", desc: "Zoom out" },
    { keys: "Ctrl  0", desc: "Reset zoom" },
  ];

  let busy = $state(false);
  let msg = $state<{ kind: "ok" | "err"; text: string } | null>(null);
  // import-content flow: hold the parsed file until the user picks replace/merge
  let pendingContent = $state<unknown | null>(null);
  let confirmClear = $state(false);

  function flash(kind: "ok" | "err", text: string) {
    msg = { kind, text };
    setTimeout(() => { if (msg && msg.text === text) msg = null; }, 4000);
  }

  // ----- settings backup -----
  async function doExportSettings() {
    try {
      const r = await saveJSON(backupFilename("settings"), JSON.stringify(exportSettings(), null, 2));
      if (r === "saved") flash("ok", "Settings exported.");
    } catch (e) { flash("err", e instanceof Error ? e.message : String(e)); }
  }
  async function doImportSettings() {
    try {
      const data = await openJSON();
      applySettings(data);
      flash("ok", "Settings imported.");
    } catch (e) { flash("err", e instanceof Error ? e.message : String(e)); }
  }

  // ----- content backup -----
  async function doExportContent() {
    busy = true;
    try {
      const text = await store.exportContentJSON();
      const r = await saveJSON(backupFilename("content"), text);
      if (r === "saved") flash("ok", "Content exported.");
    } catch (e) { flash("err", e instanceof Error ? e.message : String(e)); }
    finally { busy = false; }
  }
  async function pickContent() {
    try { pendingContent = await openJSON(); }
    catch (e) { flash("err", e instanceof Error ? e.message : String(e)); }
  }
  async function applyContent(mode: "replace" | "merge") {
    if (pendingContent == null) return;
    busy = true;
    try {
      const summary = await store.importContentJSON(pendingContent, mode);
      flash("ok", summary);
    } catch (e) { flash("err", e instanceof Error ? e.message : String(e)); }
    finally { busy = false; pendingContent = null; }
  }
  async function doClearAll() {
    busy = true;
    try { await store.clearAllData(); flash("ok", "All content cleared."); }
    catch (e) { flash("err", e instanceof Error ? e.message : String(e)); }
    finally { busy = false; confirmClear = false; }
  }
</script>

<section class="settings">
  <PageHeader icon="⚙" title="Settings" color="var(--fg-dim)" />

  <div class="scroll">
    <!-- Appearance -->
    <div class="block">
      <h2>Appearance</h2>

      <div class="row">
        <div class="r-label"><span class="r-title">Theme</span><span class="r-sub">Follow system, or pin light/dark</span></div>
        <div class="seg">
          <button class:on={theme.choice === "system"} onclick={() => theme.set("system")}>◐ System</button>
          <button class:on={theme.choice === "light"} onclick={() => theme.set("light")}>☀ Light</button>
          <button class:on={theme.choice === "dark"} onclick={() => theme.set("dark")}>☾ Dark</button>
        </div>
      </div>

      <div class="row">
        <div class="r-label"><span class="r-title">Zoom</span><span class="r-sub">Scale the whole interface</span></div>
        <div class="zoomctl">
          <button class="zb" onclick={() => zoom.out()} disabled={zoom.atMin} aria-label="Zoom out">−</button>
          <button class="zv" onclick={() => zoom.reset()} title="Reset to 100%">{zoom.percent}%</button>
          <button class="zb" onclick={() => zoom.in()} disabled={zoom.atMax} aria-label="Zoom in">+</button>
        </div>
      </div>

      <div class="row">
        <div class="r-label"><span class="r-title">Font</span><span class="r-sub">Interface typeface</span></div>
        <div class="seg fonts">
          {#each fontChoices as f (f)}
            <button class:on={font.value === f} onclick={() => font.set(f)} style="font-family: var(--font-ui)">{FONT_LABELS[f]}</button>
          {/each}
        </div>
      </div>
    </div>

    <!-- View defaults -->
    <div class="block">
      <h2>View</h2>
      <div class="row">
        <div class="r-label"><span class="r-title">Projects &amp; Areas layout</span><span class="r-sub">Compact rows or detailed cards</span></div>
        <div class="seg">
          <button class:on={viewMode.mode === "compact"} onclick={() => viewMode.set("compact")}>≣ Compact</button>
          <button class:on={viewMode.mode === "cards"} onclick={() => viewMode.set("cards")}>▦ Cards</button>
        </div>
      </div>
    </div>

    <!-- Data -->
    <div class="block">
      <h2>Data</h2>

      {#if msg}
        <div class="msg {msg.kind}">{msg.text}</div>
      {/if}

      <div class="row">
        <div class="r-label"><span class="r-title">Content backup</span><span class="r-sub">Areas, projects, tasks, notes, contacts &amp; activity</span></div>
        <div class="btns">
          <button class="btn" disabled={busy} onclick={doExportContent}>Export</button>
          <button class="btn" disabled={busy} onclick={pickContent}>Import</button>
        </div>
      </div>

      {#if pendingContent != null}
        <div class="import-confirm">
          <span class="ic-text">File loaded. How should duplicates be handled?</span>
          <div class="btns">
            <button class="btn" disabled={busy} onclick={() => applyContent("merge")}>Merge</button>
            <button class="btn warn" disabled={busy} onclick={() => applyContent("replace")}>Replace all</button>
            <button class="btn ghost" disabled={busy} onclick={() => (pendingContent = null)}>Cancel</button>
          </div>
        </div>
      {/if}

      <div class="row">
        <div class="r-label"><span class="r-title">Settings backup</span><span class="r-sub">Theme, zoom, font &amp; layout preferences</span></div>
        <div class="btns">
          <button class="btn" onclick={doExportSettings}>Export</button>
          <button class="btn" onclick={doImportSettings}>Import</button>
        </div>
      </div>

      <div class="row danger-row">
        <div class="r-label"><span class="r-title">Clear all content</span><span class="r-sub">Permanently delete everything. Settings are kept.</span></div>
        {#if confirmClear}
          <div class="btns">
            <button class="btn warn" disabled={busy} onclick={doClearAll}>Yes, delete all</button>
            <button class="btn ghost" disabled={busy} onclick={() => (confirmClear = false)}>Cancel</button>
          </div>
        {:else}
          <button class="btn danger" onclick={() => (confirmClear = true)}>Clear all…</button>
        {/if}
      </div>
    </div>

    <!-- Shortcuts -->
    <div class="block">
      <h2>Shortcuts &amp; Help</h2>
      <ul class="shortcuts">
        {#each shortcuts as s (s.desc)}
          <li><kbd>{s.keys}</kbd><span>{s.desc}</span></li>
        {/each}
      </ul>
    </div>

    <!-- About -->
    <div class="block">
      <h2>About</h2>
      <div class="about">
        <div class="brand"><span class="prompt">$</span> dano</div>
        <p class="ver">Version 0.5 · local-first PARA workspace</p>
        <p class="links">
          <a href="https://github.com/xuniti/dano" target="_blank" rel="noreferrer">GitHub</a>
          <span class="dot">·</span>
          <span>Built by xUniti</span>
        </p>
      </div>
    </div>
  </div>
</section>

<style>
  .settings { flex: 1; height: 100%; display: flex; flex-direction: column; background: var(--bg); min-width: 0; }
  .scroll { flex: 1; overflow-y: auto; padding: 18px 28px 40px; max-width: 720px; }

  .block { margin-bottom: 28px; }
  h2 { margin: 0 0 10px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.8px; color: var(--fg-faint); font-weight: 600; }

  .row { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 12px 14px; background: var(--bg-inset); border: 1px solid var(--border-soft); border-radius: 10px; margin-bottom: 8px; }
  .r-label { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
  .r-title { color: var(--fg); font-size: 13.5px; font-weight: 600; }
  .r-sub { color: var(--fg-faint); font-size: 11.5px; }

  .seg { display: flex; gap: 2px; background: var(--bg); border: 1px solid var(--border); border-radius: 8px; padding: 2px; flex: 0 0 auto; }
  .seg button { font-size: 12px; color: var(--fg-dim); padding: 6px 12px; border-radius: 6px; white-space: nowrap; transition: background 0.12s, color 0.12s; }
  .seg button:hover { color: var(--fg); }
  .seg button.on { background: var(--bg-elev); color: var(--fg); }
  .seg.fonts button.on { color: var(--accent); }

  .zoomctl { display: flex; align-items: center; gap: 4px; background: var(--bg); border: 1px solid var(--border); border-radius: 8px; padding: 3px; flex: 0 0 auto; }
  .zb { width: 28px; height: 26px; color: var(--fg-dim); font-size: 16px; border-radius: 6px; display: flex; align-items: center; justify-content: center; }
  .zb:hover:not(:disabled) { background: var(--bg-elev); color: var(--fg); }
  .zb:disabled { opacity: 0.35; cursor: default; }
  .zv { min-width: 54px; text-align: center; font-size: 12px; color: var(--fg-dim); font-variant-numeric: tabular-nums; border-radius: 6px; padding: 5px 0; }
  .zv:hover { background: var(--bg-elev); color: var(--fg); }

  .soon { font-size: 11px; color: var(--fg-faint); border: 1px solid var(--border); border-radius: 10px; padding: 3px 10px; flex: 0 0 auto; }

  .btns { display: flex; gap: 6px; flex: 0 0 auto; flex-wrap: wrap; }
  .btn { font-size: 12px; color: var(--fg-dim); background: var(--bg); border: 1px solid var(--border); border-radius: 7px; padding: 6px 12px; transition: background 0.12s, color 0.12s, border-color 0.12s; }
  .btn:hover:not(:disabled) { background: var(--bg-elev); color: var(--fg); }
  .btn:disabled { opacity: 0.5; cursor: default; }
  .btn.ghost { border-color: transparent; color: var(--fg-faint); }
  .btn.ghost:hover:not(:disabled) { color: var(--fg); }
  .btn.warn:hover:not(:disabled), .btn.danger:hover:not(:disabled) { color: var(--danger); border-color: var(--danger); }
  .danger-row { border-color: color-mix(in srgb, var(--danger) 30%, var(--border-soft)); }
  .import-confirm { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; padding: 11px 14px; margin-bottom: 8px; background: var(--bg-elev); border: 1px solid var(--border); border-radius: 10px; }
  .ic-text { font-size: 12.5px; color: var(--fg-dim); }
  .msg { padding: 9px 14px; margin-bottom: 8px; border-radius: 9px; font-size: 12.5px; }
  .msg.ok { color: var(--accent); background: color-mix(in srgb, var(--accent) 12%, transparent); border: 1px solid color-mix(in srgb, var(--accent) 30%, transparent); }
  .msg.err { color: var(--danger); background: color-mix(in srgb, var(--danger) 12%, transparent); border: 1px solid color-mix(in srgb, var(--danger) 30%, transparent); }

  .shortcuts { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 2px; }
  .shortcuts li { display: flex; align-items: center; gap: 12px; padding: 9px 14px; background: var(--bg-inset); border: 1px solid var(--border-soft); border-radius: 9px; }
  kbd { font-family: var(--font-mono); font-size: 11px; color: var(--fg-dim); background: var(--bg); border: 1px solid var(--border); border-radius: 6px; padding: 3px 8px; min-width: 76px; text-align: center; }
  .shortcuts li span { color: var(--fg); font-size: 13px; }

  .about { padding: 14px; background: var(--bg-inset); border: 1px solid var(--border-soft); border-radius: 10px; }
  .brand { font-family: var(--font-mono); font-size: 16px; font-weight: 700; color: var(--fg); }
  .brand .prompt { color: var(--accent); }
  .ver { margin: 6px 0 4px; color: var(--fg-dim); font-size: 12px; }
  .links { margin: 0; color: var(--fg-faint); font-size: 12px; display: flex; align-items: center; gap: 8px; }
  .links a { color: var(--accent); }
  .links a:hover { text-decoration: underline; }
  .links .dot { color: var(--fg-faint); }
</style>
