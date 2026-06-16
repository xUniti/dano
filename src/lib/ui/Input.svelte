<script lang="ts">
	import type { Component } from 'svelte';

	let {
		value = $bindable(''),
		placeholder,
		type = 'text',
		icon,
		label,
		oninput
	}: {
		value?: string;
		placeholder?: string;
		type?: string;
		icon?: Component;
		label?: string;
		oninput?: (e: Event) => void;
	} = $props();

	const Icon = $derived(icon);
</script>

<div class="field">
	{#if Icon}<Icon size={15} strokeWidth={1.75} aria-hidden="true" />{/if}
	<input {type} bind:value {placeholder} aria-label={label} {oninput} />
</div>

<style>
	.field {
		display: flex;
		align-items: center;
		gap: 7px;
		background: var(--surface-2);
		border: var(--border-w) solid var(--border);
		border-radius: var(--radius-3);
		padding: 0 11px;
		min-height: max(var(--control-h), var(--tap-min));
		color: var(--text-3);
	}
	.field:focus-within {
		border-color: var(--accent);
	}
	input {
		flex: 1;
		min-width: 0;
		border: none;
		background: transparent;
		font: inherit;
		font-size: var(--text-sm);
		color: var(--text-1);
		padding: 8px 0;
		outline: none;
	}
	input::placeholder {
		color: var(--text-3);
	}
</style>
