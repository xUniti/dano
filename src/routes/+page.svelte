<script lang="ts">
  import Sidebar from "$lib/components/Sidebar.svelte";
  import Dashboard from "$lib/components/Dashboard.svelte";
  import AreaView from "$lib/components/AreaView.svelte";
  import ProjectView from "$lib/components/ProjectView.svelte";
  import ResourcesLibrary from "$lib/components/ResourcesLibrary.svelte";
  import ResourceEditor from "$lib/components/ResourceEditor.svelte";
  import ArchiveView from "$lib/components/ArchiveView.svelte";
  import Calendar from "$lib/components/Calendar.svelte";
  import ContactsLibrary from "$lib/components/ContactsLibrary.svelte";
  import ContactEditor from "$lib/components/ContactEditor.svelte";
  import ProjectsBrowse from "$lib/components/ProjectsBrowse.svelte";
  import AreasBrowse from "$lib/components/AreasBrowse.svelte";
  import Search from "$lib/components/Search.svelte";
  import Settings from "$lib/components/Settings.svelte";
  import ConfirmDialog from "$lib/components/ConfirmDialog.svelte";
  import { store } from "$lib/store.svelte";
</script>

<div class="app">
  <Sidebar />

  <main class="main">
    {#if store.view === "dashboard"}
      <Dashboard />
    {:else if store.view === "calendar"}
      <Calendar />
    {:else if store.view === "search"}
      <Search />
    {:else if store.view === "settings"}
      <Settings />
    {:else if store.view === "projects"}
      <ProjectsBrowse />
    {:else if store.view === "areas"}
      <AreasBrowse />
    {:else if store.view === "contacts"}
      <ContactsLibrary />
    {:else if store.view === "contact"}
      {#key store.activeContactId}
        <ContactEditor />
      {/key}
    {:else if store.view === "project"}
      <ProjectView />
    {:else if store.view === "area"}
      <AreaView />
    {:else if store.view === "resources"}
      <ResourcesLibrary />
    {:else if store.view === "resource"}
      {#key store.activeResourceId}
        <ResourceEditor />
      {/key}
    {:else if store.view === "archive"}
      <ArchiveView />
    {:else}
      <div class="placeholder"><span>Select something from the sidebar.</span></div>
    {/if}
  </main>
</div>

{#if store.error}
  <div class="toast" role="alert">
    <span class="x">!</span>{store.error}
    <button class="dismiss" onclick={() => (store.error = null)}>×</button>
  </div>
{/if}

<ConfirmDialog />

<style>
  .app { display: flex; height: 100vh; width: 100vw; overflow: hidden; }
  .main { flex: 1; display: flex; min-width: 0; }
  .placeholder { flex: 1; display: flex; align-items: center; justify-content: center; color: var(--fg-faint); font-size: 13px; }

  .toast {
    position: fixed; bottom: 16px; left: 50%; transform: translateX(-50%);
    display: flex; align-items: center; gap: 8px; max-width: 70vw;
    padding: 9px 14px; background: var(--bg-elev); border: 1px solid var(--danger);
    border-radius: var(--radius); color: var(--fg); font-size: 12px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
  }
  .toast .x { color: var(--danger); font-weight: 700; }
  .dismiss { margin-left: 6px; color: var(--fg-faint); font-size: 16px; }
  .dismiss:hover { color: var(--fg); }
</style>
