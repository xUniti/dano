<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		lead,
		trail,
		href,
		onclick,
		children
	}: {
		lead?: Snippet;
		trail?: Snippet;
		href?: string;
		onclick?: () => void;
		children?: Snippet;
	} = $props();

	const interactive = $derived(!!href || !!onclick);

	function onkeydown(e: KeyboardEvent) {
		if (onclick && (e.key === 'Enter' || e.key === ' ')) {
			e.preventDefault();
			onclick();
		}
	}
</script>

{#if href}
	<a class="row interactive" {href} {onclick}>
		{#if lead}<span class="lead">{@render lead()}</span>{/if}
		<span class="main">{@render children?.()}</span>
		{#if trail}<span class="trail">{@render trail()}</span>{/if}
	</a>
{:else}
	<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
	<div
		class="row"
		class:interactive
		role={onclick ? 'button' : undefined}
		tabindex={onclick ? 0 : undefined}
		{onclick}
		{onkeydown}
	>
		{#if lead}<span class="lead">{@render lead()}</span>{/if}
		<span class="main">{@render children?.()}</span>
		{#if trail}<span class="trail">{@render trail()}</span>{/if}
	</div>
{/if}

<style>
	.row {
		display: flex;
		align-items: center;
		gap: 9px;
		width: 100%;
		padding: var(--row-pad-y) var(--row-pad-x);
		min-height: max(36px, var(--tap-min));
		border: none;
		background: transparent;
		font: inherit;
		color: var(--text-1);
		text-align: left;
		text-decoration: none;
	}
	.row.interactive {
		cursor: pointer;
		transition: background var(--motion-fast) var(--ease);
	}
	.row.interactive:hover {
		background: var(--surface-2);
	}
	.lead,
	.trail {
		flex: none;
		display: inline-flex;
		align-items: center;
	}
	.main {
		flex: 1;
		min-width: 0;
		font-size: var(--text-base);
	}
</style>
