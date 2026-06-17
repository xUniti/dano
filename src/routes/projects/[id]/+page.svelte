<script lang="ts">
	import type { ProjectStatus } from '$lib/projects/types';
	import { PROJECT_STATUSES } from '$lib/projects/types';
	import { projects } from '$lib/projects/store.svelte';
	import { tasks } from '$lib/tasks/store.svelte';
	import { TASK_COLUMNS, taskStatus, PRIORITIES, type Task } from '$lib/tasks/types';
	import { persona } from '$lib/persona/store.svelte';
	import { fullName } from '$lib/persona/types';
	import { notes as noteStore } from '$lib/notes/store.svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { Button, Checkbox } from '$lib/ui';
	import {
		ChevronLeft,
		ChevronRight,
		Trash2,
		Layers,
		Plus,
		List as ListIcon,
		LayoutGrid,
		StickyNote
	} from '@lucide/svelte';

	const project = $derived(projects.get(page.params.id ?? ''));

	let name = $state('');
	let status = $state<ProjectStatus>('active');
	let due = $state('');
	let personaId = $state('');
	let description = $state('');

	let loadedId = '';
	$effect(() => {
		if (project && project.id !== loadedId) {
			loadedId = project.id;
			name = project.name;
			status = project.status;
			due = project.dueDate ?? '';
			personaId = project.personaId ?? '';
			description = project.description ?? '';
		}
	});

	function persist(patch: Parameters<typeof projects.update>[1]) {
		if (project) projects.update(project.id, patch);
	}

	const projectTasks = $derived(project ? tasks.tasks.filter((t) => t.projectId === project.id) : []);
	const projectNotes = $derived(
		project ? noteStore.notes.filter((n) => n.projectId === project.id) : []
	);

	let taskView = $state<'list' | 'board'>('list');
	let taskDraft = $state('');

	function addTask() {
		const t = taskDraft.trim();
		if (!t || !project) return;
		tasks.add({
			title: t,
			done: false,
			dueDate: null,
			priority: null,
			status: 'todo',
			personaId: null,
			projectId: project.id,
			noteIds: [],
			notes: null
		});
		taskDraft = '';
	}
	function toggle(t: Task) {
		tasks.update(t.id, { done: !t.done, status: !t.done ? 'done' : 'todo' });
	}
	function move(t: Task, dir: -1 | 1) {
		const cols = TASK_COLUMNS.map((c) => c.id);
		let i = cols.indexOf(taskStatus(t)) + dir;
		i = Math.max(0, Math.min(cols.length - 1, i));
		const s = cols[i];
		tasks.update(t.id, { status: s, done: s === 'done' });
	}
	function colTasks(col: string) {
		return projectTasks.filter((t) => taskStatus(t) === col);
	}
	function priColor(t: Task): string {
		return PRIORITIES.find((x) => x.value === t.priority)?.color ?? 'transparent';
	}
	function del() {
		if (project) projects.remove(project.id);
		goto('/projects');
	}
</script>

