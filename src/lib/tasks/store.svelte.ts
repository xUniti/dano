// Task store — same localStorage seam (swappable for SQLite).
import { browser } from '$app/environment';
import type { Task, NewTask } from './types';
import { addDays, ymd } from '$lib/calendar/date';

const KEY = 'dano.tasks';

function uid(): string {
	if (browser && 'randomUUID' in crypto) return crypto.randomUUID();
	return 't_' + Math.random().toString(36).slice(2, 10);
}

function seed(): Task[] {
	const stamp = new Date().toISOString();
	const now = new Date();
	const make = (t: Omit<Task, 'createdAt' | 'updatedAt'>): Task => ({
		...t,
		createdAt: stamp,
		updatedAt: stamp
	});
	return [
		make({
			id: uid(),
			title: 'Finish DANO mockups',
			done: false,
			dueDate: ymd(now),
			priority: 'high',
			personaId: null,
			projectId: null,
			notes: null
		}),
		make({
			id: uid(),
			title: 'Pay electricity bill',
			done: false,
			dueDate: ymd(addDays(now, 2)),
			priority: 'normal',
			personaId: null,
			projectId: null,
			notes: null
		}),
		make({
			id: uid(),
			title: 'Water the plants',
			done: true,
			dueDate: null,
			priority: 'low',
			personaId: null,
			projectId: null,
			notes: null
		})
	];
}

class TaskStore {
	tasks = $state<Task[]>([]);

	constructor() {
		if (!browser) return;
		const raw = localStorage.getItem(KEY);
		if (raw) {
			try {
				this.tasks = JSON.parse(raw) as Task[];
			} catch {
				this.tasks = seed();
			}
		} else {
			this.tasks = seed();
		}
		$effect.root(() => {
			$effect(() => {
				localStorage.setItem(KEY, JSON.stringify(this.tasks));
			});
		});
	}

	get(id: string): Task | undefined {
		return this.tasks.find((t) => t.id === id);
	}
	add(data: NewTask): Task {
		const stamp = new Date().toISOString();
		const task: Task = { ...data, id: uid(), createdAt: stamp, updatedAt: stamp };
		this.tasks = [...this.tasks, task];
		return task;
	}
	update(id: string, patch: Partial<NewTask>): void {
		this.tasks = this.tasks.map((t) =>
			t.id === id ? { ...t, ...patch, updatedAt: new Date().toISOString() } : t
		);
	}
	remove(id: string): void {
		this.tasks = this.tasks.filter((t) => t.id !== id);
	}
}

export const tasks = new TaskStore();
