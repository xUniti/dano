<script lang="ts">
	import type { Priority } from '$lib/tasks/types';
	import { PRIORITIES } from '$lib/tasks/types';
	import { tasks } from '$lib/tasks/store.svelte';
	import { persona } from '$lib/persona/store.svelte';
	import { notes as noteStore } from '$lib/notes/store.svelte';
	import { projects } from '$lib/projects/store.svelte';
	import { areas } from '$lib/areas/store.svelte';
	import { fullName } from '$lib/persona/types';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { Checkbox, Button } from '$lib/ui';
	import { ChevronLeft, Trash2, FolderKanban, StickyNote, User, Layers, Archive } from '@lucide/svelte';

	const task = $derived(tasks.get(page.params.id ?? ''));

	let title = $state('');
	let due = $state('');
	let priority = $state<'none' | Priority>('none');
	let personaId = $state('');
	let projectId = $state('');
	let areaId = $state('');
	let notes = $state('');

	let loadedId = '';
	$effect(() => {
		if (task && task.id !== loadedId) {
			loadedId = task.id;
			title = task.title;
			due = task.dueDate ?? '';
			priority = task.priority ?? 'none';
			personaId = task.personaId ?? '';
			projectId = task.projectId ?? '';
			areaId = task.areaId ?? '';
			notes = task.notes ?? '';
		}
	});

	function persist(patch: Parameters<typeof tasks.update>[1]) {
		if (task) tasks.update(task.id, patch);
	}
	function del() {
		if (task) tasks.remove(task.id);
		goto('/tasks');
	}
	function archive() {
		if (task) tasks.update(task.id, { archived: true });
		goto('/tasks');
	}

	const contact = $derived(task?.personaId ? persona.get(task.personaId) : undefined);
	const linkedNotes = $derived(
		task ? noteStore.notes.filter((n) => n.taskId === task.id && !n.archived) : []
	);
</script>

