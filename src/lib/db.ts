// DANO storage layer — hierarchical PARA + Resources (Phase B).
// Native SQLite via tauri-plugin-sql. All SQL is isolated in this module.

import Database from "@tauri-apps/plugin-sql";
import type {
  Area,
  Activity,
  LinkTargetType,
  Project,
  ProjectStatus,
  Resource,
  Task,
  TaskStatus,
} from "./types";

let _db: Database | null = null;
async function db(): Promise<Database> {
  if (!_db) _db = await Database.load("sqlite:dano.db");
  return _db;
}
const now = () => Date.now();

function setClause(patch: Record<string, unknown>) {
  const fields: string[] = [];
  const values: unknown[] = [];
  let i = 1;
  for (const [k, v] of Object.entries(patch)) {
    fields.push(`${k} = $${i++}`);
    values.push(v);
  }
  return { clause: fields.join(", "), values, next: i };
}

/* ---------- Areas ---------- */

export async function listAreas(archived = false): Promise<Area[]> {
  const conn = await db();
  return conn.select<Area[]>(
    "SELECT * FROM areas WHERE archived = $1 ORDER BY updated_at DESC",
    [archived ? 1 : 0],
  );
}
export async function createArea(name: string): Promise<Area> {
  const conn = await db();
  const t = now();
  const area: Area = { id: crypto.randomUUID(), name, archived: 0, created_at: t, updated_at: t };
  await conn.execute(
    "INSERT INTO areas (id, name, archived, created_at, updated_at) VALUES ($1,$2,$3,$4,$5)",
    [area.id, area.name, area.archived, area.created_at, area.updated_at],
  );
  return area;
}
export async function updateArea(id: string, patch: Partial<Pick<Area, "name" | "archived">>): Promise<void> {
  const conn = await db();
  const { clause, values, next } = setClause(patch);
  if (!clause) return;
  values.push(now(), id);
  await conn.execute(`UPDATE areas SET ${clause}, updated_at = $${next} WHERE id = $${next + 1}`, values);
}
export async function deleteArea(id: string): Promise<void> {
  const conn = await db();
  await conn.execute("DELETE FROM tasks WHERE project_id IN (SELECT id FROM projects WHERE area_id = $1)", [id]);
  await conn.execute("DELETE FROM projects WHERE area_id = $1", [id]);
  await conn.execute("DELETE FROM resource_links WHERE target_type = 'area' AND target_id = $1", [id]);
  await conn.execute("DELETE FROM areas WHERE id = $1", [id]);
}

/* ---------- Projects ---------- */

