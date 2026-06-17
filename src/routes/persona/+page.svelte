<script lang="ts">
	import type { Person } from '$lib/persona/types';
	import { fullName, initials } from '$lib/persona/types';
	import { persona } from '$lib/persona/store.svelte';
	import { page } from '$app/state';
	import { Button, Input, Card } from '$lib/ui';
	import { Plus, Search, Cake, Building2 } from '@lucide/svelte';
	import PersonSheet from '$lib/persona/components/PersonSheet.svelte';

	let q = $state('');
	let sheetOpen = $state(false);
	let editing = $state<Person | null>(null);

	const filtered = $derived(
		persona.people
			.filter((p) => {
				const hay = `${fullName(p)} ${p.company ?? ''} ${p.email ?? ''}`.toLowerCase();
				return hay.includes(q.trim().toLowerCase());
			})
			.sort((a, b) => fullName(a).localeCompare(fullName(b)))
	);

	function subtitle(p: Person): string {
		if (p.company) return p.position ? `${p.position} · ${p.company}` : p.company;
		return p.email ?? '';
	}
	function fmtBirthday(s: string): string {
		const [y, m, d] = s.split('-').map(Number);
		return new Date(y, m - 1, d).toLocaleDateString(undefined, { day: 'numeric', month: 'long' });
	}

	function openNew() {
		editing = null;
		sheetOpen = true;
	}
	function openEdit(p: Person) {
		editing = p;
		sheetOpen = true;
	}
	function close() {
		sheetOpen = false;
		editing = null;
	}

	// Deep-open a person when arriving from a calendar birthday (/persona?id=…).
	let handledId = '';
	$effect(() => {
		const id = page.url.searchParams.get('id');
		if (id && id !== handledId) {
			handledId = id;
			const p = persona.get(id);
			if (p) {
				editing = p;
				sheetOpen = true;
			}
		}
	});
</script>

<div class="page">
	<header class="ph">
		<h1>Persona</h1>
		<Button variant="primary" icon={Plus} onclick={openNew}>New</Button>
	</header>

	<div class="search">
		<Input bind:value={q} icon={Search} placeholder="Search people…" label="Search people" />
	</div>

	{#if filtered.length === 0}
		<div class="empty">
			<Building2 size={28} strokeWidth={1.5} aria-hidden="true" />
			<p>{q ? 'No matches.' : 'No people yet. Use “New” to add someone.'}</p>
		</div>
	{:else}
		<Card pad={false}>
			<ul class="list">
				{#each filtered as p (p.id)}
					<li>
						<button class="row" onclick={() => openEdit(p)}>
							<span class="avatar" aria-hidden="true">{initials(p)}</span>
							<span class="main">
								<span class="name">{fullName(p)}</span>
								{#if subtitle(p)}<span class="sub">{subtitle(p)}</span>{/if}
							</span>
							{#if p.birthday}
								<span class="bday">
									<Cake size={14} strokeWidth={1.75} aria-hidden="true" />
									{fmtBirthday(p.birthday)}
								</span>
							{/if}
						</button>
					</li>
				{/each}
			</ul>
		</Card>
	{/if}

	<PersonSheet bind:open={sheetOpen} person={editing} onClose={close} />
</div>

<style>
	.page {
		padding: var(--space-6) var(--space-6) var(--space-8);
		max-width: 720px;
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
		margin-bottom: var(--space-5);
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
		gap: var(--space-4);
		width: 100%;
		padding: var(--row-pad-y) var(--space-5);
		min-height: max(48px, var(--tap-min));
		border: none;
		background: transparent;
		font: inherit;
		text-align: left;
		color: var(--text-1);
		cursor: pointer;
	}
	.row:hover {
		background: var(--surface-2);
	}
	.avatar {
		flex: none;
		width: 36px;
		height: 36px;
		border-radius: 50%;
		background: var(--accent-tint);
		color: var(--accent-strong);
		display: inline-flex;
		align-items: center;
		justify-content: center;
		font-size: var(--text-sm);
		font-weight: var(--weight-medium);
	}
	.main {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 1px;
	}
	.name {
		font-size: var(--text-base);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.sub {
		font-size: var(--text-xs);
		color: var(--text-2);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.bday {
		flex: none;
		display: inline-flex;
		align-items: center;
		gap: 4px;
		font-size: var(--text-xs);
		color: var(--text-2);
		background: var(--surface-2);
		padding: 3px 8px;
		border-radius: var(--radius-2);
	}
</style>
