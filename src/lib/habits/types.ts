// Habits — recurring things you want to keep up, tracked per day with streaks.
export type Habit = {
	id: string;
	name: string;
	weekdays: number[]; // 0–6 (Sun–Sat); empty = every day
	log: string[]; // yyyy-mm-dd dates completed
	createdAt: string;
	updatedAt: string;
};

export type NewHabit = Omit<Habit, 'id' | 'createdAt' | 'updatedAt'>;

export function scheduledOn(h: Habit, date: Date): boolean {
	return h.weekdays.length === 0 || h.weekdays.includes(date.getDay());
}
