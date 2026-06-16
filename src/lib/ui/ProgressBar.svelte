<script lang="ts">
	let {
		value = 0,
		max = 100,
		label
	}: { value?: number; max?: number; label?: string } = $props();

	const pct = $derived(Math.max(0, Math.min(100, (value / max) * 100)));
</script>

<div
	class="pb"
	role="progressbar"
	aria-valuenow={Math.round(value)}
	aria-valuemin={0}
	aria-valuemax={max}
	aria-label={label}
>
	<div class="fill" style="width: {pct}%"></div>
</div>

<style>
	.pb {
		height: 7px;
		background: var(--surface-3);
		border-radius: var(--radius-1);
		overflow: hidden;
	}
	.fill {
		height: 100%;
		background: var(--accent);
		transition: width var(--motion) var(--ease);
	}
</style>
