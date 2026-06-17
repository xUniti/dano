<script lang="ts">
	import type { CalendarItem } from '$lib/calendar/types';
	import {
		monthGrid,
		weekdayLabels,
		isSameDay,
		isSameMonth,
		isToday,
		fmtDayLong,
		fmtTime
	} from '$lib/calendar/date';

	let {
		cursor,
		items,
		onPickDate,
		onSelect,
		isMobile = false
	}: {
		cursor: Date;
		items: CalendarItem[];
		onPickDate: (date: Date) => void;
		onSelect: (eventId: string) => void;
		isMobile?: boolean;
	} = $props();

	const days = $derived(monthGrid(cursor));
	const labels = weekdayLabels();

	function itemsFor(day: Date): CalendarItem[] {
		return items.filter((it) => isSameDay(it.start, day));
	}
</script>

<div class="month">
	<div class="head" role="row">
		{#each labels as l (l)}<div class="hl" role="columnheader">{l}</div>{/each}
	</div>
	<div class="grid" role="grid" aria-label="Month">
		{#each days as day (day.toISOString())}
			{@const dayItems = itemsFor(day)}
			<div
				class="cell"
				class:out={!isSameMonth(day, cursor)}
				class:today={isToday(day)}
				role="gridcell"
			>
				<button
					class="num"
					class:istoday={isToday(day)}
					onclick={() => onPickDate(day)}
					aria-label={isMobile
						? `Open agenda for ${fmtDayLong(day)}`
						: `Add event on ${fmtDayLong(day)}`}
				>
					{day.getDate()}
				</button>
				<div class="items">
					{#each dayItems.slice(0, 3) as it (it.key)}
						<button class="chip" onclick={() => onSelect(it.eventId)} title={it.title}>
							<span class="dot" style="background: {it.color ?? 'var(--accent)'}"></span>
							{#if !it.allDay}<span class="t">{fmtTime(it.start)}</span>{/if}
							<span class="n">{it.title}</span>
						</button>
					{/each}
					{#if dayItems.length > 3}
						<button class="more" onclick={() => onSelect(dayItems[3].eventId)}>
							+{dayItems.length - 3} more
						</button>
					{/if}
				</div>
			</div>
		{/each}
	</div>
</div>

<style>
	.month {
		border: var(--border-w) solid var(--border);
		border-radius: var(--radius-4);
		overflow: hidden;
	}
	.head {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		background: var(--surface-2);
		border-bottom: var(--border-w) solid var(--border);
	}
	.hl {
		padding: 6px 8px;
		font-size: var(--text-xs);
		color: var(--text-3);
		text-align: left;
	}
	.grid {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		grid-auto-rows: minmax(92px, 1fr);
	}
	.cell {
		border-right: var(--border-w) solid var(--border);
		border-bottom: var(--border-w) solid var(--border);
		padding: 4px;
		display: flex;
		flex-direction: column;
		gap: 3px;
		min-width: 0;
	}
	.cell:nth-child(7n) {
		border-right: none;
	}
	.cell.out {
		background: var(--surface-2);
	}
	.cell.out .num {
		color: var(--text-3);
	}
	.num {
		align-self: flex-start;
		min-width: 22px;
		height: 22px;
		padding: 0 4px;
		border: none;
		background: transparent;
		font: inherit;
		font-size: var(--text-xs);
		color: var(--text-2);
		border-radius: var(--radius-pill);
		cursor: pointer;
	}
	.num:hover {
		background: var(--surface-3);
	}
	.num.istoday {
		background: var(--accent);
		color: var(--text-on-accent);
		font-weight: var(--weight-medium);
	}
	.items {
		display: flex;
		flex-direction: column;
		gap: 2px;
		min-width: 0;
	}
	.chip {
		display: flex;
		align-items: center;
		gap: 4px;
		width: 100%;
		padding: 1px 4px;
		border: none;
		background: transparent;
		font: inherit;
		font-size: var(--text-xs);
		color: var(--text-1);
		text-align: left;
		border-radius: var(--radius-1);
		cursor: pointer;
		min-width: 0;
	}
	.chip:hover {
		background: var(--surface-2);
	}
	.dot {
		flex: none;
		width: 6px;
		height: 6px;
		border-radius: 50%;
	}
	.chip .t {
		flex: none;
		color: var(--text-3);
	}
	.chip .n {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.more {
		border: none;
		background: transparent;
		font: inherit;
		font-size: var(--text-xs);
		color: var(--text-3);
		text-align: left;
		padding: 1px 4px;
		cursor: pointer;
	}
	.more:hover {
		color: var(--text-1);
	}
</style>
