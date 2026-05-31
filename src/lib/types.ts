// DANO core types — hierarchical PARA

export type ProjectStatus = "planned" | "in_progress" | "ongoing" | "done";
export type ProjectPriority = "low" | "medium" | "high";
export type TaskStatus = "todo" | "done";

// Areas are life domains; they hold projects.
export interface Area {
  id: string;
  name: string;
  archived: number; // 0 | 1
  created_at: number;
  updated_at: number;
}

// Projects live inside an area, have a status and an optional deadline.
export interface Project {
  id: string;
  name: string;
  area_id: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  description: string;
  due_at: number | null;
  pinned: number; // 0 | 1
  archived: number;
  created_at: number;
  updated_at: number;
}

// Tasks live inside a project. Simple and actionable.
export interface Task {
  id: string;
  title: string;
  project_id: string;
  status: TaskStatus;
  due_at: number | null;
  sort_order: number;
  archived: number;
  created_at: number;
  updated_at: number;
}

// Resources (= notes) are standalone Markdown items, linked to many targets.
export interface Resource {
  id: string;
  title: string;
  content: string;
  tags: string; // comma-separated tag list
  pinned: number; // 0 | 1
  archived: number;
  created_at: number;
  updated_at: number;
}

export type LinkTargetType = "area" | "project" | "task" | "contact";

export interface ResourceLink {
  id: string;
  resource_id: string;
  target_type: LinkTargetType;
  target_id: string;
  created_at: number;
}

// Convenience shapes for the dashboard.
export interface UpcomingItem {
  kind: "project" | "task";
  id: string;
  title: string;
  due_at: number;
  context: string; // area name, or "area / project"
}

// Standalone calendar events (not tied to a project/task).
export interface CalEvent {
  id: string;
  title: string;
  start_at: number;
  end_at: number | null;
  all_day: number; // 0 | 1
  notes: string;
  archived: number;
  created_at: number;
  updated_at: number;
}

// Unified item placed on a calendar day.
export interface CalItem {
  kind: "event" | "project" | "task" | "contactdate";
  id: string;
  title: string;
  at: number; // the day it sits on (start_at or due_at or recurring occurrence)
  context: string;
  areaId?: string; // for projects/tasks, to enable click-through
  contactId?: string; // for contact dates, to open the contact
}

// CRM
export interface Contact {
  id: string;
  name: string;
  notes: string;
  archived: number;
  created_at: number;
  updated_at: number;
}

export interface ContactDate {
  id: string;
  contact_id: string;
  label: string; // "Birthday", "Anniversary", …
  date_at: number;
  recurring: number; // 0 | 1 (annual)
  created_at: number;
}

// Activity log entry (project-scoped audit trail).
export interface Activity {
  id: string;
  project_id: string | null;
  kind: string; // 'project_created' | 'task_completed' | 'note_added' | 'deadline_updated' | 'status_changed' | 'priority_changed'
  title: string;
  detail: string;
  created_at: number;
}
