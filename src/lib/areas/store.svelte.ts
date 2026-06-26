// Areas store — same localStorage seam (swappable for SQLite).
import { browser } from '$app/environment';
import type { Area, NewArea } from './types';

const KEY = 'dano.areas';

function uid(): string {
	if (browser && 'randomUUID' in crypto) return crypto.randomUUID();
	return 'a_' + Math.random().toString(36).slice(2, 10);
}

function seed(): Area[] {
	const stamp = new Date().toISOString();
	const make = (name: string): Area => ({
		id: uid(),
		name,
		dueDate: null,
		createdAt: stamp,
		updatedAt: stamp
	});
	return [make('Work'), make('Personal'), make('Health')];
}

class AreaStore {
	areas = $state<Area[]>([]);

	constructor() {
		if (!browser) return;
		const raw = localStorage.getItem(KEY);
		if (raw) {
			try {
				this.areas = JSON.parse(raw) as Area[];
			} catch {
				this.areas = seed();
			}
		} else {
			this.areas = seed();
		}
		$effect.root(() => {
			$effect(() => {
				localStorage.setItem(KEY, JSON.stringify(this.areas));
			});
		});
	}

	get(id: string): Area | undefined {
		return this.areas.find((a) => a.id === id);
	}
	add(data: NewArea): Area {
		const stamp = new Date().toISOString();
		const area: Area = { ...data, id: uid(), createdAt: stamp, updatedAt: stamp };
		this.areas = [...this.areas, area];
		return area;
	}
	update(id: string, patch: Partial<NewArea>): void {
		this.areas = this.areas.map((a) =>
			a.id === id ? { ...a, ...patch, updatedAt: new Date().toISOString() } : a
		);
	}
	remove(id: string): void {
		this.areas = this.areas.filter((a) => a.id !== id);
	}
}

export const areas = new AreaStore();
