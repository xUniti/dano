<script lang="ts">
	import type { Snippet } from 'svelte';
	import { page } from '$app/state';
	import { nav } from '$lib/nav';
	import CommandPalette from './CommandPalette.svelte';

	let { children }: { children?: Snippet } = $props();

	let paletteOpen = $state(false);
	const current = $derived(page.url.pathname);
	const primary = nav.filter((n) => n.primary);

	function isActive(href: string) {
		return current === href || current.startsWith(href + '/');
	}
	function onkeydown(e: KeyboardEvent) {
		if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
			e.preventDefault();
			paletteOpen = true;
		}
	}
</script>

<svelte:window {onkeydown} />

<a href="#main" class="skip-link">Skip to content</a>

<div class="shell">
	<nav class="sidebar" aria-label="Primary">
		<div class="brand">DANO</div>
		<ul>
			{#each nav as item (item.href)}
				{@const Icon = item.icon}
				<li>
					<a
						href={item.href}
						class="nav"
						class:active={isActive(item.href)}
						aria-current={isActive(item.href) ? 'page' : undefined}
					>
						<Icon size={17} strokeWidth={1.75} aria-hidden="true" />
						<span>{item.label}</span>
						{#if !item.ready}<span class="soon">soon</span>{/if}
					</a>
				</li>
			{/each}
		</ul>
		<button class="cmd" onclick={() => (paletteOpen = true)}>
			<span>Jump to…</span>
			<kbd>⌘K</kbd>
		</button>
	</nav>

	<main id="main" class="content" tabindex="-1">
		{@render children?.()}
	</main>

	<nav class="tabbar" aria-label="Primary">
		{#each primary as item (item.href)}
			{@const Icon = item.icon}
			<a
				href={item.href}
				class="tab"
				class:active={isActive(item.href)}
				aria-current={isActive(item.href) ? 'page' : undefined}
			>
				<Icon size={20} strokeWidth={1.75} aria-hidden="true" />
				<span>{item.label}</span>
			</a>
		{/each}
	</nav>
</div>

<CommandPalette bind:open={paletteOpen} />

<style>
	.shell {
		display: flex;
		min-height: 100vh;
	}
	.sidebar {
		width: 204px;
		flex: none;
		display: flex;
		flex-direction: column;
		gap: 1px;
		padding: var(--space-5);
		border-right: var(--border-w) solid var(--border);
		background: var(--surface-1);
	}
	.brand {
		font-size: var(--text-lg);
		font-weight: var(--weight-medium);
		letter-spacing: 0.06em;
		color: var(--accent-strong);
		padding: var(--space-3) var(--space-3) var(--space-6);
	}
	.sidebar ul {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 1px;
	}
	.nav {
		display: flex;
		align-items: center;
		gap: 9px;
		padding: 7px 9px;
		border-radius: var(--radius-3);
		color: var(--text-2);
		text-decoration: none;
		font-size: var(--text-base);
		transition: background var(--motion-fast) var(--ease);
	}
	.nav:hover {
		background: var(--surface-2);
		color: var(--text-1);
	}
	.nav.active {
		background: var(--accent-tint);
		color: var(--accent-strong);
		font-weight: var(--weight-medium);
	}
	.soon {
		margin-left: auto;
		font-size: var(--text-xs);
		color: var(--text-3);
	}
	.cmd {
		margin-top: auto;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
		padding: 8px 11px;
		border: var(--border-w) solid var(--border);
		border-radius: var(--radius-3);
		background: var(--surface-2);
		color: var(--text-2);
		font: inherit;
		font-size: var(--text-sm);
		cursor: pointer;
	}
	.cmd kbd {
		font-family: var(--font-sans);
		font-size: var(--text-xs);
		color: var(--text-3);
		border: var(--border-w) solid var(--border);
		border-radius: var(--radius-1);
		padding: 1px 5px;
	}
	.content {
		flex: 1;
		min-width: 0;
		outline: none;
	}
	.tabbar {
		display: none;
	}

	@media (max-width: 768px) {
		.sidebar {
			display: none;
		}
		.content {
			padding-bottom: 64px;
		}
		.tabbar {
			display: flex;
			position: fixed;
			bottom: 0;
			left: 0;
			right: 0;
			justify-content: space-around;
			padding: 6px 4px calc(6px + env(safe-area-inset-bottom, 0px));
			background: var(--surface-1);
			border-top: var(--border-w) solid var(--border);
			z-index: 20;
		}
		.tab {
			display: flex;
			flex-direction: column;
			align-items: center;
			gap: 2px;
			padding: 4px 8px;
			min-width: 56px;
			border-radius: var(--radius-2);
			color: var(--text-3);
			text-decoration: none;
			font-size: var(--text-xs);
		}
		.tab.active {
			color: var(--accent-strong);
		}
	}
</style>
