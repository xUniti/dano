<script lang="ts">
	import { areas } from '$lib/areas/store.svelte';
	import { projects } from '$lib/projects/store.svelte';
	import { tasks } from '$lib/tasks/store.svelte';
	import { goto } from '$app/navigation';
	import { Button } from '$lib/ui';
	import { Plus, Calendar, FolderKanban, ListChecks } from '@lucide/svelte';

	const sorted = $derived([...areas.areas].sort((a, b) => a.name.localeCompare(b.name)));

	function projectCount(id: string): number {
		return projects.projects.filter((p) => p.areaId === id).length;
	}
	function taskCount(id: string): number {
		return tasks.tasks.filter((t) => t.areaId === id).length;
	}
	function fmtDue(s: string): string {
		const [y, m, d] = s.split('-').map(Number);
		return new Date(y, m - 1, d).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
	}
	function newArea() {
		const a = areas.add({ name: '', dueDate: null });
		goto(`/areas/${a.id}`);
	}
</script>

<div class="page">
	<header class="ph">
		<h1>Areas</h1>
		<Button variant="primary" icon={Plus} onclick={newArea}>New</Button>
	</header>

	{#if sorted.length === 0}
		<div class="empty"><p>No areas yet. Use “New” to add one.</p></div>
	{:else}
		<div class="grid">
			{#each sorted as a (a.id)}
				<button class="card" onclick={() => goto(`/areas/${a.id}`)}>
					<span class="name">{a.name || 'Untitled area'}</span>
					<span class="meta">
						<span><FolderKanban size={12} strokeWidth={2} aria-hidden="true" /> {projectCount(a.id)}</span>
						<span><ListChecks size={12} strokeWidth={2} aria-hidden="true" /> {taskCount(a.id)}</span>
						{#if a.dueDate}<span class="due"><Calendar size={12} strokeWidth={2} aria-hidden="true" /> {fmtDue(a.dueDate)}</span>{/if}
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
		grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
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
		min-height: 84px;
	}
	.card:hover {
		border-color: var(--border-strong);
		background: var(--surface-2);
	}
	.name {
		font-size: var(--text-md);
		font-weight: var(--weight-medium);
		color: var(--text-1);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.meta {
		display: flex;
		align-items: center;
		gap: var(--space-4);
		margin-top: auto;
		font-size: var(--text-xs);
		color: var(--text-3);
	}
	.meta span {
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
