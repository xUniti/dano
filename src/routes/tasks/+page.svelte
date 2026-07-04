<script lang="ts">
	import type { Task, Priority } from '$lib/tasks/types';
	import { PRIORITIES } from '$lib/tasks/types';
	import { tasks } from '$lib/tasks/store.svelte';
	import { goto } from '$app/navigation';
	import { Checkbox, Card } from '$lib/ui';
	import { Plus, ChevronRight } from '@lucide/svelte';
	import { ymd } from '$lib/calendar/date';

	let draft = $state('');
	const today = ymd(new Date());

	const sorted = $derived(
		tasks.tasks
			.filter((t) => !t.archived)
			.sort((a, b) => {
			if (a.done !== b.done) return a.done ? 1 : -1;
			const ad = a.dueDate ?? '9999-99-99';
			const bd = b.dueDate ?? '9999-99-99';
			if (ad !== bd) return ad < bd ? -1 : 1;
			return a.title.localeCompare(b.title);
		})
	);

	function addTask() {
		const t = draft.trim();
		if (!t) return;
		tasks.add({
			title: t,
			done: false,
			dueDate: null,
			priority: null,
			personaId: null,
			projectId: null,
			notes: null
		});
		draft = '';
	}
	function toggle(t: Task) {
		tasks.update(t.id, { done: !t.done });
	}
	function dueLabel(s: string): string {
		const [y, m, d] = s.split('-').map(Number);
		return new Date(y, m - 1, d).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
	}
	function overdue(t: Task): boolean {
		return !t.done && !!t.dueDate && t.dueDate < today;
	}
	function priColor(p: Priority): string {
		return PRIORITIES.find((x) => x.value === p)?.color ?? 'var(--text-3)';
	}
</script>

<div class="page">
	<header class="ph"><h1>Tasks</h1></header>

	<div class="add">
		<Plus size={15} strokeWidth={1.75} aria-hidden="true" />
		<input
			bind:value={draft}
			placeholder="Add a task and press Enter…"
			aria-label="Add a task"
			onkeydown={(e) => e.key === 'Enter' && addTask()}
		/>
	</div>

	{#if sorted.length === 0}
		<div class="empty"><p>No tasks yet. Add one above.</p></div>
	{:else}
		<Card pad={false}>
			<ul class="list">
				{#each sorted as t (t.id)}
					<li>
						<div class="row">
							<Checkbox checked={t.done} onchange={() => toggle(t)} />
							<button class="title" class:done={t.done} onclick={() => goto(`/tasks/${t.id}`)}>
								{t.title}
							</button>
							{#if t.priority}
								<span class="pri" style="background: {priColor(t.priority)}" title="{t.priority} priority"></span>
							{/if}
							{#if t.dueDate}
								<span class="due" class:over={overdue(t)}>{dueLabel(t.dueDate)}</span>
							{/if}
							<ChevronRight size={16} strokeWidth={1.75} aria-hidden="true" class="chev" />
						</div>
					</li>
				{/each}
			</ul>
		</Card>
	{/if}
</div>

<style>
	.page {
		padding: var(--space-6) var(--space-6) var(--space-8);
		max-width: 720px;
		margin: 0 auto;
	}
	.ph h1 {
		font-size: var(--text-xl);
		margin-bottom: var(--space-5);
	}
	.add {
		display: flex;
		align-items: center;
		gap: 8px;
		background: var(--surface-2);
		border: var(--border-w) solid var(--border);
		border-radius: var(--radius-3);
		padding: 0 11px;
		margin-bottom: var(--space-5);
		color: var(--text-3);
	}
	.add input {
		flex: 1;
		min-width: 0;
		border: none;
		background: transparent;
		font: inherit;
		font-size: var(--text-base);
		color: var(--text-1);
		padding: 10px 0;
		outline: none;
	}
	.list {
		list-style: none;
		margin: 0;
		padding: 0;
	}
	.list li + li .row {
		border-top: var(--border-w) solid var(--border);
	}
	.row {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		padding: var(--row-pad-y) var(--space-5);
		min-height: max(44px, var(--tap-min));
	}
	.title {
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
		padding: 4px 0;
	}
	.title:hover {
		color: var(--accent-strong);
	}
	.title.done {
		color: var(--text-3);
		text-decoration: line-through;
	}
	.pri {
		flex: none;
		width: 8px;
		height: 8px;
		border-radius: 50%;
	}
	.due {
		flex: none;
		font-size: var(--text-xs);
		color: var(--text-2);
		background: var(--surface-2);
		padding: 2px 8px;
		border-radius: var(--radius-2);
	}
	.due.over {
		background: var(--danger-tint);
		color: var(--danger);
	}
	.row :global(.chev) {
		flex: none;
		color: var(--text-3);
	}
	.empty {
		padding: var(--space-8);
		text-align: center;
		color: var(--text-3);
	}
	.empty p {
		margin: 0;
	}
</style>
