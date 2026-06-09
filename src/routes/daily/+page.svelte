<script lang="ts">
  import { onMount, tick } from "svelte";
  import { page } from "$app/stores";
  import {
    dailyHubs,
    tasks as taskDb,
    events as eventDb,
    habitCompletions,
    habits as habitDb,
    notes as noteDb,
    people as peopleDb,
  } from "$lib/db";
  import { link as gLink } from "$lib/graph";
  import { isTauri } from "$lib/platform";
  import { todayKey, startOfDayMs, endOfDayMs } from "$lib/date";
  import { fullName } from "$lib/people";
  import { detectMention, type MentionMatch } from "$lib/mentions";
  import type { DailyHub, Task, CalEvent, Note, Person, EntityType } from "$lib/types";

  const desktop = isTauri();

  let date = $state(new Date());

  // Deep-link from search: /daily?date=YYYY-MM-DD
  $effect(() => {
    const d = $page.url.searchParams.get("date");
    if (d) {
      const parsed = new Date(`${d}T00:00:00`);
      if (!Number.isNaN(parsed.getTime()) && todayKey(parsed) !== todayKey(date)) date = parsed;
    }
  });
  let hub = $state<DailyHub | null>(null);
  let loading = $state(true);

  // aggregation
  let doneTasks = $state<Task[]>([]);
  let dayEvents = $state<CalEvent[]>([]);
  let doneHabits = $state<string[]>([]);
  let dayNotes = $state<Note[]>([]);
  let touchedPeople = $state<Person[]>([]);

  // journal + @mention picker
  let journal = $state("");
  let journalEl = $state<HTMLTextAreaElement | null>(null);
  let mention = $state<MentionMatch | null>(null);
  let mPeople = $state<Person[]>([]);
  let mTasks = $state<Task[]>([]);

  const suggestions = $derived.by(() => {
    if (!mention) return [] as { id: string; label: string; type: EntityType }[];
    const q = mention.query.toLowerCase();
    if (mention.trigger === "@") {
      return mPeople
        .map((p) => ({ id: p.id, label: fullName(p), type: "person" as EntityType }))
        .filter((s) => s.label.toLowerCase().includes(q))
        .slice(0, 6);
    }
    return mTasks
      .map((t) => ({ id: t.id, label: t.title, type: "task" as EntityType }))
      .filter((s) => s.label.toLowerCase().includes(q))
      .slice(0, 6);
  });

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
    journal = hub.journal;

    const [tasksDone, evs, comps, habitList, allNotes, allPeople, allTasks] = await Promise.all([
      taskDb.completedOn(start, end),
      eventDb.between(start, end),
      habitCompletions.forDate(key),
      habitDb.list(),
      noteDb.list(),
      peopleDb.list(),
      taskDb.listAll(),
    ]);
    doneTasks = tasksDone;
    dayEvents = evs;
    const habitName = new Map(habitList.map((h) => [h.id, h.name]));
    doneHabits = comps.map((c) => habitName.get(c.habit_id) ?? "Habit");
    dayNotes = allNotes.filter((n) => n.created_at >= start && n.created_at <= end);
    touchedPeople = allPeople.filter(
      (p) => p.last_interaction_at != null && p.last_interaction_at >= start && p.last_interaction_at <= end,
    );
    mPeople = allPeople;
    mTasks = allTasks;
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

  function onJournalInput() {
    if (!journalEl) return;
    mention = detectMention(journal.slice(0, journalEl.selectionStart));
  }

  async function saveJournal() {
    if (!hub || journal === hub.journal) return;
    await setField({ journal });
  }

  async function chooseMention(s: { id: string; label: string; type: EntityType }) {
    if (!hub || !mention || !journalEl) return;
    const pos = journalEl.selectionStart;
    const insert = `${mention.trigger}${s.label} `;
    journal = journal.slice(0, mention.start) + insert + journal.slice(pos);
    const caret = mention.start + insert.length;
    mention = null;
    await saveJournal();
    // Link the day to the mentioned entity (people.touch fires inside gLink).
    await gLink({ type: "daily_hub", id: hub.id }, { type: s.type, id: s.id }, "mentioned_in");
    await load();
    await tick();
    journalEl.focus();
    journalEl.setSelectionRange(caret, caret);
  }
</script>

