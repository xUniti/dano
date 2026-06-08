// DANO data layer — the ONLY place that talks SQL.
// Local SQLite today (tauri-plugin-sql); this module is the seam where a future
// Supabase/cloud adapter plugs in. Schema source of truth: src-tauri/src/lib.rs.

import Database from "@tauri-apps/plugin-sql";
import type {
  Activity,
  Area,
  CalEvent,
  DailyHub,
  EntityType,
  Goal,
  Habit,
  HabitCompletion,
  Note,
  Notification,
  Person,
  PersonDate,
  Project,
  Task,
} from "./types";

let _db: Database | null = null;
/** Lazily open the database; the first load runs pending migrations (Rust side). */
export async function db(): Promise<Database> {
  if (!_db) _db = await Database.load("sqlite:dano_v1.db");
  return _db;
}

export const now = (): number => Date.now();
export const uid = (): string => crypto.randomUUID();

/** Generic insert from a column→value map. */
async function insert(table: string, row: object): Promise<void> {
  const r = row as Record<string, unknown>;
  const keys = Object.keys(r);
  const cols = keys.join(", ");
  const ph = keys.map((_, i) => `$${i + 1}`).join(", ");
  const conn = await db();
  await conn.execute(
    `INSERT INTO ${table} (${cols}) VALUES (${ph})`,
    keys.map((k) => r[k]),
  );
}

/** Generic patch for tables that have an `updated_at` column. */
async function patch(table: string, id: string, fields: object): Promise<void> {
  const f = fields as Record<string, unknown>;
  const keys = Object.keys(f);
  if (keys.length === 0) return;
  const sets = keys.map((k, i) => `${k} = $${i + 1}`).join(", ");
  const conn = await db();
  await conn.execute(
    `UPDATE ${table} SET ${sets}, updated_at = $${keys.length + 1} WHERE id = $${keys.length + 2}`,
    [...keys.map((k) => f[k]), now(), id],
  );
}

async function selectOne<T>(sql: string, args: unknown[]): Promise<T | null> {
  const conn = await db();
  const rows = await conn.select<T[]>(sql, args);
  return rows[0] ?? null;
}

async function removeRow(table: string, id: string): Promise<void> {
  const conn = await db();
  await conn.execute(`DELETE FROM ${table} WHERE id = $1`, [id]);
}

/* ----------------------------------------------------------------- Areas */

export const areas = {
  async list(archived = false): Promise<Area[]> {
    const conn = await db();
    return conn.select<Area[]>(
      "SELECT * FROM areas WHERE archived = $1 ORDER BY name COLLATE NOCASE",
      [archived ? 1 : 0],
    );
  },
  get: (id: string) => selectOne<Area>("SELECT * FROM areas WHERE id = $1", [id]),
  async create(name: string, color: string | null = null): Promise<Area> {
    const t = now();
    const row: Area = { id: uid(), name, color, created_at: t, updated_at: t, archived: 0 };
    await insert("areas", row);
    return row;
  },
  update: (id: string, p: Partial<Pick<Area, "name" | "color" | "archived">>) =>
    patch("areas", id, p),
  /** Delete an area and its projects' tasks + projects (explicit, not relying on FK cascade). */
  async remove(id: string): Promise<void> {
    const conn = await db();
    await conn.execute(
      "DELETE FROM tasks WHERE project_id IN (SELECT id FROM projects WHERE area_id = $1)",
      [id],
    );
    await conn.execute("DELETE FROM projects WHERE area_id = $1", [id]);
    await conn.execute("DELETE FROM areas WHERE id = $1", [id]);
  },
};

/* ----------------------------------------------------------------- Goals */

