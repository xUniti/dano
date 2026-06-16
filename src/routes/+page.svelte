<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	onMount(() => goto('/calendar', { replaceState: true }));
</script>

<p class="redirect">Opening Calendar…</p>

<style>
	.redirect {
		padding: var(--space-6);
		color: var(--text-3);
		font-size: var(--text-sm);
	}
</style>