export async function listProjects(areaId: string, archived = false): Promise<Project[]> {
  const conn = await db();
  return conn.select<Project[]>(
    "SELECT * FROM projects WHERE area_id = $1 AND archived = $2 ORDER BY (status = 'done') ASC, updated_at DESC",
    [areaId, archived ? 1 : 0],
  );
}
export async function getProject(id: string): Promise<(Project & { area_name: string }) | null> {
  const conn = await db();
  const rows = await conn.select<(Project & { area_name: string })[]>(
    `SELECT p.*, a.name AS area_name FROM projects p JOIN areas a ON a.id = p.area_id WHERE p.id = $1`,
    [id],
  );
  return rows[0] ?? null;
}
export async function createProject(areaId: string, name: string): Promise<Project> {
  const conn = await db();
  const t = now();
  const p: Project = {
    id: crypto.randomUUID(), name, area_id: areaId, status: "in_progress",
    priority: "medium", description: "", due_at: null, archived: 0, created_at: t, updated_at: t,
  };
  await conn.execute(
    "INSERT INTO projects (id, name, area_id, status, priority, description, due_at, archived, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)",
    [p.id, p.name, p.area_id, p.status, p.priority, p.description, p.due_at, p.archived, p.created_at, p.updated_at],
  );
  return p;
}
export async function updateProject(id: string, patch: Partial<Pick<Project, "name" | "status" | "priority" | "description" | "due_at" | "archived">>): Promise<void> {
  const conn = await db();
  const { clause, values, next } = setClause(patch);
  if (!clause) return;
  values.push(now(), id);
  await conn.execute(`UPDATE projects SET ${clause}, updated_at = $${next} WHERE id = $${next + 1}`, values);
}
export async function deleteProject(id: string): Promise<void> {
  const conn = await db();
  await conn.execute("DELETE FROM tasks WHERE project_id = $1", [id]);
  await conn.execute("DELETE FROM resource_links WHERE target_type = 'project' AND target_id = $1", [id]);
  await conn.execute("DELETE FROM projects WHERE id = $1", [id]);
}
export async function listArchivedProjects(): Promise<(Project & { area_name: string })[]> {
  const conn = await db();
  return conn.select(
    `SELECT p.*, a.name AS area_name FROM projects p JOIN areas a ON a.id = p.area_id
      WHERE p.archived = 1 ORDER BY p.updated_at DESC`,
  );
}
export async function listAllProjects(): Promise<{ id: string; name: string; area_name: string }[]> {
  const conn = await db();
  return conn.select(
    `SELECT p.id AS id, p.name AS name, a.name AS area_name FROM projects p JOIN areas a ON a.id = p.area_id
      WHERE p.archived = 0 ORDER BY a.name, p.name`,
  );
}
// Full project rows + area name, for the Projects browse view.
export async function listProjectsAll(): Promise<(Project & { area_name: string })[]> {
  const conn = await db();
  return conn.select(
    `SELECT p.*, a.name AS area_name FROM projects p JOIN areas a ON a.id = p.area_id
      WHERE p.archived = 0 ORDER BY (p.status = 'done') ASC, p.due_at IS NULL, p.due_at ASC, p.updated_at DESC`,
  );
}
// All non-archived tasks with their area + project (for the Areas overview).
export async function allAreaTasks(): Promise<(Task & { area_id: string; project_name: string })[]> {
  const conn = await db();
  return conn.select(
    `SELECT t.*, p.area_id AS area_id, p.name AS project_name
       FROM tasks t JOIN projects p ON p.id = t.project_id
      WHERE t.archived = 0
      ORDER BY (t.status = 'done') ASC, t.due_at IS NULL, t.due_at ASC, t.updated_at DESC`,
  );
}

/* ---------- Tasks ---------- */

export async function listTasks(projectId: string, archived = false): Promise<Task[]> {
  const conn = await db();
  return conn.select<Task[]>(
    "SELECT * FROM tasks WHERE project_id = $1 AND archived = $2 ORDER BY status ASC, due_at IS NULL, due_at ASC, updated_at DESC",
    [projectId, archived ? 1 : 0],
  );
}
export async function createTask(projectId: string, title: string): Promise<Task> {
  const conn = await db();
  const t = now();
  const task: Task = { id: crypto.randomUUID(), title, project_id: projectId, status: "todo", due_at: null, archived: 0, created_at: t, updated_at: t };
  await conn.execute(
    "INSERT INTO tasks (id, title, project_id, status, due_at, archived, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)",
    [task.id, task.title, task.project_id, task.status, task.due_at, task.archived, task.created_at, task.updated_at],
  );
  return task;
}
export async function updateTask(id: string, patch: Partial<Pick<Task, "title" | "status" | "due_at" | "archived">>): Promise<void> {
  const conn = await db();
  const { clause, values, next } = setClause(patch);
  if (!clause) return;
  values.push(now(), id);
  await conn.execute(`UPDATE tasks SET ${clause}, updated_at = $${next} WHERE id = $${next + 1}`, values);
}
export async function deleteTask(id: string): Promise<void> {
  const conn = await db();
  await conn.execute("DELETE FROM resource_links WHERE target_type = 'task' AND target_id = $1", [id]);
  await conn.execute("DELETE FROM tasks WHERE id = $1", [id]);
}
export async function listAllTasks(): Promise<{ id: string; title: string; context: string }[]> {
  const conn = await db();
  return conn.select(
    `SELECT t.id AS id, t.title AS title, a.name || ' / ' || p.name AS context
       FROM tasks t JOIN projects p ON p.id = t.project_id JOIN areas a ON a.id = p.area_id
      WHERE t.archived = 0 ORDER BY context, t.title`,
  );
}
// All tasks across an area's projects (for the Area view).
export async function listAreaTasks(areaId: string): Promise<(Task & { project_name: string })[]> {
  const conn = await db();
  return conn.select(
    `SELECT t.*, p.name AS project_name FROM tasks t JOIN projects p ON p.id = t.project_id
      WHERE p.area_id = $1 AND t.archived = 0
      ORDER BY t.status ASC, t.due_at IS NULL, t.due_at ASC, t.updated_at DESC`,
    [areaId],
  );
}

