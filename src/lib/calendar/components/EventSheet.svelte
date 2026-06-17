<script lang="ts">
	import type { CalendarEvent, RecurFreq, Recurrence, Weekday } from '$lib/calendar/types';
	import { EVENT_COLORS } from '$lib/calendar/types';
	import { calendar } from '$lib/calendar/store.svelte';
	import { toLocalInput, toDateInput } from '$lib/calendar/date';
	import { Button } from '$lib/ui';
	import { Trash2 } from '@lucide/svelte';

	let {
		open = $bindable(false),
		event = null,
		initialDate = null,
		onClose
	}: {
		open?: boolean;
		event?: CalendarEvent | null;
		initialDate?: Date | null;
		onClose: () => void;
	} = $props();

	let title = $state('');
	let allDay = $state(false);
	let startStr = $state('');
	let endStr = $state('');
	let recur = $state<'none' | RecurFreq>('none');
	let color = $state<string>(EVENT_COLORS[0].value);
	let notes = $state('');
	let error = $state('');

	let wasOpen = false;
	$effect(() => {
		if (open && !wasOpen) init();
		wasOpen = open;
	});

	function roundedNextHour(): Date {
		const d = new Date();
		d.setMinutes(0, 0, 0);
		d.setHours(d.getHours() + 1);
		return d;
	}
	function parseInput(v: string): Date {
		return v.length <= 10 ? new Date(`${v}T00:00:00`) : new Date(v);
	}

	function init() {
		error = '';
		if (event) {
			title = event.title;
			allDay = event.allDay;
			const s = new Date(event.start);
			const e = new Date(event.end);
			startStr = allDay ? toDateInput(s) : toLocalInput(s);
			endStr = allDay ? toDateInput(e) : toLocalInput(e);
			recur = event.recurrence?.freq ?? 'none';
			color = event.color ?? EVENT_COLORS[0].value;
			notes = event.notes ?? '';
		} else {
			const base = initialDate ?? roundedNextHour();
			allDay = false;
			title = '';
			startStr = toLocalInput(base);
			endStr = toLocalInput(new Date(base.getTime() + 60 * 60000));
			recur = 'none';
			color = EVENT_COLORS[0].value;
			notes = '';
		}
	}

	function toggleAllDay() {
		const s = parseInput(startStr);
		const e = parseInput(endStr);
		allDay = !allDay;
		if (allDay) {
			startStr = toDateInput(s);
			endStr = toDateInput(e);
		} else {
			startStr = toLocalInput(s);
			endStr = toLocalInput(e);
		}
	}

	function buildRecurrence(freq: RecurFreq, start: Date): Recurrence {
		if (freq === 'weekly') return { freq, interval: 1, weekdays: [start.getDay() as Weekday] };
		return { freq, interval: 1 };
	}

	function save() {
		if (!title.trim()) {
			error = 'Please add a title.';
			return;
		}
		let s = parseInput(startStr);
		let e = parseInput(endStr);
		if (allDay) {
			s = new Date(s.getFullYear(), s.getMonth(), s.getDate(), 0, 0, 0);
			e = new Date(e.getFullYear(), e.getMonth(), e.getDate(), 23, 59, 59);
		}
		if (e < s) {
			error = 'The end is before the start.';
			return;
		}
		const recurrence = recur === 'none' ? null : buildRecurrence(recur, s);
		const data = {
			title: title.trim(),
			start: s.toISOString(),
			end: e.toISOString(),
			allDay,
			recurrence,
			color,
			notes: notes.trim() || null
		};
		if (event) calendar.update(event.id, data);
		else calendar.add(data);
		onClose();
	}

	function del() {
		if (event) calendar.remove(event.id);
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
			aria-label={event ? 'Edit event' : 'New event'}
			tabindex="-1"
			onclick={(e) => e.stopPropagation()}
			{onkeydown}
		>
			<h2>{event ? 'Edit event' : 'New event'}</h2>

			<label class="field">
				<span>Title</span>
				<input bind:value={title} placeholder="What is it?" use:autofocus />
			</label>

			<label class="check">
				<input type="checkbox" checked={allDay} onchange={toggleAllDay} />
				<span>All day</span>
			</label>

			<div class="two">
				<label class="field">
					<span>Starts</span>
					<input type={allDay ? 'date' : 'datetime-local'} bind:value={startStr} />
				</label>
				<label class="field">
					<span>Ends</span>
					<input type={allDay ? 'date' : 'datetime-local'} bind:value={endStr} />
				</label>
			</div>

			<label class="field">
				<span>Repeat</span>
				<select bind:value={recur}>
					<option value="none">Does not repeat</option>
					<option value="daily">Daily</option>
					<option value="weekly">Weekly</option>
					<option value="monthly">Monthly</option>
					<option value="yearly">Yearly</option>
				</select>
			</label>

			<div class="field">
				<span>Colour</span>
				<div class="colors" role="radiogroup" aria-label="Colour">
					{#each EVENT_COLORS as c (c.id)}
						<button
							class="swatch"
							class:on={color === c.value}
							style="--c: {c.value}"
							role="radio"
							aria-checked={color === c.value}
							aria-label={c.label}
							onclick={() => (color = c.value)}
						></button>
					{/each}
				</div>
			</div>

			<label class="field">
				<span>Notes</span>
				<textarea bind:value={notes} rows="2" placeholder="Optional"></textarea>
			</label>

			{#if error}<p class="error" role="alert">{error}</p>{/if}

			<div class="actions">
				{#if event}
					<Button variant="danger" icon={Trash2} onclick={del}>Delete</Button>
				{/if}
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
		padding: 10vh var(--space-5) var(--space-5);
		z-index: 60;
		overflow: auto;
	}
	.sheet {
		width: min(460px, 96vw);
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
		margin-bottom: var(--space-1);
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
	.two {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
		gap: var(--space-4);
	}
	input,
	select,
	textarea {
		font: inherit;
		font-size: var(--text-base);
		color: var(--text-1);
		background: var(--surface-2);
		border: var(--border-w) solid var(--border);
		border-radius: var(--radius-3);
		padding: 8px 10px;
		min-height: max(0px, var(--tap-min));
		width: 100%;
		min-width: 0;
		outline: none;
	}
	input:focus,
	select:focus,
	textarea:focus {
		border-color: var(--accent);
	}
	textarea {
		resize: vertical;
	}
	select {
		appearance: none;
		-webkit-appearance: none;
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%238a8a8a' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
		background-repeat: no-repeat;
		background-position: right 10px center;
		padding-right: 34px;
	}
	.check {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		font-size: var(--text-base);
		cursor: pointer;
	}
	.check input {
		width: 18px;
		height: 18px;
		accent-color: var(--accent);
	}
	.colors {
		display: flex;
		gap: var(--space-3);
	}
	.swatch {
		width: 26px;
		height: 26px;
		border-radius: 50%;
		background: var(--c);
		border: 2px solid transparent;
		cursor: pointer;
	}
	.swatch.on {
		border-color: var(--text-1);
		outline: 2px solid var(--c);
		outline-offset: 1px;
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
		margin-top: var(--space-2);
	}
	.spacer {
		flex: 1;
	}
	@media (max-width: 480px) {
		.two {
			grid-template-columns: 1fr;
		}
	}
</style>