<div class="page">
	<a class="back" href="/projects"><ChevronLeft size={16} strokeWidth={1.75} aria-hidden="true" />Projects</a>

	{#if !project}
		<div class="empty"><p>This project no longer exists.</p></div>
	{:else}
		<input
			class="title"
			bind:value={name}
			placeholder="Untitled project"
			aria-label="Project name"
			onblur={() => persist({ name: name.trim() || 'Untitled project' })}
		/>

		<section class="details">
			<div class="drow">
				<span class="k">Status</span>
				<select class="v" bind:value={status} onchange={() => persist({ status })}>
					{#each PROJECT_STATUSES as s (s.value)}<option value={s.value}>{s.label}</option>{/each}
				</select>
			</div>
			<div class="drow muted">
				<span class="k"><Layers size={14} strokeWidth={1.75} aria-hidden="true" /> Area</span>
				<span class="soon">arrives with Areas</span>
			</div>
			<div class="drow">
				<span class="k">Due date</span>
				<input class="v" type="date" bind:value={due} onchange={() => persist({ dueDate: due || null })} />
			</div>
			<div class="drow">
				<span class="k">Contact</span>
				<select class="v" bind:value={personaId} onchange={() => persist({ personaId: personaId || null })}>
					<option value="">— None —</option>
					{#each persona.people as p (p.id)}<option value={p.id}>{fullName(p)}</option>{/each}
				</select>
			</div>
		</section>

		<section class="block">
			<h2>Description</h2>
			<textarea
				bind:value={description}
				rows="3"
				placeholder="What is this project about?"
				onblur={() => persist({ description: description.trim() || null })}
			></textarea>
		</section>

		<section class="block">
			<div class="th">
				<h2>Tasks · {projectTasks.length}</h2>
				<div class="seg" role="group" aria-label="Task view">
					<button class:on={taskView === 'list'} aria-pressed={taskView === 'list'} onclick={() => (taskView = 'list')}>
						<ListIcon size={14} strokeWidth={1.75} aria-hidden="true" /> List
					</button>
					<button class:on={taskView === 'board'} aria-pressed={taskView === 'board'} onclick={() => (taskView = 'board')}>
						<LayoutGrid size={14} strokeWidth={1.75} aria-hidden="true" /> Board
					</button>
				</div>
			</div>

			<div class="add">
				<Plus size={15} strokeWidth={1.75} aria-hidden="true" />
				<input
					bind:value={taskDraft}
					placeholder="Add a task to this project…"
					aria-label="Add a task"
					onkeydown={(e) => e.key === 'Enter' && addTask()}
				/>
			</div>

			{#if projectTasks.length === 0}
				<div class="empty small"><p>No tasks yet.</p></div>
			{:else if taskView === 'list'}
				<ul class="list">
					{#each projectTasks as t (t.id)}
						<li>
							<div class="row">
								<Checkbox checked={t.done} onchange={() => toggle(t)} />
								<button class="ttitle" class:done={t.done} onclick={() => goto(`/tasks/${t.id}`)}>{t.title}</button>
								{#if t.priority}<span class="pri" style="background: {priColor(t)}"></span>{/if}
							</div>
						</li>
					{/each}
				</ul>
			{:else}
				<div class="board">
					{#each TASK_COLUMNS as col (col.id)}
						<div class="col">
							<div class="colhead">{col.label} <span class="count">{colTasks(col.id).length}</span></div>
							{#each colTasks(col.id) as t (t.id)}
								<div class="tcard">
									<button class="tcardtitle" onclick={() => goto(`/tasks/${t.id}`)}>{t.title}</button>
									<div class="movers">
										<button aria-label="Move left" disabled={taskStatus(t) === TASK_COLUMNS[0].id} onclick={() => move(t, -1)}>
											<ChevronLeft size={14} strokeWidth={2} aria-hidden="true" />
										</button>
										<button aria-label="Move right" disabled={taskStatus(t) === TASK_COLUMNS[TASK_COLUMNS.length - 1].id} onclick={() => move(t, 1)}>
											<ChevronRight size={14} strokeWidth={2} aria-hidden="true" />
										</button>
									</div>
								</div>
							{/each}
						</div>
					{/each}
				</div>
			{/if}
		</section>

		<section class="block">
			<h2>Notes · {projectNotes.length}</h2>
			{#each projectNotes as n (n.id)}
				<a class="link" href="/notes/{n.id}">
					<StickyNote size={16} strokeWidth={1.75} aria-hidden="true" />
					<span>{n.title || 'Untitled note'}</span>
				</a>
			{/each}
			{#if projectNotes.length === 0}
				<div class="link muted">
					<StickyNote size={16} strokeWidth={1.75} aria-hidden="true" />
					<span>No linked notes — link this project from a note.</span>
				</div>
			{/if}
		</section>

		<div class="footer">
			<Button variant="danger" icon={Trash2} onclick={del}>Delete project</Button>
		</div>
	{/if}
</div>

<style>
	.page {
		padding: var(--space-5) var(--space-6) var(--space-8);
		max-width: 760px;
		margin: 0 auto;
	}
	.back {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		font-size: var(--text-sm);
		color: var(--text-2);
		text-decoration: none;
		margin-bottom: var(--space-4);
	}
	.back:hover {
		color: var(--text-1);
	}
	.title {
		width: 100%;
		border: none;
		background: transparent;
		font: inherit;
		font-size: var(--text-xl);
		font-weight: var(--weight-medium);
		color: var(--text-1);
		outline: none;
		padding: 4px 6px;
		border-radius: var(--radius-2);
		margin-bottom: var(--space-5);
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
	.muted .soon {
		font-size: var(--text-xs);
		color: var(--text-3);
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
	select.v {
		appearance: none;
		-webkit-appearance: none;
		padding-right: 28px;
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%238a8a8a' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
		background-repeat: no-repeat;
		background-position: right 8px center;
	}
	.v:focus {
		border-color: var(--accent);
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
	.th {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-4);
		margin-bottom: var(--space-3);
	}
	.th h2 {
		margin: 0;
	}
	.seg {
		display: inline-flex;
		border: var(--border-w) solid var(--border);
		border-radius: var(--radius-3);
		overflow: hidden;
	}
	.seg button {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		font: inherit;
		font-size: var(--text-xs);
		padding: 5px 10px;
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
	.add {
		display: flex;
		align-items: center;
		gap: 8px;
		background: var(--surface-2);
		border: var(--border-w) solid var(--border);
		border-radius: var(--radius-3);
		padding: 0 11px;
		margin-bottom: var(--space-4);
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
		padding: 9px 0;
		outline: none;
	}
	.list {
		list-style: none;
		margin: 0;
		padding: 0;
		border: var(--border-w) solid var(--border);
		border-radius: var(--radius-3);
		overflow: hidden;
	}
	.list li + li .row {
		border-top: var(--border-w) solid var(--border);
	}
	.row {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		padding: var(--row-pad-y) var(--space-4);
		min-height: max(40px, var(--tap-min));
	}
	.ttitle {
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
	.ttitle:hover {
		color: var(--accent-strong);
	}
	.ttitle.done {
		color: var(--text-3);
		text-decoration: line-through;
	}
	.pri {
		flex: none;
		width: 8px;
		height: 8px;
		border-radius: 50%;
	}
	.board {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: var(--space-3);
	}
	.col {
		background: var(--surface-2);
		border-radius: var(--radius-3);
		padding: var(--space-3);
		min-height: 80px;
	}
	.colhead {
		font-size: var(--text-xs);
		font-weight: var(--weight-medium);
		color: var(--text-2);
		margin-bottom: var(--space-3);
		display: flex;
		align-items: center;
		gap: 6px;
	}
	.count {
		color: var(--text-3);
	}
	.tcard {
		background: var(--surface-1);
		border: var(--border-w) solid var(--border);
		border-radius: var(--radius-2);
		padding: var(--space-3);
		margin-bottom: var(--space-2);
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}
	.tcardtitle {
		border: none;
		background: transparent;
		font: inherit;
		font-size: var(--text-sm);
		color: var(--text-1);
		text-align: left;
		cursor: pointer;
		padding: 0;
	}
	.tcardtitle:hover {
		color: var(--accent-strong);
	}
	.movers {
		display: flex;
		justify-content: flex-end;
		gap: 2px;
	}
	.movers button {
		display: inline-flex;
		border: var(--border-w) solid var(--border);
		background: var(--surface-1);
		color: var(--text-2);
		border-radius: var(--radius-1);
		cursor: pointer;
		padding: 2px;
	}
	.movers button:hover:not(:disabled) {
		background: var(--surface-2);
	}
	.movers button:disabled {
		opacity: 0.35;
		cursor: not-allowed;
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
		margin-top: var(--space-7);
	}
	.empty {
		padding: var(--space-8);
		text-align: center;
		color: var(--text-3);
	}
	.empty.small {
		padding: var(--space-6);
	}
	@media (max-width: 560px) {
		.board {
			grid-template-columns: 1fr;
		}
	}
</style>
