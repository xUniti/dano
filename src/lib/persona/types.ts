// Persona — people / contacts.
export type Person = {
	id: string;
	firstName: string;
	lastName: string;
	email?: string | null;
	phone?: string | null;
	company?: string | null;
	position?: string | null; // only meaningful when company is set
	birthday?: string | null; // yyyy-mm-dd → shows on the calendar
	notes?: string | null;
	lastContact?: string | null; // yyyy-mm-dd
	createdAt: string;
	updatedAt: string;
};

export type NewPerson = Omit<Person, 'id' | 'createdAt' | 'updatedAt'>;

export function fullName(p: Person): string {
	return `${p.firstName} ${p.lastName}`.trim();
}
export function initials(p: Person): string {
	const a = p.firstName.trim()[0] ?? '';
	const b = p.lastName.trim()[0] ?? '';
	return (a + b).toUpperCase() || '?';
}
