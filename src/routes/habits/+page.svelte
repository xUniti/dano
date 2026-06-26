<script lang="ts">
	import type { Habit } from '$lib/habits/types';
	import { scheduledOn } from '$lib/habits/types';
	import { habits, streak } from '$lib/habits/store.svelte';
	import { addDays, isToday, ymd } from '$lib/calendar/date';
	import { Button, Checkbox } from '$lib/ui';
	import { Plus, Flame } from '@lucide/svelte';
	import HabitSheet from '$lib/habits/components/HabitSheet.svelte';

	let sheetOpen = $state(false);
	let editing = $state<Habit | null>(null);

	const today = new Date();
	const last7 = $derived(Array.from({ length: 7 }, (_, i) => addDays(today, -(6 - i))));

	function openNew() {
		editing = null;
		sheetOpen = true;
	}
	function openEdit(h: Habit) {
		editing = h;
		sheetOpen = true;
	}
	function dayState(h: Habit, day: Date): 'done' | 'missed' | 'off' {
		if (!scheduledOn(h, day)) return 'off';
		return h.log.includes(ymd(day)) ? 'done' : 'missed';
	}
</script>

<div class="page">
	<header class="ph">
		<h1>Habits</h1>
		<Button variant="primary" icon={Plus} onclick={openNew}>New</Button>
	</header>

	{#if habits.habits.length === 0}
		<div class="empty"><p>No habits yet. Use “New” to add one.</p></div>
	{:else}
		<ul class="list">
			{#each habits.habits as h (h.id)}
				{@const s = streak(h)}
				<li>
					<div class="hrow">
						<button class="hname" onclick={() => openEdit(h)}>{h.name}</button>
						<div class="week" aria-hidden="true">
							{#each last7 as day (day.toISOString())}
								<span class="dot {dayState(h, day)}" class:tday={isToday(day)}></span>
							{/each}
						</div>
						<span class="streak" class:active={s > 0}>
							<Flame size={13} strokeWidth={2} aria-hidden="true" />
							{s}
						</span>
						{#if scheduledOn(h, today)}
							<Checkbox checked={h.log.includes(ymd(today))} onchange={() => habits.toggle(h.id, today)} />
						{:else}
							<span class="rest" title="Not scheduled today">—</span>
						{/if}
					</div>
				</li>
			{/each}
		</ul>
	{/if}

	<HabitSheet bind:open={sheetOpen} habit={editing} onClose={() => ((sheetOpen = false), (editing = null))} />
</div>

<style>
	.page {
		padding: var(--space-6) var(--space-6) var(--space-8);
		max-width: 720px;
		margin: 0 auto;
	}
	.ph {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: var(--space-5);
	}
	.ph h1 {
		font-size: var(--text-xl);
	}
	.list {
		list-style: none;
		margin: 0;
		padding: 0;
		border: var(--border-w) solid var(--border);
		border-radius: var(--radius-4);
		overflow: hidden;
	}
	.list li + li .hrow {
		border-top: var(--border-w) solid var(--border);
	}
	.hrow {
		display: flex;
		align-items: center;
		gap: var(--space-4);
		padding: var(--row-pad-y) var(--space-5);
		min-height: max(48px, var(--tap-min));
	}
	.hname {
		flex: 1;
		min-width: 0;
		border: none;
		background: transparent;
		font: inherit;
		font-size: var(--text-base);
		color: var(--text-1);
		text-align: left;
		cursor: pointer;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.hname:hover {
		color: var(--accent-strong);
	}
	.week {
		display: flex;
		gap: 3px;
		flex: none;
	}
	.dot {
		width: 9px;
		height: 9px;
		border-radius: 50%;
		box-sizing: border-box;
	}
	.dot.done {
		background: var(--accent);
	}
	.dot.missed {
		border: 1.5px solid var(--border-strong);
	}
	.dot.off {
		background: var(--surface-3);
	}
	.dot.tday {
		outline: 2px solid var(--accent-tint);
		outline-offset: 1px;
	}
	.streak {
		display: inline-flex;
		align-items: center;
		gap: 3px;
		flex: none;
		font-size: var(--text-xs);
		color: var(--text-3);
		min-width: 34px;
	}
	.streak.active {
		color: var(--accent-strong);
		font-weight: var(--weight-medium);
	}
	.rest {
		color: var(--text-3);
		width: 16px;
		text-align: center;
	}
	.empty {
		padding: var(--space-8);
		text-align: center;
		color: var(--text-3);
	}
</style>
