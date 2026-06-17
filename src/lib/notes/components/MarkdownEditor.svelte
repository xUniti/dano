<script lang="ts">
	import { renderMarkdown } from '$lib/notes/markdown';
	import {
		Bold,
		Italic,
		Strikethrough,
		Heading,
		List,
		ListOrdered,
		ListChecks,
		Quote,
		Link as LinkIcon,
		Code
	} from '@lucide/svelte';

	let {
		value = $bindable(''),
		placeholder = 'Write…',
		onblur
	}: { value?: string; placeholder?: string; onblur?: () => void } = $props();

	let ta = $state<HTMLTextAreaElement>();
	let tab = $state<'write' | 'preview'>('write');

	function queueSelection(a: number, b: number) {
		requestAnimationFrame(() => {
			ta?.focus();
			ta?.setSelectionRange(a, b);
		});
	}
	function surround(before: string, after = before, ph = 'text') {
		if (!ta) return;
		const start = ta.selectionStart;
		const end = ta.selectionEnd;
		const sel = value.slice(start, end) || ph;
		value = value.slice(0, start) + before + sel + after + value.slice(end);
		queueSelection(start + before.length, start + before.length + sel.length);
	}
	function linePrefix(prefix: string) {
		if (!ta) return;
		const start = ta.selectionStart;
		const end = ta.selectionEnd;
		const lineStart = value.lastIndexOf('\n', start - 1) + 1;
		const block = value.slice(lineStart, end);
		const prefixed = block
			.split('\n')
			.map((l) => prefix + l)
			.join('\n');
		value = value.slice(0, lineStart) + prefixed + value.slice(end);
		queueSelection(lineStart, lineStart + prefixed.length);
	}
	function link() {
		if (!ta) return;
		const start = ta.selectionStart;
		const end = ta.selectionEnd;
		const sel = value.slice(start, end) || 'text';
		const insert = `[${sel}](https://)`;
		value = value.slice(0, start) + insert + value.slice(end);
		queueSelection(start + insert.length - 1, start + insert.length - 1);
	}

	const tools = [
		{ icon: Bold, label: 'Bold', run: () => surround('**') },
		{ icon: Italic, label: 'Italic', run: () => surround('*') },
		{ icon: Strikethrough, label: 'Strikethrough', run: () => surround('~~') },
		{ icon: Heading, label: 'Heading', run: () => linePrefix('# ') },
		{ icon: LinkIcon, label: 'Link', run: link },
		{ icon: List, label: 'Bulleted list', run: () => linePrefix('- ') },
		{ icon: ListOrdered, label: 'Numbered list', run: () => linePrefix('1. ') },
		{ icon: ListChecks, label: 'Checklist', run: () => linePrefix('- [ ] ') },
		{ icon: Quote, label: 'Quote', run: () => linePrefix('> ') },
		{ icon: Code, label: 'Code', run: () => surround('`') }
	];
</script>

<div class="editor">
	<div class="bar">
		<div class="tools" role="toolbar" aria-label="Formatting">
			{#each tools as t (t.label)}
				{@const Icon = t.icon}
				<button type="button" aria-label={t.label} title={t.label} onclick={t.run} disabled={tab === 'preview'}>
					<Icon size={16} strokeWidth={1.75} aria-hidden="true" />
				</button>
			{/each}
		</div>
		<div class="tabs">
			<button type="button" class:on={tab === 'write'} onclick={() => (tab = 'write')}>Write</button>
			<button type="button" class:on={tab === 'preview'} onclick={() => (tab = 'preview')}>Preview</button>
		</div>
	</div>

	{#if tab === 'write'}
		<textarea
			bind:this={ta}
			bind:value
			{placeholder}
			aria-label="Note body"
			rows="12"
			onblur={() => onblur?.()}
		></textarea>
	{:else if value.trim()}
		<div class="preview prose">{@html renderMarkdown(value)}</div>
	{:else}
		<div class="preview empty">Nothing to preview yet.</div>
	{/if}
</div>

<style>
	.editor {
		border: var(--border-w) solid var(--border);
		border-radius: var(--radius-3);
		overflow: hidden;
		background: var(--surface-1);
	}
	.bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-3);
		padding: 4px 6px;
		background: var(--surface-2);
		border-bottom: var(--border-w) solid var(--border);
		flex-wrap: wrap;
	}
	.tools {
		display: flex;
		flex-wrap: wrap;
		gap: 1px;
	}
	.tools button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 30px;
		height: 30px;
		border: none;
		background: transparent;
		color: var(--text-2);
		border-radius: var(--radius-2);
		cursor: pointer;
	}
	.tools button:hover {
		background: var(--surface-3);
		color: var(--text-1);
	}
	.tools button:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}
	.tabs {
		display: inline-flex;
		gap: 1px;
	}
	.tabs button {
		font: inherit;
		font-size: var(--text-xs);
		padding: 5px 10px;
		border: none;
		background: transparent;
		color: var(--text-2);
		border-radius: var(--radius-2);
		cursor: pointer;
	}
	.tabs button.on {
		background: var(--accent-tint);
		color: var(--accent-strong);
		font-weight: var(--weight-medium);
	}
	textarea {
		width: 100%;
		border: none;
		background: transparent;
		font: inherit;
		font-size: var(--text-base);
		line-height: var(--leading);
		color: var(--text-1);
		padding: var(--space-4) var(--space-5);
		outline: none;
		resize: vertical;
		min-height: 200px;
	}
	.preview {
		padding: var(--space-4) var(--space-5);
		min-height: 200px;
	}
	.preview.empty {
		color: var(--text-3);
		font-size: var(--text-sm);
	}
	.prose :global(h1),
	.prose :global(h2),
	.prose :global(h3) {
		font-weight: var(--weight-medium);
		margin: 0.6em 0 0.3em;
	}
	.prose :global(h1) {
		font-size: var(--text-lg);
	}
	.prose :global(h2) {
		font-size: var(--text-md);
	}
	.prose :global(h3) {
		font-size: var(--text-base);
	}
	.prose :global(p) {
		margin: 0 0 0.6em;
	}
	.prose :global(ul),
	.prose :global(ol) {
		margin: 0 0 0.6em;
		padding-left: 1.4em;
	}
	.prose :global(li.task) {
		list-style: none;
		margin-left: -1.2em;
	}
	.prose :global(blockquote) {
		margin: 0 0 0.6em;
		padding-left: var(--space-4);
		border-left: 3px solid var(--border-strong);
		color: var(--text-2);
	}
	.prose :global(code) {
		font-family: var(--font-mono);
		font-size: 0.9em;
		background: var(--surface-2);
		padding: 1px 5px;
		border-radius: var(--radius-1);
	}
	.prose :global(pre) {
		background: var(--surface-2);
		padding: var(--space-4);
		border-radius: var(--radius-2);
		overflow: auto;
	}
	.prose :global(pre code) {
		background: none;
		padding: 0;
	}
	.prose :global(a) {
		color: var(--accent-strong);
	}
	.prose :global(hr) {
		border: none;
		border-top: var(--border-w) solid var(--border);
		margin: 1em 0;
	}
</style>
