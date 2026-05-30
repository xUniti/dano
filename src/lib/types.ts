// DANO core types — hierarchical PARA

export type ProjectStatus = "active" | "done";
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
  due_at: number | null;
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
  archived: number;
  created_at: number;
  updated_at: number;
}

// Resources (= notes) are standalone Markdown items, linked to many targets.
export interface Resource {
  id: string;
  title: string;
  content: string;
  archived: number;
  created_at: number;
  updated_at: number;
}

export type LinkTargetType = "area" | "project" | "task";

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
