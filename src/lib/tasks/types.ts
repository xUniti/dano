// Tasks.
export type Priority = 'low' | 'normal' | 'high';
export type TaskStatus = 'todo' | 'doing' | 'done';

export type Task = {
	id: string;
	title: string; // name / short description
	done: boolean;
	dueDate?: string | null; // yyyy-mm-dd
	priority?: Priority | null;
	status?: TaskStatus | null; // board column (falls back to done → todo/done)
	personaId?: string | null; // linked contact (Persona)
	projectId?: string | null; // linked project
	areaId?: string | null; // linked area
	notes?: string | null; // free-form notes on the task
	archived?: boolean;
	createdAt: string;
	updatedAt: string;
};

export type NewTask = Omit<Task, 'id' | 'createdAt' | 'updatedAt'>;

export const PRIORITIES: { value: Priority; label: string; color: string }[] = [
	{ value: 'low', label: 'Low', color: '#6b8e68' },
	{ value: 'normal', label: 'Normal', color: '#3a6da6' },
	{ value: 'high', label: 'High', color: '#b3423b' }
];

export const TASK_COLUMNS: { id: TaskStatus; label: string }[] = [
	{ id: 'todo', label: 'To do' },
	{ id: 'doing', label: 'In progress' },
	{ id: 'done', label: 'Done' }
];

export function taskStatus(t: { status?: TaskStatus | null; done: boolean }): TaskStatus {
	return t.status ?? (t.done ? 'done' : 'todo');
}
