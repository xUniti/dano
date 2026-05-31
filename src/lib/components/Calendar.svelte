<script lang="ts">
  import { store } from "$lib/store.svelte";
  import type { CalItem } from "$lib/types";
  import {
    startOfDay, sameDay, isToday, weekdayLabels, dayLabel,
  } from "$lib/date";
  import DatePicker from "$lib/components/DatePicker.svelte";

  const anchorDate = $derived(new Date(store.calAnchor));
  const periodLabel = $derived(
    store.calMode === "month"
      ? anchorDate.toLocaleDateString([], { month: "long", year: "numeric" })
      : store.calMode === "week"
        ? "Week of " + weekStart().toLocaleDateString([], { month: "short", day: "numeric" })
        : "Agenda",
  );

  function weekStart(): Date {
    const a = new Date(store.calAnchor);
    const dow = (a.getDay() + 6) % 7;
    return new Date(a.getFullYear(), a.getMonth(), a.getDate() - dow);
  }

  // 42 day cells for the month grid (6 weeks).
  const monthDays = $derived.by(() => {
    const a = new Date(store.calAnchor);
    const first = new Date(a.getFullYear(), a.getMonth(), 1);
    const startDow = (first.getDay() + 6) % 7;
    const start = new Date(first.getFullYear(), first.getMonth(), 1 - startDow);
    return Array.from({ length: 42 }, (_, i) =>
      new Date(start.getFullYear(), start.getMonth(), start.getDate() + i).getTime(),
    );
  });

  const weekDays = $derived.by(() => {
    const s = weekStart();
    return Array.from({ length: 7 }, (_, i) =>
      new Date(s.getFullYear(), s.getMonth(), s.getDate() + i).getTime(),
    );
  });

  function itemsOn(day: number): CalItem[] {
    return store.calItems.filter((it) => sameDay(it.at, day));
  }
  function inCurrentMonth(day: number): boolean {
    return new Date(day).getMonth() === anchorDate.getMonth();
  }
  const glyph = (k: CalItem["kind"]) => (k === "event" ? "●" : k === "project" ? "◆" : k === "contactdate" ? "♥" : "□");

  // Agenda: group items by day.
  const agendaGroups = $derived.by(() => {
    const map = new Map<number, CalItem[]>();
    for (const it of store.calItems) {
      const d = startOfDay(it.at);
      if (!map.has(d)) map.set(d, []);
      map.get(d)!.push(it);
    }
    return [...map.entries()].sort((a, b) => a[0] - b[0]);
  });
</script>

