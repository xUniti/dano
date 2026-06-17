import type { Component } from 'svelte';
import {
	Calendar,
	Users,
	ListChecks,
	StickyNote,
	FolderKanban,
	Layers,
	Archive,
	Flame,
	LayoutDashboard,
	Search,
	Settings
} from '@lucide/svelte';

export type NavItem = {
	href: string;
	label: string;
	icon: Component;
	ready: boolean;
	/** Shown in the mobile bottom tab bar. */
	primary?: boolean;
};

// Order follows the agreed build sequence. `ready` flips on as phases land.
export const nav: NavItem[] = [
	{ href: '/calendar', label: 'Calendar', icon: Calendar, ready: true, primary: true },
	{ href: '/persona', label: 'Persona', icon: Users, ready: true, primary: true },
	{ href: '/tasks', label: 'Tasks', icon: ListChecks, ready: true, primary: true },
	{ href: '/notes', label: 'Notes', icon: StickyNote, ready: true, primary: true },
	{ href: '/projects', label: 'Projects', icon: FolderKanban, ready: false },
	{ href: '/areas', label: 'Areas', icon: Layers, ready: false },
	{ href: '/archive', label: 'Archive', icon: Archive, ready: false },
	{ href: '/habits', label: 'Habits', icon: Flame, ready: false },
	{ href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, ready: false },
	{ href: '/search', label: 'Search', icon: Search, ready: false },
	{ href: '/settings', label: 'Settings', icon: Settings, ready: true, primary: true }
];