{#if !desktop}
  <div class="m-6 rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-200/80">
    The Daily Hub lives in the local database. Launch the desktop app with
    <code class="rounded bg-black/30 px-1">npm run tauri dev</code> to use it.
  </div>
{:else if loading || !hub}
  <div class="p-6 text-sm text-fg/40">Loading…</div>
{:else}
  <!-- Day header -->
  <div class="flex items-center gap-3 border-b border-fg/10 px-6 py-4">
    <button type="button" onclick={() => shiftDay(-1)} class="rounded-md px-2 py-1 text-fg/50 hover:bg-fg/5 hover:text-fg">←</button>
    <div>
      <h1 class="text-lg font-semibold tracking-tight">{heading}</h1>
      {#if !isToday}<button type="button" onclick={() => (date = new Date())} class="text-xs text-accent hover:underline">Jump to today</button>{/if}
    </div>
    <button type="button" onclick={() => shiftDay(1)} class="rounded-md px-2 py-1 text-fg/50 hover:bg-fg/5 hover:text-fg">→</button>
  </div>

  <div class="mx-auto grid max-w-5xl gap-5 p-6 lg:grid-cols-[1.4fr_1fr]">
    <!-- Left: reflection -->
    <div class="space-y-5">
      <!-- Mood + Energy -->
      <div class="grid grid-cols-2 gap-4">
        {#each [["Mood", hub.mood, (v: number) => setField({ mood: v })], ["Energy", hub.energy, (v: number) => setField({ energy: v })]] as [label, value, set] (label)}
          <div class="rounded-xl border border-fg/10 bg-fg/[0.02] p-3">
            <div class="mb-2 flex items-center justify-between">
              <span class="text-xs text-fg/55">{label}</span>
              <span class="text-xs tabular-nums text-fg/40">{value ?? "–"}/10</span>
            </div>
            <div class="flex gap-1">
              {#each Array.from({ length: 10 }, (_, i) => i + 1) as n (n)}
                <button
                  type="button"
                  onclick={() => (set as (v: number) => void)(n)}
                  class="h-6 flex-1 rounded {Number(value) >= n ? (label === 'Mood' ? 'bg-accent/70' : 'bg-emerald-400/70') : 'bg-fg/8 hover:bg-fg/15'}"
                  aria-label="{label} {n}"
                ></button>
              {/each}
            </div>
          </div>
        {/each}
      </div>

      <!-- Journal -->
      <div class="relative">
        <div class="mb-1.5 text-xs uppercase tracking-wide text-fg/35">Journal</div>
        <textarea
          bind:this={journalEl}
          bind:value={journal}
          oninput={onJournalInput}
          onblur={saveJournal}
          onkeydown={(e) => e.key === "Escape" && (mention = null)}
          rows="6"
          placeholder="How was your day? Type @ to mention a person, # to link a task…"
          class="w-full resize-y rounded-xl border border-fg/10 bg-fg/[0.02] px-3 py-2.5 text-sm leading-relaxed outline-none placeholder:text-fg/25 focus:border-fg/25"
        ></textarea>

        {#if mention && suggestions.length > 0}
          <div class="absolute left-3 top-16 z-20 w-72 overflow-hidden rounded-lg border border-fg/15 bg-surface shadow-2xl">
            <div class="border-b border-fg/10 px-3 py-1.5 text-[10px] uppercase tracking-wide text-fg/35">
              {mention.trigger === "@" ? "People" : "Tasks"}
            </div>
            {#each suggestions as s (s.id)}
              <button
                type="button"
                onmousedown={(e) => (e.preventDefault(), chooseMention(s))}
                class="block w-full truncate px-3 py-2 text-left text-sm text-fg/80 hover:bg-fg/10"
              >
                {s.label}
              </button>
            {/each}
          </div>
        {/if}
      </div>

      <!-- Structured reflection -->
      <div class="grid grid-cols-2 gap-3">
        {#each [["Wins", hub.wins, (v: string) => setField({ wins: v })], ["Challenges", hub.challenges, (v: string) => setField({ challenges: v })], ["Lessons", hub.lessons, (v: string) => setField({ lessons: v })], ["Gratitude", hub.gratitude, (v: string) => setField({ gratitude: v })]] as [label, value, set] (label)}
          <div>
            <div class="mb-1 text-xs text-fg/45">{label}</div>
            <textarea
              value={value as string}
              onblur={(e) => (set as (v: string) => void)((e.currentTarget as HTMLTextAreaElement).value)}
              rows="2"
              class="w-full resize-y rounded-lg border border-fg/10 bg-fg/[0.02] px-2.5 py-1.5 text-sm outline-none focus:border-fg/25"
            ></textarea>
          </div>
        {/each}
      </div>
    </div>

    <!-- Right: auto aggregation -->
    <div class="space-y-4">
      <div class="text-xs uppercase tracking-wide text-fg/35">Your day, automatically</div>

      {#snippet section(title: string, count: number, emptyText: string)}
        <div class="text-[11px] text-fg/40">{title} · {count}</div>
        {#if count === 0}<p class="text-xs text-fg/25">{emptyText}</p>{/if}
      {/snippet}

      <div class="rounded-xl border border-fg/10 bg-fg/[0.02] p-4">
        {@render section("Completed tasks", doneTasks.length, "Nothing completed yet.")}
        <ul class="mt-1 space-y-1">
          {#each doneTasks as t (t.id)}<li class="text-sm text-fg/80">✓ {t.title}</li>{/each}
        </ul>
      </div>

      <div class="rounded-xl border border-fg/10 bg-fg/[0.02] p-4">
        {@render section("Habits", doneHabits.length, "No habits logged.")}
        <div class="mt-1 flex flex-wrap gap-1.5">
          {#each doneHabits as h (h)}<span class="rounded bg-emerald-500/15 px-1.5 py-0.5 text-xs text-emerald-300">{h}</span>{/each}
        </div>
      </div>

      <div class="rounded-xl border border-fg/10 bg-fg/[0.02] p-4">
        {@render section("Events", dayEvents.length, "No events today.")}
        <ul class="mt-1 space-y-1">
          {#each dayEvents as e (e.id)}<li class="text-sm text-fg/80">{e.title}</li>{/each}
        </ul>
      </div>

      <div class="rounded-xl border border-fg/10 bg-fg/[0.02] p-4">
        {@render section("Notes created", dayNotes.length, "No notes today.")}
        <ul class="mt-1 space-y-1">
          {#each dayNotes as n (n.id)}<li class="truncate text-sm text-fg/80">{n.title}</li>{/each}
        </ul>
      </div>

      <div class="rounded-xl border border-fg/10 bg-fg/[0.02] p-4">
        {@render section("People", touchedPeople.length, "No one yet today.")}
        <div class="mt-1 flex flex-wrap gap-1.5">
          {#each touchedPeople as p (p.id)}<span class="rounded bg-fg/10 px-1.5 py-0.5 text-xs text-fg/70">{fullName(p)}</span>{/each}
        </div>
      </div>
    </div>
  </div>
{/if}
