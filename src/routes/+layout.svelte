<script lang="ts">
	import '../app.css';
	import '$lib/settings.svelte'; // constructs the settings singleton; self-applies in browser
	import favicon from '$lib/assets/favicon.svg';
	import AppShell from '$lib/shell/AppShell.svelte';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<AppShell>
	{@render children?.()}
</AppShell>
