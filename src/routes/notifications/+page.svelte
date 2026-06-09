<script lang="ts">
  import { onMount } from "svelte";
  import PageHeader from "$lib/components/PageHeader.svelte";
  import { tasks as taskDb, people as peopleDb, events as eventDb } from "$lib/db";
  import { isTauri } from "$lib/platform";
  import { startOfDayMs, dueLabel } from "$lib/date";
  import { fullName, isFollowUpDue, daysUntilBirthday, daysSinceInteraction } from "$lib/people";
  import type { Task, Person, CalEvent } from "$lib/types";

  const desktop = isTauri();

  let tasks = $state<Task[]>([]);
  let people = $state<Person[]>([]);
  let events = $state<CalEvent[]>([]);
  let loading = $state(true);

  async function load() {
    if (!desktop) { loading = false; return; }
    loading = true;
    [tasks, people, events] = await Promise.all([taskDb.listAll(), peopleDb.list(), eventDb.listAll()]);
    loading = false;
  }
  onMount(load);

  const overdue = $derived(
    tasks
      .filter((t) => t.status !== "done" && t.due_at != null && t.due_at < startOfDayMs())
      .sort((a, b) => (a.due_at ?? 0) - (b.due_at ?? 0)),
  );
  const birthdays = $derived(
    people
      .map((p) => ({ p, d: daysUntilBirthday(p.birthday) }))
      .filter((x): x is { p: Person; d: number } => x.d != null && x.d <= 30)
      .sort((a, b) => a.d - b.d),
  );
  const followUps = $derived(
    people
      .filter((p) => isFollowUpDue(p))
      .sort((a, b) => (daysSinceInteraction(b) ?? 9999) - (daysSinceInteraction(a) ?? 9999)),
  );
  const upcomingEvents = $derived(
    events.filter((e) => e.start_at >= startOfDayMs()).sort((a, b) => a.start_at - b.start_at).slice(0, 10),
  );

  const total = $derived(overdue.length + birthdays.length + followUps.length + upcomingEvents.length);
</script>

<PageHeader title="Notifications" subtitle="Follow-ups · birthdays · deadlines" />

{#if !desktop}
  <div class="m-6 rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-200/80">
    Notifications read your local database. Launch the desktop app with
    <code class="rounded bg-black/30 px-1">npm run tauri dev</code> to see them.
  </div>
{:else if loading}
  <div class="p-6 text-sm text-fg/40">Loading…</div>
{:else if total === 0}
  <div class="mx-auto max-w-2xl p-10 text-center text-sm text-fg/40">
    🎉 You’re all caught up. No overdue tasks, follow-ups, or upcoming dates.
  </div>
{:else}
  <div class="mx-auto max-w-2xl space-y-6 p-6">
    {#if overdue.length}
      <section>
        <h2 class="mb-2 text-xs font-semibold uppercase tracking-wide text-red-300/80">Overdue tasks · {overdue.length}</h2>
        <div class="space-y-1.5">
          {#each overdue as t (t.id)}
            <a href="/tasks" class="flex items-center gap-3 rounded-lg border border-red-500/15 bg-red-500/[0.04] px-3 py-2">
              <span class="h-2 w-2 shrink-0 rounded-full bg-red-400/80"></span>
              <span class="flex-1 truncate text-sm text-fg/85">{t.title}</span>
              <span class="text-[11px] text-red-300/80">{dueLabel(t.due_at)}</span>
            </a>
          {/each}
        </div>
      </section>
    {/if}

    {#if birthdays.length}
      <section>
        <h2 class="mb-2 text-xs font-semibold uppercase tracking-wide text-amber-300/80">Birthdays · {birthdays.length}</h2>
        <div class="space-y-1.5">
          {#each birthdays as b (b.p.id)}
            <a href="/people?id={b.p.id}" class="flex items-center gap-3 rounded-lg border border-fg/10 bg-fg/[0.02] px-3 py-2">
              <span>🎂</span>
              <span class="flex-1 truncate text-sm text-fg/85">{fullName(b.p)}</span>
              <span class="text-[11px] text-fg/40">{b.d === 0 ? "today" : `in ${b.d}d`}</span>
            </a>
          {/each}
        </div>
      </section>
    {/if}

    {#if followUps.length}
      <section>
        <h2 class="mb-2 text-xs font-semibold uppercase tracking-wide text-fg/55">Follow-ups · {followUps.length}</h2>
        <div class="space-y-1.5">
          {#each followUps as p (p.id)}
            <a href="/people?id={p.id}" class="flex items-center gap-3 rounded-lg border border-fg/10 bg-fg/[0.02] px-3 py-2">
              <span class="text-fg/40">↻</span>
              <span class="flex-1 truncate text-sm text-fg/85">{fullName(p)}</span>
              <span class="text-[11px] text-fg/40">
                {#if daysSinceInteraction(p) == null}never contacted{:else}{daysSinceInteraction(p)}d ago{/if}
              </span>
            </a>
          {/each}
        </div>
      </section>
    {/if}

    {#if upcomingEvents.length}
      <section>
        <h2 class="mb-2 text-xs font-semibold uppercase tracking-wide text-sky-300/80">Upcoming events · {upcomingEvents.length}</h2>
        <div class="space-y-1.5">
          {#each upcomingEvents as e (e.id)}
            <a href="/calendar" class="flex items-center gap-3 rounded-lg border border-fg/10 bg-fg/[0.02] px-3 py-2">
              <span class="h-2 w-2 shrink-0 rounded-full bg-sky-400/80"></span>
              <span class="flex-1 truncate text-sm text-fg/85">{e.title}</span>
              <span class="text-[11px] text-fg/40">{dueLabel(e.start_at)}</span>
            </a>
          {/each}
        </div>
      </section>
    {/if}
  </div>
{/if}
