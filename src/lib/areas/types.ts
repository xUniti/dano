// Areas — broad areas of life/work that group projects and tasks.
export type Area = {
	id: string;
	name: string;
	dueDate?: string | null; // yyyy-mm-dd → shows on the calendar
	createdAt: string;
	updatedAt: string;
};

export type NewArea = Omit<Area, 'id' | 'createdAt' | 'updatedAt'>;