export const goals = {
  async list(archived = false): Promise<Goal[]> {
    const conn = await db();
    return conn.select<Goal[]>(
      "SELECT * FROM goals WHERE archived = $1 ORDER BY updated_at DESC",
      [archived ? 1 : 0],
    );
  },
  get: (id: string) => selectOne<Goal>("SELECT * FROM goals WHERE id = $1", [id]),
  async create(title: string): Promise<Goal> {
    const t = now();
    const row: Goal = {
      id: uid(), title, description: "", status: "active",
      created_at: t, updated_at: t, archived: 0,
    };
    await insert("goals", row);
    return row;
  },
  update: (id: string, p: Partial<Pick<Goal, "title" | "description" | "status" | "archived">>) =>
    patch("goals", id, p),
  remove: (id: string) => removeRow("goals", id),
};

/* -------------------------------------------------------------- Projects */

export const projects = {
  async listByArea(areaId: string, archived = false): Promise<Project[]> {
    const conn = await db();
    return conn.select<Project[]>(
      "SELECT * FROM projects WHERE area_id = $1 AND archived = $2 ORDER BY updated_at DESC",
      [areaId, archived ? 1 : 0],
    );
  },
  async listActive(): Promise<Project[]> {
    const conn = await db();
    return conn.select<Project[]>(
      "SELECT * FROM projects WHERE archived = 0 AND status = 'active' ORDER BY updated_at DESC",
    );
  },
  async listAll(archived = false): Promise<Project[]> {
    const conn = await db();
    return conn.select<Project[]>(
      "SELECT * FROM projects WHERE archived = $1 ORDER BY name COLLATE NOCASE",
      [archived ? 1 : 0],
    );
  },
  get: (id: string) => selectOne<Project>("SELECT * FROM projects WHERE id = $1", [id]),
  async create(areaId: string, name: string): Promise<Project> {
    const t = now();
    const row: Project = {
      id: uid(), name, description: "", status: "active", progress: 0,
      due_at: null, goal_id: null, area_id: areaId, created_at: t, updated_at: t, archived: 0,
    };
    await insert("projects", row);
    return row;
  },
  update: (
    id: string,
    p: Partial<Pick<Project, "name" | "description" | "status" | "progress" | "due_at" | "goal_id" | "area_id" | "archived">>,
  ) => patch("projects", id, p),
  remove: (id: string) => removeRow("projects", id),
  /** Recompute progress = done / total * 100 from the project's tasks. */
  async recomputeProgress(id: string): Promise<number> {
    const row = await selectOne<{ total: number; done: number }>(
      "SELECT COUNT(*) AS total, SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END) AS done FROM tasks WHERE project_id = $1 AND archived = 0",
      [id],
    );
    const total = row?.total ?? 0;
    const done = row?.done ?? 0;
    const progress = total === 0 ? 0 : Math.round((done / total) * 100);
    await patch("projects", id, { progress });
    return progress;
  },
};

/* ----------------------------------------------------------------- Tasks */