/* ---------- Projects browse: per-project preview bundles ---------- */

export interface ProjectPreview {
  project: Project & { area_name: string };
  tasks: Task[];          // up to a few, open first
  notes: Resource[];      // linked notes, recent first
  contacts: { id: string; name: string }[];
  taskCounts: { done: number; total: number };
}

// One bundle per non-archived project, with a small preview of tasks/notes/contacts.
// Done in a few batched queries (no N+1): fetch all rows, then group in JS.
export async function listProjectsWithPreview(taskLimit = 4, noteLimit = 3): Promise<ProjectPreview[]> {
  const conn = await db();
  const projects = await conn.select<(Project & { area_name: string })[]>(
    `SELECT p.*, a.name AS area_name FROM projects p JOIN areas a ON a.id = p.area_id
      WHERE p.archived = 0
      ORDER BY (p.status = 'done') ASC, p.due_at IS NULL, p.due_at ASC, p.updated_at DESC`,
  );
  if (projects.length === 0) return [];

  const tasks = await conn.select<Task[]>(
    `SELECT t.* FROM tasks t JOIN projects p ON p.id = t.project_id
      WHERE p.archived = 0 AND t.archived = 0
      ORDER BY (t.status = 'done') ASC, t.due_at IS NULL, t.due_at ASC, t.updated_at DESC`,
  );
  const notes = await conn.select<(Resource & { project_id: string })[]>(
    `SELECT r.*, l.target_id AS project_id FROM resources r
       JOIN resource_links l ON l.resource_id = r.id
      WHERE r.archived = 0 AND l.target_type = 'project'
      ORDER BY r.updated_at DESC`,
  );
  const contacts = await conn.select<{ project_id: string; id: string; name: string }[]>(
    `SELECT l.project_id AS project_id, c.id AS id, c.name AS name
       FROM contact_links l JOIN contacts c ON c.id = l.contact_id
      WHERE c.archived = 0 ORDER BY c.name COLLATE NOCASE ASC`,
  );

  const byProjTasks = new Map<string, Task[]>();
  const counts = new Map<string, { done: number; total: number }>();
  for (const t of tasks) {
    const arr = byProjTasks.get(t.project_id) ?? [];
    arr.push(t);
    byProjTasks.set(t.project_id, arr);
    const c = counts.get(t.project_id) ?? { done: 0, total: 0 };
    c.total += 1;
    if (t.status === "done") c.done += 1;
    counts.set(t.project_id, c);
  }
  const byProjNotes = new Map<string, Resource[]>();
  for (const n of notes) {
    const arr = byProjNotes.get(n.project_id) ?? [];
    arr.push(n);
    byProjNotes.set(n.project_id, arr);
  }
  const byProjContacts = new Map<string, { id: string; name: string }[]>();
  for (const c of contacts) {
    const arr = byProjContacts.get(c.project_id) ?? [];
    arr.push({ id: c.id, name: c.name });
    byProjContacts.set(c.project_id, arr);
  }

  return projects.map((project) => ({
    project,
    tasks: (byProjTasks.get(project.id) ?? []).slice(0, taskLimit),
    notes: (byProjNotes.get(project.id) ?? []).slice(0, noteLimit),
    contacts: byProjContacts.get(project.id) ?? [],
    taskCounts: counts.get(project.id) ?? { done: 0, total: 0 },
  }));
}

/* ---------- Resources (= notes) ---------- */

