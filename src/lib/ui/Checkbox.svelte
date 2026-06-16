<script lang="ts">
	import { Check } from '@lucide/svelte';

	let {
		checked = $bindable(false),
		label,
		onchange
	}: {
		checked?: boolean;
		label?: string;
		onchange?: (value: boolean) => void;
	} = $props();
</script>

<label class="cb">
	<input type="checkbox" bind:checked onchange={() => onchange?.(checked)} />
	<span class="box" aria-hidden="true">
		{#if checked}<Check size={11} strokeWidth={2.75} />{/if}
	</span>
	{#if label}<span class="lbl" class:done={checked}>{label}</span>{/if}
</label>

<style>
	.cb {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		cursor: pointer;
		min-height: var(--tap-min);
	}
	input {
		position: absolute;
		width: 1px;
		height: 1px;
		opacity: 0;
	}
	.box {
		flex: none;
		width: 16px;
		height: 16px;
		border-radius: var(--radius-2);
		border: 1.5px solid var(--border-strong);
		background: var(--surface-1);
		color: var(--text-on-accent);
		display: inline-flex;
		align-items: center;
		justify-content: center;
		transition:
			background var(--motion-fast) var(--ease),
			border-color var(--motion-fast) var(--ease);
	}
	input:checked + .box {
		background: var(--accent);
		border-color: var(--accent);
	}
	input:focus-visible + .box {
		outline: 2px solid var(--accent);
		outline-offset: 2px;
	}
	.lbl {
		font-size: var(--text-base);
	}
	.lbl.done {
		color: var(--text-3);
		text-decoration: line-through;
	}
</style>