export const tasks = {
  async listByProject(projectId: string, archived = false): Promise<Task[]> {
    const conn = await db();
    return conn.select<Task[]>(
      "SELECT * FROM tasks WHERE project_id = $1 AND archived = $2 ORDER BY sort_order, created_at",
      [projectId, archived ? 1 : 0],
    );
  },
  async listToday(): Promise<Task[]> {
    const endOfToday = endOfTodayMs();
    const conn = await db();
    return conn.select<Task[]>(
      "SELECT * FROM tasks WHERE archived = 0 AND status != 'done' AND due_at IS NOT NULL AND due_at <= $1 ORDER BY priority, due_at",
      [endOfToday],
    );
  },
  async completedOn(dayStart: number, dayEnd: number): Promise<Task[]> {
    const conn = await db();
    return conn.select<Task[]>(
      "SELECT * FROM tasks WHERE completed_at IS NOT NULL AND completed_at >= $1 AND completed_at <= $2 ORDER BY completed_at",
      [dayStart, dayEnd],
    );
  },
  async listAll(archived = false): Promise<Task[]> {
    const conn = await db();
    return conn.select<Task[]>(
      "SELECT * FROM tasks WHERE archived = $1 ORDER BY sort_order, created_at",
      [archived ? 1 : 0],
    );
  },
  async listUpcoming(): Promise<Task[]> {
    const conn = await db();
    return conn.select<Task[]>(
      "SELECT * FROM tasks WHERE archived = 0 AND status != 'done' AND due_at IS NOT NULL AND due_at > $1 ORDER BY due_at",
      [endOfTodayMs()],
    );
  },
  get: (id: string) => selectOne<Task>("SELECT * FROM tasks WHERE id = $1", [id]),
  async create(title: string, projectId: string | null = null): Promise<Task> {
    const t = now();
    const row: Task = {
      id: uid(), title, description: "", status: "todo", priority: "p3",
      due_at: null, completed_at: null, sort_order: t, project_id: projectId,
      goal_id: null, tags: "", created_at: t, updated_at: t, archived: 0,
    };
    await insert("tasks", row);
    return row;
  },
  update: (
    id: string,
    p: Partial<Pick<Task, "title" | "description" | "status" | "priority" | "due_at" | "completed_at" | "sort_order" | "project_id" | "goal_id" | "tags" | "archived">>,
  ) => patch("tasks", id, p),
  /** Toggle done, stamping completed_at, then refresh the project's progress. */
  async setStatus(id: string, status: Task["status"]): Promise<void> {
    const completed_at = status === "done" ? now() : null;
    await patch("tasks", id, { status, completed_at });
    const task = await tasks.get(id);
    if (task?.project_id) await projects.recomputeProgress(task.project_id);
  },
  remove: (id: string) => removeRow("tasks", id),
};

/* ----------------------------------------------------------------- Notes */

export const notes = {
  async list(archived = false): Promise<Note[]> {
    const conn = await db();
    return conn.select<Note[]>(
      "SELECT * FROM notes WHERE archived = $1 ORDER BY pinned DESC, updated_at DESC",
      [archived ? 1 : 0],
    );
  },
  get: (id: string) => selectOne<Note>("SELECT * FROM notes WHERE id = $1", [id]),
  async create(title: string): Promise<Note> {
    const t = now();
    const row: Note = {
      id: uid(), title, content: "", tags: "", pinned: 0,
      created_at: t, updated_at: t, archived: 0,
    };
    await insert("notes", row);
    return row;
  },
  update: (id: string, p: Partial<Pick<Note, "title" | "content" | "tags" | "pinned" | "archived">>) =>
    patch("notes", id, p),
  remove: (id: string) => removeRow("notes", id),
};

/* --------------------------------------------------------------- Habits */

export const habits = {
  async list(archived = false): Promise<Habit[]> {
    const conn = await db();
    return conn.select<Habit[]>(
      "SELECT * FROM habits WHERE archived = $1 ORDER BY created_at",
      [archived ? 1 : 0],
    );
  },
  get: (id: string) => selectOne<Habit>("SELECT * FROM habits WHERE id = $1", [id]),
  async create(name: string): Promise<Habit> {
    const t = now();
    const row: Habit = {
      id: uid(), name, frequency: "daily", target: 1, color: null,
      goal_id: null, created_at: t, updated_at: t, archived: 0,
    };
    await insert("habits", row);
    return row;
  },
  update: (id: string, p: Partial<Pick<Habit, "name" | "frequency" | "target" | "color" | "goal_id" | "archived">>) =>
    patch("habits", id, p),
  remove: (id: string) => removeRow("habits", id),
};

