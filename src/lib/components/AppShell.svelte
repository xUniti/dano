<script lang="ts">
  import { page } from "$app/stores";
  import { ui } from "$lib/stores/ui.svelte";
  import Icon, { type IconName } from "$lib/components/Icon.svelte";
  import CommandPalette from "$lib/components/CommandPalette.svelte";
  import Toaster from "$lib/components/Toaster.svelte";
  import Titlebar from "$lib/components/Titlebar.svelte";

  let { children } = $props();

  const nav: { href: string; label: string; icon: IconName }[] = [
    { href: "/", label: "Dashboard", icon: "dashboard" },
    { href: "/tasks", label: "Tasks", icon: "tasks" },
    { href: "/daily", label: "Daily Hub", icon: "today" },
    { href: "/notes", label: "Notes", icon: "notes" },
    { href: "/calendar", label: "Calendar", icon: "calendar" },
    { href: "/projects", label: "Projects", icon: "projects" },
    { href: "/goals", label: "Goals", icon: "goal" },
    { href: "/areas", label: "Areas", icon: "areas" },
    { href: "/habits", label: "Habits", icon: "habits" },
    { href: "/people", label: "People", icon: "people" },
  ];

  const menu: { href: string; label: string; icon: IconName }[] = [
    { href: "/notifications", label: "Notifications", icon: "bell" },
    { href: "/settings", label: "Settings", icon: "user" },
    { href: "/archive", label: "Archive", icon: "archive" },
    { href: "/settings", label: "About DANO", icon: "info" },
  ];

  function isActive(href: string, path: string): boolean {
    return href === "/" ? path === "/" : path === href || path.startsWith(href + "/");
  }

  function onKeydown(e: KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && (e.key.toLowerCase() === "k" || e.key.toLowerCase() === "n")) {
      e.preventDefault();
      ui.openCommand();
    }
  }
</script>

<svelte:window on:keydown={onKeydown} />

<div class="relative flex h-screen flex-col overflow-hidden bg-bg text-fg">
  <!-- Ambient glow -->
  <div
    class="pointer-events-none absolute inset-x-0 top-[-20%] mx-auto h-[40rem] w-[40rem] rounded-full bg-accent/10 blur-[120px]"
  ></div>

  <Titlebar />

  <!-- Content -->
  <main class="relative z-10 min-h-0 flex-1 overflow-y-auto pb-28">
    {@render children()}
  </main>

  <!-- Floating dock -->
  <div class="absolute bottom-5 left-1/2 z-50 -translate-x-1/2">
    <nav
      class="flex items-end gap-1 rounded-2xl border border-fg/10 bg-fg/[0.06] px-2 py-1.5 shadow-2xl shadow-black/40 backdrop-blur-2xl"
    >
      <!-- Brand tile = account/system menu (opens on hover) -->
      <div class="group relative flex flex-col items-center">
        <!-- hover menu (pb-3 bridges the gap so hover doesn't drop) -->
        <div class="invisible absolute bottom-full left-0 pb-3 opacity-0 transition-all duration-150 group-hover:visible group-hover:opacity-100">
          <div class="w-44 overflow-hidden rounded-xl border border-fg/15 bg-surface/95 shadow-2xl backdrop-blur-2xl">
            <div class="border-b border-fg/10 px-3 py-2">
              <div class="text-sm font-semibold text-fg">DANO OS</div>
              <div class="text-[10px] text-fg/40">Life Operating System</div>
            </div>
            {#each menu as m (m.label)}
              <a
                href={m.href}
                class="flex items-center gap-2.5 px-3 py-2 text-sm text-fg/75 hover:bg-fg/10 hover:text-fg"
              >
                <span class="text-fg/45"><Icon name={m.icon} size={16} /></span>
                {m.label}
              </a>
            {/each}
          </div>
        </div>
        <a
          href="/"
          aria-label="DANO home"
          class="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl border border-fg/15 transition-all duration-200 ease-out group-hover:-translate-y-1.5 group-hover:scale-110"
        >
          <img src="/dano-logo.svg" alt="DANO" class="h-full w-full" />
        </a>
        <span class="mt-0.5 h-1 w-1 rounded-full bg-transparent"></span>
      </div>
      <span class="mx-1 mb-3 h-7 w-px self-center bg-fg/10"></span>

      {#each nav as item (item.href)}
        {@const active = isActive(item.href, $page.url.pathname)}
        <a href={item.href} class="group relative flex flex-col items-center">
          <span
            class="pointer-events-none absolute -top-9 whitespace-nowrap rounded-md bg-fg px-2 py-1 text-[11px] text-bg opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100"
          >
            {item.label}
          </span>
          <span
            class="flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-200 ease-out group-hover:-translate-y-1.5 group-hover:scale-110
              {active
              ? 'bg-fg/15 text-fg shadow-inner shadow-fg/10'
              : 'text-fg/55 hover:bg-fg/10 hover:text-fg'}"
          >
            <Icon name={item.icon} />
          </span>
          <span
            class="mt-0.5 h-1 w-1 rounded-full transition-colors {active ? 'bg-accent' : 'bg-transparent'}"
          ></span>
        </a>
      {/each}

      <!-- divider -->
      <span class="mx-1 mb-3 h-7 w-px self-center bg-fg/10"></span>

      <button type="button" onclick={() => ui.openCommand()} class="group relative flex flex-col items-center">
        <span
          class="pointer-events-none absolute -top-9 flex items-center gap-1.5 whitespace-nowrap rounded-md bg-fg px-2 py-1 text-[11px] text-bg opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100"
        >
          Search <kbd class="rounded bg-fg/15 px-1 text-[10px]">⌘K</kbd>
        </span>
        <span
          class="flex h-11 w-11 items-center justify-center rounded-xl text-fg/55 transition-all duration-200 ease-out hover:bg-fg/10 hover:text-fg group-hover:-translate-y-1.5 group-hover:scale-110"
        >
          <Icon name="search" />
        </span>
        <span class="mt-0.5 h-1 w-1 rounded-full bg-transparent"></span>
      </button>
    </nav>
  </div>

  <CommandPalette />
  <Toaster />
</div>
