<script lang="ts">
	import type { Component } from 'svelte';
	import { tasks } from '$lib/tasks/store.svelte';
	import { notes } from '$lib/notes/store.svelte';
	import { projects } from '$lib/projects/store.svelte';
	import { areas } from '$lib/areas/store.svelte';
	import { persona } from '$lib/persona/store.svelte';
	import { fullName } from '$lib/persona/types';
	import { goto } from '$app/navigation';
	import { Input } from '$lib/ui';
	import { ListChecks, StickyNote, FolderKanban, Layers, Users, Search } from '@lucide/svelte';

	type Result = { type: string; title: string; href: string; icon: Component };

	let q = $state('');
	const query = $derived(q.trim().toLowerCase());

	const results = $derived.by<Result[]>(() => {
		if (!query) return [];
		const r: Result[] = [];
		for (const t of tasks.tasks)
			if (!t.archived && t.title.toLowerCase().includes(query))
				r.push({ type: 'Task', title: t.title, href: `/tasks/${t.id}`, icon: ListChecks });
		for (const n of notes.notes)
			if (!n.archived && `${n.title} ${n.body} ${n.tags.join(' ')}`.toLowerCase().includes(query))
				r.push({ type: 'Note', title: n.title || 'Untitled note', href: `/notes/${n.id}`, icon: StickyNote });
		for (const p of projects.projects)
			if (!p.archived && p.name.toLowerCase().includes(query))
				r.push({ type: 'Project', title: p.name || 'Untitled project', href: `/projects/${p.id}`, icon: FolderKanban });
		for (const a of areas.areas)
			if (a.name.toLowerCase().includes(query))
				r.push({ type: 'Area', title: a.name || 'Untitled area', href: `/areas/${a.id}`, icon: Layers });
		for (const pe of persona.people)
			if (`${fullName(pe)} ${pe.company ?? ''} ${pe.email ?? ''}`.toLowerCase().includes(query))
				r.push({ type: 'Person', title: fullName(pe), href: `/persona?id=${pe.id}`, icon: Users });
		return r;
	});
</script>

<div class="page">
	<header class="ph"><h1>Search</h1></header>

	<div class="search">
		<Input bind:value={q} icon={Search} placeholder="Search everything…" label="Search" />
	</div>

	{#if !query}
		<p class="hint">Search across tasks, notes, projects, areas and people.</p>
	{:else if results.length === 0}
		<p class="hint">No results for “{q}”.</p>
	{:else}
		<ul class="list">
			{#each results as r, i (r.href + i)}
				{@const Icon = r.icon}
				<li>
					<button class="row" onclick={() => goto(r.href)}>
						<Icon size={16} strokeWidth={1.75} aria-hidden="true" />
						<span class="t">{r.title}</span>
						<span class="type">{r.type}</span>
					</button>
				</li>
			{/each}
		</ul>
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
	.search {
		margin-bottom: var(--space-5);
	}
	.hint {
		color: var(--text-3);
		font-size: var(--text-sm);
	}
	.list {
		list-style: none;
		margin: 0;
		padding: 0;
		border: var(--border-w) solid var(--border);
		border-radius: var(--radius-4);
		overflow: hidden;
	}
	.list li + li .row {
		border-top: var(--border-w) solid var(--border);
	}
	.row {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		width: 100%;
		padding: var(--row-pad-y) var(--space-5);
		min-height: max(44px, var(--tap-min));
		border: none;
		background: transparent;
		font: inherit;
		text-align: left;
		color: var(--text-2);
		cursor: pointer;
	}
	.row:hover {
		background: var(--surface-2);
	}
	.t {
		flex: 1;
		min-width: 0;
		font-size: var(--text-base);
		color: var(--text-1);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.type {
		flex: none;
		font-size: var(--text-xs);
		color: var(--text-3);
		background: var(--surface-2);
		padding: 2px 8px;
		border-radius: var(--radius-2);
	}
</style>
