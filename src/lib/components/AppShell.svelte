<script lang="ts">
  import { page } from "$app/stores";
  import { ui } from "$lib/stores/ui.svelte";
  import Icon, { type IconName } from "$lib/components/Icon.svelte";
  import CommandPalette from "$lib/components/CommandPalette.svelte";

  let { children } = $props();

  const nav: { href: string; label: string; icon: IconName }[] = [
    { href: "/", label: "Dashboard", icon: "dashboard" },
    { href: "/daily", label: "Today", icon: "today" },
    { href: "/tasks", label: "Tasks", icon: "tasks" },
    { href: "/areas", label: "Areas", icon: "areas" },
    { href: "/projects", label: "Projects", icon: "projects" },
    { href: "/notes", label: "Notes", icon: "notes" },
    { href: "/calendar", label: "Calendar", icon: "calendar" },
    { href: "/habits", label: "Habits", icon: "habits" },
    { href: "/people", label: "People", icon: "people" },
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

<div class="relative h-screen overflow-hidden bg-[#0c0d10] text-[#e7e9ee]">
  <!-- Ambient glow -->
  <div
    class="pointer-events-none absolute inset-x-0 top-[-20%] mx-auto h-[40rem] w-[40rem] rounded-full bg-sky-500/10 blur-[120px]"
  ></div>

  <!-- Profile / Settings (top-right) -->
  <div class="absolute right-4 top-3.5 z-40">
    <a
      href="/settings"
      title="Settings"
      aria-label="Settings"
      class="group flex h-9 w-9 items-center justify-center rounded-full border bg-white/[0.06] backdrop-blur-xl transition-all duration-200 hover:scale-105 hover:bg-white/10
        {$page.url.pathname === '/settings' ? 'border-sky-400/60 text-white' : 'border-white/15 text-white/70 hover:text-white'}"
    >
      <Icon name="user" size={18} />
    </a>
  </div>

  <!-- Content -->
  <main class="relative z-10 h-full overflow-y-auto pb-28">
    {@render children()}
  </main>

  <!-- Floating dock -->
  <div class="absolute bottom-5 left-1/2 z-50 -translate-x-1/2">
    <nav
      class="flex items-end gap-1 rounded-2xl border border-white/10 bg-white/[0.06] px-2 py-1.5 shadow-2xl shadow-black/40 backdrop-blur-2xl"
    >
      <!-- Brand tile -->
      <a href="/" class="group relative flex flex-col items-center" aria-label="DANO home">
        <span
          class="flex h-11 w-11 items-center justify-center rounded-xl border border-white/15 bg-gradient-to-br from-sky-500/30 to-indigo-500/20 text-base font-semibold text-white transition-all duration-200 ease-out group-hover:-translate-y-1.5 group-hover:scale-110"
          >D</span
        >
        <span class="mt-0.5 h-1 w-1 rounded-full bg-transparent"></span>
      </a>
      <span class="mx-1 mb-3 h-7 w-px self-center bg-white/10"></span>

      {#each nav as item (item.href)}
        {@const active = isActive(item.href, $page.url.pathname)}
        <a href={item.href} class="group relative flex flex-col items-center">
          <span
            class="pointer-events-none absolute -top-9 whitespace-nowrap rounded-md bg-black/80 px-2 py-1 text-[11px] text-white/90 opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100"
          >
            {item.label}
          </span>
          <span
            class="flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-200 ease-out group-hover:-translate-y-1.5 group-hover:scale-110
              {active
              ? 'bg-white/15 text-white shadow-inner shadow-white/10'
              : 'text-white/55 hover:bg-white/10 hover:text-white'}"
          >
            <Icon name={item.icon} />
          </span>
          <span
            class="mt-0.5 h-1 w-1 rounded-full transition-colors {active ? 'bg-sky-400' : 'bg-transparent'}"
          ></span>
        </a>
      {/each}

      <!-- divider -->
      <span class="mx-1 mb-3 h-7 w-px self-center bg-white/10"></span>

      <button type="button" onclick={() => ui.openCommand()} class="group relative flex flex-col items-center">
        <span
          class="pointer-events-none absolute -top-9 flex items-center gap-1.5 whitespace-nowrap rounded-md bg-black/80 px-2 py-1 text-[11px] text-white/90 opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100"
        >
          Search <kbd class="rounded bg-white/15 px-1 text-[10px]">⌘K</kbd>
        </span>
        <span
          class="flex h-11 w-11 items-center justify-center rounded-xl text-white/55 transition-all duration-200 ease-out hover:bg-white/10 hover:text-white group-hover:-translate-y-1.5 group-hover:scale-110"
        >
          <Icon name="search" />
        </span>
        <span class="mt-0.5 h-1 w-1 rounded-full bg-transparent"></span>
      </button>
    </nav>
  </div>

  <CommandPalette />
</div>