export async function getResource(id: string): Promise<Resource | null> {
  const conn = await db();
  const rows = await conn.select<Resource[]>("SELECT * FROM resources WHERE id = $1", [id]);
  return rows[0] ?? null;
}
export async function listResources(archived = false): Promise<Resource[]> {
  const conn = await db();
  return conn.select<Resource[]>(
    "SELECT * FROM resources WHERE archived = $1 ORDER BY updated_at DESC",
    [archived ? 1 : 0],
  );
}
// Inbox = resources with no links and not archived (unprocessed captures).
export async function listInboxResources(): Promise<Resource[]> {
  const conn = await db();
  return conn.select<Resource[]>(
    `SELECT * FROM resources r
      WHERE r.archived = 0
        AND NOT EXISTS (SELECT 1 FROM resource_links l WHERE l.resource_id = r.id)
      ORDER BY r.updated_at DESC`,
  );
}
export async function listResourcesForTarget(type: LinkTargetType, targetId: string): Promise<Resource[]> {
  const conn = await db();
  return conn.select<Resource[]>(
    `SELECT r.* FROM resources r
       JOIN resource_links l ON l.resource_id = r.id
      WHERE r.archived = 0 AND l.target_type = $1 AND l.target_id = $2
      ORDER BY r.updated_at DESC`,
    [type, targetId],
  );
}
export async function createResource(title = "", content = ""): Promise<Resource> {
  const conn = await db();
  const t = now();
  const r: Resource = { id: crypto.randomUUID(), title, content, archived: 0, created_at: t, updated_at: t };
  await conn.execute(
    "INSERT INTO resources (id, title, content, archived, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6)",
    [r.id, r.title, r.content, r.archived, r.created_at, r.updated_at],
  );
  return r;
}
export async function updateResource(id: string, patch: Partial<Pick<Resource, "title" | "content" | "archived">>): Promise<void> {
  const conn = await db();
  const { clause, values, next } = setClause(patch);
  if (!clause) return;
  values.push(now(), id);
  await conn.execute(`UPDATE resources SET ${clause}, updated_at = $${next} WHERE id = $${next + 1}`, values);
}
export async function deleteResource(id: string): Promise<void> {
  const conn = await db();
  await conn.execute("DELETE FROM resource_links WHERE resource_id = $1", [id]);
  await conn.execute("DELETE FROM resources WHERE id = $1", [id]);
}

/* ---------- Resource links (many-to-many) ---------- */

export interface DetailedLink {
  id: string;
  target_type: LinkTargetType;
  target_id: string;
  label: string;
}

export async function listLinks(resourceId: string): Promise<DetailedLink[]> {
  const conn = await db();
  return conn.select<DetailedLink[]>(
    `SELECT l.id AS id, l.target_type AS target_type, l.target_id AS target_id,
            CASE l.target_type
              WHEN 'area' THEN (SELECT name FROM areas WHERE id = l.target_id)
              WHEN 'project' THEN (SELECT name FROM projects WHERE id = l.target_id)
              WHEN 'task' THEN (SELECT title FROM tasks WHERE id = l.target_id)
              WHEN 'contact' THEN (SELECT name FROM contacts WHERE id = l.target_id)
            END AS label
       FROM resource_links l
      WHERE l.resource_id = $1
      ORDER BY l.created_at ASC`,
    [resourceId],
  );
}
export async function addLink(resourceId: string, type: LinkTargetType, targetId: string): Promise<void> {
  const conn = await db();
  // Avoid duplicates.
  const existing = await conn.select<{ c: number }[]>(
    "SELECT COUNT(*) AS c FROM resource_links WHERE resource_id = $1 AND target_type = $2 AND target_id = $3",
    [resourceId, type, targetId],
  );
  if ((existing[0]?.c ?? 0) > 0) return;
  await conn.execute(
    "INSERT INTO resource_links (id, resource_id, target_type, target_id, created_at) VALUES ($1,$2,$3,$4,$5)",
    [crypto.randomUUID(), resourceId, type, targetId, now()],
  );
}
export async function removeLink(linkId: string): Promise<void> {
  const conn = await db();
  await conn.execute("DELETE FROM resource_links WHERE id = $1", [linkId]);
}

/* ---------- Dashboard queries ---------- */

export async function upcoming(limit = 12): Promise<
  { kind: "project" | "task"; id: string; title: string; due_at: number; context: string }[]
