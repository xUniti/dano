<script lang="ts">
	import { notes } from '$lib/notes/store.svelte';
	import { isLinked, snippet } from '$lib/notes/types';
	import { goto } from '$app/navigation';
	import { Button, Input, Card } from '$lib/ui';
	import { Plus, Search, Link2 } from '@lucide/svelte';

	let q = $state('');
	let tagFilter = $state('');
	let linkFilter = $state<'all' | 'unlinked'>('all');

	const allTags = $derived(notes.allTags());

	const filtered = $derived(
		notes.notes
			.filter((n) => {
				if (q.trim()) {
					const hay = `${n.title} ${n.body} ${n.tags.join(' ')}`.toLowerCase();
					if (!hay.includes(q.trim().toLowerCase())) return false;
				}
				if (tagFilter && !n.tags.includes(tagFilter)) return false;
				if (linkFilter === 'unlinked' && isLinked(n)) return false;
				return true;
			})
			.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
	);

	function newNote() {
		const n = notes.add({
			title: '',
			body: '',
			tags: [],
			taskId: null,
			personaId: null,
			projectId: null,
			areaId: null
		});
		goto(`/notes/${n.id}`);
	}
</script>

<div class="page">
	<header class="ph">
		<h1>Notes</h1>
		<Button variant="primary" icon={Plus} onclick={newNote}>New</Button>
	</header>

	<div class="search">
		<Input bind:value={q} icon={Search} placeholder="Search notes…" label="Search notes" />
	</div>

	<div class="filters">
		<button class:on={linkFilter === 'all' && !tagFilter} onclick={() => { linkFilter = 'all'; tagFilter = ''; }}>
			All
		</button>
		<button class:on={linkFilter === 'unlinked'} onclick={() => (linkFilter = linkFilter === 'unlinked' ? 'all' : 'unlinked')}>
			Unlinked
		</button>
		{#each allTags as t (t)}
			<button class="tag" class:on={tagFilter === t} onclick={() => (tagFilter = tagFilter === t ? '' : t)}>
				#{t}
			</button>
		{/each}
	</div>

	{#if filtered.length === 0}
		<div class="empty"><p>{q || tagFilter || linkFilter !== 'all' ? 'No matching notes.' : 'No notes yet. Use “New” to start one.'}</p></div>
	{:else}
		<div class="grid">
			{#each filtered as n (n.id)}
				<button class="note" onclick={() => goto(`/notes/${n.id}`)}>
					<span class="title">{n.title || 'Untitled note'}</span>
					{#if snippet(n)}<span class="snip">{snippet(n)}</span>{/if}
					<span class="meta">
						{#each n.tags as t (t)}<span class="tag">#{t}</span>{/each}
						{#if isLinked(n)}<span class="linked"><Link2 size={12} strokeWidth={2} aria-hidden="true" /> linked</span>{/if}
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
	.search {
		margin-bottom: var(--space-4);
	}
	.filters {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2);
		margin-bottom: var(--space-5);
	}
	.filters button {
		font: inherit;
		font-size: var(--text-xs);
		padding: 4px 10px;
		border: var(--border-w) solid var(--border);
		border-radius: var(--radius-pill);
		background: var(--surface-1);
		color: var(--text-2);
		cursor: pointer;
	}
	.filters button:hover {
		background: var(--surface-2);
	}
	.filters button.on {
		background: var(--accent-tint);
		color: var(--accent-strong);
		border-color: transparent;
		font-weight: var(--weight-medium);
	}
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
		gap: var(--space-4);
	}
	.note {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		text-align: left;
		padding: var(--space-5);
		background: var(--surface-1);
		border: var(--border-w) solid var(--border);
		border-radius: var(--radius-4);
		cursor: pointer;
		min-height: 96px;
	}
	.note:hover {
		border-color: var(--border-strong);
		background: var(--surface-2);
	}
	.note .title {
		font-size: var(--text-base);
		font-weight: var(--weight-medium);
		color: var(--text-1);
	}
	.snip {
		font-size: var(--text-sm);
		color: var(--text-2);
		line-height: var(--leading);
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
	.meta {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-2);
		margin-top: auto;
	}
	.tag {
		font-size: var(--text-xs);
		color: var(--accent-strong);
		background: var(--accent-tint);
		padding: 1px 7px;
		border-radius: var(--radius-pill);
	}
	.linked {
		display: inline-flex;
		align-items: center;
		gap: 3px;
		font-size: var(--text-xs);
		color: var(--text-3);
	}
	.empty {
		padding: var(--space-8);
		text-align: center;
		color: var(--text-3);
	}
</style>
