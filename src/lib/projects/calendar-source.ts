// Projects → Calendar. A project with a due date shows on the calendar on that
// day. Clicking it opens the project.
import type { CalendarItem } from '$lib/calendar/types';
import { registerSource } from '$lib/calendar/sources';
import { startOfDay, endOfDay } from '$lib/calendar/date';
import { projects } from './store.svelte';

const PROJECT_COLOR = '#7a5aa6';

registerSource({
	id: 'projects-due',
	label: 'Projects',
	getItems(start, end) {
		const items: CalendarItem[] = [];
		for (const p of projects.projects) {
			if (!p.dueDate || p.status === 'done') continue;
			const [y, m, d] = p.dueDate.split('-').map(Number);
			if (Number.isNaN(y)) continue;
			const date = new Date(y, m - 1, d);
			const s = startOfDay(date);
			const e = endOfDay(date);
			if (e >= start && s <= end) {
				items.push({
					key: `project_${p.id}`,
					eventId: p.id,
					title: p.name,
					start: s,
					end: e,
					allDay: true,
					color: PROJECT_COLOR,
					source: 'project',
					kind: 'project',
					editable: false
				});
			}
		}
		return items;
	}
});