> {
  const conn = await db();
  return conn.select(
    `SELECT 'project' AS kind, p.id AS id, p.name AS title, p.due_at AS due_at, a.name AS context
       FROM projects p JOIN areas a ON a.id = p.area_id
      WHERE p.archived = 0 AND p.status != 'done' AND p.due_at IS NOT NULL
     UNION ALL
     SELECT 'task' AS kind, t.id AS id, t.title AS title, t.due_at AS due_at, a.name || ' / ' || p.name AS context
       FROM tasks t JOIN projects p ON p.id = t.project_id JOIN areas a ON a.id = p.area_id
      WHERE t.archived = 0 AND t.status = 'todo' AND t.due_at IS NOT NULL
     ORDER BY due_at ASC LIMIT $1`,
    [limit],
  );
}
export async function activeProjects(limit = 20): Promise<
  { id: string; name: string; area_id: string; area_name: string; due_at: number | null }[]
> {
  const conn = await db();
  return conn.select(
    `SELECT p.id AS id, p.name AS name, p.area_id AS area_id, a.name AS area_name, p.due_at AS due_at
       FROM projects p JOIN areas a ON a.id = p.area_id
      WHERE p.archived = 0 AND p.status != 'done'
      ORDER BY p.updated_at DESC LIMIT $1`,
    [limit],
  );
}

export type { ProjectStatus, TaskStatus };

/* ---------- Activity log ---------- */

export async function logActivity(projectId: string | null, kind: string, title: string, detail = ""): Promise<void> {
  const conn = await db();
  await conn.execute(
    "INSERT INTO activity (id, project_id, kind, title, detail, created_at) VALUES ($1,$2,$3,$4,$5,$6)",
    [crypto.randomUUID(), projectId, kind, title, detail, now()],
  );
}
export async function listActivity(projectId: string, limit = 15): Promise<Activity[]> {
  const conn = await db();
  return conn.select<Activity[]>(
    "SELECT * FROM activity WHERE project_id = $1 ORDER BY created_at DESC LIMIT $2",
    [projectId, limit],
  );
}

/* ---------- Counts + recently edited (dashboard / sidebar) ---------- */

export async function counts(): Promise<{ projects: number; areas: number; resources: number; archive: number; inbox: number }> {
  const conn = await db();
  const rows = await conn.select<{ k: string; c: number }[]>(
    `SELECT 'projects' AS k, COUNT(*) AS c FROM projects WHERE archived = 0
     UNION ALL SELECT 'areas', COUNT(*) FROM areas WHERE archived = 0
     UNION ALL SELECT 'resources', COUNT(*) FROM resources WHERE archived = 0
     UNION ALL SELECT 'archive',
       (SELECT COUNT(*) FROM projects WHERE archived = 1)
       + (SELECT COUNT(*) FROM areas WHERE archived = 1)
       + (SELECT COUNT(*) FROM resources WHERE archived = 1)
     UNION ALL SELECT 'inbox',
       (SELECT COUNT(*) FROM resources r WHERE r.archived = 0
          AND NOT EXISTS (SELECT 1 FROM resource_links l WHERE l.resource_id = r.id))`,
  );
  const m: Record<string, number> = {};
  for (const r of rows) m[r.k] = r.c;
  return {
    projects: m.projects ?? 0, areas: m.areas ?? 0, resources: m.resources ?? 0,
    archive: m.archive ?? 0, inbox: m.inbox ?? 0,
  };
}

export async function recentlyEdited(limit = 6): Promise<
  { kind: "resource" | "project" | "area"; id: string; title: string; context: string; updated_at: number; areaId?: string }[]
> {
  const conn = await db();
  const rows = await conn.select<
    { kind: "resource" | "project" | "area"; id: string; title: string; context: string; updated_at: number; area_id: string | null }[]
  >(
    `SELECT 'resource' AS kind, r.id AS id, r.title AS title, 'Resources' AS context, r.updated_at AS updated_at, NULL AS area_id
       FROM resources r WHERE r.archived = 0
     UNION ALL
     SELECT 'project' AS kind, p.id AS id, p.name AS title, a.name AS context, p.updated_at AS updated_at, p.area_id AS area_id
       FROM projects p JOIN areas a ON a.id = p.area_id WHERE p.archived = 0
     UNION ALL
     SELECT 'area' AS kind, a.id AS id, a.name AS title, 'Areas' AS context, a.updated_at AS updated_at, a.id AS area_id
       FROM areas a WHERE a.archived = 0
     ORDER BY updated_at DESC LIMIT $1`,
    [limit],
  );
  return rows.map((r) => ({
    kind: r.kind, id: r.id, title: r.title, context: r.context,
    updated_at: r.updated_at, areaId: r.area_id ?? undefined,
  }));
}

