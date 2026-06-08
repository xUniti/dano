// DANO domain types — mirror the SQLite schema in src-tauri/src/lib.rs.
// Timestamps are ms-since-epoch (INTEGER). Calendar days are 'YYYY-MM-DD' strings.
// Booleans are stored as 0 | 1.

export type Bool = 0 | 1;

export type GoalStatus = "active" | "paused" | "completed";
export type ProjectStatus = "active" | "planned" | "completed" | "archived";
export type TaskStatus = "todo" | "doing" | "waiting" | "done";
export type TaskPriority = "p1" | "p2" | "p3" | "p4";
export type HabitFrequency = "daily" | "weekly" | "custom";

// Entity kinds usable in the universal graph (`links`) and as link targets.
export type EntityType =
  | "area"
  | "goal"
  | "project"
  | "task"
  | "note"
  | "habit"
  | "event"
  | "person"
  | "daily_hub";

export type RelationType =
  | "mentioned_in"
  | "related_to"
  | "belongs_to"
  | "follows"
  | "depends_on";

export interface Area {
  id: string;
  name: string;
  color: string | null;
  created_at: number;
  updated_at: number;
  archived: Bool;
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  status: GoalStatus;
  created_at: number;
  updated_at: number;
  archived: Bool;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  progress: number; // 0..100, auto-computed from tasks
  due_at: number | null;
  goal_id: string | null;
  area_id: string; // mandatory
  created_at: number;
  updated_at: number;
  archived: Bool;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_at: number | null;
  completed_at: number | null;
  sort_order: number;
  project_id: string | null;
  goal_id: string | null;
  tags: string; // comma-separated
  created_at: number;
  updated_at: number;
  archived: Bool;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string;
  pinned: Bool;
  created_at: number;
  updated_at: number;
  archived: Bool;
}

export interface Habit {
  id: string;
  name: string;
  frequency: HabitFrequency;
  target: number;
  color: string | null;
  goal_id: string | null;
  created_at: number;
  updated_at: number;
  archived: Bool;
}

export interface HabitCompletion {
  id: string;
  habit_id: string;
  date: string; // YYYY-MM-DD
  count: number;
  created_at: number;
}

export interface CalEvent {
  id: string;
  title: string;
  description: string;
  start_at: number;
  end_at: number | null;
  all_day: Bool;
  location: string;
  created_at: number;
  updated_at: number;
  archived: Bool;
}

export interface Person {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  avatar_url: string | null;
  birthday: string | null; // YYYY-MM-DD
  notes: string;
  relationship_tags: string;
  last_interaction_at: number | null;
  created_at: number;
  updated_at: number;
  archived: Bool;
}

export interface PersonDate {
  id: string;
  person_id: string;
  label: string;
  date: string; // YYYY-MM-DD
  recurring: Bool;
  created_at: number;
}

export interface DailyHub {
  id: string;
  date: string; // YYYY-MM-DD, unique
  journal: string;
  mood: number | null; // 1..10
  energy: number | null; // 1..10
  wins: string;
  challenges: string;
  lessons: string;
  gratitude: string;
  created_at: number;
  updated_at: number;
}

export interface Link {
  id: string;
  source_type: EntityType;
  source_id: string;
  target_type: EntityType;
  target_id: string;
  relation_type: RelationType;
  created_at: number;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  entity_type: string | null;
  entity_id: string | null;
  read: Bool;
  created_at: number;
}

export interface Activity {
  id: string;
  entity_type: string | null;
  entity_id: string | null;
  kind: string;
  title: string;
  detail: string;
  created_at: number;
}
