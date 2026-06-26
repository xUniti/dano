<script lang="ts">
	import { projects } from '$lib/projects/store.svelte';
	import { PROJECT_STATUSES } from '$lib/projects/types';
	import { tasks } from '$lib/tasks/store.svelte';
	import { areas } from '$lib/areas/store.svelte';
	import { goto } from '$app/navigation';
	import { Button, Badge } from '$lib/ui';
	import { Plus, Calendar } from '@lucide/svelte';

	const sorted = $derived(
		projects.projects
			.filter((p) => !p.archived)
			.sort((a, b) => {
			const order = { active: 0, 'on-hold': 1, done: 2 };
			if (order[a.status] !== order[b.status]) return order[a.status] - order[b.status];
			return a.name.localeCompare(b.name);
		})
	);

	function statusLabel(s: string): string {
		return PROJECT_STATUSES.find((x) => x.value === s)?.label ?? s;
	}
	function taskCount(id: string): number {
		return tasks.tasks.filter((t) => t.projectId === id).length;
	}
	function fmtDue(s: string): string {
		const [y, m, d] = s.split('-').map(Number);
		return new Date(y, m - 1, d).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
	}
	function newProject() {
		const p = projects.add({
			name: '',
			areaId: areas.areas[0]?.id ?? null,
			personaId: null,
			dueDate: null,
			description: null,
			status: 'active'
		});
		goto(`/projects/${p.id}`);
	}
</script>

<div class="page">
	<header class="ph">
		<h1>Projects</h1>
		<Button variant="primary" icon={Plus} onclick={newProject}>New</Button>
	</header>

	{#if sorted.length === 0}
		<div class="empty"><p>No projects yet. Use “New” to start one.</p></div>
	{:else}
		<div class="grid">
			{#each sorted as p (p.id)}
				<button class="card" class:done={p.status === 'done'} onclick={() => goto(`/projects/${p.id}`)}>
					<span class="top">
						<span class="name">{p.name || 'Untitled project'}</span>
						<Badge tone={p.status === 'done' ? 'success' : p.status === 'on-hold' ? 'warning' : 'accent'}>
							{statusLabel(p.status)}
						</Badge>
					</span>
					{#if p.description}<span class="desc">{p.description}</span>{/if}
					<span class="meta">
						<span>{taskCount(p.id)} tasks</span>
						{#if p.dueDate}<span class="due"><Calendar size={12} strokeWidth={2} aria-hidden="true" /> {fmtDue(p.dueDate)}</span>{/if}
					</span>
				</button>
			{/each}
		</div>
	{/if}
</div>

<style>
	.page {
		padding: var(--space-6) var(--space-6) var(--space-8);
		max-width: 820px;
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
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
		gap: var(--space-4);
	}
	.card {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
		text-align: left;
		padding: var(--space-5);
		background: var(--surface-1);
		border: var(--border-w) solid var(--border);
		border-radius: var(--radius-4);
		cursor: pointer;
		min-height: 100px;
	}
	.card:hover {
		border-color: var(--border-strong);
		background: var(--surface-2);
	}
	.card.done {
		opacity: 0.7;
	}
	.top {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-3);
	}
	.name {
		font-size: var(--text-md);
		font-weight: var(--weight-medium);
		color: var(--text-1);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.desc {
		font-size: var(--text-sm);
		color: var(--text-2);
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
	.meta {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-3);
		margin-top: auto;
		font-size: var(--text-xs);
		color: var(--text-3);
	}
	.due {
		display: inline-flex;
		align-items: center;
		gap: 3px;
	}
	.empty {
		padding: var(--space-8);
		text-align: center;
		color: var(--text-3);
	}
</style>
