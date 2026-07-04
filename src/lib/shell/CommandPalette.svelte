<script lang="ts">
	import { goto } from '$app/navigation';
	import { Search } from '@lucide/svelte';
	import { nav } from '$lib/nav';
	import { trapFocus } from '$lib/trapFocus';

	let { open = $bindable(false) }: { open?: boolean } = $props();

	let query = $state('');
	const results = $derived(
		nav.filter((n) => n.label.toLowerCase().includes(query.trim().toLowerCase()))
	);

	function close() {
		open = false;
		query = '';
	}
	function choose(href: string) {
		close();
		goto(href);
	}
	function onkeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') close();
	}
</script>

{#if open}
	<div class="overlay" role="presentation" onclick={close}>
		<div
			class="palette"
			role="dialog"
			aria-modal="true"
			aria-label="Command palette"
			tabindex="-1"
			onclick={(e) => e.stopPropagation()}
			{onkeydown}
			use:trapFocus
		>
			<div class="search">
				<Search size={16} strokeWidth={1.75} aria-hidden="true" />
				<input placeholder="Jump to…" aria-label="Jump to" bind:value={query} />
			</div>
			<ul>
				{#each results as r (r.href)}
					{@const Icon = r.icon}
					<li>
						<button onclick={() => choose(r.href)}>
							<Icon size={16} strokeWidth={1.75} aria-hidden="true" />
							<span>{r.label}</span>
						</button>
					</li>
				{/each}
				{#if results.length === 0}<li class="empty">No matches</li>{/if}
			</ul>
		</div>
	</div>
{/if}

<style>
	.overlay {
		position: fixed;
		inset: 0;
		background: rgba(20, 24, 18, 0.4);
		display: flex;
		justify-content: center;
		align-items: flex-start;
		padding-top: 12vh;
		z-index: 50;
	}
	.palette {
		width: min(440px, 92vw);
		background: var(--surface-1);
		border: var(--border-w) solid var(--border-strong);
		border-radius: var(--radius-4);
		box-shadow: var(--shadow-2);
		overflow: hidden;
	}
	.search {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 11px 14px;
		border-bottom: var(--border-w) solid var(--border);
		color: var(--text-3);
	}
	.search input {
		flex: 1;
		border: none;
		background: transparent;
		font: inherit;
		font-size: var(--text-md);
		color: var(--text-1);
		outline: none;
	}
	ul {
		list-style: none;
		margin: 0;
		padding: var(--space-2);
		max-height: 50vh;
		overflow: auto;
	}
	li button {
		display: flex;
		align-items: center;
		gap: 9px;
		width: 100%;
		padding: 9px 11px;
		border: none;
		background: transparent;
		font: inherit;
		font-size: var(--text-base);
		color: var(--text-1);
		text-align: left;
		border-radius: var(--radius-2);
		cursor: pointer;
		min-height: max(0px, var(--tap-min));
	}
	li button:hover {
		background: var(--surface-2);
	}
	.empty {
		padding: 12px;
		color: var(--text-3);
		font-size: var(--text-sm);
		text-align: center;
	}
</style>
