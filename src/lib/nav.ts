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
	/** Shown in the mobile bottom tab bar. */
	primary?: boolean;
};

// Order follows the agreed build sequence.
export const nav: NavItem[] = [
	{ href: '/calendar', label: 'Calendar', icon: Calendar, primary: true },
	{ href: '/persona', label: 'Persona', icon: Users, primary: true },
	{ href: '/tasks', label: 'Tasks', icon: ListChecks, primary: true },
	{ href: '/notes', label: 'Notes', icon: StickyNote, primary: true },
	{ href: '/projects', label: 'Projects', icon: FolderKanban },
	{ href: '/areas', label: 'Areas', icon: Layers },
	{ href: '/archive', label: 'Archive', icon: Archive },
	{ href: '/habits', label: 'Habits', icon: Flame },
	{ href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
	{ href: '/search', label: 'Search', icon: Search },
	{ href: '/notifications', label: 'Notifications', icon: Bell },
	{ href: '/settings', label: 'Settings', icon: Settings, primary: true }
];
