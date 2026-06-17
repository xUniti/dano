<script lang="ts">
	import type { CalendarItem } from '$lib/calendar/types';
	import { fmtTime, isSameDay, isToday, minutesOfDay, fmtDayShort } from '$lib/calendar/date';

	let {
		days,
		items,
		onSelect,
		onPickDate,
		onCreateAt,
		isMobile = false
	}: {
		days: Date[];
		items: CalendarItem[];
		onSelect: (item: CalendarItem) => void;
		onPickDate: (date: Date) => void;
		onCreateAt: (date: Date) => void;
		isMobile?: boolean;
	} = $props();

	const HOUR = 44; // px per hour
	const hours = Array.from({ length: 24 }, (_, h) => h);

	function timed(day: Date): CalendarItem[] {
		return items.filter((it) => !it.allDay && isSameDay(it.start, day));
	}
	function allDay(day: Date): CalendarItem[] {
		return items.filter((it) => it.allDay && isSameDay(it.start, day));
	}
	function top(it: CalendarItem): number {
		return (minutesOfDay(it.start) / 60) * HOUR;
	}
	function height(it: CalendarItem): number {
		const mins = Math.max(20, (it.end.getTime() - it.start.getTime()) / 60000);
		return Math.max(20, (mins / 60) * HOUR);
	}
	function hourLabel(h: number): string {
		return new Date(2000, 0, 1, h).toLocaleTimeString(undefined, { hour: 'numeric' });
	}
</script>

<div class="tg" style="--hour: {HOUR}px; --cols: {days.length}">
	<div class="colhead">
		<div class="gutter-sp"></div>
		{#each days as day (day.toISOString())}
			<button
				class="dh"
				class:today={isToday(day)}
				aria-label={isMobile
					? `Open agenda for ${fmtDayShort(day)}`
					: `Add event on ${fmtDayShort(day)}`}
				onclick={() => onPickDate(day)}
			>
				{fmtDayShort(day)}
			</button>
		{/each}
	</div>

	<div class="allday">
		<div class="gutter-sp">All day</div>
		{#each days as day (day.toISOString())}
			<div class="ad-col">
				{#each allDay(day) as it (it.key)}
					<button class="ad" style="--c: {it.color ?? 'var(--accent)'}" onclick={() => onSelect(it)}>
						{it.title}
					</button>
				{/each}
			</div>
		{/each}
	</div>

	<div class="scroll">
		<div class="body" style="height: {24 * HOUR}px">
			<div class="gutter">
				{#each hours as h (h)}
					<div class="hr" style="top: {h * HOUR}px">{hourLabel(h)}</div>
				{/each}
			</div>
			{#each days as day (day.toISOString())}
				<div class="col">
					{#each hours as h (h)}
						<button
							class="slot"
							style="top: {h * HOUR}px; height: {HOUR}px"
							aria-label={isMobile
								? `Open agenda for ${fmtDayShort(day)}`
								: `Add event at ${hourLabel(h)}`}
							onclick={() =>
								isMobile
									? onPickDate(day)
									: onCreateAt(new Date(day.getFullYear(), day.getMonth(), day.getDate(), h, 0))}
						></button>
					{/each}
					{#each timed(day) as it (it.key)}
						<button
							class="ev"
							style="top: {top(it)}px; height: {height(it)}px; --c: {it.color ?? 'var(--accent)'}"
							onclick={() => onSelect(it)}
						>
							<span class="t">{fmtTime(it.start)}</span>
							<span class="n">{it.title}</span>
						</button>
					{/each}
				</div>
			{/each}
		</div>
	</div>
</div>

<style>
	.tg {
		border: var(--border-w) solid var(--border);
		border-radius: var(--radius-4);
		overflow: hidden;
	}
	.colhead,
	.allday {
		display: grid;
		grid-template-columns: 56px repeat(var(--cols, 1), 1fr);
	}
	.colhead {
		border-bottom: var(--border-w) solid var(--border);
		background: var(--surface-2);
	}
	.dh {
		width: 100%;
		padding: 6px 8px;
		font: inherit;
		font-size: var(--text-xs);
		color: var(--text-2);
		text-align: left;
		background: transparent;
		border: none;
		border-left: var(--border-w) solid var(--border);
		cursor: pointer;
	}
	.dh:hover {
		background: var(--surface-1);
		color: var(--text-1);
	}
	.dh.today {
		color: var(--accent-strong);
		font-weight: var(--weight-medium);
	}
	.gutter-sp {
		font-size: var(--text-xs);
		color: var(--text-3);
		padding: 4px 6px;
	}
	.allday {
		border-bottom: var(--border-w) solid var(--border);
		min-height: 28px;
	}
	.ad-col {
		border-left: var(--border-w) solid var(--border);
		padding: 3px;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}
	.ad {
		font: inherit;
		font-size: var(--text-xs);
		text-align: left;
		padding: 2px 6px;
		border: none;
		border-left: 3px solid var(--c);
		border-radius: var(--radius-1);
		background: color-mix(in srgb, var(--c) 16%, var(--surface-1));
		color: var(--text-1);
		cursor: pointer;
	}
	.scroll {
		max-height: 60vh;
		overflow: auto;
	}
	.body {
		position: relative;
		display: grid;
		grid-template-columns: 56px repeat(var(--cols, 1), 1fr);
	}
	.gutter {
		position: relative;
	}
	.hr {
		position: absolute;
		right: 6px;
		transform: translateY(-50%);
		font-size: var(--text-xs);
		color: var(--text-3);
	}
	.col {
		position: relative;
		border-left: var(--border-w) solid var(--border);
	}
	.slot {
		position: absolute;
		left: 0;
		right: 0;
		border: none;
		border-top: var(--border-w) solid var(--border);
		background: transparent;
		cursor: pointer;
		padding: 0;
	}
	.slot:hover {
		background: var(--surface-2);
	}
	.ev {
		position: absolute;
		left: 3px;
		right: 3px;
		display: flex;
		flex-direction: column;
		gap: 1px;
		overflow: hidden;
		padding: 2px 6px;
		border: none;
		border-left: 3px solid var(--c);
		border-radius: var(--radius-2);
		background: color-mix(in srgb, var(--c) 18%, var(--surface-1));
		color: var(--text-1);
		font: inherit;
		text-align: left;
		cursor: pointer;
	}
	.ev .t {
		font-size: var(--text-xs);
		color: var(--text-2);
	}
	.ev .n {
		font-size: var(--text-sm);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
</style>
