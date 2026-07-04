// Recurrence expansion. We keep a small structured model (covers the presets the
// editor offers) and expand it locally — timezone-safe, dependency-free.
import type { CalendarEvent, Recurrence } from './types';
import { addDays, addMonths, endOfDay, startOfWeek, withTime } from './date';

function* occurrences(start: Date, r: Recurrence): Generator<Date> {
	const interval = Math.max(1, r.interval);

	if (r.freq === 'weekly' && r.weekdays && r.weekdays.length) {
		const days = [...r.weekdays].sort((a, b) => a - b);
		let anchor = startOfWeek(start, 0); // Sunday-based to match getDay()
		let guard = 0;
		while (guard++ < 6000) {
			for (const wd of days) {
				const occ = withTime(addDays(anchor, wd), start);
				if (occ >= start) yield occ;
			}
			anchor = addDays(anchor, 7 * interval);
		}
		return;
	}

	let occ = new Date(start);
	let guard = 0;
	while (guard++ < 6000) {
		yield occ;
		if (r.freq === 'daily') occ = addDays(occ, interval);
		else if (r.freq === 'weekly') occ = addDays(occ, 7 * interval);
		else if (r.freq === 'monthly') occ = addMonths(occ, interval);
		else occ = addMonths(occ, 12 * interval);
	}
}

/** Occurrences of an event overlapping [rangeStart, rangeEnd]. */
export function expandEvent(
	ev: CalendarEvent,
	rangeStart: Date,
	rangeEnd: Date
): { start: Date; end: Date }[] {
	const start = new Date(ev.start);
	const end = new Date(ev.end);
	const duration = Math.max(0, end.getTime() - start.getTime());

	if (!ev.recurrence) {
		if (end >= rangeStart && start <= rangeEnd) return [{ start, end }];
		return [];
	}

	const r = ev.recurrence;
	const untilEnd = r.until ? endOfDay(new Date(`${r.until}T00:00:00`)) : null;
	const maxCount = r.count && r.count > 0 ? r.count : Infinity;

	const out: { start: Date; end: Date }[] = [];
	let n = 0;
	for (const occStart of occurrences(start, r)) {
		if (n >= maxCount) break;
		if (untilEnd && occStart > untilEnd) break;
		if (occStart > rangeEnd) break;
		n++;
		const occEnd = new Date(occStart.getTime() + duration);
		if (occEnd >= rangeStart && occStart <= rangeEnd) out.push({ start: occStart, end: occEnd });
		if (out.length > 400) break; // safety for huge ranges
	}
	return out;
}
