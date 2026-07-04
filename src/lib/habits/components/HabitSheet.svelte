<script lang="ts">
	import type { Habit } from '$lib/habits/types';
	import { habits } from '$lib/habits/store.svelte';
	import { Button } from '$lib/ui';
	import { Trash2 } from '@lucide/svelte';

	let {
		open = $bindable(false),
		habit = null,
		onClose
	}: { open?: boolean; habit?: Habit | null; onClose: () => void } = $props();

	const DAYS = [
		{ n: 1, l: 'Mon' },
		{ n: 2, l: 'Tue' },
		{ n: 3, l: 'Wed' },
		{ n: 4, l: 'Thu' },
		{ n: 5, l: 'Fri' },
		{ n: 6, l: 'Sat' },
		{ n: 0, l: 'Sun' }
	];

	let name = $state('');
	let weekdays = $state<number[]>([]);
	let error = $state('');

	let wasOpen = false;
	$effect(() => {
		if (open && !wasOpen) {
			error = '';
			name = habit?.name ?? '';
			weekdays = habit ? [...habit.weekdays] : [];
		}
		wasOpen = open;
	});

	function toggleDay(n: number) {
		weekdays = weekdays.includes(n) ? weekdays.filter((d) => d !== n) : [...weekdays, n];
	}
	function save() {
		if (!name.trim()) {
			error = 'A name is required.';
			return;
		}
		const data = { name: name.trim(), weekdays: $state.snapshot(weekdays) };
		if (habit) habits.update(habit.id, data);
		else habits.add({ ...data, log: [] });
		onClose();
	}
	function del() {
		if (!confirm('Delete this habit? This cannot be undone.')) return;
		if (habit) habits.remove(habit.id);
		onClose();
	}
	function onkeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') onClose();
	}
	function autofocus(node: HTMLInputElement) {
		node.focus();
	}
</script>

{#if open}
	<div class="overlay" role="presentation" onclick={onClose}>
		<div
			class="sheet"
			role="dialog"
			aria-modal="true"
			aria-label={habit ? 'Edit habit' : 'New habit'}
			tabindex="-1"
			onclick={(e) => e.stopPropagation()}
			{onkeydown}
		>
			<h2>{habit ? 'Edit habit' : 'New habit'}</h2>

			<label class="field">
				<span>Name</span>
				<input bind:value={name} placeholder="e.g. Drink water" use:autofocus />
			</label>

			<div class="field">
				<span>Days {weekdays.length === 0 ? '· every day' : ''}</span>
				<div class="days" role="group" aria-label="Days">
					{#each DAYS as d (d.n)}
						<button
							type="button"
							class:on={weekdays.includes(d.n)}
							aria-pressed={weekdays.includes(d.n)}
							onclick={() => toggleDay(d.n)}
						>
							{d.l}
						</button>
					{/each}
				</div>
			</div>

			{#if error}<p class="error" role="alert">{error}</p>{/if}

			<div class="actions">
				{#if habit}<Button variant="danger" icon={Trash2} onclick={del}>Delete</Button>{/if}
				<span class="spacer"></span>
				<Button variant="ghost" onclick={onClose}>Cancel</Button>
				<Button variant="primary" onclick={save}>Save</Button>
			</div>
		</div>
	</div>
{/if}

<style>
	.overlay {
		position: fixed;
		inset: 0;
		background: rgba(20, 24, 18, 0.4);
		display: flex;
		justify-content: center;
		align-items: flex-start;
		padding: 12vh var(--space-5) var(--space-5);
		z-index: 60;
		overflow: auto;
	}
	.sheet {
		width: min(420px, 96vw);
		background: var(--surface-1);
		border: var(--border-w) solid var(--border-strong);
		border-radius: var(--radius-4);
		box-shadow: var(--shadow-2);
		padding: var(--space-6);
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}
	h2 {
		font-size: var(--text-lg);
	}
	.field {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}
	.field > span {
		font-size: var(--text-xs);
		color: var(--text-2);
	}
	input {
		font: inherit;
		font-size: var(--text-base);
		color: var(--text-1);
		background: var(--surface-2);
		border: var(--border-w) solid var(--border);
		border-radius: var(--radius-3);
		padding: 8px 10px;
		min-height: max(0px, var(--tap-min));
		outline: none;
	}
	input:focus {
		border-color: var(--accent);
	}
	.days {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2);
	}
	.days button {
		font: inherit;
		font-size: var(--text-xs);
		padding: 6px 10px;
		border: var(--border-w) solid var(--border);
		border-radius: var(--radius-2);
		background: var(--surface-1);
		color: var(--text-2);
		cursor: pointer;
		min-width: 42px;
	}
	.days button.on {
		background: var(--accent-tint);
		color: var(--accent-strong);
		border-color: transparent;
		font-weight: var(--weight-medium);
	}
	.error {
		margin: 0;
		font-size: var(--text-sm);
		color: var(--danger);
	}
	.actions {
		display: flex;
		align-items: center;
		gap: var(--space-3);
	}
	.spacer {
		flex: 1;
	}
</style>
