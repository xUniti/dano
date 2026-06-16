<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		elevated = false,
		pad = true,
		children
	}: { elevated?: boolean; pad?: boolean; children?: Snippet } = $props();
</script>

<div class="card" class:elevated class:pad>
	{@render children?.()}
</div>

<style>
	.card {
		background: var(--surface-1);
		border: var(--border-w) solid var(--border);
		border-radius: var(--radius-4);
	}
	.card.pad {
		padding: var(--space-5) var(--space-6);
	}
	.card.elevated {
		box-shadow: var(--shadow-1);
	}
</style>
