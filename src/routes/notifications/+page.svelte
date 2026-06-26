<script lang="ts">
	import type { CalendarItem } from '$lib/calendar/types';
	import { itemsInRange } from '$lib/calendar/sources';
	import { tasks } from '$lib/tasks/store.svelte';
	import { projects } from '$lib/projects/store.svelte';
	import { startOfDay, endOfDay, ymd, fmtTime } from '$lib/calendar/date';
	import { goto } from '$app/navigation';
	import { AlertCircle, ListChecks, FolderKanban } from '@lucide/svelte';

	const now = new Date();
	const today = ymd(now);

	const overdueTasks = $derived(
		tasks.tasks
			.filter((t) => !t.archived && !t.done && t.dueDate && t.dueDate < today)
			.sort((a, b) => (a.dueDate! < b.dueDate! ? -1 : 1))
	);
	const overdueProjects = $derived(
		projects.projects.filter((p) => !p.archived && p.status !== 'done' && p.dueDate && p.dueDate < today)
	);
	const todayItems = $derived(itemsInRange(startOfDay(now), endOfDay(now)));
	const overdueCount = $derived(overdueTasks.length + overdueProjects.length);

	function hrefFor(it: CalendarItem): string {
		if (it.source === 'task') return `/tasks/${it.eventId}`;
		if (it.source === 'project') return `/projects/${it.eventId}`;
		if (it.source === 'area') return `/areas/${it.eventId}`;
		if (it.source === 'persona') return `/persona?id=${it.eventId}`;
		return '/calendar';
	}
	function fmtDue(s: string): string {
		const [y, m, d] = s.split('-').map(Number);
		return new Date(y, m - 1, d).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
	}
</script>

<div class="page">
	<header class="ph"><h1>Notifications</h1></header>

	{#if overdueCount === 0 && todayItems.length === 0}
		<div class="empty"><p>You're all caught up. Nothing overdue or due today.</p></div>
	{:else}
		{#if overdueCount > 0}
			<section>
				<h2 class="danger"><AlertCircle size={14} strokeWidth={1.75} aria-hidden="true" /> Overdue · {overdueCount}</h2>
				{#each overdueTasks as t (t.id)}
					<button class="row over" onclick={() => goto(`/tasks/${t.id}`)}>
						<ListChecks size={16} strokeWidth={1.75} aria-hidden="true" />
						<span class="t">{t.title}</span>
						<span class="when">{fmtDue(t.dueDate!)}</span>
					</button>
				{/each}
				{#each overdueProjects as p (p.id)}
					<button class="row over" onclick={() => goto(`/projects/${p.id}`)}>
						<FolderKanban size={16} strokeWidth={1.75} aria-hidden="true" />
						<span class="t">{p.name || 'Untitled project'}</span>
						<span class="when">{fmtDue(p.dueDate!)}</span>
					</button>
				{/each}
			</section>
		{/if}

		{#if todayItems.length > 0}
			<section>
				<h2>Today · {todayItems.length}</h2>
				{#each todayItems as it (it.key)}
					<button class="row" onclick={() => goto(hrefFor(it))}>
						<span class="bar" style="background: {it.color ?? 'var(--accent)'}"></span>
						<span class="t">{it.title}</span>
						<span class="when">{it.allDay ? 'All day' : fmtTime(it.start)}</span>
					</button>
				{/each}
			</section>
		{/if}
	{/if}

	<p class="foot">OS notifications arrive with the installed app (Tauri). This is your in-app overview.</p>
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
		margin-bottom: var(--space-6);
	}
	h2 {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: var(--text-xs);
		font-weight: var(--weight-medium);
		letter-spacing: 0.04em;
		text-transform: uppercase;
		color: var(--text-3);
		margin-bottom: var(--space-3);
	}
	h2.danger {
		color: var(--danger);
	}
	.row {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		width: 100%;
		padding: var(--space-3) var(--space-4);
		border: var(--border-w) solid var(--border);
		border-radius: var(--radius-3);
		margin-bottom: var(--space-2);
		background: var(--surface-1);
		font: inherit;
		text-align: left;
		color: var(--text-2);
		cursor: pointer;
	}
	.row:hover {
		background: var(--surface-2);
	}
	.row.over {
		border-color: var(--danger-tint);
	}
	.bar {
		flex: none;
		width: 3px;
		height: 16px;
		border-radius: 2px;
	}
	.t {
		flex: 1;
		min-width: 0;
		font-size: var(--text-base);
		color: var(--text-1);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.when {
		flex: none;
		font-size: var(--text-xs);
		color: var(--text-3);
	}
	.over .when {
		color: var(--danger);
	}
	.empty {
		padding: var(--space-8);
		text-align: center;
		color: var(--text-3);
	}
	.foot {
		margin-top: var(--space-6);
		font-size: var(--text-xs);
		color: var(--text-3);
	}
</style>
