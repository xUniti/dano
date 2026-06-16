<script lang="ts">
	import {
		Button,
		Checkbox,
		Input,
		Card,
		ListRow,
		SectionHeader,
		Badge,
		ProgressBar,
		IconLabel
	} from '$lib/ui';
	import { Plus, Flame, Search, Clock, Droplet, Trash2 } from '@lucide/svelte';

	let done = $state(true);
	let todo = $state(false);
	let quick = $state('');

	const colors = [
		{ name: 'bg', var: '--bg' },
		{ name: 'surface-1', var: '--surface-1' },
		{ name: 'surface-2', var: '--surface-2' },
		{ name: 'surface-3', var: '--surface-3' },
		{ name: 'text-2', var: '--text-2' },
		{ name: 'text-1', var: '--text-1' },
		{ name: 'tint', var: '--accent-tint' },
		{ name: 'accent', var: '--accent' },
		{ name: 'accent-strong', var: '--accent-strong' }
	];
	const radii = [
		{ n: '4', v: '--radius-1' },
		{ n: '6', v: '--radius-2' },
		{ n: '8', v: '--radius-3' },
		{ n: '12', v: '--radius-4' }
	];
	const spaces = ['--space-1', '--space-2', '--space-3', '--space-4', '--space-5', '--space-6', '--space-7'];
</script>

<div class="page">
	<header class="ph">
		<h1>Design system</h1>
		<p>Live tokens and components — the language every DANO screen is built from.</p>
	</header>

	<SectionHeader title="Palette · neutral + sage" />
	<div class="swatches">
		{#each colors as c (c.name)}
			<div class="sw">
				<div class="chip" style="background: var({c.var})"></div>
				<small>{c.name}</small>
			</div>
		{/each}
	</div>

	<div class="cols">
		<div>
			<SectionHeader title="Type · system" />
			<div class="type">
				<div style="font-size: var(--text-lg); font-weight: 500;">Good evening</div>
				<div style="font-size: var(--text-base);">Finish DANO mockups</div>
				<div style="font-size: var(--text-xs); letter-spacing: 0.04em; text-transform: uppercase; color: var(--text-3);">Tasks</div>
			</div>
		</div>
		<div>
			<SectionHeader title="Radius" />
			<div class="radii">
				{#each radii as r (r.n)}
					<div class="rwrap">
						<div class="rbox" style="border-radius: var({r.v})"></div>
						<small>{r.n}</small>
					</div>
				{/each}
			</div>
		</div>
	</div>

	<SectionHeader title="Spacing · compact" />
	<div class="spacing">
		{#each spaces as s (s)}
			<div class="swrap">
				<div class="sbar" style="width: var({s})"></div>
				<small>{s.replace('--space-', '')}</small>
			</div>
		{/each}
	</div>

	<SectionHeader title="Buttons" />
	<div class="cluster">
		<Button variant="primary" icon={Plus}>Add task</Button>
		<Button variant="secondary">Cancel</Button>
		<Button variant="ghost">Ghost</Button>
		<Button variant="danger" icon={Trash2}>Delete</Button>
		<Button variant="primary" size="sm" icon={Plus}>Small</Button>
		<Button variant="secondary" icon={Search} ariaLabel="Search" />
	</div>

	<SectionHeader title="Badges" />
	<div class="cluster">
		<Badge tone="neutral">Today</Badge>
		<Badge tone="accent" icon={Flame}>12d streak</Badge>
		<Badge tone="success">Done</Badge>
		<Badge tone="warning">Due soon</Badge>
		<Badge tone="danger">Overdue</Badge>
		<Badge tone="info">Synced</Badge>
	</div>

	<div class="cols">
		<div>
			<SectionHeader title="Inputs & checks" />
			<div class="stack">
				<Input bind:value={quick} icon={Plus} placeholder="Add a task, note, or habit…" label="Quick add" />
				<Checkbox bind:checked={done} label="Morning workout" />
				<Checkbox bind:checked={todo} label="Finish DANO mockups" />
				<IconLabel icon={Clock} text="14:00 · Design review" />
			</div>
		</div>
		<div>
			<SectionHeader title="Progress" />
			<div class="stack">
				<div>
					<div class="pbl"><span>Goal · Ship v1</span><span>62%</span></div>
					<ProgressBar value={62} label="Ship v1 goal" />
				</div>
				<div>
					<div class="pbl"><span>Water</span><span>6 / 8</span></div>
					<ProgressBar value={6} max={8} label="Water" />
				</div>
			</div>
		</div>
	</div>

	<SectionHeader title="List rows" action="See all" />
	<Card pad={false}>
		<div class="rows">
			<ListRow onclick={() => {}}>
				{#snippet lead()}<Checkbox checked label="" />{/snippet}
				<span style="color: var(--text-3); text-decoration: line-through;">Morning workout</span>
			</ListRow>
			<ListRow onclick={() => {}}>
				{#snippet lead()}<Checkbox label="" />{/snippet}
				Finish DANO mockups
				{#snippet trail()}<Badge tone="accent">2pm</Badge>{/snippet}
			</ListRow>
			<ListRow onclick={() => {}}>
				{#snippet lead()}<Droplet size={16} strokeWidth={1.75} aria-hidden="true" />{/snippet}
				Drink water
				{#snippet trail()}<Badge tone="neutral">6/8</Badge>{/snippet}
			</ListRow>
		</div>
	</Card>
</div>

<style>
	.page {
		padding: var(--space-6) var(--space-6) var(--space-8);
		max-width: 860px;
		margin: 0 auto;
	}
	.ph {
		margin-bottom: var(--space-6);
	}
	.ph h1 {
		font-size: var(--text-xl);
	}
	.ph p {
		margin: var(--space-2) 0 0;
		color: var(--text-2);
		font-size: var(--text-base);
	}
	.swatches {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-4);
		margin-bottom: var(--space-7);
	}
	.sw {
		text-align: center;
	}
	.chip {
		width: 40px;
		height: 40px;
		border-radius: var(--radius-3);
		border: var(--border-w) solid var(--border);
	}
	.sw small,
	.rwrap small,
	.swrap small {
		display: block;
		margin-top: var(--space-1);
		font-size: var(--text-xs);
		color: var(--text-3);
	}
	.cols {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--space-7);
		margin-bottom: var(--space-7);
	}
	.type {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}
	.radii,
	.spacing {
		display: flex;
		align-items: flex-end;
		gap: var(--space-5);
		margin-bottom: var(--space-7);
	}
	.rbox {
		width: 40px;
		height: 40px;
		background: var(--accent-tint);
		border: var(--border-w) solid var(--accent);
	}
	.sbar {
		height: 20px;
		background: var(--accent);
		border-radius: var(--radius-1);
	}
	.swrap {
		text-align: center;
	}
	.cluster {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-3);
		margin-bottom: var(--space-7);
	}
	.stack {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}
	.pbl {
		display: flex;
		justify-content: space-between;
		font-size: var(--text-xs);
		color: var(--text-2);
		margin-bottom: var(--space-2);
	}
	.rows :global(.row) {
		border-bottom: var(--border-w) solid var(--border);
	}
	.rows :global(.row:last-child) {
		border-bottom: none;
	}
	@media (max-width: 640px) {
		.cols {
			grid-template-columns: 1fr;
		}
	}
</style>
