<script lang="ts">
  import { onMount } from "svelte";
  import PageHeader from "$lib/components/PageHeader.svelte";
  import DashCard from "$lib/components/DashCard.svelte";
  import Bars from "$lib/components/charts/Bars.svelte";
  import Sparkline from "$lib/components/charts/Sparkline.svelte";
  import {
    tasks as taskDb, projects as projectDb, notes as noteDb, people as peopleDb,
    habits as habitDb, habitCompletions, goals as goalDb, dailyHubs, linkTimestamps,
  } from "$lib/db";
  import { isTauri } from "$lib/platform";
  import { todayKey, startOfDayMs, dueLabel, isOverdue, endOfDayMs } from "$lib/date";
  import { streak, completionRate, recentDays } from "$lib/habits";
  import { fullName, isFollowUpDue, daysUntilBirthday } from "$lib/people";
  import type { Task, Project, Person, Habit, Goal, DailyHub } from "$lib/types";

  const desktop = isTauri();
  const heading = new Intl.DateTimeFormat(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" }).format(new Date());
  const days14 = recentDays(14);
  const days30 = recentDays(30);
  const dayNum = (k: string) => k.slice(8);

  let loading = $state(true);
  let tasks = $state<Task[]>([]);
  let projects = $state<Project[]>([]);
  let notes = $state<number>(0);
  let people = $state<Person[]>([]);
  let habits = $state<Habit[]>([]);
  let habitSets = $state<Record<string, Set<string>>>({});
  let hubs = $state<DailyHub[]>([]);
  let goals = $state<Goal[]>([]);
  let linkTs = $state<number[]>([]);

  async function load() {
    if (!desktop) { loading = false; return; }
    loading = true;
    const [t, ps, ns, pe, hb, gs, lt, hubs30] = await Promise.all([
      taskDb.listAll(), projectDb.listAll(), noteDb.list(), peopleDb.list(),
      habitDb.list(), goalDb.list(), linkTimestamps(),
      dailyHubs.listBetween(days30[0], todayKey()),
    ]);
    const setMap: Record<string, Set<string>> = {};
    await Promise.all(hb.map(async (h) => { setMap[h.id] = new Set((await habitCompletions.forHabit(h.id)).map((c) => c.date)); }));
    tasks = t; projects = ps; notes = ns.length; people = pe;
    habits = hb; habitSets = setMap; goals = gs; linkTs = lt; hubs = hubs30;
    loading = false;
  }
  onMount(load);

  // ---- derived analytics ----
  const activeTasks = $derived(tasks.filter((t) => t.status !== "done"));
  const overdue = $derived(tasks.filter((t) => t.status !== "done" && t.due_at != null && t.due_at < startOfDayMs()).length);
  const activeProjects = $derived(projects.filter((p) => p.status === "active"));
  const today = $derived(tasks.filter((t) => t.status !== "done" && t.due_at != null && t.due_at <= endOfDayMs()).slice(0, 6));

  const completedByDay = $derived(days14.map((k) => tasks.filter((t) => t.completed_at != null && todayKey(new Date(t.completed_at)) === k).length));
  const completedWeek = $derived(completedByDay.slice(-7).reduce((a, b) => a + b, 0));
  const linksByDay = $derived(days14.map((k) => linkTs.filter((ts) => todayKey(new Date(ts)) === k).length));

  const hubMap = $derived(new Map(hubs.map((h) => [h.date, h])));
  const moodSeries = $derived(days30.map((k) => hubMap.get(k)?.mood ?? null));
  const energySeries = $derived(days30.map((k) => hubMap.get(k)?.energy ?? null));
  const avgMood = $derived(avgOf(moodSeries));
  const avgEnergy = $derived(avgOf(energySeries));

  const habitStats = $derived(
    habits.map((h) => { const d = habitSets[h.id] ?? new Set<string>(); return { h, done: d, streak: streak(d), rate: completionRate(d) }; }),
  );
  const goalProg = $derived(
    goals.map((g) => { const linked = projects.filter((p) => p.goal_id === g.id); return { g, progress: linked.length ? Math.round(linked.reduce((s, p) => s + p.progress, 0) / linked.length) : 0, count: linked.length }; }),
  );
  const followUps = $derived(people.filter((p) => isFollowUpDue(p)).slice(0, 5));
  const birthdays = $derived(
    people.map((p) => ({ p, d: daysUntilBirthday(p.birthday) })).filter((x): x is { p: Person; d: number } => x.d != null && x.d <= 30).sort((a, b) => a.d - b.d),
  );

  function avgOf(arr: (number | null)[]): string {
    const v = arr.filter((x): x is number => x != null);
    return v.length ? (v.reduce((a, b) => a + b, 0) / v.length).toFixed(1) : "–";
  }

  async function toggleTask(t: Task) { await taskDb.setStatus(t.id, t.status === "done" ? "todo" : "done"); await load(); }
  async function toggleHabit(h: Habit) {
    const k = todayKey();
    if (habitSets[h.id]?.has(k)) await habitCompletions.unset(h.id, k); else await habitCompletions.set(h.id, k);
    await load();
  }
</script>

<PageHeader title="Dashboard" subtitle={heading} />

{#if !desktop}
  <div class="m-6 rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-200/80">
    The dashboard reads your local database. Launch the desktop app with <code class="rounded bg-black/30 px-1">npm run tauri dev</code> to see it.
  </div>
{:else if loading}
  <div class="p-6 text-sm text-white/40">Loading your life…</div>
{:else}
  <div class="space-y-3 p-6">
    <!-- Overview tiles -->
    <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {#each [
        ["Connected", linkTs.length, "text-sky-300"],
        ["Active tasks", activeTasks.length, "text-white/90"],
        ["Overdue", overdue, overdue > 0 ? "text-red-300" : "text-white/90"],
        ["Projects", activeProjects.length, "text-white/90"],
        ["People", people.length, "text-white/90"],
        ["Notes", notes, "text-white/90"],
      ] as [label, value, cls] (label)}
        <div class="rounded-xl border border-white/10 bg-white/[0.02] p-3">
          <div class="text-2xl font-semibold {cls}">{value}</div>
          <div class="text-[11px] text-white/40">{label}</div>
        </div>
      {/each}
    </div>

    <div class="grid gap-3 lg:grid-cols-3">
      <!-- Productivity -->
      <DashCard title="Productivity" href="/tasks">
        <div class="mb-2 flex items-baseline gap-2">
          <span class="text-2xl font-semibold text-white/90">{completedWeek}</span>
          <span class="text-xs text-white/40">completed this week</span>
        </div>
        <Bars data={completedByDay} labels={days14.map(dayNum)} color="#38bdf8" />
        <div class="mt-2 text-[11px] text-white/35">Last 14 days · {overdue} overdue</div>
      </DashCard>

      <!-- Mood & Energy -->
      <DashCard title="Mood & Energy" href="/daily">
        <div class="mb-1 flex items-center justify-between text-xs text-white/50"><span>Mood</span><span class="text-white/80">avg {avgMood}/10</span></div>
        <Sparkline data={moodSeries} color="#38bdf8" min={0} max={10} height={38} />
        <div class="mb-1 mt-3 flex items-center justify-between text-xs text-white/50"><span>Energy</span><span class="text-white/80">avg {avgEnergy}/10</span></div>
        <Sparkline data={energySeries} color="#34d399" min={0} max={10} height={38} />
        <div class="mt-2 text-[11px] text-white/35">Last 30 days</div>
      </DashCard>

      <!-- Relationships & graph -->
      <DashCard title="Relationships & Graph" href="/people">
        <div class="mb-2 flex items-baseline gap-2">
          <span class="text-2xl font-semibold text-sky-300">{linkTs.length}</span>
          <span class="text-xs text-white/40">connected objects</span>
        </div>
        <Bars data={linksByDay} labels={days14.map(dayNum)} color="#a78bfa" height={40} />
        <div class="mt-3 space-y-1">
          {#each birthdays.slice(0, 2) as b (b.p.id)}
            <a href="/people?id={b.p.id}" class="flex items-center gap-2 text-xs text-amber-200/80">🎂 <span class="flex-1 truncate">{fullName(b.p)}</span><span>{b.d === 0 ? "today" : `${b.d}d`}</span></a>
          {/each}
          {#each followUps.slice(0, 3) as p (p.id)}
            <a href="/people?id={p.id}" class="flex items-center gap-2 text-xs text-white/60">↻ <span class="flex-1 truncate">{fullName(p)}</span></a>
          {/each}
          {#if birthdays.length === 0 && followUps.length === 0}<p class="text-xs text-white/30">All relationships are warm.</p>{/if}
        </div>
      </DashCard>
    </div>

    <div class="grid gap-3 lg:grid-cols-3">
      <!-- Habit consistency -->
      <DashCard title="Habit Consistency" href="/habits">
        {#if habitStats.length === 0}
          <p class="text-xs text-white/30">No habits yet.</p>
        {:else}
          <div class="space-y-2.5">
            {#each habitStats as s (s.h.id)}
              <div>
                <button type="button" onclick={() => toggleHabit(s.h)} class="flex w-full items-center gap-2 text-left">
                  <span class="flex-1 truncate text-sm text-white/85">{s.h.name}</span>
                  <span class="text-[11px] text-white/40">🔥{s.streak} · {s.rate}%</span>
                </button>
                <div class="mt-1 flex gap-[2px]">
                  {#each days14 as d (d)}
                    <span class="h-2 flex-1 rounded-sm" style="background: {s.done.has(d) ? (s.h.color ?? '#34d399') : 'rgba(255,255,255,0.07)'}"></span>
                  {/each}
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </DashCard>

      <!-- Today focus -->
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

      <!-- Goal progress -->
      <DashCard title="Goal Progress">
        {#if goalProg.length === 0}
          <p class="text-xs text-white/30">No goals yet. Link goals from a project.</p>
        {:else}
          <div class="space-y-2.5">
            {#each goalProg as gp (gp.g.id)}
              <div>
                <div class="flex items-center justify-between gap-2"><span class="truncate text-sm text-white/85">{gp.g.title}</span><span class="text-[10px] tabular-nums text-white/40">{gp.progress}%</span></div>
                <div class="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10"><div class="h-full rounded-full bg-indigo-400/80" style="width:{gp.progress}%"></div></div>
              </div>
            {/each}
          </div>
        {/if}
      </DashCard>
    </div>
  </div>
{/if}
