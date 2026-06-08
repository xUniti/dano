<script lang="ts">
  import PageHeader from "$lib/components/PageHeader.svelte";
  import { exportData } from "$lib/db";
  import { isTauri } from "$lib/platform";
  import { invoke } from "@tauri-apps/api/core";
  import { theme, ACCENTS } from "$lib/stores/theme.svelte";

  const desktop = isTauri();
  let exporting = $state(false);
  let exportMsg = $state<string | null>(null);

  const shortcuts = [
    ["⌘K / Ctrl+K", "Open command palette (search + quick create)"],
    ["⌘N / Ctrl+N", "Open command palette to create"],
    ["Esc", "Close palette / cancel inline edit"],
    ["Double-click", "Rename a task / area / habit / note title"],
  ];

  async function backup() {
    exporting = true;
    exportMsg = null;
    try {
      const data = await exportData();
      const path = await invoke<string>("export_backup", { contents: JSON.stringify(data, null, 2) });
      exportMsg = `Backup saved to ${path}`;
    } catch (e) {
      exportMsg = `Export failed: ${e instanceof Error ? e.message : String(e)}`;
    } finally {
      exporting = false;
    }
  }
</script>

<PageHeader title="Settings" subtitle="DANO OS" />

<div class="max-w-2xl space-y-8 p-6">
  <!-- Appearance -->
  <section>
    <h2 class="mb-2 text-sm font-semibold tracking-tight text-fg/85">Appearance</h2>
    <div class="space-y-4 rounded-xl border border-fg/10 bg-fg/[0.02] p-4">
      <div class="flex items-center justify-between">
        <span class="text-sm text-fg/70">Theme</span>
        <div class="flex rounded-lg border border-fg/10 p-0.5">
          {#each ["dark", "light"] as m (m)}
            <button
              type="button"
              onclick={() => theme.setMode(m as "dark" | "light")}
              class="rounded-md px-3 py-1 text-xs capitalize transition-colors {theme.mode === m ? 'bg-accent/20 text-fg' : 'text-fg/50 hover:text-fg/80'}"
            >
              {m}
            </button>
          {/each}
        </div>
      </div>
      <div class="flex items-center justify-between">
        <span class="text-sm text-fg/70">Accent</span>
        <div class="flex items-center gap-2">
          {#each ACCENTS as a (a.id)}
            <button
              type="button"
              onclick={() => theme.setAccent(a.id)}
              title={a.label}
              aria-label={a.label}
              class="h-6 w-6 rounded-full transition-transform hover:scale-110 {theme.accent === a.id ? 'ring-2 ring-fg/70 ring-offset-2 ring-offset-bg' : ''}"
              style="background: {a.value}"
            ></button>
          {/each}
        </div>
      </div>
    </div>
  </section>

  <!-- About -->
  <section>
    <h2 class="mb-2 text-sm font-semibold tracking-tight text-fg/85">About</h2>
    <div class="rounded-xl border border-fg/10 bg-fg/[0.02] p-4 text-sm text-fg/70">
      <p><span class="text-fg/45">DANO OS</span> — a local-first Life Operating System.</p>
      <p class="mt-1 text-xs text-fg/40">SvelteKit 5 · Tauri 2 · local SQLite. Your data never leaves this device.</p>
    </div>
  </section>

  <!-- Data -->
  <section>
    <h2 class="mb-2 text-sm font-semibold tracking-tight text-fg/85">Data &amp; Backup</h2>
    <div class="rounded-xl border border-fg/10 bg-fg/[0.02] p-4">
      {#if !desktop}
        <p class="text-sm text-fg/40">Backup is available in the desktop app.</p>
      {:else}
        <p class="mb-3 text-xs text-fg/45">Export every table to a JSON file in your app folder. Keep it somewhere safe.</p>
        <button type="button" onclick={backup} disabled={exporting} class="rounded-lg bg-accent/80 px-4 py-2 text-sm font-medium text-fg hover:bg-accent disabled:opacity-50">
          {exporting ? "Exporting…" : "Export backup (JSON)"}
        </button>
        {#if exportMsg}
          <p class="selectable mt-3 break-all text-xs text-fg/55">{exportMsg}</p>
        {/if}
      {/if}
    </div>
  </section>

  <!-- Shortcuts -->
  <section>
    <h2 class="mb-2 text-sm font-semibold tracking-tight text-fg/85">Keyboard shortcuts</h2>
    <div class="rounded-xl border border-fg/10 bg-fg/[0.02] p-4">
      <dl class="space-y-2">
        {#each shortcuts as [key, desc] (key)}
          <div class="flex items-center gap-3 text-sm">
            <kbd class="rounded bg-fg/10 px-2 py-0.5 text-xs text-fg/70">{key}</kbd>
            <span class="text-fg/60">{desc}</span>
          </div>
        {/each}
      </dl>
    </div>
  </section>
</div>
