<script lang="ts">
  import { onMount } from "svelte";
  import PageHeader from "$lib/components/PageHeader.svelte";
  import DashCard from "$lib/components/DashCard.svelte";
  import { statusPill } from "$lib/components/projects/ProjectCard.svelte";
  import {
    tasks as taskDb,
    projects as projectDb,
    people as peopleDb,
    habits as habitDb,
    habitCompletions,
    events as eventDb,
    notes as noteDb,
    goals as goalDb,
    dailyHubs,
  } from "$lib/db";
  import { isTauri } from "$lib/platform";
  import { todayKey, dueLabel, isOverdue, endOfDayMs } from "$lib/date";
  import { fullName, isFollowUpDue, daysUntilBirthday } from "$lib/people";
  import type { Task, Project, Person, Habit, CalEvent, Note, Goal, DailyHub } from "$lib/types";

  const desktop = isTauri();
  const key = todayKey();

  let loading = $state(true);
  let today = $state<Task[]>([]);
  let activeProjects = $state<Project[]>([]);
  let people = $state<Person[]>([]);
  let habits = $state<Habit[]>([]);
  let doneHabitIds = $state<Set<string>>(new Set());
  let upcoming = $state<CalEvent[]>([]);
  let recentNotes = $state<Note[]>([]);
  let goals = $state<Goal[]>([]);
  let goalProgress = $state<Record<string, number>>({});
  let hub = $state<DailyHub | null>(null);

  const heading = new Intl.DateTimeFormat(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" }).format(new Date());

  const followUps = $derived(people.filter((p) => isFollowUpDue(p)).slice(0, 5));
  const birthdays = $derived(
    people.map((p) => ({ p, d: daysUntilBirthday(p.birthday) })).filter((x): x is { p: Person; d: number } => x.d != null && x.d <= 14).sort((a, b) => a.d - b.d),
  );

  async function load() {
    if (!desktop) {
      loading = false;
      return;
    }
    loading = true;
    const now = Date.now();
    const [t, ap, pe, hb, comps, ev, ns, gs, allProjects, h] = await Promise.all([
      taskDb.listToday(),
      projectDb.listActive(),
      peopleDb.list(),
      habitDb.list(),
      habitCompletions.forDate(key),
      eventDb.between(now, endOfDayMs(new Date(now + 7 * 86400000))),
      noteDb.list(),
      goalDb.list(),
      projectDb.listAll(),
      dailyHubs.get(key),
    ]);
    today = t.slice(0, 7);
    activeProjects = ap.slice(0, 5);
    people = pe;
    habits = hb;
    doneHabitIds = new Set(comps.map((c) => c.habit_id));
    upcoming = ev.slice(0, 5);
    recentNotes = ns.slice(0, 5);
    goals = gs.slice(0, 5);
    const prog: Record<string, number> = {};
    for (const g of gs) {
      const linked = allProjects.filter((p) => p.goal_id === g.id);
      prog[g.id] = linked.length ? Math.round(linked.reduce((s, p) => s + p.progress, 0) / linked.length) : 0;
    }
    goalProgress = prog;
    hub = h;
    loading = false;
  }

  async function toggleHabit(h: Habit) {
    if (doneHabitIds.has(h.id)) await habitCompletions.unset(h.id, key);
    else await habitCompletions.set(h.id, key);
    await load();
  }

  async function toggleTask(t: Task) {
    await taskDb.setStatus(t.id, t.status === "done" ? "todo" : "done");
    await load();
  }

  onMount(load);
</script>

<PageHeader title="Dashboard" subtitle={heading} />

{#if !desktop}
  <div class="m-6 rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-200/80">
    The dashboard reads your local database. Launch the desktop app with
    <code class="rounded bg-black/30 px-1">npm run tauri dev</code> to see it.
  </div>
{:else if loading}
  <div class="p-6 text-sm text-white/40">Loading your day…</div>
{:else}
  <div class="grid gap-3 p-6 md:grid-cols-2 xl:grid-cols-3">
    <!-- Today Focus -->
    <DashCard title="Today Focus" href="/tasks">
      {#if today.length === 0}
        <p class="text-xs text-white/30">Nothing due today.</p>
      {:else}
        <div class="space-y-1.5">
          {#each today as t (t.id)}
            <button type="button" onclick={() => toggleTask(t)} class="flex w-full items-center gap-2 text-left">
              <span class="flex h-4 w-4 shrink-0 items-center justify-center rounded border border-white/25 text-[10px]">{t.status === "done" ? "✓" : ""}</span>
              <span class="flex-1 truncate text-sm text-white/85">{t.title}</span>
              {#if t.due_at != null}<span class="text-[11px] {isOverdue(t.due_at) ? 'text-red-400' : 'text-white/35'}">{dueLabel(t.due_at)}</span>{/if}
            </button>
          {/each}
        </div>
      {/if}
    </DashCard>

    <!-- Active Projects -->
    <DashCard title="Active Projects" href="/projects">
      {#if activeProjects.length === 0}
        <p class="text-xs text-white/30">No active projects.</p>
      {:else}
        <div class="space-y-2.5">
          {#each activeProjects as p (p.id)}
            <a href="/projects/{p.id}" class="block">
              <div class="flex items-center justify-between gap-2">
                <span class="truncate text-sm text-white/85">{p.name}</span>
                <span class="text-[10px] tabular-nums text-white/40">{p.progress}%</span>
              </div>
              <div class="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10"><div class="h-full rounded-full bg-sky-400/80" style="width:{p.progress}%"></div></div>
            </a>
          {/each}
        </div>
      {/if}
    </DashCard>

    <!-- People Follow-ups -->
    <DashCard title="People Follow-ups" href="/people">
      {#if followUps.length === 0 && birthdays.length === 0}
        <p class="text-xs text-white/30">All caught up.</p>
      {:else}
        <div class="space-y-1.5">
          {#each birthdays as b (b.p.id)}
            <a href="/people?id={b.p.id}" class="flex items-center gap-2 text-sm text-amber-200/80">🎂 <span class="flex-1 truncate">{fullName(b.p)}</span><span class="text-[11px]">{b.d === 0 ? "today" : `${b.d}d`}</span></a>
          {/each}
          {#each followUps as p (p.id)}
            <a href="/people?id={p.id}" class="flex items-center gap-2 text-sm text-white/75">↻ <span class="flex-1 truncate">{fullName(p)}</span></a>
          {/each}
        </div>
      {/if}
    </DashCard>

    <!-- Habit Status -->
    <DashCard title="Habit Status" href="/habits">
      {#if habits.length === 0}
        <p class="text-xs text-white/30">No habits yet.</p>
      {:else}
        <div class="flex flex-wrap gap-1.5">
          {#each habits as h (h.id)}
            <button type="button" onclick={() => toggleHabit(h)} class="rounded-full px-2.5 py-1 text-xs transition-colors {doneHabitIds.has(h.id) ? 'bg-emerald-500/25 text-emerald-200' : 'bg-white/8 text-white/55 hover:bg-white/15'}">
              {doneHabitIds.has(h.id) ? "✓ " : ""}{h.name}
            </button>
          {/each}
        </div>
      {/if}
    </DashCard>

    <!-- Upcoming Events -->
    <DashCard title="Upcoming Events" href="/calendar">
      {#if upcoming.length === 0}
        <p class="text-xs text-white/30">Nothing scheduled.</p>
      {:else}
        <div class="space-y-1.5">
          {#each upcoming as e (e.id)}
            <div class="flex items-center justify-between gap-2 text-sm"><span class="truncate text-white/85">{e.title}</span><span class="text-[11px] text-white/35">{dueLabel(e.start_at)}</span></div>
          {/each}
        </div>
      {/if}
    </DashCard>

    <!-- Daily Hub Preview -->
    <DashCard title="Daily Hub" href="/daily">
      <div class="space-y-2">
        <div class="flex gap-4 text-xs text-white/55">
          <span>Mood <span class="text-white/85">{hub?.mood ?? "–"}/10</span></span>
          <span>Energy <span class="text-white/85">{hub?.energy ?? "–"}/10</span></span>
        </div>
        {#if hub?.journal}
          <p class="line-clamp-3 text-sm text-white/70">{hub.journal}</p>
        {:else}
          <p class="text-xs text-white/30">No journal entry yet today.</p>
        {/if}
      </div>
    </DashCard>

    <!-- Goal Progress -->
    <DashCard title="Goal Progress">
      {#if goals.length === 0}
        <p class="text-xs text-white/30">No goals yet.</p>
      {:else}
        <div class="space-y-2.5">
          {#each goals as g (g.id)}
            <div>
              <div class="flex items-center justify-between gap-2"><span class="truncate text-sm text-white/85">{g.title}</span><span class="text-[10px] tabular-nums text-white/40">{goalProgress[g.id] ?? 0}%</span></div>
              <div class="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10"><div class="h-full rounded-full bg-indigo-400/80" style="width:{goalProgress[g.id] ?? 0}%"></div></div>
            </div>
          {/each}
        </div>
      {/if}
    </DashCard>

    <!-- Knowledge Feed -->
    <DashCard title="Knowledge Feed" href="/notes">
      {#if recentNotes.length === 0}
        <p class="text-xs text-white/30">No notes yet.</p>
      {:else}
        <div class="space-y-1.5">
          {#each recentNotes as n (n.id)}
            <a href="/notes?id={n.id}" class="block truncate text-sm text-white/80 hover:text-white">{n.title || "Untitled"}</a>
          {/each}
        </div>
      {/if}
    </DashCard>
  </div>
{/if}
