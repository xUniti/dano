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
	Settings,
	Bell
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
	{ href: '/projects', label: 'Projects', icon: FolderKanban, ready: true },
	{ href: '/areas', label: 'Areas', icon: Layers, ready: true },
	{ href: '/archive', label: 'Archive', icon: Archive, ready: true },
	{ href: '/habits', label: 'Habits', icon: Flame, ready: true },
	{ href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, ready: true },
	{ href: '/search', label: 'Search', icon: Search, ready: true },
	{ href: '/notifications', label: 'Notifications', icon: Bell, ready: true },
	{ href: '/settings', label: 'Settings', icon: Settings, ready: true, primary: true }
];
