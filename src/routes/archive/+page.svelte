<script lang="ts">
	import { tasks } from '$lib/tasks/store.svelte';
	import { projects } from '$lib/projects/store.svelte';
	import { notes } from '$lib/notes/store.svelte';
	import { goto } from '$app/navigation';
	import { RotateCcw, Trash2, ListChecks, FolderKanban, StickyNote } from '@lucide/svelte';

	const archivedTasks = $derived(tasks.tasks.filter((t) => t.archived));
	const archivedProjects = $derived(projects.projects.filter((p) => p.archived));
	const archivedNotes = $derived(notes.notes.filter((n) => n.archived));
	const total = $derived(archivedTasks.length + archivedProjects.length + archivedNotes.length);
</script>

<div class="page">
	<header class="ph"><h1>Archive</h1></header>

	{#if total === 0}
		<div class="empty"><p>Nothing archived. Archived tasks, projects and notes show up here.</p></div>
	{:else}
		{#if archivedTasks.length}
			<section>
				<h2><ListChecks size={14} strokeWidth={1.75} aria-hidden="true" /> Tasks</h2>
				{#each archivedTasks as t (t.id)}
					<div class="row">
						<button class="name" onclick={() => goto(`/tasks/${t.id}`)}>{t.title || 'Untitled'}</button>
						<button class="act" onclick={() => tasks.update(t.id, { archived: false })} aria-label="Restore">
							<RotateCcw size={15} strokeWidth={1.75} aria-hidden="true" />
						</button>
						<button class="act danger" onclick={() => tasks.remove(t.id)} aria-label="Delete permanently">
							<Trash2 size={15} strokeWidth={1.75} aria-hidden="true" />
						</button>
					</div>
				{/each}
			</section>
		{/if}

		{#if archivedProjects.length}
			<section>
				<h2><FolderKanban size={14} strokeWidth={1.75} aria-hidden="true" /> Projects</h2>
				{#each archivedProjects as p (p.id)}
					<div class="row">
						<button class="name" onclick={() => goto(`/projects/${p.id}`)}>{p.name || 'Untitled'}</button>
						<button class="act" onclick={() => projects.update(p.id, { archived: false })} aria-label="Restore">
							<RotateCcw size={15} strokeWidth={1.75} aria-hidden="true" />
						</button>
						<button class="act danger" onclick={() => projects.remove(p.id)} aria-label="Delete permanently">
							<Trash2 size={15} strokeWidth={1.75} aria-hidden="true" />
						</button>
					</div>
				{/each}
			</section>
		{/if}

		{#if archivedNotes.length}
			<section>
				<h2><StickyNote size={14} strokeWidth={1.75} aria-hidden="true" /> Notes</h2>
				{#each archivedNotes as n (n.id)}
					<div class="row">
						<button class="name" onclick={() => goto(`/notes/${n.id}`)}>{n.title || 'Untitled note'}</button>
						<button class="act" onclick={() => notes.update(n.id, { archived: false })} aria-label="Restore">
							<RotateCcw size={15} strokeWidth={1.75} aria-hidden="true" />
						</button>
						<button class="act danger" onclick={() => notes.remove(n.id)} aria-label="Delete permanently">
							<Trash2 size={15} strokeWidth={1.75} aria-hidden="true" />
						</button>
					</div>
				{/each}
			</section>
		{/if}
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
	section {
		margin-bottom: var(--space-6);
	}
	h2 {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: var(--text-xs);
		font-weight: var(--weight-medium);
		letter-spacing: 0.04em;
		text-transform: uppercase;
		color: var(--text-3);
		margin-bottom: var(--space-3);
	}
	.row {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		padding: var(--space-3) var(--space-4);
		border: var(--border-w) solid var(--border);
		border-radius: var(--radius-3);
		margin-bottom: var(--space-2);
	}
	.name {
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
	.name:hover {
		color: var(--accent-strong);
	}
	.act {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 30px;
		height: 30px;
		flex: none;
		border: var(--border-w) solid var(--border);
		border-radius: var(--radius-2);
		background: var(--surface-1);
		color: var(--text-2);
		cursor: pointer;
	}
	.act:hover {
		background: var(--surface-2);
		color: var(--text-1);
	}
	.act.danger:hover {
		color: var(--danger);
		border-color: var(--danger);
	}
	.empty {
		padding: var(--space-8);
		text-align: center;
		color: var(--text-3);
	}
</style>