// Recently archived items across types (for the dashboard Archive card).
export async function recentArchived(limit = 6): Promise<
  { kind: "project" | "resource" | "area"; id: string; title: string; context: string; areaId?: string }[]
> {
  const conn = await db();
  const rows = await conn.select<
    { kind: "project" | "resource" | "area"; id: string; title: string; context: string; updated_at: number; area_id: string | null }[]
  >(
    `SELECT 'project' AS kind, p.id AS id, p.name AS title, a.name AS context, p.updated_at AS updated_at, p.area_id AS area_id
       FROM projects p JOIN areas a ON a.id = p.area_id WHERE p.archived = 1
     UNION ALL
     SELECT 'resource' AS kind, r.id AS id, r.title AS title, 'Resources' AS context, r.updated_at AS updated_at, NULL AS area_id
       FROM resources r WHERE r.archived = 1
     UNION ALL
     SELECT 'area' AS kind, a.id AS id, a.name AS title, 'Areas' AS context, a.updated_at AS updated_at, a.id AS area_id
       FROM areas a WHERE a.archived = 1
     ORDER BY updated_at DESC LIMIT $1`,
    [limit],
  );
  return rows.map((r) => ({ kind: r.kind, id: r.id, title: r.title, context: r.context, areaId: r.area_id ?? undefined }));
}

/* ---------- Global search ---------- */

export interface SearchHit {
  kind: "resource" | "project" | "task" | "area" | "contact";
  id: string;
  title: string;
  context: string;
  areaId?: string;
  projectId?: string;
}

export async function search(term: string, limit = 40): Promise<SearchHit[]> {
  const conn = await db();
  const like = "%" + term + "%";
  const rows = await conn.select<
    { kind: SearchHit["kind"]; id: string; title: string; context: string; area_id: string | null; project_id: string | null }[]
  >(
    `SELECT 'resource' AS kind, r.id AS id, r.title AS title, 'Resources' AS context, NULL AS area_id, NULL AS project_id
       FROM resources r WHERE r.archived = 0 AND (r.title LIKE $1 OR r.content LIKE $1)
     UNION ALL
     SELECT 'project' AS kind, p.id AS id, p.name AS title, a.name AS context, p.area_id AS area_id, NULL AS project_id
       FROM projects p JOIN areas a ON a.id = p.area_id WHERE p.archived = 0 AND p.name LIKE $1
     UNION ALL
     SELECT 'task' AS kind, t.id AS id, t.title AS title, a.name || ' / ' || p.name AS context, p.area_id AS area_id, p.id AS project_id
       FROM tasks t JOIN projects p ON p.id = t.project_id JOIN areas a ON a.id = p.area_id
      WHERE t.archived = 0 AND t.title LIKE $1
     UNION ALL
     SELECT 'area' AS kind, a.id AS id, a.name AS title, 'Areas' AS context, a.id AS area_id, NULL AS project_id
       FROM areas a WHERE a.archived = 0 AND a.name LIKE $1
     UNION ALL
     SELECT 'contact' AS kind, c.id AS id, c.name AS title, 'Contacts' AS context, NULL AS area_id, NULL AS project_id
       FROM contacts c WHERE c.archived = 0 AND (c.name LIKE $1 OR c.notes LIKE $1)
     LIMIT $2`,
    [like, limit],
  );
  return rows.map((r) => ({
    kind: r.kind, id: r.id, title: r.title, context: r.context,
    areaId: r.area_id ?? undefined, projectId: r.project_id ?? undefined,
  }));
}

/* ---------- Events + calendar ---------- */

import type { CalEvent, CalItem } from "./types";

export async function createEvent(startAt: number, title = ""): Promise<CalEvent> {
  const conn = await db();
  const t = now();
  const ev: CalEvent = {
    id: crypto.randomUUID(), title, start_at: startAt, end_at: null,
    all_day: 1, notes: "", archived: 0, created_at: t, updated_at: t,
  };
  await conn.execute(
    "INSERT INTO events (id, title, start_at, end_at, all_day, notes, archived, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)",
    [ev.id, ev.title, ev.start_at, ev.end_at, ev.all_day, ev.notes, ev.archived, ev.created_at, ev.updated_at],
  );
  return ev;
}

