<script lang="ts">
	import type { Person } from '$lib/persona/types';
	import { persona } from '$lib/persona/store.svelte';
	import { Button } from '$lib/ui';
	import { Trash2 } from '@lucide/svelte';

	let {
		open = $bindable(false),
		person = null,
		onClose
	}: { open?: boolean; person?: Person | null; onClose: () => void } = $props();

	let firstName = $state('');
	let lastName = $state('');
	let email = $state('');
	let phone = $state('');
	let company = $state('');
	let position = $state('');
	let birthday = $state('');
	let lastContact = $state('');
	let notes = $state('');
	let error = $state('');

	let wasOpen = false;
	$effect(() => {
		if (open && !wasOpen) init();
		wasOpen = open;
	});

	function init() {
		error = '';
		firstName = person?.firstName ?? '';
		lastName = person?.lastName ?? '';
		email = person?.email ?? '';
		phone = person?.phone ?? '';
		company = person?.company ?? '';
		position = person?.position ?? '';
		birthday = person?.birthday ?? '';
		lastContact = person?.lastContact ?? '';
		notes = person?.notes ?? '';
	}

	function save() {
		if (!firstName.trim()) {
			error = 'A first name is required.';
			return;
		}
		const hasCompany = company.trim().length > 0;
		const data = {
			firstName: firstName.trim(),
			lastName: lastName.trim(),
			email: email.trim() || null,
			phone: phone.trim() || null,
			company: hasCompany ? company.trim() : null,
			position: hasCompany ? position.trim() || null : null,
			birthday: birthday || null,
			lastContact: lastContact || null,
			notes: notes.trim() || null
		};
		if (person) persona.update(person.id, data);
		else persona.add(data);
		onClose();
	}
	function del() {
		if (!confirm('Delete this contact? This cannot be undone.')) return;
		if (person) persona.remove(person.id);
		onClose();
	}
	function onkeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') onClose();
	}
	function autofocus(node: HTMLInputElement) {
		node.focus();
	}
</script>

{#if open}
	<div class="overlay" role="presentation" onclick={onClose}>
		<div
			class="sheet"
			role="dialog"
			aria-modal="true"
			aria-label={person ? 'Edit person' : 'New person'}
			tabindex="-1"
			onclick={(e) => e.stopPropagation()}
			{onkeydown}
		>
			<h2>{person ? 'Edit person' : 'New person'}</h2>

			<div class="two">
				<label class="field"><span>First name</span><input bind:value={firstName} use:autofocus /></label>
				<label class="field"><span>Last name</span><input bind:value={lastName} /></label>
			</div>

			<div class="two">
				<label class="field"><span>Email</span><input type="email" bind:value={email} /></label>
				<label class="field"><span>Phone</span><input type="tel" bind:value={phone} /></label>
			</div>

			<label class="field"><span>Company</span><input bind:value={company} placeholder="Optional" /></label>

			{#if company.trim()}
				<label class="field"><span>Position</span><input bind:value={position} placeholder="Role at {company.trim()}" /></label>
			{/if}

			<div class="two">
				<label class="field"><span>Birthday</span><input type="date" bind:value={birthday} /></label>
				<label class="field"><span>Last contact</span><input type="date" bind:value={lastContact} /></label>
			</div>

			<label class="field"><span>Notes</span><textarea bind:value={notes} rows="3" placeholder="Optional"></textarea></label>

			{#if error}<p class="error" role="alert">{error}</p>{/if}

			<div class="actions">
				{#if person}<Button variant="danger" icon={Trash2} onclick={del}>Delete</Button>{/if}
				<span class="spacer"></span>
				<Button variant="ghost" onclick={onClose}>Cancel</Button>
				<Button variant="primary" onclick={save}>Save</Button>
			</div>
		</div>
	</div>
{/if}

<style>
	.overlay {
		position: fixed;
		inset: 0;
		background: rgba(20, 24, 18, 0.4);
		display: flex;
		justify-content: center;
		align-items: flex-start;
		padding: 8vh var(--space-5) var(--space-5);
		z-index: 60;
		overflow: auto;
	}
	.sheet {
		width: min(480px, 96vw);
		background: var(--surface-1);
		border: var(--border-w) solid var(--border-strong);
		border-radius: var(--radius-4);
		box-shadow: var(--shadow-2);
		padding: var(--space-6);
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}
	h2 {
		font-size: var(--text-lg);
		margin-bottom: var(--space-1);
	}
	.field {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}
	.field > span {
		font-size: var(--text-xs);
		color: var(--text-2);
	}
	.two {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
		gap: var(--space-4);
	}
	input,
	textarea {
		font: inherit;
		font-size: var(--text-base);
		color: var(--text-1);
		background: var(--surface-2);
		border: var(--border-w) solid var(--border);
		border-radius: var(--radius-3);
		padding: 8px 10px;
		min-height: max(0px, var(--tap-min));
		width: 100%;
		min-width: 0;
		outline: none;
	}
	input:focus,
	textarea:focus {
		border-color: var(--accent);
	}
	textarea {
		resize: vertical;
	}
	.error {
		margin: 0;
		font-size: var(--text-sm);
		color: var(--danger);
	}
	.actions {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		margin-top: var(--space-2);
	}
	.spacer {
		flex: 1;
	}
	@media (max-width: 480px) {
		.two {
			grid-template-columns: 1fr;
		}
	}
</style>
