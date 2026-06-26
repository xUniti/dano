// Notes — a title + a markdown body, freely categorised with tags and optionally
// linked to a task, person, project or area (each independent and optional).
export type Note = {
	id: string;
	title: string;
	body: string; // markdown
	tags: string[];
	taskId?: string | null;
	personaId?: string | null;
	projectId?: string | null; // Projects — later phase
	areaId?: string | null; // Areas — later phase
	archived?: boolean;
	createdAt: string;
	updatedAt: string;
};

export type NewNote = Omit<Note, 'id' | 'createdAt' | 'updatedAt'>;

export function isLinked(n: Note): boolean {
	return !!(n.taskId || n.personaId || n.projectId || n.areaId);
}
export function snippet(n: Note, max = 120): string {
	const text = n.body
		.replace(/[#>*`~_[\]()-]/g, '')
		.replace(/\s+/g, ' ')
		.trim();
	return text.length > max ? text.slice(0, max) + '…' : text;
}