export const habitCompletions = {
  async forDate(date: string): Promise<HabitCompletion[]> {
    const conn = await db();
    return conn.select<HabitCompletion[]>(
      "SELECT * FROM habit_completions WHERE date = $1",
      [date],
    );
  },
  async forHabit(habitId: string): Promise<HabitCompletion[]> {
    const conn = await db();
    return conn.select<HabitCompletion[]>(
      "SELECT * FROM habit_completions WHERE habit_id = $1 ORDER BY date DESC",
      [habitId],
    );
  },
  /** Mark a habit done for a day (idempotent on (habit_id, date)). */
  async set(habitId: string, date: string, count = 1): Promise<void> {
    const conn = await db();
    await conn.execute(
      `INSERT INTO habit_completions (id, habit_id, date, count, created_at)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (habit_id, date) DO UPDATE SET count = excluded.count`,
      [uid(), habitId, date, count, now()],
    );
  },
  async unset(habitId: string, date: string): Promise<void> {
    const conn = await db();
    await conn.execute(
      "DELETE FROM habit_completions WHERE habit_id = $1 AND date = $2",
      [habitId, date],
    );
  },
};

/* ---------------------------------------------------------------- Events */

export const events = {
  async between(startMs: number, endMs: number): Promise<CalEvent[]> {
    const conn = await db();
    return conn.select<CalEvent[]>(
      "SELECT * FROM events WHERE archived = 0 AND start_at >= $1 AND start_at <= $2 ORDER BY start_at",
      [startMs, endMs],
    );
  },
  get: (id: string) => selectOne<CalEvent>("SELECT * FROM events WHERE id = $1", [id]),
  async create(title: string, startAt: number): Promise<CalEvent> {
    const t = now();
    const row: CalEvent = {
      id: uid(), title, description: "", start_at: startAt, end_at: null,
      all_day: 0, location: "", created_at: t, updated_at: t, archived: 0,
    };
    await insert("events", row);
    return row;
  },
  update: (
    id: string,
    p: Partial<Pick<CalEvent, "title" | "description" | "start_at" | "end_at" | "all_day" | "location" | "archived">>,
  ) => patch("events", id, p),
  remove: (id: string) => removeRow("events", id),
};

/* ---------------------------------------------------------------- People */

export const people = {
  async list(archived = false): Promise<Person[]> {
    const conn = await db();
    return conn.select<Person[]>(
      "SELECT * FROM people WHERE archived = $1 ORDER BY first_name COLLATE NOCASE, last_name COLLATE NOCASE",
      [archived ? 1 : 0],
    );
  },
  get: (id: string) => selectOne<Person>("SELECT * FROM people WHERE id = $1", [id]),
  async create(firstName: string, lastName = ""): Promise<Person> {
    const t = now();
    const row: Person = {
      id: uid(), first_name: firstName, last_name: lastName, email: "", phone: "",
      avatar_url: null, birthday: null, notes: "", relationship_tags: "",
      last_interaction_at: null, created_at: t, updated_at: t, archived: 0,
    };
    await insert("people", row);
    return row;
  },
  update: (
    id: string,
    p: Partial<Pick<Person, "first_name" | "last_name" | "email" | "phone" | "avatar_url" | "birthday" | "notes" | "relationship_tags" | "last_interaction_at" | "archived">>,
  ) => patch("people", id, p),
  touch: (id: string) => patch("people", id, { last_interaction_at: now() }),
  remove: (id: string) => removeRow("people", id),
};

export const peopleDates = {
  async forPerson(personId: string): Promise<PersonDate[]> {
    const conn = await db();
    return conn.select<PersonDate[]>(
      "SELECT * FROM people_dates WHERE person_id = $1 ORDER BY date",
      [personId],
    );
  },
  async create(personId: string, label: string, date: string, recurring = true): Promise<PersonDate> {
    const row: PersonDate = {
      id: uid(), person_id: personId, label, date, recurring: recurring ? 1 : 0, created_at: now(),
    };
    await insert("people_dates", row);
    return row;
  },
  remove: (id: string) => removeRow("people_dates", id),
};

/* ------------------------------------------------------------ Daily Hubs */

