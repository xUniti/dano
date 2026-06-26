// Areas → Calendar. An area with a due date shows on the calendar on that day.
// Clicking it opens the area.
import type { CalendarItem } from '$lib/calendar/types';
import { registerSource } from '$lib/calendar/sources';
import { startOfDay, endOfDay } from '$lib/calendar/date';
import { areas } from './store.svelte';

const AREA_COLOR = '#1d9e75';

registerSource({
	id: 'areas-due',
	label: 'Areas',
	getItems(start, end) {
		const items: CalendarItem[] = [];
		for (const a of areas.areas) {
			if (!a.dueDate) continue;
			const [y, m, d] = a.dueDate.split('-').map(Number);
			if (Number.isNaN(y)) continue;
			const date = new Date(y, m - 1, d);
			const s = startOfDay(date);
			const e = endOfDay(date);
			if (e >= start && s <= end) {
				items.push({
					key: `area_${a.id}`,
					eventId: a.id,
					title: a.name,
					start: s,
					end: e,
					allDay: true,
					color: AREA_COLOR,
					source: 'area',
					kind: 'area',
					editable: false
				});
			}
		}
		return items;
	}
});
