<script lang="ts">
	import type { Component } from 'svelte';

	let { title, icon, note }: { title: string; icon: Component; note?: string } = $props();
	const Icon = $derived(icon);
</script>

<div class="page">
	<header class="ph"><h1>{title}</h1></header>
	<div class="cs">
		<Icon size={28} strokeWidth={1.5} aria-hidden="true" />
		<p>{note ?? 'Coming in a later phase.'}</p>
	</div>
</div>

<style>
	.page {
		padding: var(--space-6) var(--space-6) var(--space-8);
		max-width: 920px;
		margin: 0 auto;
	}
	.ph h1 {
		font-size: var(--text-xl);
	}
	.cs {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-4);
		margin-top: var(--space-8);
		padding: var(--space-8);
		color: var(--text-3);
		text-align: center;
	}
	.cs p {
		margin: 0;
		font-size: var(--text-base);
	}
</style>
