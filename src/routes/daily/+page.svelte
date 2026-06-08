<script lang="ts">
  import { onMount } from "svelte";
  import {
    dailyHubs,
    tasks as taskDb,
    events as eventDb,
    habitCompletions,
    habits as habitDb,
    notes as noteDb,
    people as peopleDb,
  } from "$lib/db";
  import { isTauri } from "$lib/platform";
  import { todayKey, startOfDayMs, endOfDayMs } from "$lib/date";
  import { fullName } from "$lib/people";
  import type { DailyHub, Task, CalEvent, Note, Person } from "$lib/types";

  const desktop = isTauri();

  let date = $state(new Date());
  let hub = $state<DailyHub | null>(null);
  let loading = $state(true);

  // aggregation
  let doneTasks = $state<Task[]>([]);
  let dayEvents = $state<CalEvent[]>([]);
  let doneHabits = $state<string[]>([]);
  let dayNotes = $state<Note[]>([]);
  let touchedPeople = $state<Person[]>([]);

  const isToday = $derived(todayKey(date) === todayKey());
  const heading = $derived(
    new Intl.DateTimeFormat(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" }).format(date),
  );

  async function load() {
    if (!desktop) {
      loading = false;
      return;
    }
    loading = true;
    const key = todayKey(date);
    const start = startOfDayMs(date);
    const end = endOfDayMs(date);

    hub = await dailyHubs.ensure(key);

    const [tasksDone, evs, comps, habitList, allNotes, allPeople] = await Promise.all([
      taskDb.completedOn(start, end),
      eventDb.between(start, end),
      habitCompletions.forDate(key),
      habitDb.list(),
      noteDb.list(),
      peopleDb.list(),
    ]);
    doneTasks = tasksDone;
    dayEvents = evs;
    const habitName = new Map(habitList.map((h) => [h.id, h.name]));
    doneHabits = comps.map((c) => habitName.get(c.habit_id) ?? "Habit");
    dayNotes = allNotes.filter((n) => n.created_at >= start && n.created_at <= end);
    touchedPeople = allPeople.filter(
      (p) => p.last_interaction_at != null && p.last_interaction_at >= start && p.last_interaction_at <= end,
    );
    loading = false;
  }

  $effect(() => {
    date;
    if (desktop) load();
  });
  onMount(() => {
    if (desktop) load();
  });

  function shiftDay(delta: number) {
    const d = new Date(date);
    d.setDate(d.getDate() + delta);
    date = d;
  }

  async function setField(patch: Partial<DailyHub>) {
    if (!hub) return;
    await dailyHubs.update(hub.id, patch);
    hub = { ...hub, ...patch };
  }
</script>

{#if !desktop}
  <div class="m-6 rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-200/80">
    The Daily Hub lives in the local database. Launch the desktop app with
    <code class="rounded bg-black/30 px-1">npm run tauri dev</code> to use it.
  </div>
{:else if loading || !hub}
  <div class="p-6 text-sm text-white/40">Loading…</div>
{:else}
  <!-- Day header -->
  <div class="flex items-center gap-3 border-b border-white/10 px-6 py-4">
    <button type="button" onclick={() => shiftDay(-1)} class="rounded-md px-2 py-1 text-white/50 hover:bg-white/5 hover:text-white">←</button>
    <div>
      <h1 class="text-lg font-semibold tracking-tight">{heading}</h1>
      {#if !isToday}<button type="button" onclick={() => (date = new Date())} class="text-xs text-sky-400 hover:underline">Jump to today</button>{/if}
    </div>
    <button type="button" onclick={() => shiftDay(1)} class="rounded-md px-2 py-1 text-white/50 hover:bg-white/5 hover:text-white">→</button>
  </div>

  <div class="mx-auto grid max-w-5xl gap-5 p-6 lg:grid-cols-[1.4fr_1fr]">
    <!-- Left: reflection -->
    <div class="space-y-5">
      <!-- Mood + Energy -->
      <div class="grid grid-cols-2 gap-4">
        {#each [["Mood", hub.mood, (v: number) => setField({ mood: v })], ["Energy", hub.energy, (v: number) => setField({ energy: v })]] as [label, value, set] (label)}
          <div class="rounded-xl border border-white/10 bg-white/[0.02] p-3">
            <div class="mb-2 flex items-center justify-between">
              <span class="text-xs text-white/55">{label}</span>
              <span class="text-xs tabular-nums text-white/40">{value ?? "–"}/10</span>
            </div>
            <div class="flex gap-1">
              {#each Array.from({ length: 10 }, (_, i) => i + 1) as n (n)}
                <button
                  type="button"
                  onclick={() => (set as (v: number) => void)(n)}
                  class="h-6 flex-1 rounded {Number(value) >= n ? (label === 'Mood' ? 'bg-sky-400/70' : 'bg-emerald-400/70') : 'bg-white/8 hover:bg-white/15'}"
                  aria-label="{label} {n}"
                ></button>
              {/each}
            </div>
          </div>
        {/each}
      </div>

      <!-- Journal -->
      <div>
        <div class="mb-1.5 text-xs uppercase tracking-wide text-white/35">Journal</div>
        <textarea
          value={hub.journal}
          onblur={(e) => setField({ journal: (e.currentTarget as HTMLTextAreaElement).value })}
          rows="6"
          placeholder="How was your day? Thoughts, events, feelings…"
          class="w-full resize-y rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2.5 text-sm leading-relaxed outline-none placeholder:text-white/25 focus:border-white/25"
        ></textarea>
      </div>

      <!-- Structured reflection -->
      <div class="grid grid-cols-2 gap-3">
        {#each [["Wins", hub.wins, (v: string) => setField({ wins: v })], ["Challenges", hub.challenges, (v: string) => setField({ challenges: v })], ["Lessons", hub.lessons, (v: string) => setField({ lessons: v })], ["Gratitude", hub.gratitude, (v: string) => setField({ gratitude: v })]] as [label, value, set] (label)}
          <div>
            <div class="mb-1 text-xs text-white/45">{label}</div>
            <textarea
              value={value as string}
              onblur={(e) => (set as (v: string) => void)((e.currentTarget as HTMLTextAreaElement).value)}
              rows="2"
              class="w-full resize-y rounded-lg border border-white/10 bg-white/[0.02] px-2.5 py-1.5 text-sm outline-none focus:border-white/25"
            ></textarea>
          </div>
        {/each}
      </div>
    </div>

    <!-- Right: auto aggregation -->
    <div class="space-y-4">
      <div class="text-xs uppercase tracking-wide text-white/35">Your day, automatically</div>

      {#snippet section(title: string, count: number, emptyText: string)}
        <div class="text-[11px] text-white/40">{title} · {count}</div>
        {#if count === 0}<p class="text-xs text-white/25">{emptyText}</p>{/if}
      {/snippet}

      <div class="rounded-xl border border-white/10 bg-white/[0.02] p-4">
        {@render section("Completed tasks", doneTasks.length, "Nothing completed yet.")}
        <ul class="mt-1 space-y-1">
          {#each doneTasks as t (t.id)}<li class="text-sm text-white/80">✓ {t.title}</li>{/each}
        </ul>
      </div>

      <div class="rounded-xl border border-white/10 bg-white/[0.02] p-4">
        {@render section("Habits", doneHabits.length, "No habits logged.")}
        <div class="mt-1 flex flex-wrap gap-1.5">
          {#each doneHabits as h (h)}<span class="rounded bg-emerald-500/15 px-1.5 py-0.5 text-xs text-emerald-300">{h}</span>{/each}
        </div>
      </div>

      <div class="rounded-xl border border-white/10 bg-white/[0.02] p-4">
        {@render section("Events", dayEvents.length, "No events today.")}
        <ul class="mt-1 space-y-1">
          {#each dayEvents as e (e.id)}<li class="text-sm text-white/80">{e.title}</li>{/each}
        </ul>
      </div>

      <div class="rounded-xl border border-white/10 bg-white/[0.02] p-4">
        {@render section("Notes created", dayNotes.length, "No notes today.")}
        <ul class="mt-1 space-y-1">
          {#each dayNotes as n (n.id)}<li class="truncate text-sm text-white/80">{n.title}</li>{/each}
        </ul>
      </div>

      <div class="rounded-xl border border-white/10 bg-white/[0.02] p-4">
        {@render section("People", touchedPeople.length, "No one yet today.")}
        <div class="mt-1 flex flex-wrap gap-1.5">
          {#each touchedPeople as p (p.id)}<span class="rounded bg-white/10 px-1.5 py-0.5 text-xs text-white/70">{fullName(p)}</span>{/each}
        </div>
      </div>
    </div>
  </div>
{/if}
