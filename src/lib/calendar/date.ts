// Date helpers — native Date only (no dependency). Everything is local-time for
// now; explicit time-zone handling comes with external calendar sync.

export const WEEK_START = 1; // Monday

export function pad(n: number): string {
	return String(n).padStart(2, '0');
}

export function ymd(d: Date): string {
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function startOfDay(d: Date): Date {
	const x = new Date(d);
	x.setHours(0, 0, 0, 0);
	return x;
}
export function endOfDay(d: Date): Date {
	const x = new Date(d);
	x.setHours(23, 59, 59, 999);
	return x;
}
export function stripTime(d: Date): Date {
	return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
export function withTime(day: Date, time: Date): Date {
	return new Date(
		day.getFullYear(),
		day.getMonth(),
		day.getDate(),
		time.getHours(),
		time.getMinutes(),
		time.getSeconds(),
		0
	);
}

export function addDays(d: Date, n: number): Date {
	const x = new Date(d);
	x.setDate(x.getDate() + n);
	return x;
}
export function addMonths(d: Date, n: number): Date {
	const x = new Date(d);
	x.setMonth(x.getMonth() + n);
	return x;
}

export function isSameDay(a: Date, b: Date): boolean {
	return (
		a.getFullYear() === b.getFullYear() &&
		a.getMonth() === b.getMonth() &&
		a.getDate() === b.getDate()
	);
}
export function isToday(d: Date): boolean {
	return isSameDay(d, new Date());
}
export function isSameMonth(a: Date, b: Date): boolean {
	return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

export function startOfMonth(d: Date): Date {
	return new Date(d.getFullYear(), d.getMonth(), 1);
}
export function endOfMonth(d: Date): Date {
	return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}
export function startOfWeek(d: Date, weekStart = WEEK_START): Date {
	const x = startOfDay(d);
	const diff = (x.getDay() - weekStart + 7) % 7;
	return addDays(x, -diff);
}
export function endOfWeek(d: Date, weekStart = WEEK_START): Date {
	return endOfDay(addDays(startOfWeek(d, weekStart), 6));
}

export function eachDay(start: Date, end: Date): Date[] {
	const days: Date[] = [];
	let cur = startOfDay(start);
	const last = startOfDay(end);
	while (cur <= last) {
		days.push(cur);
		cur = addDays(cur, 1);
	}
	return days;
}

/** 6 full weeks (42 days) covering the month — for the month grid. */
export function monthGrid(d: Date, weekStart = WEEK_START): Date[] {
	const gridStart = startOfWeek(startOfMonth(d), weekStart);
	return Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
}

/** Weekday header labels starting from weekStart. */
export function weekdayLabels(weekStart = WEEK_START): string[] {
	const ref = startOfWeek(new Date(), weekStart);
	return Array.from({ length: 7 }, (_, i) =>
		addDays(ref, i).toLocaleDateString(undefined, { weekday: 'short' })
	);
}

export function minutesOfDay(d: Date): number {
	return d.getHours() * 60 + d.getMinutes();
}

// Formatting
export function fmtMonthYear(d: Date): string {
	return d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}
export function fmtTime(d: Date): string {
	return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}
export function fmtDayLong(d: Date): string {
	return d.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });
}
export function fmtDayShort(d: Date): string {
	return d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' });
}

// <input type="datetime-local"> round-trips (local, no timezone suffix)
export function toLocalInput(d: Date): string {
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
export function toDateInput(d: Date): string {
	return ymd(d);
}
