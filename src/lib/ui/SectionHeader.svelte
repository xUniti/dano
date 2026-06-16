<script lang="ts">
	let {
		title,
		action,
		onaction
	}: { title: string; action?: string; onaction?: () => void } = $props();
</script>

<div class="sh">
	<span class="t">{title}</span>
	{#if action}<button class="a" onclick={onaction}>{action}</button>{/if}
</div>

<style>
	.sh {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin: 0 0 var(--space-3);
	}
	.t {
		font-size: var(--text-xs);
		font-weight: var(--weight-medium);
		letter-spacing: 0.04em;
		text-transform: uppercase;
		color: var(--text-3);
	}
	.a {
		font-size: var(--text-xs);
		color: var(--accent-strong);
		background: none;
		border: none;
		cursor: pointer;
		padding: 2px 4px;
		border-radius: var(--radius-1);
	}
	.a:hover {
		text-decoration: underline;
	}
</style>