export const dailyHubs = {
  get: (date: string) => selectOne<DailyHub>("SELECT * FROM daily_hubs WHERE date = $1", [date]),
  /** Get today's hub, creating it if missing (the Daily Hub engine entry point). */
  async ensure(date: string): Promise<DailyHub> {
    const existing = await dailyHubs.get(date);
    if (existing) return existing;
    const t = now();
    const row: DailyHub = {
      id: uid(), date, journal: "", mood: null, energy: null,
      wins: "", challenges: "", lessons: "", gratitude: "", created_at: t, updated_at: t,
    };
    await insert("daily_hubs", row);
    return row;
  },
  update: (
    id: string,
    p: Partial<Pick<DailyHub, "journal" | "mood" | "energy" | "wins" | "challenges" | "lessons" | "gratitude">>,
  ) => patch("daily_hubs", id, p),
};

/* ----------------------------------------------------------- Notifications */

export const notifications = {
  async list(unreadOnly = false): Promise<Notification[]> {
    const conn = await db();
    const where = unreadOnly ? "WHERE read = 0" : "";
    return conn.select<Notification[]>(
      `SELECT * FROM notifications ${where} ORDER BY created_at DESC`,
    );
  },
  async create(type: string, title: string, body = ""): Promise<Notification> {
    const row: Notification = {
      id: uid(), type, title, body, entity_type: null, entity_id: null, read: 0, created_at: now(),
    };
    await insert("notifications", row);
    return row;
  },
  async markRead(id: string): Promise<void> {
    const conn = await db();
    await conn.execute("UPDATE notifications SET read = 1 WHERE id = $1", [id]);
  },
  remove: (id: string) => removeRow("notifications", id),
};

/* --------------------------------------------------------------- Activity */

export const activity = {
  async recent(limit = 50): Promise<Activity[]> {
    const conn = await db();
    return conn.select<Activity[]>(
      "SELECT * FROM activity ORDER BY created_at DESC LIMIT $1",
      [limit],
    );
  },
  async log(kind: string, title: string, opts: { detail?: string; entityType?: string; entityId?: string } = {}): Promise<void> {
    await insert("activity", {
      id: uid(), entity_type: opts.entityType ?? null, entity_id: opts.entityId ?? null,
      kind, title, detail: opts.detail ?? "", created_at: now(),
    });
  },
};

/* ------------------------------------------------------------- Backup */

/** Dump every table to a plain object — used by Settings → Export backup. */
export async function exportData(): Promise<Record<string, unknown>> {
  const conn = await db();
  const tableNames = [
    "areas", "goals", "projects", "tasks", "notes", "habits", "habit_completions",
    "events", "people", "people_dates", "daily_hubs", "links", "notifications", "activity",
  ];
  const tables: Record<string, unknown[]> = {};
  for (const t of tableNames) {
    tables[t] = await conn.select<unknown[]>(`SELECT * FROM ${t}`);
  }
  return { app: "DANO", schema: "v1", exported_at: now(), tables };
}

/* ----------------------------------------------------------- Graph labels */

/** Human label for any entity, used by timelines and backlink panels. */
export async function entityLabel(type: EntityType, id: string): Promise<string> {
  switch (type) {
    case "person": {
      const p = await people.get(id);
      return p ? `${p.first_name} ${p.last_name}`.trim() || "Unnamed" : "Person";
    }
    case "task":
      return (await tasks.get(id))?.title ?? "Task";
    case "project":
      return (await projects.get(id))?.name ?? "Project";
    case "note":
      return (await notes.get(id))?.title ?? "Note";
    case "event":
      return (await events.get(id))?.title ?? "Event";
    case "goal":
      return (await goals.get(id))?.title ?? "Goal";
    case "area":
      return (await areas.get(id))?.name ?? "Area";
    case "habit":
      return (await habits.get(id))?.name ?? "Habit";
    case "daily_hub":
      return "Daily Hub";
    default:
      return type;
  }
}

/* --------------------------------------------------------------- Helpers */

/** End-of-today in ms (local time), for "due today or overdue" queries. */
function endOfTodayMs(): number {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d.getTime();
}
