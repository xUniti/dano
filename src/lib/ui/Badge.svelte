<script lang="ts">
	import type { Component, Snippet } from 'svelte';

	type Tone = 'neutral' | 'accent' | 'danger' | 'warning' | 'success' | 'info';

	let {
		tone = 'neutral',
		icon,
		children
	}: { tone?: Tone; icon?: Component; children?: Snippet } = $props();

	const Icon = $derived(icon);
</script>

<span class="badge {tone}">
	{#if Icon}<Icon size={12} strokeWidth={2} aria-hidden="true" />{/if}
	{@render children?.()}
</span>

<style>
	.badge {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		font-size: var(--text-xs);
		font-weight: var(--weight-medium);
		padding: 2px 8px;
		border-radius: var(--radius-2);
		white-space: nowrap;
	}
	.neutral {
		background: var(--surface-2);
		color: var(--text-2);
	}
	.accent {
		background: var(--accent-tint);
		color: var(--accent-strong);
	}
	.danger {
		background: var(--danger-tint);
		color: var(--danger);
	}
	.warning {
		background: var(--warning-tint);
		color: var(--warning);
	}
	.success {
		background: var(--success-tint);
		color: var(--success);
	}
	.info {
		background: var(--info-tint);
		color: var(--info);
	}
</style>
