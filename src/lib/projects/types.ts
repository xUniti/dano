// Projects — a named effort with a single (mandatory, once Areas exists) area,
// an optional due date and contact, and a description. Tasks and notes link to it.
export type ProjectStatus = 'active' | 'on-hold' | 'done';

export type Project = {
	id: string;
	name: string;
	areaId?: string | null; // placeholder until the Areas phase; becomes required then
	personaId?: string | null; // optional contact
	dueDate?: string | null; // yyyy-mm-dd → shows on the calendar
	description?: string | null;
	status: ProjectStatus;
	archived?: boolean;
	createdAt: string;
	updatedAt: string;
};

export type NewProject = Omit<Project, 'id' | 'createdAt' | 'updatedAt'>;

export const PROJECT_STATUSES: { value: ProjectStatus; label: string }[] = [
	{ value: 'active', label: 'Active' },
	{ value: 'on-hold', label: 'On hold' },
	{ value: 'done', label: 'Done' }
];
