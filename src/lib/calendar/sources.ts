// Source registry — the heart of "future-aware aggregation".
//
// The calendar renders whatever the registered sources return for a date range.
// Today there is one source (local events). When later phases land, Tasks /
// Habits / Goals and external providers (Google, CalDAV) register their own
// sources and automatically appear on the calendar — no view changes needed.
import type { CalendarItem } from './types';
import { calendar } from './store.svelte';
import { expandEvent } from './recurrence';

export type CalendarSource = {
	id: string;
	label: string;
	getItems: (start: Date, end: Date) => CalendarItem[];
};

const localEvents: CalendarSource = {
	id: 'local',
	label: 'DANO',
	getItems(start, end) {
		const items: CalendarItem[] = [];
		// Reading calendar.events keeps this reactive when used inside $derived.
		for (const ev of calendar.events) {
			for (const occ of expandEvent(ev, start, end)) {
				items.push({
					key: `${ev.id}@${occ.start.toISOString()}`,
					eventId: ev.id,
					title: ev.title,
					start: occ.start,
					end: occ.end,
					allDay: ev.allDay,
					color: ev.color ?? null,
					source: 'local',
					kind: 'event',
					editable: true
				});
			}
		}
		return items;
	}
};

const registry: CalendarSource[] = [localEvents];

export function registerSource(source: CalendarSource): void {
	if (!registry.some((s) => s.id === source.id)) registry.push(source);
}

export function itemsInRange(start: Date, end: Date): CalendarItem[] {
	return registry
		.flatMap((s) => s.getItems(start, end))
		.sort((a, b) => a.start.getTime() - b.start.getTime());
}