<section class="cal">
  <header class="head">
    <div class="nav">
      <button class="ico" onclick={() => store.calStep(-1)} title="Previous">‹</button>
      <button class="today" onclick={() => store.calToday()}>today</button>
      <button class="ico" onclick={() => store.calStep(1)} title="Next">›</button>
      <span class="period">{periodLabel}</span>
    </div>
    <div class="modes">
      <button class:on={store.calMode === "month"} onclick={() => store.setCalMode("month")}>Month</button>
      <button class:on={store.calMode === "week"} onclick={() => store.setCalMode("week")}>Week</button>
      <button class:on={store.calMode === "agenda"} onclick={() => store.setCalMode("agenda")}>Agenda</button>
    </div>
  </header>

  {#if store.calMode === "month"}
    <div class="weekhead">
      {#each weekdayLabels as w (w)}<span>{w}</span>{/each}
    </div>
    <div class="grid">
      {#each monthDays as day (day)}
        <div class="cell" class:dim={!inCurrentMonth(day)} class:today={isToday(day)}>
          <div class="cell-head">
            <span class="num">{new Date(day).getDate()}</span>
            <button class="addday" title="New event" onclick={() => store.newEvent(day)}>+</button>
          </div>
          <div class="cell-items">
            {#each itemsOn(day).slice(0, 4) as it (it.kind + it.id)}
              <button class="chip {it.kind}" onclick={() => store.openCalItem(it)}>
                <span class="cg">{glyph(it.kind)}</span><span class="ct">{it.title || "Untitled"}</span>
              </button>
            {/each}
            {#if itemsOn(day).length > 4}<span class="more">+{itemsOn(day).length - 4}</span>{/if}
          </div>
        </div>
      {/each}
    </div>
  {:else if store.calMode === "week"}
    <div class="week">
      {#each weekDays as day (day)}
        <div class="wcol" class:today={isToday(day)}>
          <div class="wcol-head">
            <span class="wd">{new Date(day).toLocaleDateString([], { weekday: "short" })}</span>
            <span class="wn">{new Date(day).getDate()}</span>
            <button class="addday" title="New event" onclick={() => store.newEvent(day)}>+</button>
          </div>
          <div class="wcol-items">
            {#each itemsOn(day) as it (it.kind + it.id)}
              <button class="chip {it.kind} block" onclick={() => store.openCalItem(it)}>
                <span class="cg">{glyph(it.kind)}</span><span class="ct">{it.title || "Untitled"}</span>
              </button>
            {/each}
          </div>
        </div>
      {/each}
    </div>
  {:else}
    <div class="agenda">
      {#if agendaGroups.length === 0}
        <p class="muted">Nothing scheduled in the next 60 days.</p>
      {:else}
        {#each agendaGroups as [day, items] (day)}
          <div class="ag-day">
            <div class="ag-date" class:today={isToday(day)}>{dayLabel(day)}</div>
            <div class="ag-items">
              {#each items as it (it.kind + it.id)}
                <button class="ag-item" onclick={() => store.openCalItem(it)}>
                  <span class="cg {it.kind}">{glyph(it.kind)}</span>
                  <span class="ai-main"><span class="ai-title">{it.title || "Untitled"}</span>{#if it.context}<span class="ai-ctx">{it.context}</span>{/if}</span>
                </button>
              {/each}
            </div>
          </div>
        {/each}
      {/if}
    </div>
  {/if}
</section>

{#if store.activeEvent}
  {@const ev = store.activeEvent}
  <div
    class="overlay"
    onclick={() => store.closeEvent()}
    onkeydown={(e) => { if (e.key === "Escape") store.closeEvent(); }}
    role="button"
    tabindex="-1"
    aria-label="Close dialog"
  >
    <div class="dialog" onclick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" tabindex="-1">
      <div class="dlg-head">
        <span>Event</span>
        <button class="x" onclick={() => store.closeEvent()}>×</button>
      </div>
      <input
        class="dlg-title"
        placeholder="Event title…"
        value={ev.title}
        oninput={(e) => store.saveEvent({ title: (e.target as HTMLInputElement).value })}
      />
      <label class="dlg-field">
        Date
        <DatePicker value={ev.start_at} onpick={(ms) => { if (ms != null) store.saveEvent({ start_at: ms }); }} />
      </label>
      <textarea
        class="dlg-notes"
        placeholder="Notes…"
        value={ev.notes}
        oninput={(e) => store.saveEvent({ notes: (e.target as HTMLTextAreaElement).value })}
      ></textarea>
      <div class="dlg-actions">
        <button class="del" onclick={() => store.deleteEvent()}>delete</button>
        <button class="done" onclick={() => store.closeEvent()}>done</button>
      </div>
    </div>
  </div>
{/if}

<style>
  .cal { flex: 1; height: 100%; display: flex; flex-direction: column; background: var(--bg); min-width: 0; overflow: hidden; }
  .head { display: flex; align-items: center; justify-content: space-between; padding: 16px 24px; border-bottom: 1px solid var(--border-soft); }
  .nav { display: flex; align-items: center; gap: 6px; }
  .ico { width: 26px; height: 26px; border-radius: var(--radius); color: var(--fg-dim); font-size: 16px; }
  .ico:hover { background: var(--bg-elev); color: var(--fg); }
  .today { font-size: 11px; color: var(--fg-dim); padding: 4px 9px; border: 1px solid var(--border); border-radius: var(--radius); }
  .today:hover { background: var(--bg-elev); color: var(--fg); }
  .period { margin-left: 10px; font-size: 15px; font-weight: 700; color: var(--fg); }
  .modes { display: flex; gap: 2px; background: var(--bg-inset); border: 1px solid var(--border); border-radius: var(--radius); padding: 2px; }
  .modes button { font-size: 11px; color: var(--fg-dim); padding: 4px 10px; border-radius: 4px; }
  .modes button.on { background: var(--bg-elev); color: var(--fg); }

  .weekhead { display: grid; grid-template-columns: repeat(7, 1fr); padding: 6px 24px 0; }
  .weekhead span { font-size: 10px; text-transform: uppercase; letter-spacing: 0.6px; color: var(--fg-faint); text-align: left; padding-left: 4px; }

  .grid { flex: 1; display: grid; grid-template-columns: repeat(7, 1fr); grid-auto-rows: 1fr; gap: 1px; padding: 4px 24px 24px; min-height: 0; }
  .cell { background: var(--bg-inset); border: 1px solid var(--border-soft); border-radius: 4px; padding: 4px; display: flex; flex-direction: column; min-height: 0; overflow: hidden; }
  .cell.dim { opacity: 0.4; }
  .cell.today { border-color: var(--accent); }
  .cell-head { display: flex; align-items: center; justify-content: space-between; }
  .num { font-size: 11px; color: var(--fg-dim); }
  .cell.today .num { color: var(--accent); font-weight: 700; }
  .addday { opacity: 0; color: var(--fg-faint); font-size: 13px; width: 16px; border-radius: 4px; }
  .cell:hover .addday { opacity: 1; }
  .addday:hover { color: var(--accent); }
  .cell-items { display: flex; flex-direction: column; gap: 2px; margin-top: 2px; overflow: hidden; }

  .chip { display: flex; align-items: center; gap: 4px; text-align: left; padding: 1px 4px; border-radius: 3px; font-size: 10.5px; color: var(--fg); }
  .chip:hover { background: var(--bg-elev); }
  .chip .cg { flex: 0 0 auto; font-size: 7px; }
  .chip.event .cg { color: var(--accent); }
  .chip.project .cg { color: var(--accent); }
  .chip.task .cg { color: var(--fg-faint); }
  .chip.contactdate .cg { color: var(--accent); }
  .chip .ct { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .chip.block { background: var(--bg-inset); border: 1px solid var(--border-soft); padding: 3px 6px; }
  .more { font-size: 9.5px; color: var(--fg-faint); padding-left: 4px; }

  .week { flex: 1; display: grid; grid-template-columns: repeat(7, 1fr); gap: 1px; padding: 8px 24px 24px; min-height: 0; }
  .wcol { background: var(--bg-inset); border: 1px solid var(--border-soft); border-radius: 4px; display: flex; flex-direction: column; overflow: hidden; }
  .wcol.today { border-color: var(--accent); }
  .wcol-head { display: flex; align-items: center; gap: 5px; padding: 6px 8px; border-bottom: 1px solid var(--border-soft); }
  .wd { font-size: 10px; text-transform: uppercase; color: var(--fg-faint); }
  .wn { font-size: 12px; font-weight: 700; color: var(--fg-dim); }
  .wcol.today .wn { color: var(--accent); }
  .wcol-head .addday { margin-left: auto; opacity: 1; }
  .wcol-items { flex: 1; overflow-y: auto; padding: 6px; display: flex; flex-direction: column; gap: 4px; }

  .agenda { flex: 1; overflow-y: auto; padding: 16px 28px 28px; max-width: 720px; }
  .muted { color: var(--fg-faint); font-size: 12px; }
  .ag-day { display: flex; gap: 16px; padding: 8px 0; border-bottom: 1px solid var(--border-soft); }
  .ag-date { flex: 0 0 130px; font-size: 12px; color: var(--fg-dim); padding-top: 6px; }
  .ag-date.today { color: var(--accent); font-weight: 700; }
  .ag-items { flex: 1; display: flex; flex-direction: column; gap: 2px; }
  .ag-item { display: flex; align-items: center; gap: 10px; padding: 6px 8px; border-radius: var(--radius); text-align: left; }
  .ag-item:hover { background: var(--bg-elev); }
  .cg.event, .cg.project { color: var(--accent); }
  .cg.contactdate { color: var(--accent); }
  .cg.task { color: var(--fg-faint); }
  .ai-main { display: flex; flex-direction: column; min-width: 0; }
  .ai-title { color: var(--fg); font-size: 13px; }
  .ai-ctx { color: var(--fg-faint); font-size: 10.5px; }

  .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.45); display: flex; align-items: center; justify-content: center; z-index: 50; }
  .dialog { width: 360px; max-width: 90vw; background: var(--bg-inset); border: 1px solid var(--border); border-radius: 8px; padding: 16px; box-shadow: 0 16px 48px rgba(0,0,0,0.4); }
  .dlg-head { display: flex; align-items: center; justify-content: space-between; font-size: 11px; text-transform: uppercase; letter-spacing: 0.6px; color: var(--fg-faint); margin-bottom: 10px; }
  .dlg-head .x { font-size: 18px; color: var(--fg-faint); }
  .dlg-head .x:hover { color: var(--fg); }
  .dlg-title { width: 100%; background: transparent; border: none; border-bottom: 1px solid var(--border); outline: none; font-size: 16px; font-weight: 700; color: var(--fg); padding: 4px 0; margin-bottom: 12px; }
  .dlg-field { display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--fg-dim); margin-bottom: 12px; }
  .dlg-notes { width: 100%; min-height: 70px; resize: vertical; background: var(--bg); color: var(--fg); border: 1px solid var(--border); border-radius: var(--radius); padding: 8px; font-size: 12px; font-family: inherit; outline: none; margin-bottom: 12px; }
  .dlg-notes::placeholder { color: var(--fg-faint); }
  .dlg-actions { display: flex; align-items: center; justify-content: space-between; }
  .del { color: var(--fg-faint); font-size: 12px; padding: 5px 10px; border-radius: var(--radius); }
  .del:hover { color: var(--danger); }
  .done { color: var(--accent); font-size: 12px; padding: 5px 14px; border: 1px solid var(--border); border-radius: var(--radius); }
  .done:hover { background: var(--bg-elev); }
</style>
