<script lang="ts">
	import { notes } from '$lib/notes/store.svelte';
	import { tasks } from '$lib/tasks/store.svelte';
	import { persona } from '$lib/persona/store.svelte';
	import { projects } from '$lib/projects/store.svelte';
	import { fullName } from '$lib/persona/types';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { Button } from '$lib/ui';
	import MarkdownEditor from '$lib/notes/components/MarkdownEditor.svelte';
	import { ChevronLeft, Trash2, X, ListChecks, User, FolderKanban, Layers, Archive } from '@lucide/svelte';

	const note = $derived(notes.get(page.params.id ?? ''));

	let title = $state('');
	let body = $state('');
	let tags = $state<string[]>([]);
	let taskId = $state('');
	let personaId = $state('');
	let projectId = $state('');
	let tagDraft = $state('');

	let loadedId = '';
	$effect(() => {
		if (note && note.id !== loadedId) {
			loadedId = note.id;
			title = note.title;
			body = note.body;
			tags = [...note.tags];
			taskId = note.taskId ?? '';
			personaId = note.personaId ?? '';
			projectId = note.projectId ?? '';
		}
	});

	// Persist explicitly on blur/change (no reactive write-loop).
	function persist(patch: Parameters<typeof notes.update>[1]) {
		if (note) notes.update(note.id, patch);
	}

	function addTag() {
		const t = tagDraft.trim().toLowerCase();
		if (t && !tags.includes(t)) {
			tags = [...tags, t];
			persist({ tags: $state.snapshot(tags) });
		}
		tagDraft = '';
	}
	function removeTag(t: string) {
		tags = tags.filter((x) => x !== t);
		persist({ tags: $state.snapshot(tags) });
	}
	function del() {
		if (note) notes.remove(note.id);
		goto('/notes');
	}
	function archive() {
		if (note) notes.update(note.id, { archived: true });
		goto('/notes');
	}
</script>

<div class="page">
	<a class="back" href="/notes"><ChevronLeft size={16} strokeWidth={1.75} aria-hidden="true" />Notes</a>

	{#if !note}
		<div class="empty"><p>This note no longer exists.</p></div>
	{:else}
		<input
			class="title"
			bind:value={title}
			placeholder="Untitled note"
			aria-label="Note title"
			onblur={() => persist({ title })}
		/>

		<MarkdownEditor
			bind:value={body}
			placeholder="Write your note… use the toolbar to format."
			onblur={() => persist({ body })}
		/>

		<section class="block">
			<h2>Tags</h2>
			<div class="tags">
				{#each tags as t (t)}
					<span class="tag">
						{t}
						<button type="button" aria-label="Remove {t}" onclick={() => removeTag(t)}>
							<X size={12} strokeWidth={2} aria-hidden="true" />
						</button>
					</span>
				{/each}
				<input
					class="tag-input"
					bind:value={tagDraft}
					placeholder="Add tag…"
					aria-label="Add tag"
					onkeydown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
					onblur={addTag}
				/>
			</div>
		</section>

		<section class="block">
			<h2>Links</h2>
			<div class="link">
				<span class="k"><ListChecks size={14} strokeWidth={1.75} aria-hidden="true" /> Task</span>
				<select class="v" bind:value={taskId} onchange={() => persist({ taskId: taskId || null })}>
					<option value="">— None —</option>
					{#each tasks.tasks as t (t.id)}<option value={t.id}>{t.title}</option>{/each}
				</select>
			</div>
			<div class="link">
				<span class="k"><User size={14} strokeWidth={1.75} aria-hidden="true" /> Person</span>
				<select class="v" bind:value={personaId} onchange={() => persist({ personaId: personaId || null })}>
					<option value="">— None —</option>
					{#each persona.people as p (p.id)}<option value={p.id}>{fullName(p)}</option>{/each}
				</select>
			</div>
			<div class="link">
				<span class="k"><FolderKanban size={14} strokeWidth={1.75} aria-hidden="true" /> Project</span>
				<select class="v" bind:value={projectId} onchange={() => persist({ projectId: projectId || null })}>
					<option value="">— None —</option>
					{#each projects.projects as p (p.id)}<option value={p.id}>{p.name || 'Untitled project'}</option>{/each}
				</select>
			</div>
			<div class="link muted">
				<span class="k"><Layers size={14} strokeWidth={1.75} aria-hidden="true" /> Area</span>
				<span class="soon">arrives with Areas</span>
			</div>
		</section>

		<div class="footer">
			<Button icon={Archive} onclick={archive}>Archive</Button>
			<Button variant="danger" icon={Trash2} onclick={del}>Delete note</Button>
		</div>
	{/if}
</div>

<style>
	.page {
		padding: var(--space-5) var(--space-6) var(--space-8);
		max-width: 720px;
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
		padding: 4px 0;
		margin-bottom: var(--space-4);
	}
	.block {
		margin-top: var(--space-6);
	}
	.block h2 {
		font-size: var(--text-xs);
		font-weight: var(--weight-medium);
		letter-spacing: 0.04em;
		text-transform: uppercase;
		color: var(--text-3);
		margin-bottom: var(--space-3);
	}
	.tags {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-2);
	}
	.tag {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		font-size: var(--text-xs);
		background: var(--accent-tint);
		color: var(--accent-strong);
		padding: 3px 4px 3px 9px;
		border-radius: var(--radius-pill);
	}
	.tag button {
		display: inline-flex;
		border: none;
		background: transparent;
		color: var(--accent-strong);
		cursor: pointer;
		padding: 1px;
		border-radius: 50%;
	}
	.tag button:hover {
		background: rgba(0, 0, 0, 0.1);
	}
	.tag-input {
		flex: 1;
		min-width: 120px;
		border: none;
		background: transparent;
		font: inherit;
		font-size: var(--text-sm);
		color: var(--text-1);
		padding: 5px 2px;
		outline: none;
	}
	.link {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-4);
		padding: var(--space-3) 0;
		border-bottom: var(--border-w) solid var(--border);
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
		padding: 6px 28px 6px 10px;
		min-height: max(0px, var(--tap-min));
		outline: none;
		appearance: none;
		-webkit-appearance: none;
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%238a8a8a' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
		background-repeat: no-repeat;
		background-position: right 8px center;
		max-width: 60%;
	}
	.v:focus {
		border-color: var(--accent);
	}
	.muted .soon {
		font-size: var(--text-xs);
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
