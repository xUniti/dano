// Persona → Calendar integration. Importing this module registers a calendar
// source so every person's birthday appears on the calendar as a yearly all-day
// item titled "Ditëlinda e {firstName}". This is the aggregation architecture in
// action: the calendar needs no changes to show a new kind of item.
import type { CalendarItem } from '$lib/calendar/types';
import { registerSource } from '$lib/calendar/sources';
import { startOfDay, endOfDay } from '$lib/calendar/date';
import { persona } from './store.svelte';

const BIRTHDAY_COLOR = '#c45c93';

registerSource({
	id: 'persona-birthdays',
	label: 'Birthdays',
	getItems(start, end) {
		const items: CalendarItem[] = [];
		for (const p of persona.people) {
			if (!p.birthday) continue;
			const [, monthStr, dayStr] = p.birthday.split('-');
			const month = Number(monthStr) - 1;
			const day = Number(dayStr);
			if (Number.isNaN(month) || Number.isNaN(day)) continue;

			for (let year = start.getFullYear(); year <= end.getFullYear(); year++) {
				const date = new Date(year, month, day);
				const s = startOfDay(date);
				const e = endOfDay(date);
				if (e >= start && s <= end) {
					items.push({
						key: `bday_${p.id}_${year}`,
						eventId: p.id,
						title: `Ditëlinda e ${p.firstName}`,
						start: s,
						end: e,
						allDay: true,
						color: BIRTHDAY_COLOR,
						source: 'persona',
						kind: 'birthday',
						editable: false
					});
				}
			}
		}
		return items;
	}
});