export async function updateEvent(
  id: string,
  patch: Partial<Pick<CalEvent, "title" | "start_at" | "end_at" | "all_day" | "notes" | "archived">>,
): Promise<void> {
  const conn = await db();
  const { clause, values, next } = setClause(patch);
  if (!clause) return;
  values.push(now(), id);
  await conn.execute(
    "UPDATE events SET " + clause + ", updated_at = $" + next + " WHERE id = $" + (next + 1),
    values,
  );
}

export async function deleteEvent(id: string): Promise<void> {
  const conn = await db();
  await conn.execute("DELETE FROM events WHERE id = $1", [id]);
}

export async function getEvent(id: string): Promise<CalEvent | null> {
  const conn = await db();
  const rows = await conn.select<CalEvent[]>("SELECT * FROM events WHERE id = $1", [id]);
  return rows[0] ?? null;
}

// All dated items (events + project/task due dates) within [start, end).
export async function calendarItems(start: number, end: number): Promise<CalItem[]> {
  const conn = await db();
  const rows = await conn.select<
    { kind: "event" | "project" | "task"; id: string; title: string; at: number; context: string; area_id: string | null }[]
  >(
    `SELECT 'event' AS kind, e.id AS id, e.title AS title, e.start_at AS at, '' AS context, NULL AS area_id
       FROM events e
      WHERE e.archived = 0 AND e.start_at >= $1 AND e.start_at < $2
     UNION ALL
     SELECT 'project' AS kind, p.id AS id, p.name AS title, p.due_at AS at, a.name AS context, p.area_id AS area_id
       FROM projects p JOIN areas a ON a.id = p.area_id
      WHERE p.archived = 0 AND p.due_at IS NOT NULL AND p.due_at >= $1 AND p.due_at < $2
     UNION ALL
     SELECT 'task' AS kind, t.id AS id, t.title AS title, t.due_at AS at, a.name || ' / ' || p.name AS context, p.area_id AS area_id
       FROM tasks t JOIN projects p ON p.id = t.project_id JOIN areas a ON a.id = p.area_id
      WHERE t.archived = 0 AND t.due_at IS NOT NULL AND t.due_at >= $1 AND t.due_at < $2
     ORDER BY at ASC`,
    [start, end],
  );
  return rows.map((r) => ({
    kind: r.kind, id: r.id, title: r.title, at: r.at, context: r.context,
    areaId: r.area_id ?? undefined,
  }));
}

export type { CalEvent, CalItem };

/* ---------- CRM: contacts ---------- */

import type { Contact, ContactDate } from "./types";

export async function listContacts(archived = false): Promise<Contact[]> {
  const conn = await db();
  return conn.select<Contact[]>(
    "SELECT * FROM contacts WHERE archived = $1 ORDER BY name COLLATE NOCASE ASC",
    [archived ? 1 : 0],
  );
}
export async function getContact(id: string): Promise<Contact | null> {
  const conn = await db();
  const rows = await conn.select<Contact[]>("SELECT * FROM contacts WHERE id = $1", [id]);
  return rows[0] ?? null;
}
export async function createContact(name = ""): Promise<Contact> {
  const conn = await db();
  const t = now();
  const c: Contact = { id: crypto.randomUUID(), name, notes: "", archived: 0, created_at: t, updated_at: t };
  await conn.execute(
    "INSERT INTO contacts (id, name, notes, archived, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6)",
    [c.id, c.name, c.notes, c.archived, c.created_at, c.updated_at],
  );
  return c;
}
export async function updateContact(id: string, patch: Partial<Pick<Contact, "name" | "notes" | "archived">>): Promise<void> {
  const conn = await db();
  const { clause, values, next } = setClause(patch);
  if (!clause) return;
  values.push(now(), id);
  await conn.execute(
    "UPDATE contacts SET " + clause + ", updated_at = $" + next + " WHERE id = $" + (next + 1),
    values,
  );
}
export async function deleteContact(id: string): Promise<void> {
  const conn = await db();
  await conn.execute("DELETE FROM contact_dates WHERE contact_id = $1", [id]);
  await conn.execute("DELETE FROM contact_links WHERE contact_id = $1", [id]);
  await conn.execute("DELETE FROM resource_links WHERE target_type = 'contact' AND target_id = $1", [id]);
  await conn.execute("DELETE FROM contacts WHERE id = $1", [id]);
}
export async function listAllContacts(): Promise<{ id: string; name: string }[]> {
  const conn = await db();
  return conn.select("SELECT id, name FROM contacts WHERE archived = 0 ORDER BY name COLLATE NOCASE ASC");
}

