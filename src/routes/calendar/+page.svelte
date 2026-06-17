<script lang="ts">
	import type { CalendarView, CalendarEvent, CalendarItem } from '$lib/calendar/types';
	import { goto } from '$app/navigation';
	import { itemsInRange } from '$lib/calendar/sources';
	import { calendar } from '$lib/calendar/store.svelte';
	import {
		addDays,
		addMonths,
		startOfWeek,
		endOfWeek,
		monthGrid,
		startOfDay,
		endOfDay,
		fmtMonthYear,
		fmtDayLong
	} from '$lib/calendar/date';
	import CalendarHeader from '$lib/calendar/components/CalendarHeader.svelte';
	import MonthView from '$lib/calendar/components/MonthView.svelte';
	import TimeGrid from '$lib/calendar/components/TimeGrid.svelte';
	import AgendaView from '$lib/calendar/components/AgendaView.svelte';
	import EventSheet from '$lib/calendar/components/EventSheet.svelte';

	let view = $state<CalendarView>('month');
	let cursor = $state(new Date());
	let sheetOpen = $state(false);
	let editing = $state<CalendarEvent | null>(null);
	let createDate = $state<Date | null>(null);
	let isMobile = $state(false);

	$effect(() => {
		const mq = window.matchMedia('(max-width: 768px)');
		isMobile = mq.matches;
		const onChange = (e: MediaQueryListEvent) => (isMobile = e.matches);
		mq.addEventListener('change', onChange);
		return () => mq.removeEventListener('change', onChange);
	});

	const range = $derived.by(() => {
		if (view === 'month') {
			const g = monthGrid(cursor);
			return { start: startOfDay(g[0]), end: endOfDay(g[g.length - 1]) };
		}
		if (view === 'week') return { start: startOfWeek(cursor), end: endOfWeek(cursor) };
		if (view === 'day') return { start: startOfDay(cursor), end: endOfDay(cursor) };
		return { start: startOfDay(cursor), end: endOfDay(addDays(cursor, 30)) };
	});
	const items = $derived(itemsInRange(range.start, range.end));
	const weekDays = $derived(Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(cursor), i)));

	const title = $derived.by(() => {
		if (view === 'month') return fmtMonthYear(cursor);
		if (view === 'day') return fmtDayLong(cursor);
		if (view === 'week') {
			const s = startOfWeek(cursor);
			const e = addDays(s, 6);
			const opt: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
			return `${s.toLocaleDateString(undefined, opt)} – ${e.toLocaleDateString(undefined, opt)}`;
		}
		return 'Agenda';
	});

	function prev() {
		if (view === 'month') cursor = addMonths(cursor, -1);
		else if (view === 'week') cursor = addDays(cursor, -7);
		else if (view === 'day') cursor = addDays(cursor, -1);
		else cursor = addDays(cursor, -30);
	}
	function next() {
		if (view === 'month') cursor = addMonths(cursor, 1);
		else if (view === 'week') cursor = addDays(cursor, 7);
		else if (view === 'day') cursor = addDays(cursor, 1);
		else cursor = addDays(cursor, 30);
	}
	function today() {
		cursor = new Date();
	}
	function openNew(date?: Date) {
		editing = null;
		createDate = date ?? null;
		sheetOpen = true;
	}
	function openEdit(eventId: string) {
		editing = calendar.get(eventId) ?? null;
		createDate = null;
		sheetOpen = true;
	}
	// Items can come from other sources (e.g. a person's birthday). Route those to
	// their owner instead of the event editor.
	function selectItem(item: CalendarItem) {
		if (item.source === 'persona') {
			goto(`/persona?id=${item.eventId}`);
			return;
		}
		if (item.source === 'task') {
			goto(`/tasks/${item.eventId}`);
			return;
		}
		if (item.source === 'project') {
			goto(`/projects/${item.eventId}`);
			return;
		}
		openEdit(item.eventId);
	}
	function closeSheet() {
		sheetOpen = false;
		editing = null;
		createDate = null;
	}
	// On mobile, tapping a date in month/week opens that day's agenda instead of
	// jumping straight to the new-event editor. On desktop it still quick-creates.
	function activateDate(date: Date) {
		if (isMobile) {
			cursor = startOfDay(date);
			view = 'agenda';
		} else {
			openNew(date);
		}
	}
</script>

<div class="page">
	<CalendarHeader
		{title}
		{view}
		onPrev={prev}
		onNext={next}
		onToday={today}
		onView={(v) => (view = v)}
		onNew={() => openNew()}
	/>

	{#if view === 'month'}
		<MonthView {cursor} {items} onPickDate={activateDate} onSelect={selectItem} {isMobile} />
	{:else if view === 'agenda'}
		<AgendaView {items} onSelect={selectItem} />
	{:else if view === 'day'}
		<TimeGrid
			days={[startOfDay(cursor)]}
			{items}
			onSelect={selectItem}
			onPickDate={openNew}
			onCreateAt={openNew}
			isMobile={false}
		/>
	{:else}
		<TimeGrid
			days={weekDays}
			{items}
			onSelect={selectItem}
			onPickDate={activateDate}
			onCreateAt={openNew}
			{isMobile}
		/>
	{/if}

	<EventSheet bind:open={sheetOpen} event={editing} initialDate={createDate} onClose={closeSheet} />
</div>

<style>
	.page {
		padding: var(--space-6) var(--space-6) var(--space-8);
		max-width: 1100px;
		margin: 0 auto;
	}
</style>
