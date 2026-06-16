<script lang="ts">
	import type { Component } from 'svelte';

	// The labelled-icon pattern: an icon is never alone — it always carries text.
	let {
		icon,
		text,
		size = 14
	}: { icon: Component; text: string; size?: number } = $props();

	const Icon = $derived(icon);
</script>

<span class="il">
	<Icon {size} strokeWidth={1.75} aria-hidden="true" />
	<span>{text}</span>
</span>

<style>
	.il {
		display: inline-flex;
		align-items: center;
		gap: 5px;
		font-size: var(--text-sm);
		color: var(--text-2);
	}
</style>
