<script lang="ts">
	import { Calendar } from '@lucide/svelte';
	import { Card } from '$lib/ui';
</script>

<div class="page">
	<header class="ph">
		<h1>Calendar</h1>
	</header>

	<Card>
		<div class="cs">
			<Calendar size={28} strokeWidth={1.5} aria-hidden="true" />
			<p>Phase 0 is in place — the calendar itself is the next thing we build (Phase 1).</p>
		</div>
	</Card>
</div>

<style>
	.page {
		padding: var(--space-6) var(--space-6) var(--space-8);
		max-width: 920px;
		margin: 0 auto;
	}
	.ph h1 {
		font-size: var(--text-xl);
		margin-bottom: var(--space-5);
	}
	.cs {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-4);
		padding: var(--space-7);
		color: var(--text-3);
		text-align: center;
	}
	.cs p {
		margin: 0;
		font-size: var(--text-base);
		max-width: 42ch;
	}
</style>
