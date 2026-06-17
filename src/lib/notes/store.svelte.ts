// Notes store — same localStorage seam (swappable for SQLite).
import { browser } from '$app/environment';
import type { Note, NewNote } from './types';

const KEY = 'dano.notes';

function uid(): string {
	if (browser && 'randomUUID' in crypto) return crypto.randomUUID();
	return 'n_' + Math.random().toString(36).slice(2, 10);
}

function seed(): Note[] {
	const stamp = new Date().toISOString();
	const make = (n: Omit<Note, 'createdAt' | 'updatedAt'>): Note => ({
		...n,
		createdAt: stamp,
		updatedAt: stamp
	});
	return [
		make({
			id: uid(),
			title: 'Welcome to Notes',
			body: '# Notes\n\nWrite anything here. Use the toolbar for **bold**, *italic*, lists, and:\n\n- [ ] a checklist\n- [x] that you can tick\n\n> Tag notes to find them later, or link them to a task or person.',
			tags: ['guide'],
			taskId: null,
			personaId: null,
			projectId: null,
			areaId: null
		}),
		make({
			id: uid(),
			title: 'Ideas',
			body: 'A standalone note — not linked to anything. Just a place to think.\n\n1. First idea\n2. Second idea',
			tags: ['ideas', 'inbox'],
			taskId: null,
			personaId: null,
			projectId: null,
			areaId: null
		})
	];
}

class NoteStore {
	notes = $state<Note[]>([]);

	constructor() {
		if (!browser) return;
		const raw = localStorage.getItem(KEY);
		if (raw) {
			try {
				this.notes = JSON.parse(raw) as Note[];
			} catch {
				this.notes = seed();
			}
		} else {
			this.notes = seed();
		}
		$effect.root(() => {
			$effect(() => {
				localStorage.setItem(KEY, JSON.stringify(this.notes));
			});
		});
	}

	get(id: string): Note | undefined {
		return this.notes.find((n) => n.id === id);
	}
	allTags(): string[] {
		return [...new Set(this.notes.flatMap((n) => n.tags))].sort();
	}
	add(data: NewNote): Note {
		const stamp = new Date().toISOString();
		const note: Note = { ...data, id: uid(), createdAt: stamp, updatedAt: stamp };
		this.notes = [...this.notes, note];
		return note;
	}
	update(id: string, patch: Partial<NewNote>): void {
		this.notes = this.notes.map((n) =>
			n.id === id ? { ...n, ...patch, updatedAt: new Date().toISOString() } : n
		);
	}
	remove(id: string): void {
		this.notes = this.notes.filter((n) => n.id !== id);
	}
}

export const notes = new NoteStore();
