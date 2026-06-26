// Habits store — same localStorage seam (swappable for SQLite).
import { browser } from '$app/environment';
import type { Habit, NewHabit } from './types';
import { scheduledOn } from './types';
import { addDays, ymd } from '$lib/calendar/date';

const KEY = 'dano.habits';

function uid(): string {
	if (browser && 'randomUUID' in crypto) return crypto.randomUUID();
	return 'h_' + Math.random().toString(36).slice(2, 10);
}

function seed(): Habit[] {
	const stamp = new Date().toISOString();
	const today = new Date();
	const make = (name: string, weekdays: number[], doneOffsets: number[]): Habit => ({
		id: uid(),
		name,
		weekdays,
		log: doneOffsets.map((o) => ymd(addDays(today, -o))),
		createdAt: stamp,
		updatedAt: stamp
	});
	return [
		make('Drink water', [], [1, 2, 3]),
		make('Read 20 minutes', [], [0, 1, 2, 3, 4]),
		make('Workout', [1, 3, 5], [])
	];
}

export function streak(h: Habit): number {
	const done = new Set(h.log);
	let count = 0;
	const today = new Date();
	for (let i = 0; i < 3650; i++) {
		const day = addDays(today, -i);
		if (!scheduledOn(h, day)) continue;
		if (done.has(ymd(day))) {
			count++;
		} else if (i === 0) {
			continue; // today not done yet doesn't break the streak
		} else {
			break;
		}
	}
	return count;
}

class HabitStore {
	habits = $state<Habit[]>([]);

	constructor() {
		if (!browser) return;
		const raw = localStorage.getItem(KEY);
		if (raw) {
			try {
				this.habits = JSON.parse(raw) as Habit[];
			} catch {
				this.habits = seed();
			}
		} else {
			this.habits = seed();
		}
		$effect.root(() => {
			$effect(() => {
				localStorage.setItem(KEY, JSON.stringify(this.habits));
			});
		});
	}

	get(id: string): Habit | undefined {
		return this.habits.find((h) => h.id === id);
	}
	isDone(h: Habit, date: Date): boolean {
		return h.log.includes(ymd(date));
	}
	toggle(id: string, date: Date): void {
		const key = ymd(date);
		this.habits = this.habits.map((h) => {
			if (h.id !== id) return h;
			const log = h.log.includes(key) ? h.log.filter((d) => d !== key) : [...h.log, key];
			return { ...h, log, updatedAt: new Date().toISOString() };
		});
	}
	add(data: NewHabit): Habit {
		const stamp = new Date().toISOString();
		const habit: Habit = { ...data, id: uid(), createdAt: stamp, updatedAt: stamp };
		this.habits = [...this.habits, habit];
		return habit;
	}
	update(id: string, patch: Partial<NewHabit>): void {
		this.habits = this.habits.map((h) =>
			h.id === id ? { ...h, ...patch, updatedAt: new Date().toISOString() } : h
		);
	}
	remove(id: string): void {
		this.habits = this.habits.filter((h) => h.id !== id);
	}
}

export const habits = new HabitStore();
