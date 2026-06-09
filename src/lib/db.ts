// DANO data layer — the ONLY place that talks SQL.
// Local SQLite today (tauri-plugin-sql); this module is the seam where a future
// Supabase/cloud adapter plugs in. Schema source of truth: src-tauri/src/lib.rs.

import Database from "@tauri-apps/plugin-sql";
import type {
  Activity,
  Area,
  Attachment,
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
// Serialize every query: concurrent reads/writes on tauri-plugin-sql (SQLite)
// can deadlock, which left pages stuck on "Loading…". We run them one at a time.
let _chain: Promise<unknown> = Promise.resolve();
function serialize<T>(fn: () => Promise<T>): Promise<T> {
  const result = _chain.then(fn, fn);
  _chain = result.catch(() => {});
  return result;
}

/** Lazily open the database; the first load runs pending migrations (Rust side). */
export async function db(): Promise<Database> {
  if (!_db) {
    const d = await Database.load("sqlite:dano_v1.db");
    // Wrap select/execute so all DB access is queued through a single chain.
    const raw = d as unknown as {
      select: (q: string, p?: unknown[]) => Promise<unknown>;
      execute: (q: string, p?: unknown[]) => Promise<unknown>;
    };
    const origSelect = raw.select.bind(raw);
    const origExecute = raw.execute.bind(raw);
    raw.select = (q, p) => serialize(() => origSelect(q, p));
    raw.execute = (q, p) => serialize(() => origExecute(q, p));
    _db = d;
  }
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
  /** All completions whose date (YYYY-MM-DD) falls within [startKey, endKey]. */
  async between(startKey: string, endKey: string): Promise<HabitCompletion[]> {
    const conn = await db();
    return conn.select<HabitCompletion[]>(
      "SELECT * FROM habit_completions WHERE date >= $1 AND date <= $2 ORDER BY date",
      [startKey, endKey],
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
  async listAll(archived = false): Promise<CalEvent[]> {
    const conn = await db();
    return conn.select<CalEvent[]>(
      "SELECT * FROM events WHERE archived = $1 ORDER BY start_at DESC",
      [archived ? 1 : 0],
    );
  },
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
  async listAll(): Promise<DailyHub[]> {
    const conn = await db();
    return conn.select<DailyHub[]>("SELECT * FROM daily_hubs ORDER BY date DESC");
  },
  async listBetween(startKey: string, endKey: string): Promise<DailyHub[]> {
    const conn = await db();
    return conn.select<DailyHub[]>(
      "SELECT * FROM daily_hubs WHERE date >= $1 AND date <= $2 ORDER BY date",
      [startKey, endKey],
    );
  },
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

/* ------------------------------------------------------------ Attachments */
// File metadata only; the bytes live on disk (app data dir) — see
// platform.saveAttachmentFile / openAttachment.

export const attachments = {
  async forEntity(type: EntityType, id: string): Promise<Attachment[]> {
    const conn = await db();
    return conn.select<Attachment[]>(
      "SELECT * FROM attachments WHERE entity_type = $1 AND entity_id = $2 ORDER BY created_at DESC",
      [type, id],
    );
  },
  async create(type: EntityType, id: string, file: { name: string; mime: string; size: number; path: string }): Promise<Attachment> {
    const row: Attachment = {
      id: uid(), entity_type: type, entity_id: id,
      name: file.name, mime: file.mime, size: file.size, path: file.path, created_at: now(),
    };
    await insert("attachments", row);
    return row;
  },
  remove: (id: string) => removeRow("attachments", id),
};

/* --------------------------------------------------------------- Demo data */
// Sample content for previewing the app. All rows use `demo-` ids so they can be
// wiped cleanly. Stored only in the local DB — never part of the repo.

export const demo = {
  async load(): Promise<void> {
    const conn = await db();
    const t = now();
    const DAY = 86_400_000;
    const ms = (d: number) => t + d * DAY;
    const key = (d: number) => {
      const x = new Date(t + d * DAY);
      return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
    };
    const run = (sql: string, params: unknown[]) => conn.execute(sql, params);

    // Areas
    const areasD: [string, string, string][] = [
      ["demo-area-health", "Health", "#34d399"],
      ["demo-area-career", "Career", "#38bdf8"],
      ["demo-area-learning", "Learning", "#a78bfa"],
    ];
    for (const [id, name, color] of areasD)
      await run("INSERT OR IGNORE INTO areas (id,name,color,created_at,updated_at,archived) VALUES ($1,$2,$3,$4,$5,0)", [id, name, color, ms(-40), ms(-2)]);

    // Goals
    const goalsD: [string, string, string][] = [
      ["demo-goal-5k", "Run a 5K", "Build up to a parkrun"],
      ["demo-goal-launch", "Launch portfolio", "Ship the new personal site"],
    ];
    for (const [id, title, desc] of goalsD)
      await run("INSERT OR IGNORE INTO goals (id,title,description,status,created_at,updated_at,archived) VALUES ($1,$2,$3,'active',$4,$5,0)", [id, title, desc, ms(-30), ms(-3)]);

    // Projects (area_id, goal_id)
    const projD: [string, string, string, string | null, number][] = [
      ["demo-proj-website", "Website Redesign", "demo-area-career", "demo-goal-launch", 6],
      ["demo-proj-5k", "5K Training", "demo-area-health", "demo-goal-5k", 25],
      ["demo-proj-spanish", "Learn Spanish", "demo-area-learning", null, 12],
    ];
    for (const [id, name, area, goal, due] of projD)
      await run("INSERT OR IGNORE INTO projects (id,name,description,status,progress,due_at,goal_id,area_id,created_at,updated_at,archived) VALUES ($1,$2,'','active',0,$3,$4,$5,$6,$7,0)", [id, name, ms(due), goal, area, ms(-25), ms(-1)]);

    // Tasks: [id, title, status, priority, dueOffset|null, completedOffset|null, project]
    const tasksD: [string, string, string, string, number | null, number | null, string][] = [
      ["demo-task-1", "Draft homepage copy", "doing", "p2", 0, null, "demo-proj-website"],
      ["demo-task-2", "Pick color palette", "done", "p3", -1, -1, "demo-proj-website"],
      ["demo-task-3", "Set up analytics", "todo", "p3", 2, null, "demo-proj-website"],
      ["demo-task-4", "Email the designer", "waiting", "p2", 1, null, "demo-proj-website"],
      ["demo-task-5", "Buy running shoes", "todo", "p1", -1, null, "demo-proj-5k"],
      ["demo-task-6", "Run 3km", "done", "p3", -2, -2, "demo-proj-5k"],
      ["demo-task-7", "Spanish lesson 1", "done", "p3", -3, -3, "demo-proj-spanish"],
      ["demo-task-8", "Spanish lesson 2", "todo", "p3", 0, null, "demo-proj-spanish"],
      ["demo-task-9", "Weekly review", "done", "p2", -5, -5, "demo-proj-website"],
      ["demo-task-10", "Stretch routine", "done", "p4", -7, -7, "demo-proj-5k"],
      ["demo-task-11", "Outline about page", "done", "p3", -10, -10, "demo-proj-website"],
      ["demo-task-12", "Morning run", "done", "p3", 0, 0, "demo-proj-5k"],
    ];
    let so = 0;
    for (const [id, title, status, prio, due, done, proj] of tasksD)
      await run("INSERT OR IGNORE INTO tasks (id,title,description,status,priority,due_at,completed_at,sort_order,project_id,goal_id,tags,created_at,updated_at,archived) VALUES ($1,$2,'',$3,$4,$5,$6,$7,$8,NULL,'',$9,$10,0)", [id, title, status, prio, due == null ? null : ms(due), done == null ? null : ms(done), so++, proj, ms(-20), ms(0)]);

    // Notes
    await run("INSERT OR IGNORE INTO notes (id,title,content,tags,pinned,created_at,updated_at,archived) VALUES ($1,$2,$3,$4,1,$5,$6,0)", ["demo-note-ideas", "Website ideas", "Talk to @Ana about the hero layout. Tie this to #Draft homepage copy.\n\n- Bolder type\n- Calmer palette", "design,web", ms(-4), ms(0)]);
    await run("INSERT OR IGNORE INTO notes (id,title,content,tags,pinned,created_at,updated_at,archived) VALUES ($1,$2,$3,$4,0,$5,$6,0)", ["demo-note-reading", "Reading list", "# To read\n- Atomic Habits\n- Deep Work", "learning", ms(-2), ms(0)]);

    // People (birthday MM-DD; Ana within ~8 days)
    const anaBday = `1992-${key(8).slice(5)}`;
    const benBday = `1988-${key(120).slice(5)}`;
    await run("INSERT OR IGNORE INTO people (id,first_name,last_name,email,phone,avatar_url,birthday,notes,relationship_tags,last_interaction_at,created_at,updated_at,archived) VALUES ($1,'Ana','Costa','ana@example.com','',NULL,$2,'Designer, great taste','friend,design',$3,$4,$5,0)", ["demo-person-ana", anaBday, ms(-1), ms(-60), ms(-1)]);
    await run("INSERT OR IGNORE INTO people (id,first_name,last_name,email,phone,avatar_url,birthday,notes,relationship_tags,last_interaction_at,created_at,updated_at,archived) VALUES ($1,'Ben','Hayes','ben@example.com','',NULL,$2,'Old colleague','work',$3,$4,$5,0)", ["demo-person-ben", benBday, ms(-45), ms(-90), ms(-45)]);

    // Habits + completions
    const habitsD: [string, string, string][] = [
      ["demo-habit-meditate", "Meditate", "#34d399"],
      ["demo-habit-read", "Read", "#38bdf8"],
      ["demo-habit-workout", "Workout", "#fbbf24"],
    ];
    for (const [id, name, color] of habitsD)
      await run("INSERT OR IGNORE INTO habits (id,name,frequency,target,color,goal_id,created_at,updated_at,archived) VALUES ($1,$2,'daily',1,$3,NULL,$4,$5,0)", [id, name, color, ms(-30), ms(0)]);
    const addComp = async (habit: string, d: number) =>
      run("INSERT OR IGNORE INTO habit_completions (id,habit_id,date,count,created_at) VALUES ($1,$2,$3,1,$4)", [`demo-hc-${habit}-${key(d)}`, habit, key(d), ms(d)]);
    for (let d = -11; d <= 0; d++) await addComp("demo-habit-meditate", d); // 12-day streak
    for (let d = -19; d <= 0; d++) if (d % 2 === 0) await addComp("demo-habit-read", d); // ~every other day
    for (let d = -13; d <= 0; d++) if (d % 3 !== 0) await addComp("demo-habit-workout", d);

    // Daily hubs (last 10 days) — OR IGNORE leaves a real today hub intact
    const journals = ["Solid focus today.", "Bit tired but pushed through.", "Great run this morning.", "Deep work on the site.", "Caught up with Ana.", "Slow day, rested.", "Shipped the palette.", "Read before bed.", "Planned the week.", "Felt grateful."];
    for (let d = -9; d <= 0; d++)
      await run("INSERT OR IGNORE INTO daily_hubs (id,date,journal,mood,energy,wins,challenges,lessons,gratitude,created_at,updated_at) VALUES ($1,$2,$3,$4,$5,'','','','',$6,$7)", [`demo-hub-${key(d)}`, key(d), journals[d + 9] ?? "", 6 + ((d + 9) % 4), 5 + ((d + 9) % 5), ms(d), ms(d)]);

    // Events (next week)
    await run("INSERT OR IGNORE INTO events (id,title,description,start_at,end_at,all_day,location,created_at,updated_at,archived) VALUES ($1,'Design review','',$2,NULL,0,'Zoom',$3,$4,0)", ["demo-event-review", ms(2) , ms(-3), ms(-3)]);
    await run("INSERT OR IGNORE INTO events (id,title,description,start_at,end_at,all_day,location,created_at,updated_at,archived) VALUES ($1,'Parkrun','',$2,NULL,0,'Park',$3,$4,0)", ["demo-event-parkrun", ms(5), ms(-3), ms(-3)]);

    // Links (graph)
    const linksD: [string, string, string, string, string, string][] = [
      ["demo-link-1", "note", "demo-note-ideas", "person", "demo-person-ana", "mentioned_in"],
      ["demo-link-2", "note", "demo-note-ideas", "task", "demo-task-1", "mentioned_in"],
      ["demo-link-3", "project", "demo-proj-website", "person", "demo-person-ana", "related_to"],
      ["demo-link-4", "project", "demo-proj-website", "person", "demo-person-ben", "related_to"],
      ["demo-link-5", "project", "demo-proj-5k", "note", "demo-note-reading", "related_to"],
    ];
    for (const [id, st, si, tt, ti, rel] of linksD)
      await run("INSERT OR IGNORE INTO links (id,source_type,source_id,target_type,target_id,relation_type,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7)", [id, st, si, tt, ti, rel, ms(-3)]);

    // Recompute project progress from the seeded tasks
    for (const [pid] of projD) await projects.recomputeProgress(pid);
  },

  async clear(): Promise<void> {
    const conn = await db();
    const tables = ["tasks", "projects", "goals", "areas", "notes", "habits", "habit_completions", "events", "people", "people_dates", "daily_hubs", "notifications", "activity"];
    for (const tbl of tables) await conn.execute(`DELETE FROM ${tbl} WHERE id LIKE 'demo-%'`);
    await conn.execute("DELETE FROM links WHERE id LIKE 'demo-%' OR source_id LIKE 'demo-%' OR target_id LIKE 'demo-%'");
  },
};

/* ------------------------------------------------------------- Backup */

/** Dump every table to a plain object — used by Settings → Export backup. */
export async function exportData(): Promise<Record<string, unknown>> {
  const conn = await db();
  const tableNames = [
    "areas", "goals", "projects", "tasks", "notes", "habits", "habit_completions",
    "events", "people", "people_dates", "daily_hubs", "links", "notifications", "activity", "attachments",
  ];
  const tables: Record<string, unknown[]> = {};
  for (const t of tableNames) {
    tables[t] = await conn.select<unknown[]>(`SELECT * FROM ${t}`);
  }
  return { app: "DANO", schema: "v1", exported_at: now(), tables };
}

/* ------------------------------------------------------------- Archive */

// Entities that support soft-delete (have an `archived` column).
const ARCHIVABLE: { type: EntityType; table: string }[] = [
  { type: "area", table: "areas" },
  { type: "goal", table: "goals" },
  { type: "project", table: "projects" },
  { type: "task", table: "tasks" },
  { type: "note", table: "notes" },
  { type: "habit", table: "habits" },
  { type: "event", table: "events" },
  { type: "person", table: "people" },
];

function labelOf(type: EntityType, row: Record<string, unknown>): string {
  if (type === "person") return `${row.first_name ?? ""} ${row.last_name ?? ""}`.trim() || "Unnamed";
  return String(row.title ?? row.name ?? "Untitled");
}

async function setArchived(type: EntityType, id: string, archived: 0 | 1): Promise<void> {
  const t = ARCHIVABLE.find((a) => a.type === type);
  if (!t) return;
  const conn = await db();
  await conn.execute(`UPDATE ${t.table} SET archived = $1, updated_at = $2 WHERE id = $3`, [archived, now(), id]);
}

/** Soft-delete: move an entity to the Archive. */
export const archiveEntity = (type: EntityType, id: string) => setArchived(type, id, 1);
/** Bring an archived entity back. */
export const restoreEntity = (type: EntityType, id: string) => setArchived(type, id, 0);

/** Permanently delete an entity (with child cascade for areas & projects). */
export async function purgeEntity(type: EntityType, id: string): Promise<void> {
  const conn = await db();
  if (type === "area") return areas.remove(id);
  if (type === "project") {
    await conn.execute("DELETE FROM tasks WHERE project_id = $1", [id]);
    await conn.execute("DELETE FROM projects WHERE id = $1", [id]);
    return;
  }
  const t = ARCHIVABLE.find((a) => a.type === type);
  if (t) await conn.execute(`DELETE FROM ${t.table} WHERE id = $1`, [id]);
}

/** Everything currently archived, across all entity types. */
export async function listArchived(): Promise<{ type: EntityType; id: string; label: string; updated_at: number }[]> {
  const conn = await db();
  const out: { type: EntityType; id: string; label: string; updated_at: number }[] = [];
  for (const { type, table } of ARCHIVABLE) {
    const rows = await conn.select<Record<string, unknown>[]>(`SELECT * FROM ${table} WHERE archived = 1 ORDER BY updated_at DESC`);
    for (const r of rows) out.push({ type, id: String(r.id), label: labelOf(type, r), updated_at: Number(r.updated_at) });
  }
  return out.sort((a, b) => b.updated_at - a.updated_at);
}

/* --------------------------------------------------------------- Metrics */

/** All links (created_at only) — for the "connected objects" count + per-day trend. */
export async function linkTimestamps(): Promise<number[]> {
  const conn = await db();
  const rows = await conn.select<{ created_at: number }[]>("SELECT created_at FROM links");
  return rows.map((r) => r.created_at);
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