<div class="page">
	<a class="back" href="/tasks"><ChevronLeft size={16} strokeWidth={1.75} aria-hidden="true" />Tasks</a>

	{#if !task}
		<div class="empty"><p>This task no longer exists.</p></div>
	{:else}
		<div class="head">
			<Checkbox checked={task.done} onchange={(v) => persist({ done: v })} />
			<input
				class="title"
				bind:value={title}
				aria-label="Task title"
				onblur={() => persist({ title: title.trim() || 'Untitled' })}
			/>
		</div>

		<section class="details">
			<div class="drow">
				<span class="k">Due date</span>
				<input
					class="v"
					type="date"
					bind:value={due}
					onchange={() => persist({ dueDate: due || null })}
				/>
			</div>
			<div class="drow">
				<span class="k">Priority</span>
				<select class="v" bind:value={priority} onchange={() => persist({ priority: priority === 'none' ? null : priority })}>
					<option value="none">None</option>
					{#each PRIORITIES as p (p.value)}<option value={p.value}>{p.label}</option>{/each}
				</select>
			</div>
			<div class="drow">
				<span class="k"><User size={14} strokeWidth={1.75} aria-hidden="true" /> Contact</span>
				<select class="v" bind:value={personaId} onchange={() => persist({ personaId: personaId || null })}>
					<option value="">— None —</option>
					{#each persona.people as p (p.id)}<option value={p.id}>{fullName(p)}</option>{/each}
				</select>
			</div>
			<div class="drow">
				<span class="k"><FolderKanban size={14} strokeWidth={1.75} aria-hidden="true" /> Project</span>
				<select class="v" bind:value={projectId} onchange={() => persist({ projectId: projectId || null })}>
					<option value="">— None —</option>
					{#each projects.projects as p (p.id)}<option value={p.id}>{p.name || 'Untitled project'}</option>{/each}
				</select>
			</div>
			<div class="drow">
				<span class="k"><Layers size={14} strokeWidth={1.75} aria-hidden="true" /> Area</span>
				<select class="v" bind:value={areaId} onchange={() => persist({ areaId: areaId || null })}>
					<option value="">— None —</option>
					{#each areas.areas as a (a.id)}<option value={a.id}>{a.name}</option>{/each}
				</select>
			</div>
		</section>

		<section class="block">
			<h2>Notes</h2>
			<textarea
				bind:value={notes}
				rows="4"
				placeholder="Anything important about this task…"
				onblur={() => persist({ notes: notes.trim() || null })}
			></textarea>
		</section>

		<section class="block">
			<h2>Linked</h2>
			{#each linkedNotes as n (n.id)}
				<a class="link" href="/notes/{n.id}">
					<StickyNote size={16} strokeWidth={1.75} aria-hidden="true" />
					<span>{n.title || 'Untitled note'}</span>
				</a>
			{/each}
			{#if linkedNotes.length === 0}
				<div class="link muted">
					<StickyNote size={16} strokeWidth={1.75} aria-hidden="true" />
					<span>No linked notes yet — link this task from a note.</span>
				</div>
			{/if}
			{#if contact}
				<a class="link" href="/persona?id={contact.id}">
					<User size={16} strokeWidth={1.75} aria-hidden="true" />
					<span>{fullName(contact)}</span>
				</a>
			{/if}
		</section>

		<div class="footer">
			<Button icon={Archive} onclick={archive}>Archive</Button>
			<Button variant="danger" icon={Trash2} onclick={del}>Delete task</Button>
		</div>
	{/if}
</div>

<style>
	.page {
		padding: var(--space-5) var(--space-6) var(--space-8);
		max-width: 640px;
		margin: 0 auto;
	}
	.back {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		font-size: var(--text-sm);
		color: var(--text-2);
		text-decoration: none;
		margin-bottom: var(--space-5);
	}
	.back:hover {
		color: var(--text-1);
	}
	.head {
		display: flex;
		align-items: center;
		gap: var(--space-4);
		margin-bottom: var(--space-6);
	}
	.title {
		flex: 1;
		min-width: 0;
		border: none;
		background: transparent;
		font: inherit;
		font-size: var(--text-xl);
		font-weight: var(--weight-medium);
		color: var(--text-1);
		outline: none;
		padding: 4px 6px;
		border-radius: var(--radius-2);
	}
	.title:hover,
	.title:focus {
		background: var(--surface-2);
	}
	.details {
		border: var(--border-w) solid var(--border);
		border-radius: var(--radius-4);
		overflow: hidden;
		margin-bottom: var(--space-6);
	}
	.drow {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-4);
		padding: var(--space-4) var(--space-5);
	}
	.drow + .drow {
		border-top: var(--border-w) solid var(--border);
	}
	.k {
		display: inline-flex;
		align-items: center;
		gap: 5px;
		font-size: var(--text-sm);
		color: var(--text-2);
	}
	.v {
		font: inherit;
		font-size: var(--text-base);
		color: var(--text-1);
		background: var(--surface-2);
		border: var(--border-w) solid var(--border);
		border-radius: var(--radius-2);
		padding: 6px 10px;
		min-height: max(0px, var(--tap-min));
		outline: none;
	}
	.v:focus {
		border-color: var(--accent);
	}
	select.v {
		appearance: none;
		-webkit-appearance: none;
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%238a8a8a' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
		background-repeat: no-repeat;
		background-position: right 8px center;
		padding-right: 30px;
	}
	.block {
		margin-bottom: var(--space-6);
	}
	.block h2 {
		font-size: var(--text-xs);
		font-weight: var(--weight-medium);
		letter-spacing: 0.04em;
		text-transform: uppercase;
		color: var(--text-3);
		margin-bottom: var(--space-3);
	}
	textarea {
		width: 100%;
		font: inherit;
		font-size: var(--text-base);
		color: var(--text-1);
		background: var(--surface-2);
		border: var(--border-w) solid var(--border);
		border-radius: var(--radius-3);
		padding: 10px;
		outline: none;
		resize: vertical;
	}
	textarea:focus {
		border-color: var(--accent);
	}
	.link {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		padding: var(--space-3) var(--space-4);
		border: var(--border-w) solid var(--border);
		border-radius: var(--radius-3);
		font-size: var(--text-sm);
		color: var(--text-1);
		text-decoration: none;
		margin-bottom: var(--space-2);
	}
	a.link:hover {
		background: var(--surface-2);
	}
	.link.muted {
		color: var(--text-3);
	}
	.footer {
		display: flex;
		gap: var(--space-3);
		margin-top: var(--space-7);
	}
	.empty {
		padding: var(--space-8);
		text-align: center;
		color: var(--text-3);
	}
</style>
