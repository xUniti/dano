<script lang="ts">
	import { itemsInRange } from '$lib/calendar/sources';
	import { tasks } from '$lib/tasks/store.svelte';
	import { habits } from '$lib/habits/store.svelte';
	import { scheduledOn } from '$lib/habits/types';
	import { projects } from '$lib/projects/store.svelte';
	import { startOfDay, endOfDay, ymd, fmtTime } from '$lib/calendar/date';
	import { goto } from '$app/navigation';
	import { Checkbox } from '$lib/ui';
	import { ArrowRight } from '@lucide/svelte';

	const now = new Date();
	const today = ymd(now);
	const greeting =
		now.getHours() < 12 ? 'Good morning' : now.getHours() < 18 ? 'Good afternoon' : 'Good evening';
	const dateLabel = now.toLocaleDateString(undefined, {
		weekday: 'long',
		day: 'numeric',
		month: 'long'
	});

	const todayItems = $derived(itemsInRange(startOfDay(now), endOfDay(now)));
	const dueTasks = $derived(
		tasks.tasks
			.filter((t) => !t.archived && !t.done && t.dueDate && t.dueDate <= today)
			.sort((a, b) => (a.dueDate! < b.dueDate! ? -1 : 1))
	);
	const todayHabits = $derived(habits.habits.filter((h) => scheduledOn(h, now)));
	const activeProjects = $derived(
		projects.projects.filter((p) => !p.archived && p.status === 'active')
	);
</script>

<div class="page">
	<header class="ph">
		<h1>{greeting}</h1>
		<p>{dateLabel}</p>
	</header>

	<div class="cols">
		<section class="card">
			<div class="ch"><h2>Today</h2><a href="/calendar">Calendar <ArrowRight size={12} strokeWidth={2} aria-hidden="true" /></a></div>
			{#if todayItems.length === 0}
				<p class="none">Nothing scheduled.</p>
			{:else}
				{#each todayItems as it (it.key)}
					<div class="line">
						<span class="bar" style="background: {it.color ?? 'var(--accent)'}"></span>
						<span class="time">{it.allDay ? 'All day' : fmtTime(it.start)}</span>
						<span class="t">{it.title}</span>
					</div>
				{/each}
			{/if}
		</section>

		<section class="card">
			<div class="ch"><h2>Due tasks</h2><a href="/tasks">Tasks <ArrowRight size={12} strokeWidth={2} aria-hidden="true" /></a></div>
			{#if dueTasks.length === 0}
				<p class="none">All clear.</p>
			{:else}
				{#each dueTasks.slice(0, 6) as t (t.id)}
					<div class="line">
						<Checkbox checked={t.done} onchange={() => tasks.update(t.id, { done: true, status: 'done' })} />
						<button class="t link" onclick={() => goto(`/tasks/${t.id}`)}>{t.title}</button>
						{#if t.dueDate && t.dueDate < today}<span class="over">overdue</span>{/if}
					</div>
				{/each}
			{/if}
		</section>

		<section class="card">
			<div class="ch"><h2>Habits today</h2><a href="/habits">Habits <ArrowRight size={12} strokeWidth={2} aria-hidden="true" /></a></div>
			{#if todayHabits.length === 0}
				<p class="none">No habits today.</p>
			{:else}
				{#each todayHabits as h (h.id)}
					<div class="line">
						<Checkbox checked={h.log.includes(today)} onchange={() => habits.toggle(h.id, now)} />
						<span class="t">{h.name}</span>
					</div>
				{/each}
			{/if}
		</section>

		<section class="card">
			<div class="ch"><h2>Active projects</h2><a href="/projects">Projects <ArrowRight size={12} strokeWidth={2} aria-hidden="true" /></a></div>
			{#if activeProjects.length === 0}
				<p class="none">No active projects.</p>
			{:else}
				{#each activeProjects.slice(0, 6) as p (p.id)}
					<div class="line">
						<button class="t link" onclick={() => goto(`/projects/${p.id}`)}>{p.name || 'Untitled project'}</button>
					</div>
				{/each}
			{/if}
		</section>
	</div>
</div>

<style>
	.page {
		padding: var(--space-6) var(--space-6) var(--space-8);
		max-width: 900px;
		margin: 0 auto;
	}
	.ph {
		margin-bottom: var(--space-6);
	}
	.ph h1 {
		font-size: var(--text-xl);
	}
	.ph p {
		margin: var(--space-1) 0 0;
		color: var(--text-2);
		font-size: var(--text-base);
	}
	.cols {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
		gap: var(--space-4);
	}
	.card {
		background: var(--surface-1);
		border: var(--border-w) solid var(--border);
		border-radius: var(--radius-4);
		padding: var(--space-5);
	}
	.ch {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: var(--space-3);
	}
	.ch h2 {
		font-size: var(--text-md);
		font-weight: var(--weight-medium);
	}
	.ch a {
		display: inline-flex;
		align-items: center;
		gap: 3px;
		font-size: var(--text-xs);
		color: var(--accent-strong);
		text-decoration: none;
	}
	.none {
		margin: 0;
		font-size: var(--text-sm);
		color: var(--text-3);
	}
	.line {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		padding: var(--space-2) 0;
		min-height: 30px;
	}
	.bar {
		flex: none;
		width: 3px;
		height: 15px;
		border-radius: 2px;
	}
	.time {
		flex: none;
		width: 58px;
		font-size: var(--text-xs);
		color: var(--text-2);
	}
	.t {
		flex: 1;
		min-width: 0;
		font-size: var(--text-base);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	button.link {
		border: none;
		background: transparent;
		font: inherit;
		color: var(--text-1);
		text-align: left;
		cursor: pointer;
		padding: 0;
	}
	button.link:hover {
		color: var(--accent-strong);
	}
	.over {
		flex: none;
		font-size: var(--text-xs);
		color: var(--danger);
		background: var(--danger-tint);
		padding: 1px 7px;
		border-radius: var(--radius-2);
	}
</style>
