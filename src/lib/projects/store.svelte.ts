// Projects store — same localStorage seam (swappable for SQLite).
import { browser } from '$app/environment';
import type { Project, NewProject } from './types';
import { addDays, ymd } from '$lib/calendar/date';

const KEY = 'dano.projects';

function uid(): string {
	if (browser && 'randomUUID' in crypto) return crypto.randomUUID();
	return 'pr_' + Math.random().toString(36).slice(2, 10);
}

function seed(): Project[] {
	const stamp = new Date().toISOString();
	return [
		{
			id: uid(),
			name: 'Launch DANO v1',
			areaId: null,
			personaId: null,
			dueDate: ymd(addDays(new Date(), 14)),
			description: 'Ship the first usable version.',
			status: 'active',
			createdAt: stamp,
			updatedAt: stamp
		}
	];
}

class ProjectStore {
	projects = $state<Project[]>([]);

	constructor() {
		if (!browser) return;
		const raw = localStorage.getItem(KEY);
		if (raw) {
			try {
				this.projects = JSON.parse(raw) as Project[];
			} catch {
				this.projects = seed();
			}
		} else {
			this.projects = seed();
		}
		$effect.root(() => {
			$effect(() => {
				localStorage.setItem(KEY, JSON.stringify(this.projects));
			});
		});
	}

	get(id: string): Project | undefined {
		return this.projects.find((p) => p.id === id);
	}
	add(data: NewProject): Project {
		const stamp = new Date().toISOString();
		const project: Project = { ...data, id: uid(), createdAt: stamp, updatedAt: stamp };
		this.projects = [...this.projects, project];
		return project;
	}
	update(id: string, patch: Partial<NewProject>): void {
		this.projects = this.projects.map((p) =>
			p.id === id ? { ...p, ...patch, updatedAt: new Date().toISOString() } : p
		);
	}
	remove(id: string): void {
		this.projects = this.projects.filter((p) => p.id !== id);
	}
}

export const projects = new ProjectStore();
