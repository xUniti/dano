// Local event store — the source of truth for the calendar's own events.
//
// Persistence is behind a thin seam: today it's localStorage (works in both the
// web preview and the Tauri webview). It is intentionally swappable for a Tauri
// SQLite adapter later without touching the UI or the calendar sources.
import { browser } from '$app/environment';
import type { CalendarEvent } from './types';
import { addDays, withTime } from './date';

const KEY = 'dano.calendar.events';

function uid(): string {
	if (browser && 'randomUUID' in crypto) return crypto.randomUUID();
	return 'ev_' + Math.random().toString(36).slice(2, 10);
}

export type NewEvent = Omit<CalendarEvent, 'id' | 'source' | 'createdAt' | 'updatedAt'>;

function seed(): CalendarEvent[] {
	const now = new Date();
	const at = (dayOffset: number, h: number, m: number) =>
		withTime(addDays(now, dayOffset), new Date(2000, 0, 1, h, m));
	const iso = (d: Date) => d.toISOString();
	const stamp = now.toISOString();
	const make = (e: Omit<CalendarEvent, 'source' | 'createdAt' | 'updatedAt'>): CalendarEvent => ({
		...e,
		source: 'local',
		createdAt: stamp,
		updatedAt: stamp
	});

	return [
		make({
			id: uid(),
			title: 'Design review',
			start: iso(at(0, 14, 0)),
			end: iso(at(0, 15, 0)),
			allDay: false,
			color: '#3a6da6',
			notes: null,
			recurrence: null
		}),
		make({
			id: uid(),
			title: 'Dinner with Mira',
			start: iso(at(0, 18, 30)),
			end: iso(at(0, 20, 0)),
			allDay: false,
			color: '#c2603a',
			notes: null,
			recurrence: null
		}),
		make({
			id: uid(),
			title: 'Morning run',
			start: iso(at(1, 7, 0)),
			end: iso(at(1, 7, 45)),
			allDay: false,
			color: '#6f9c71',
			notes: null,
			recurrence: { freq: 'weekly', interval: 1, weekdays: [1, 3, 5] }
		}),
		make({
			id: uid(),
			title: 'Project deadline',
			start: iso(at(3, 0, 0)),
			end: iso(at(3, 23, 59)),
			allDay: true,
			color: '#b5740b',
			notes: null,
			recurrence: null
		})
	];
}

class CalendarStore {
	events = $state<CalendarEvent[]>([]);

	constructor() {
		if (!browser) return;
		const raw = localStorage.getItem(KEY);
		if (raw) {
			try {
				this.events = JSON.parse(raw) as CalendarEvent[];
			} catch {
				this.events = seed();
			}
		} else {
			this.events = seed();
		}
		$effect.root(() => {
			$effect(() => {
				localStorage.setItem(KEY, JSON.stringify(this.events));
			});
		});
	}

	get(id: string): CalendarEvent | undefined {
		return this.events.find((e) => e.id === id);
	}

	add(data: NewEvent): CalendarEvent {
		const stamp = new Date().toISOString();
		const ev: CalendarEvent = { ...data, id: uid(), source: 'local', createdAt: stamp, updatedAt: stamp };
		this.events = [...this.events, ev];
		return ev;
	}

	update(id: string, patch: Partial<NewEvent>): void {
		this.events = this.events.map((e) =>
			e.id === id ? { ...e, ...patch, updatedAt: new Date().toISOString() } : e
		);
	}

	remove(id: string): void {
		this.events = this.events.filter((e) => e.id !== id);
	}
}

export const calendar = new CalendarStore();
