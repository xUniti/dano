// Tasks → Calendar. Importing this registers a source so pending tasks with a due
// date appear on the calendar on that day. Clicking one opens the task page.
import type { CalendarItem } from '$lib/calendar/types';
import { registerSource } from '$lib/calendar/sources';
import { startOfDay, endOfDay } from '$lib/calendar/date';
import { tasks } from './store.svelte';

const TASK_COLOR = '#3a6da6';

registerSource({
	id: 'tasks-due',
	label: 'Tasks',
	getItems(start, end) {
		const items: CalendarItem[] = [];
		for (const t of tasks.tasks) {
			if (!t.dueDate || t.done) continue;
			const [y, m, d] = t.dueDate.split('-').map(Number);
			if (Number.isNaN(y)) continue;
			const date = new Date(y, m - 1, d);
			const s = startOfDay(date);
			const e = endOfDay(date);
			if (e >= start && s <= end) {
				items.push({
					key: `task_${t.id}`,
					eventId: t.id,
					title: t.title,
					start: s,
					end: e,
					allDay: true,
					color: TASK_COLOR,
					source: 'task',
					kind: 'task',
					editable: false
				});
			}
		}
		return items;
	}
});