/* ---------- CRM: contact dates ---------- */

export async function listContactDates(contactId: string): Promise<ContactDate[]> {
  const conn = await db();
  return conn.select<ContactDate[]>(
    "SELECT * FROM contact_dates WHERE contact_id = $1 ORDER BY date_at ASC",
    [contactId],
  );
}
export async function addContactDate(contactId: string, label: string, dateAt: number): Promise<ContactDate> {
  const conn = await db();
  const cd: ContactDate = { id: crypto.randomUUID(), contact_id: contactId, label, date_at: dateAt, recurring: 1, created_at: now() };
  await conn.execute(
    "INSERT INTO contact_dates (id, contact_id, label, date_at, recurring, created_at) VALUES ($1,$2,$3,$4,$5,$6)",
    [cd.id, cd.contact_id, cd.label, cd.date_at, cd.recurring, cd.created_at],
  );
  return cd;
}
export async function updateContactDate(id: string, patch: Partial<Pick<ContactDate, "label" | "date_at" | "recurring">>): Promise<void> {
  const conn = await db();
  const { clause, values, next } = setClause(patch);
  if (!clause) return;
  values.push(id);
  await conn.execute("UPDATE contact_dates SET " + clause + " WHERE id = $" + next, values);
}
export async function deleteContactDate(id: string): Promise<void> {
  const conn = await db();
  await conn.execute("DELETE FROM contact_dates WHERE id = $1", [id]);
}

// All contact dates joined with the contact name (for calendar/dashboard).
export async function allContactDates(): Promise<
  { id: string; contact_id: string; contact_name: string; label: string; date_at: number; recurring: number }[]
> {
  const conn = await db();
  return conn.select(
    `SELECT d.id AS id, d.contact_id AS contact_id, c.name AS contact_name,
            d.label AS label, d.date_at AS date_at, d.recurring AS recurring
       FROM contact_dates d JOIN contacts c ON c.id = d.contact_id
      WHERE c.archived = 0`,
  );
}

/* ---------- CRM: contact ↔ project links ---------- */

export async function listContactProjects(contactId: string): Promise<{ link_id: string; project_id: string; name: string; area_name: string }[]> {
  const conn = await db();
  return conn.select(
    `SELECT l.id AS link_id, p.id AS project_id, p.name AS name, a.name AS area_name
       FROM contact_links l JOIN projects p ON p.id = l.project_id JOIN areas a ON a.id = p.area_id
      WHERE l.contact_id = $1 ORDER BY a.name, p.name`,
    [contactId],
  );
}
export async function listProjectContacts(projectId: string): Promise<{ id: string; name: string }[]> {
  const conn = await db();
  return conn.select(
    `SELECT c.id AS id, c.name AS name FROM contact_links l JOIN contacts c ON c.id = l.contact_id
      WHERE l.project_id = $1 AND c.archived = 0 ORDER BY c.name COLLATE NOCASE ASC`,
    [projectId],
  );
}
export async function addContactProject(contactId: string, projectId: string): Promise<void> {
  const conn = await db();
  const existing = await conn.select<{ c: number }[]>(
    "SELECT COUNT(*) AS c FROM contact_links WHERE contact_id = $1 AND project_id = $2",
    [contactId, projectId],
  );
  if ((existing[0]?.c ?? 0) > 0) return;
  await conn.execute(
    "INSERT INTO contact_links (id, contact_id, project_id, created_at) VALUES ($1,$2,$3,$4)",
    [crypto.randomUUID(), contactId, projectId, now()],
  );
}
export async function removeContactProject(linkId: string): Promise<void> {
  const conn = await db();
  await conn.execute("DELETE FROM contact_links WHERE id = $1", [linkId]);
}

export type { Contact, ContactDate };
