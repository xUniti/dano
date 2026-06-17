<script lang="ts">
	import type { CalendarView } from '$lib/calendar/types';
	import { ChevronLeft, ChevronRight, Plus } from '@lucide/svelte';
	import { Button } from '$lib/ui';

	let {
		title,
		view,
		onPrev,
		onNext,
		onToday,
		onView,
		onNew
	}: {
		title: string;
		view: CalendarView;
		onPrev: () => void;
		onNext: () => void;
		onToday: () => void;
		onView: (v: CalendarView) => void;
		onNew: () => void;
	} = $props();

	const views: { id: CalendarView; label: string }[] = [
		{ id: 'agenda', label: 'Agenda' },
		{ id: 'day', label: 'Day' },
		{ id: 'week', label: 'Week' },
		{ id: 'month', label: 'Month' }
	];
</script>

<header class="ch">
	<div class="row1">
		<h1 aria-live="polite">{title}</h1>
		<div class="nav">
			<button class="ico" onclick={onPrev} aria-label="Previous">
				<ChevronLeft size={18} strokeWidth={1.75} aria-hidden="true" />
			</button>
			<button class="today" onclick={onToday}>Today</button>
			<button class="ico" onclick={onNext} aria-label="Next">
				<ChevronRight size={18} strokeWidth={1.75} aria-hidden="true" />
			</button>
		</div>
	</div>
	<div class="row2">
		<div class="seg" role="group" aria-label="Calendar view">
			{#each views as v (v.id)}
				<button class:on={view === v.id} aria-pressed={view === v.id} onclick={() => onView(v.id)}>
					{v.label}
				</button>
			{/each}
		</div>
		<Button variant="primary" icon={Plus} onclick={onNew}>New</Button>
	</div>
</header>

<style>
	.ch {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
		margin-bottom: var(--space-5);
	}
	.row1,
	.row2 {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-5);
		flex-wrap: wrap;
	}
	h1 {
		font-size: var(--text-xl);
	}
	.nav {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
	}
	.ico {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		min-height: max(32px, var(--tap-min));
		min-width: max(32px, var(--tap-min));
		border: var(--border-w) solid var(--border);
		border-radius: var(--radius-2);
		background: var(--surface-1);
		color: var(--text-1);
		cursor: pointer;
	}
	.ico:hover {
		background: var(--surface-2);
	}
	.today {
		font: inherit;
		font-size: var(--text-sm);
		padding: 6px 12px;
		min-height: max(0px, var(--tap-min));
		border: var(--border-w) solid var(--border);
		border-radius: var(--radius-2);
		background: var(--surface-1);
		color: var(--text-1);
		cursor: pointer;
	}
	.today:hover {
		background: var(--surface-2);
	}
	.seg {
		display: inline-flex;
		border: var(--border-w) solid var(--border);
		border-radius: var(--radius-3);
		overflow: hidden;
	}
	.seg button {
		font: inherit;
		font-size: var(--text-sm);
		padding: 6px 12px;
		min-height: max(0px, var(--tap-min));
		background: var(--surface-1);
		color: var(--text-2);
		border: none;
		border-left: var(--border-w) solid var(--border);
		cursor: pointer;
	}
	.seg button:first-child {
		border-left: none;
	}
	.seg button.on {
		background: var(--accent-tint);
		color: var(--accent-strong);
		font-weight: var(--weight-medium);
	}
</style>
