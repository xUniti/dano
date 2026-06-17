// People store — same localStorage seam as the calendar (swappable for SQLite).
import { browser } from '$app/environment';
import type { Person, NewPerson } from './types';

const KEY = 'dano.persona.people';

function uid(): string {
	if (browser && 'randomUUID' in crypto) return crypto.randomUUID();
	return 'p_' + Math.random().toString(36).slice(2, 10);
}

function seed(): Person[] {
	const stamp = new Date().toISOString();
	const make = (p: Omit<Person, 'createdAt' | 'updatedAt'>): Person => ({
		...p,
		createdAt: stamp,
		updatedAt: stamp
	});
	return [
		make({
			id: uid(),
			firstName: 'Mira',
			lastName: 'Hoxha',
			email: 'mira@example.com',
			phone: '+355 69 123 4567',
			company: 'Acme Studio',
			position: 'Product designer',
			birthday: '1996-06-20',
			notes: 'Met at the design meetup.',
			lastContact: '2026-06-15'
		}),
		make({
			id: uid(),
			firstName: 'Erion',
			lastName: 'Krasniqi',
			email: 'erion@example.com',
			phone: null,
			company: null,
			position: null,
			birthday: '1990-03-12',
			notes: null,
			lastContact: '2026-05-28'
		})
	];
}

class PersonaStore {
	people = $state<Person[]>([]);

	constructor() {
		if (!browser) return;
		const raw = localStorage.getItem(KEY);
		if (raw) {
			try {
				this.people = JSON.parse(raw) as Person[];
			} catch {
				this.people = seed();
			}
		} else {
			this.people = seed();
		}
		$effect.root(() => {
			$effect(() => {
				localStorage.setItem(KEY, JSON.stringify(this.people));
			});
		});
	}

	get(id: string): Person | undefined {
		return this.people.find((p) => p.id === id);
	}
	add(data: NewPerson): Person {
		const stamp = new Date().toISOString();
		const person: Person = { ...data, id: uid(), createdAt: stamp, updatedAt: stamp };
		this.people = [...this.people, person];
		return person;
	}
	update(id: string, patch: Partial<NewPerson>): void {
		this.people = this.people.map((p) =>
			p.id === id ? { ...p, ...patch, updatedAt: new Date().toISOString() } : p
		);
	}
	remove(id: string): void {
		this.people = this.people.filter((p) => p.id !== id);
	}
}

export const persona = new PersonaStore();
