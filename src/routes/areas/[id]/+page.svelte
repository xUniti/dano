<script lang="ts">
	import { areas } from '$lib/areas/store.svelte';
	import { projects } from '$lib/projects/store.svelte';
	import { PROJECT_STATUSES, type Project } from '$lib/projects/types';
	import { tasks } from '$lib/tasks/store.svelte';
	import { type Task } from '$lib/tasks/types';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { Button, Checkbox } from '$lib/ui';
	import {
		ChevronLeft,
		ChevronRight,
		Trash2,
		Plus,
		List as ListIcon,
		LayoutGrid
	} from '@lucide/svelte';

	const area = $derived(areas.get(page.params.id ?? ''));

	let name = $state('');
	let due = $state('');

	let loadedId = '';
	$effect(() => {
		if (area && area.id !== loadedId) {
			loadedId = area.id;
			name = area.name;
			due = area.dueDate ?? '';
		}
	});

	function persist(patch: Parameters<typeof areas.update>[1]) {
		if (area) areas.update(area.id, patch);
	}

	const areaProjects = $derived(
		area ? projects.projects.filter((p) => p.areaId === area.id && !p.archived) : []
	);
	const areaTasks = $derived(
		area ? tasks.tasks.filter((t) => t.areaId === area.id && !t.archived) : []
	);

	let projectView = $state<'list' | 'board'>('list');
	let projectDraft = $state('');
	let taskDraft = $state('');

	function addProject() {
		const n = projectDraft.trim();
		if (!n || !area) return;
		projects.add({
			name: n,
			areaId: area.id,
			personaId: null,
			dueDate: null,
			description: null,
			status: 'active'
		});
		projectDraft = '';
	}
	function moveProject(p: Project, dir: -1 | 1) {
		const cols = PROJECT_STATUSES.map((c) => c.value);
		let i = cols.indexOf(p.status) + dir;
		i = Math.max(0, Math.min(cols.length - 1, i));
		projects.update(p.id, { status: cols[i] });
	}
	function colProjects(status: string) {
		return areaProjects.filter((p) => p.status === status);
	}
	function addTask() {
		const t = taskDraft.trim();
		if (!t || !area) return;
		tasks.add({
			title: t,
			done: false,
			dueDate: null,
			priority: null,
			status: 'todo',
			personaId: null,
			projectId: null,
			areaId: area.id,
			notes: null
		});
		taskDraft = '';
	}
	function toggle(t: Task) {
		tasks.update(t.id, { done: !t.done, status: !t.done ? 'done' : 'todo' });
	}
	function del() {
		if (!confirm('Delete this area? This cannot be undone.')) return;
		if (area) areas.remove(area.id);
		goto('/areas');
	}
</script>

