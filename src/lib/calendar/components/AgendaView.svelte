<script lang="ts">
	import type { CalendarItem } from '$lib/calendar/types';
	import { fmtDayLong, fmtTime, isToday, ymd } from '$lib/calendar/date';
	import { CalendarDays } from '@lucide/svelte';

	let {
		items,
		onSelect
	}: { items: CalendarItem[]; onSelect: (item: CalendarItem) => void } = $props();

	type Group = { key: string; date: Date; items: CalendarItem[] };
	const groups = $derived.by(() => {
		const map = new Map<string, Group>();
		for (const it of items) {
			const key = ymd(it.start);
			if (!map.has(key)) map.set(key, { key, date: new Date(it.start), items: [] });
			map.get(key)!.items.push(it);
		}
		return [...map.values()].sort((a, b) => a.date.getTime() - b.date.getTime());
	});
</script>

{#if groups.length === 0}
	<div class="empty">
		<CalendarDays size={28} strokeWidth={1.5} aria-hidden="true" />
		<p>Nothing scheduled here. Use “New” to add an event.</p>
	</div>
{:else}
	<div class="agenda">
		{#each groups as g (g.key)}
			<section class="day">
				<h2 class:today={isToday(g.date)}>
					{fmtDayLong(g.date)}
					{#if isToday(g.date)}<span class="badge">Today</span>{/if}
				</h2>
				<ul>
					{#each g.items as it (it.key)}
						<li>
							<button class="item" onclick={() => onSelect(it)}>
								<span class="bar" style="background: {it.color ?? 'var(--accent)'}"></span>
								<span class="time">{it.allDay ? 'All day' : fmtTime(it.start)}</span>
								<span class="title">{it.title}</span>
							</button>
						</li>
					{/each}
				</ul>
			</section>
		{/each}
	</div>
{/if}

<style>
	.agenda {
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
	}
	.day h2 {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		font-size: var(--text-sm);
		font-weight: var(--weight-medium);
		color: var(--text-2);
		padding-bottom: var(--space-2);
		margin-bottom: var(--space-2);
		border-bottom: var(--border-w) solid var(--border);
	}
	.day h2.today {
		color: var(--accent-strong);
	}
	.badge {
		font-size: var(--text-xs);
		background: var(--accent-tint);
		color: var(--accent-strong);
		padding: 1px 7px;
		border-radius: var(--radius-2);
	}
	ul {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 1px;
	}
	.item {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		width: 100%;
		padding: var(--row-pad-y) var(--space-3);
		min-height: max(36px, var(--tap-min));
		border: none;
		background: transparent;
		font: inherit;
		text-align: left;
		color: var(--text-1);
		border-radius: var(--radius-2);
		cursor: pointer;
	}
	.item:hover {
		background: var(--surface-2);
	}
	.bar {
		flex: none;
		width: 3px;
		height: 16px;
		border-radius: 2px;
	}
	.time {
		flex: none;
		width: 64px;
		font-size: var(--text-xs);
		color: var(--text-2);
	}
	.title {
		flex: 1;
		min-width: 0;
		font-size: var(--text-base);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-4);
		padding: var(--space-8);
		color: var(--text-3);
		text-align: center;
	}
	.empty p {
		margin: 0;
		font-size: var(--text-base);
	}
</style>
