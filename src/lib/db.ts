// DANO storage layer — hierarchical PARA + Resources (Phase B).
// Native SQLite via tauri-plugin-sql. All SQL is isolated in this module.

import Database from "@tauri-apps/plugin-sql";
import type {
  Area,
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
    "SELECT * FROM projects WHERE area_id = $1 AND archived = $2 ORDER BY status ASC, updated_at DESC",
    [areaId, archived ? 1 : 0],
  );
}
export async function createProject(areaId: string, name: string): Promise<Project> {
  const conn = await db();
  const t = now();
  const p: Project = { id: crypto.randomUUID(), name, area_id: areaId, status: "active", due_at: null, archived: 0, created_at: t, updated_at: t };
  await conn.execute(
    "INSERT INTO projects (id, name, area_id, status, due_at, archived, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)",
    [p.id, p.name, p.area_id, p.status, p.due_at, p.archived, p.created_at, p.updated_at],
  );
  return p;
}
export async function updateProject(id: string, patch: Partial<Pick<Project, "name" | "status" | "due_at" | "archived">>): Promise<void> {
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
      WHERE p.archived = 0 AND p.status = 'active' AND p.due_at IS NOT NULL
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
      WHERE p.archived = 0 AND p.status = 'active'
      ORDER BY p.updated_at DESC LIMIT $1`,
    [limit],
  );
}

export type { ProjectStatus, TaskStatus };