<div class="page">
	<a class="back" href="/areas"><ChevronLeft size={16} strokeWidth={1.75} aria-hidden="true" />Areas</a>

	{#if !area}
		<div class="empty"><p>This area no longer exists.</p></div>
	{:else}
		<input
			class="title"
			bind:value={name}
			placeholder="Untitled area"
			aria-label="Area name"
			onblur={() => persist({ name: name.trim() || 'Untitled area' })}
		/>

		<section class="details">
			<div class="drow">
				<span class="k">Due date</span>
				<input class="v" type="date" bind:value={due} onchange={() => persist({ dueDate: due || null })} />
			</div>
		</section>

		<section class="block">
			<div class="th">
				<h2>Projects · {areaProjects.length}</h2>
				<div class="seg" role="group" aria-label="Project view">
					<button class:on={projectView === 'list'} aria-pressed={projectView === 'list'} onclick={() => (projectView = 'list')}>
						<ListIcon size={14} strokeWidth={1.75} aria-hidden="true" /> List
					</button>
					<button class:on={projectView === 'board'} aria-pressed={projectView === 'board'} onclick={() => (projectView = 'board')}>
						<LayoutGrid size={14} strokeWidth={1.75} aria-hidden="true" /> Board
					</button>
				</div>
			</div>

			<div class="add">
				<Plus size={15} strokeWidth={1.75} aria-hidden="true" />
				<input
					bind:value={projectDraft}
					placeholder="Add a project to this area…"
					aria-label="Add a project"
					onkeydown={(e) => e.key === 'Enter' && addProject()}
				/>
			</div>

			{#if areaProjects.length === 0}
				<div class="empty small"><p>No projects yet.</p></div>
			{:else if projectView === 'list'}
				<ul class="list">
					{#each areaProjects as p (p.id)}
						<li>
							<button class="prow" onclick={() => goto(`/projects/${p.id}`)}>
								<span class="pname">{p.name || 'Untitled project'}</span>
								<span class="pstatus">{PROJECT_STATUSES.find((s) => s.value === p.status)?.label}</span>
							</button>
						</li>
					{/each}
				</ul>
			{:else}
				<div class="board">
					{#each PROJECT_STATUSES as col (col.value)}
						<div class="col">
							<div class="colhead">{col.label} <span class="count">{colProjects(col.value).length}</span></div>
							{#each colProjects(col.value) as p (p.id)}
								<div class="pcard">
									<button class="pcardtitle" onclick={() => goto(`/projects/${p.id}`)}>{p.name || 'Untitled project'}</button>
									<div class="movers">
										<button aria-label="Move left" disabled={p.status === PROJECT_STATUSES[0].value} onclick={() => moveProject(p, -1)}>
											<ChevronLeft size={14} strokeWidth={2} aria-hidden="true" />
										</button>
										<button aria-label="Move right" disabled={p.status === PROJECT_STATUSES[PROJECT_STATUSES.length - 1].value} onclick={() => moveProject(p, 1)}>
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
			<h2>Tasks · {areaTasks.length}</h2>
			<div class="add">
				<Plus size={15} strokeWidth={1.75} aria-hidden="true" />
				<input
					bind:value={taskDraft}
					placeholder="Add a task to this area…"
					aria-label="Add a task"
					onkeydown={(e) => e.key === 'Enter' && addTask()}
				/>
			</div>
			{#if areaTasks.length === 0}
				<div class="empty small"><p>No tasks yet.</p></div>
			{:else}
				<ul class="list">
					{#each areaTasks as t (t.id)}
						<li>
							<div class="row">
								<Checkbox checked={t.done} onchange={() => toggle(t)} />
								<button class="ttitle" class:done={t.done} onclick={() => goto(`/tasks/${t.id}`)}>{t.title}</button>
							</div>
						</li>
					{/each}
				</ul>
			{/if}
		</section>

		<div class="footer">
			<Button variant="danger" icon={Trash2} onclick={del}>Delete area</Button>
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
	.k {
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
	.block {
		margin-bottom: var(--space-6);
	}
	.block h2 {
		font-size: var(--text-xs);
		font-weight: var(--weight-medium);
		letter-spacing: 0.04em;
		text-transform: uppercase;
		color: var(--text-3);
		margin: 0 0 var(--space-3);
	}
	.th {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-4);
		margin-bottom: var(--space-3);
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
	.list li + li > * {
		border-top: var(--border-w) solid var(--border);
	}
	.prow {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-4);
		width: 100%;
		padding: var(--row-pad-y) var(--space-5);
		min-height: max(44px, var(--tap-min));
		border: none;
		background: transparent;
		font: inherit;
		text-align: left;
		color: var(--text-1);
		cursor: pointer;
	}
	.prow:hover {
		background: var(--surface-2);
	}
	.pname {
		font-size: var(--text-base);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.pstatus {
		flex: none;
		font-size: var(--text-xs);
		color: var(--text-3);
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
	.pcard {
		background: var(--surface-1);
		border: var(--border-w) solid var(--border);
		border-radius: var(--radius-2);
		padding: var(--space-3);
		margin-bottom: var(--space-2);
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}
	.pcardtitle {
		border: none;
		background: transparent;
		font: inherit;
		font-size: var(--text-sm);
		color: var(--text-1);
		text-align: left;
		cursor: pointer;
		padding: 0;
	}
	.pcardtitle:hover {
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
