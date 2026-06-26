// Calendar domain model.
//
// The calendar is an aggregating VIEW: many sources (local events now; tasks,
// habits, goals and external providers later) each produce CalendarItems for a
// date range. CalendarEvent is the stored shape for the local "events" source.

export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6; // Sun..Sat (matches Date.getDay)

export type RecurFreq = 'daily' | 'weekly' | 'monthly' | 'yearly';

export type Recurrence = {
	freq: RecurFreq;
	interval: number; // every N units
	weekdays?: Weekday[]; // weekly: which days
	count?: number | null; // total occurrences
	until?: string | null; // yyyy-mm-dd inclusive
};

export type CalendarEvent = {
	id: string;
	title: string;
	start: string; // ISO datetime (local)
	end: string; // ISO datetime (local)
	allDay: boolean;
	recurrence?: Recurrence | null;
	color?: string | null;
	notes?: string | null;
	source: 'local';
	createdAt: string;
	updatedAt: string;
};

/** A single rendered occurrence — what every view consumes. */
export type CalendarItem = {
	key: string; // unique per occurrence
	eventId: string;
	title: string;
	start: Date;
	end: Date;
	allDay: boolean;
	color: string | null;
	source: string; // 'local' | 'persona' | 'task' | 'project' | 'area' | future provider ids
	kind: 'event' | 'birthday' | 'task' | 'project' | 'area'; // future: 'habit' | ...
	editable: boolean;
};

export type CalendarView = 'month' | 'week' | 'day' | 'agenda';

// Accent palette for events — sage-led, accessible, never the only signal.
export const EVENT_COLORS = [
	{ id: 'sage', label: 'Sage', value: '#6f9c71' },
	{ id: 'blue', label: 'Blue', value: '#3a6da6' },
	{ id: 'amber', label: 'Amber', value: '#b5740b' },
	{ id: 'coral', label: 'Coral', value: '#c2603a' },
	{ id: 'plum', label: 'Plum', value: '#7a5aa6' }
] as const;
