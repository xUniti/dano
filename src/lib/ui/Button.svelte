<script lang="ts">
	import type { Component, Snippet } from 'svelte';

	type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

	let {
		variant = 'secondary',
		size = 'md',
		icon,
		href,
		type = 'button',
		disabled = false,
		ariaLabel,
		onclick,
		children
	}: {
		variant?: Variant;
		size?: 'sm' | 'md';
		icon?: Component;
		href?: string;
		type?: 'button' | 'submit';
		disabled?: boolean;
		ariaLabel?: string;
		onclick?: (e: MouseEvent) => void;
		children?: Snippet;
	} = $props();

	const Icon = $derived(icon);
	const iconSize = $derived(size === 'sm' ? 14 : 16);
</script>

{#if href}
	<a class="btn {variant} {size}" {href} aria-label={ariaLabel} {onclick}>
		{#if Icon}<Icon size={iconSize} strokeWidth={1.75} aria-hidden="true" />{/if}
		{@render children?.()}
	</a>
{:else}
	<button class="btn {variant} {size}" {type} {disabled} aria-label={ariaLabel} {onclick}>
		{#if Icon}<Icon size={iconSize} strokeWidth={1.75} aria-hidden="true" />{/if}
		{@render children?.()}
	</button>
{/if}

<style>
	.btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		font: inherit;
		font-size: var(--text-sm);
		font-weight: var(--weight-medium);
		line-height: 1;
		border-radius: var(--radius-3);
		border: var(--border-w) solid transparent;
		padding: 7px 13px;
		min-height: max(var(--control-h), var(--tap-min));
		cursor: pointer;
		text-decoration: none;
		transition:
			background var(--motion-fast) var(--ease),
			border-color var(--motion-fast) var(--ease),
			transform var(--motion-fast) var(--ease);
	}
	.btn.sm {
		padding: 5px 10px;
		font-size: var(--text-xs);
	}
	.btn:active {
		transform: scale(0.985);
	}
	.btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	.primary {
		background: var(--accent);
		color: var(--text-on-accent);
	}
	.primary:hover {
		background: var(--accent-hover);
	}
	.secondary {
		background: var(--surface-1);
		color: var(--text-1);
		border-color: var(--border-strong);
	}
	.secondary:hover {
		background: var(--surface-2);
	}
	.ghost {
		background: transparent;
		color: var(--text-1);
	}
	.ghost:hover {
		background: var(--surface-2);
	}
	.danger {
		background: var(--danger);
		color: #fff;
	}
</style>
