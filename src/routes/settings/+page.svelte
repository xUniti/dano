<script lang="ts">
	import { settings, type ThemeMode, type Density } from '$lib/settings.svelte';
	import { exportData, importData } from '$lib/backup';
	import { Button } from '$lib/ui';
	import { RotateCcw, Download, Upload } from '@lucide/svelte';

	let fileInput = $state<HTMLInputElement | null>(null);
	let importError = $state('');

	async function onImport(e: Event) {
		importError = '';
		const file = (e.currentTarget as HTMLInputElement).files?.[0];
		if (!file) return;
		try {
			await importData(file); // reloads on success
		} catch (err) {
			importError = err instanceof Error ? err.message : 'Could not read that file.';
		}
	}

	const themes: { value: ThemeMode; label: string }[] = [
		{ value: 'auto', label: 'Auto' },
		{ value: 'light', label: 'Light' },
		{ value: 'dark', label: 'Dark' }
	];
	const densities: { value: Density; label: string }[] = [
		{ value: 'compact', label: 'Compact' },
		{ value: 'comfortable', label: 'Comfortable' }
	];
</script>

<div class="page">
	<header class="ph"><h1>Settings</h1></header>

	<section aria-labelledby="appearance">
		<h2 id="appearance">Appearance</h2>

		<div class="row">
			<div class="label"><span>Theme</span><small>Follows your system by default</small></div>
			<div class="seg" role="group" aria-label="Theme">
				{#each themes as t (t.value)}
					<button class:on={settings.theme === t.value} onclick={() => (settings.theme = t.value)}>
						{t.label}
					</button>
				{/each}
			</div>
		</div>

		<div class="row">
			<div class="label"><span>Density</span><small>How tight the layout feels</small></div>
			<div class="seg" role="group" aria-label="Density">
				{#each densities as d (d.value)}
					<button class:on={settings.density === d.value} onclick={() => (settings.density = d.value)}>
						{d.label}
					</button>
				{/each}
			</div>
		</div>
	</section>

	<section aria-labelledby="reading">
		<h2 id="reading">Reading & vision</h2>

		<div class="row">
			<label class="label" for="textscale"><span>Text size</span><small>{settings.textScale}%</small></label>
			<input
				id="textscale"
				type="range"
				min="80"
				max="160"
				step="10"
				bind:value={settings.textScale}
			/>
		</div>

		{#snippet toggle(id: string, title: string, desc: string, checked: boolean, set: (v: boolean) => void)}
			<div class="row">
				<label class="label" for={id}><span>{title}</span><small>{desc}</small></label>
				<input {id} type="checkbox" {checked} onchange={(e) => set(e.currentTarget.checked)} />
			</div>
		{/snippet}

		{@render toggle('contrast', 'High contrast', 'Stronger text and borders', settings.highContrast, (v) => (settings.highContrast = v))}
		{@render toggle('spacing', 'Roomier text spacing', 'More space between letters and lines', settings.looseTextSpacing, (v) => (settings.looseTextSpacing = v))}
		{@render toggle('dyslexia', 'Dyslexia-friendly font', 'Switch to a more legible typeface', settings.dyslexiaFont, (v) => (settings.dyslexiaFont = v))}
		{@render toggle('lines', 'Shorter line length', 'Easier tracking for long text', settings.shortLines, (v) => (settings.shortLines = v))}
	</section>

	<section aria-labelledby="interaction">
		<h2 id="interaction">Interaction & motion</h2>

		{#snippet toggle2(id: string, title: string, desc: string, checked: boolean, set: (v: boolean) => void)}
			<div class="row">
				<label class="label" for={id}><span>{title}</span><small>{desc}</small></label>
				<input {id} type="checkbox" {checked} onchange={(e) => set(e.currentTarget.checked)} />
			</div>
		{/snippet}

		{@render toggle2('targets', 'Large touch targets', 'Bigger tap areas (≥44px)', settings.largeTargets, (v) => (settings.largeTargets = v))}
		{@render toggle2('motion', 'Reduce motion', 'Minimise animations', settings.reduceMotion, (v) => (settings.reduceMotion = v))}
	</section>

	<section aria-labelledby="data">
		<h2 id="data">Your data</h2>

		<div class="row">
			<div class="label">
				<span>Backup</span>
				<small>Save everything to a file you keep</small>
			</div>
			<Button icon={Download} onclick={exportData}>Export</Button>
		</div>

		<div class="row">
			<div class="label">
				<span>Restore</span>
				<small>Replace your data with a backup file</small>
			</div>
			<Button icon={Upload} onclick={() => fileInput?.click()}>Import</Button>
		</div>

		<input
			bind:this={fileInput}
			type="file"
			accept="application/json"
			class="sr-only"
			aria-hidden="true"
			tabindex="-1"
			onchange={onImport}
		/>
		{#if importError}<p class="err" role="alert">{importError}</p>{/if}
	</section>

	<div class="reset">
		<Button icon={RotateCcw} onclick={() => settings.reset()}>Reset to defaults</Button>
	</div>
</div>

<style>
	.page {
		padding: var(--space-6) var(--space-6) var(--space-8);
		max-width: 720px;
		margin: 0 auto;
	}
	.ph h1 {
		font-size: var(--text-xl);
		margin-bottom: var(--space-5);
	}
	section {
		margin-bottom: var(--space-7);
	}
	h2 {
		font-size: var(--text-xs);
		font-weight: var(--weight-medium);
		letter-spacing: 0.04em;
		text-transform: uppercase;
		color: var(--text-3);
		margin-bottom: var(--space-3);
	}
	.row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-5);
		padding: var(--space-4) 0;
		border-bottom: var(--border-w) solid var(--border);
	}
	.label {
		display: flex;
		flex-direction: column;
		gap: 1px;
		font-size: var(--text-base);
	}
	.label small {
		font-size: var(--text-xs);
		color: var(--text-3);
	}
	.seg {
		display: inline-flex;
		border: var(--border-w) solid var(--border);
		border-radius: var(--radius-3);
		overflow: hidden;
		flex: none;
	}
	.seg button {
		font: inherit;
		font-size: var(--text-sm);
		padding: 6px 12px;
		min-height: max(0px, var(--tap-min));
		background: var(--surface-1);
		color: var(--text-2);
		border: none;
		border-left: var(--border-w) solid var(--border);
		cursor: pointer;
	}
	.seg button:first-child {
		border-left: none;
	}
	.seg button.on {
		background: var(--accent-tint);
		color: var(--accent-strong);
		font-weight: var(--weight-medium);
	}
	input[type='range'] {
		flex: 1;
		max-width: 240px;
		accent-color: var(--accent);
	}
	input[type='checkbox'] {
		width: 18px;
		height: 18px;
		accent-color: var(--accent);
		flex: none;
	}
	.err {
		margin: var(--space-3) 0 0;
		font-size: var(--text-sm);
		color: var(--danger);
	}
	.reset {
		margin-top: var(--space-6);
	}
</style>
