// Tasks.
export type Priority = 'low' | 'normal' | 'high';

export type Task = {
	id: string;
	title: string; // name / short description
	done: boolean;
	dueDate?: string | null; // yyyy-mm-dd
	priority?: Priority | null;
	personaId?: string | null; // linked contact (Persona)
	projectId?: string | null; // linked project (Projects — later phase)
	noteIds?: string[]; // linked notes (Notes — later phase)
	notes?: string | null; // free-form notes on the task
	createdAt: string;
	updatedAt: string;
};

export type NewTask = Omit<Task, 'id' | 'createdAt' | 'updatedAt'>;

export const PRIORITIES: { value: Priority; label: string; color: string }[] = [
	{ value: 'low', label: 'Low', color: '#6b8e68' },
	{ value: 'normal', label: 'Normal', color: '#3a6da6' },
	{ value: 'high', label: 'High', color: '#b3423b' }
];
