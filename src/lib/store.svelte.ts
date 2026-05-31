// DANO reactive store (Svelte 5 runes) — PARA + Resources (Phase B).

import type {
  Area, Activity, CalEvent, CalItem, Contact, ContactDate, LinkTargetType, Project, ProjectPriority, ProjectStatus, Resource, Task, TaskStatus,
} from "./types";
import * as db from "./db";
import type { DetailedLink } from "./db";

type View = "dashboard" | "area" | "project" | "resources" | "resource" | "archive" | "calendar" | "contacts" | "contact" | "projects" | "areas" | "search";
type CalMode = "month" | "week" | "agenda";

class DanoStore {
  view = $state<View>("dashboard");

  areas = $state<Area[]>([]);
  expandedAreas = $state<Record<string, boolean>>({});
  projectsByArea = $state<Record<string, Project[]>>({});

  activeAreaId = $state<string | null>(null);
  activeProjectId = $state<string | null>(null);
  activeProjectObj = $state<(Project & { area_name?: string }) | null>(null);
  tasks = $state<Task[]>([]);

  // Resources linked to the open project / area.
  contextResources = $state<Resource[]>([]);

  // Dashboard
  dashboard = $state<{
    upcoming: { kind: "project" | "task" | "contactdate"; id: string; title: string; due_at: number; context: string; contactId?: string }[];
    activeProjects: Awaited<ReturnType<typeof db.activeProjects>>;
    inbox: Resource[];
    resources: Resource[];
    archived: Awaited<ReturnType<typeof db.recentArchived>>;
    recent: Awaited<ReturnType<typeof db.recentlyEdited>>;
  }>({ upcoming: [], activeProjects: [], inbox: [], resources: [], archived: [], recent: [] });

  // Resources library + open resource
  library = $state<Resource[]>([]);
  resourceRows = $state<Awaited<ReturnType<typeof db.listResourcesWithContext>>>([]);
  activeResourceId = $state<string | null>(null);
  resourceCache = $state<Record<string, Resource>>({});
  resourceLinks = $state<DetailedLink[]>([]);
  returnTo = $state<View>("dashboard"); // where to go back after editing a resource

  // Link picker data (loaded lazily)
  pickProjects = $state<{ id: string; name: string; area_name: string }[]>([]);
  pickTasks = $state<{ id: string; title: string; context: string }[]>([]);

  // Archive
  archive = $state<{
    resources: Resource[];
    projects: Awaited<ReturnType<typeof db.listArchivedProjects>>;
    areas: Area[];
  }>({ resources: [], projects: [], areas: [] });

  loading = $state(true);
  ready = $state(false);
  error = $state<string | null>(null);

  // PARA counts (sidebar + stat cards) and browse lists
  counts = $state<{ projects: number; areas: number; resources: number; archive: number; inbox: number }>(
    { projects: 0, areas: 0, resources: 0, archive: 0, inbox: 0 },
  );
  allProjects = $state<(Project & { area_name: string })[]>([]);
  projectPreviews = $state<Awaited<ReturnType<typeof db.listProjectsWithPreview>>>([]);
  areaTasks = $state<(Task & { project_name: string })[]>([]);
  areaTasksAll = $state<(Task & { area_id: string; project_name: string })[]>([]);
  projectActivity = $state<Activity[]>([]);

  // Search (Phase 3)
  searchQuery = $state("");
  searchHits = $state<Awaited<ReturnType<typeof db.search>>>([]);
  // Dashboard filter: scope by area (null = all)
  dashFilterArea = $state<string | null>(null);

  // Calendar
  calMode = $state<CalMode>("month");
  calAnchor = $state<number>(Date.now()); // a timestamp inside the viewed period
  calItems = $state<CalItem[]>([]);
  activeEvent = $state<CalEvent | null>(null); // event being edited in the dialog

  // CRM
  contacts = $state<Contact[]>([]);
  activeContactId = $state<string | null>(null);
  contactCache = $state<Record<string, Contact>>({});
  contactDates = $state<ContactDate[]>([]);
  contactProjects = $state<Awaited<ReturnType<typeof db.listContactProjects>>>([]);
  contactNotes = $state<Resource[]>([]); // resources linked to the open contact
  projectContacts = $state<{ id: string; name: string }[]>([]); // people linked to open project
  pickContacts = $state<{ id: string; name: string }[]>([]);
  contactReturnTo = $state<View>("contacts");

  #saveTimer: ReturnType<typeof setTimeout> | null = null;

  #fail(e: unknown) { this.error = e instanceof Error ? e.message : String(e); }

  get activeArea(): Area | null {
    return this.areas.find((a) => a.id === this.activeAreaId) ?? null;
  }
  get activeProject(): (Project & { area_name?: string }) | null {
    return this.activeProjectObj;
  }
  get activeResource(): Resource | null {
    return this.activeResourceId ? this.resourceCache[this.activeResourceId] ?? null : null;
  }
  get activeContact(): Contact | null {
    return this.activeContactId ? this.contactCache[this.activeContactId] ?? null : null;
  }

  // Recurring (annual) occurrences of a date within [start, end).
  #occurrences(dateAt: number, recurring: boolean, start: number, end: number): number[] {
    const d = new Date(dateAt);
    if (!recurring) return dateAt >= start && dateAt < end ? [dateAt] : [];
    const out: number[] = [];
    const ys = new Date(start).getFullYear();
    const ye = new Date(end).getFullYear();
    for (let y = ys; y <= ye; y++) {
      const occ = new Date(y, d.getMonth(), d.getDate()).getTime();
      if (occ >= start && occ < end) out.push(occ);
    }
    return out;
  }

  async init() {
    await this.loadAreas();
    await this.loadCounts();
    await this.openDashboard();
    this.ready = true;
  }

  async loadCounts() {
    try { this.counts = await db.counts(); } catch (e) { this.#fail(e); }
  }

  async loadAreas() {
    try { this.areas = await db.listAreas(false); } catch (e) { this.#fail(e); }
  }
  async #loadProjects(areaId: string) {
    try { this.projectsByArea[areaId] = await db.listProjects(areaId, false); } catch (e) { this.#fail(e); }
  }

  /* ---- dashboard ---- */

  async openDashboard() {
    this.view = "dashboard";
    this.activeAreaId = null; this.activeProjectId = null; this.activeResourceId = null;
    this.loading = true;
    try {
      const [up, active, inbox, dates] = await Promise.all([
        db.upcoming(), db.activeProjects(), db.listInboxResources(), db.allContactDates(),
      ]);
      const [resources, archived, recent] = await Promise.all([
        db.listResources(false), db.recentArchived(6), db.recentlyEdited(6),
      ]);
      this.counts = await db.counts();
      const now = Date.now();
      const horizon = now + 45 * 86400000;
      const birthdays = dates.flatMap((d) => {
        const occ = this.#occurrences(d.date_at, d.recurring === 1, now - 86400000, horizon)[0];
        return occ
          ? [{ kind: "contactdate" as const, id: d.id, title: d.contact_name + " · " + d.label, due_at: occ, context: "", contactId: d.contact_id }]
          : [];
      });
      const upcoming = [...up, ...birthdays].sort((a, b) => a.due_at - b.due_at);
      this.dashboard = { upcoming, activeProjects: active, inbox, resources: resources.slice(0, 6), archived, recent };
    } catch (e) { this.#fail(e); } finally { this.loading = false; }
  }

  async quickCapture(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    const firstLine = trimmed.split("\n")[0];
    const title = firstLine.length > 80 ? "" : firstLine;
    const content = title ? trimmed.split("\n").slice(1).join("\n") : trimmed;
    try {
      const r = await db.createResource(title, content);
      this.dashboard.inbox = [r, ...this.dashboard.inbox];
      this.resourceCache[r.id] = r;
      void this.loadCounts();
    } catch (e) { this.#fail(e); }
  }

  /* ---- navigation ---- */

  async toggleArea(id: string) {
    this.expandedAreas[id] = !this.expandedAreas[id];
    if (this.expandedAreas[id] && !this.projectsByArea[id]) await this.#loadProjects(id);
  }

  async openArea(id: string) {
    this.view = "area";
    this.activeAreaId = id; this.activeProjectId = null; this.activeResourceId = null;
    if (!this.projectsByArea[id]) await this.#loadProjects(id);
    this.expandedAreas[id] = true;
    try {
      const [res, tasks] = await Promise.all([
        db.listResourcesForTarget("area", id), db.listAreaTasks(id),
      ]);
      this.contextResources = res; this.areaTasks = tasks;
    } catch (e) { this.#fail(e); }
  }

  // Browse: all areas (sidebar PARA → Areas), with their projects and tasks.
  async openAreasList() {
    this.view = "areas";
    this.activeAreaId = null; this.activeProjectId = null; this.activeResourceId = null;
    this.loading = true;
    try {
      const [areas, projects, tasks] = await Promise.all([
        db.listAreas(false), db.listProjectsAll(), db.allAreaTasks(),
      ]);
      this.areas = areas; this.allProjects = projects; this.areaTasksAll = tasks;
      await this.loadCounts();
    } catch (e) { this.#fail(e); } finally { this.loading = false; }
  }

  // Browse: all projects across areas (sidebar PARA → Projects), each with a preview.
  async openProjects() {
    this.view = "projects";
    this.activeProjectId = null; this.activeResourceId = null;
    this.loading = true;
    try {
      this.projectPreviews = await db.listProjectsWithPreview();
      this.allProjects = this.projectPreviews.map((p) => p.project);
      await this.loadCounts();
    } catch (e) { this.#fail(e); } finally { this.loading = false; }
  }

  // Toggle a task shown in a Projects-browse preview card.
  async toggleProjectPreviewTask(projectId: string, taskId: string) {
    const bundle = this.projectPreviews.find((b) => b.project.id === projectId);
    const t = bundle?.tasks.find((x) => x.id === taskId);
    if (!t) return;
    const status: TaskStatus = t.status === "done" ? "todo" : "done";
    t.status = status;
    if (status === "done") bundle!.taskCounts.done += 1; else bundle!.taskCounts.done -= 1;
    try {
      await db.updateTask(taskId, { status });
      if (status === "done") await db.logActivity(projectId, "task_completed", "Task completed", t.title || "Untitled");
    } catch (e) { this.#fail(e); }
  }

  async openSearch() {
    this.view = "search";
    this.activeResourceId = null;
    void this.loadCounts();
  }

  async doSearch(q: string) {
    this.searchQuery = q;
    const term = q.trim();
    if (term.length < 2) { this.searchHits = []; return; }
    try { this.searchHits = await db.search(term); } catch (e) { this.#fail(e); }
  }

  // Navigate to a search hit or a recently-edited item.
  async openHit(hit: { kind: string; id: string; areaId?: string; projectId?: string }) {
    if (hit.kind === "resource") await this.openResource(hit.id, "search");
    else if (hit.kind === "project" && hit.areaId) await this.openProject(hit.id, hit.areaId);
    else if (hit.kind === "task" && hit.projectId && hit.areaId) await this.openProject(hit.projectId, hit.areaId);
    else if (hit.kind === "area") await this.openArea(hit.id);
    else if (hit.kind === "contact") await this.openContact(hit.id, "search");
  }

  // Create a blank note from the dashboard and open it (returns to dashboard).
  async newNote() {
    try {
      const r = await db.createResource("", "");
      this.resourceCache[r.id] = r;
      void this.loadCounts();
      await this.openResource(r.id, "dashboard");
    } catch (e) { this.#fail(e); }
  }

  async openProject(id: string, areaId: string) {
    this.view = "project";
    this.activeAreaId = areaId; this.activeProjectId = id; this.activeResourceId = null;
    this.loading = true;
    void this.loadCounts();
    try {
      const [proj, tasks, res, people, activity] = await Promise.all([
        db.getProject(id), db.listTasks(id, false), db.listResourcesForTarget("project", id),
        db.listProjectContacts(id), db.listActivity(id),
      ]);
      this.activeProjectObj = proj;
      this.tasks = tasks; this.contextResources = res; this.projectContacts = people;
      this.projectActivity = activity;
    } catch (e) { this.#fail(e); } finally { this.loading = false; }
  }

  get projectProgress(): { done: number; total: number } {
    const total = this.tasks.length;
    const done = this.tasks.filter((t) => t.status === "done").length;
    return { done, total };
  }

  async openResources() {
    this.view = "resources";
    this.activeResourceId = null;
    this.loading = true;
    try {
      this.resourceRows = await db.listResourcesWithContext();
      await this.loadCounts();
    } catch (e) { this.#fail(e); } finally { this.loading = false; }
  }

  async openResource(id: string, from: View = this.view) {
    this.returnTo = from === "resource" ? this.returnTo : from;
    this.view = "resource";
    this.activeResourceId = id;
    void this.loadCounts();
    try {
      const [r, links] = await Promise.all([db.getResource(id), db.listLinks(id)]);
      if (r) this.resourceCache[id] = r;
      this.resourceLinks = links;
    } catch (e) { this.#fail(e); }
  }

  async backFromResource() {
    const to = this.returnTo;
    if (to === "project" && this.activeProjectId && this.activeAreaId)
      await this.openProject(this.activeProjectId, this.activeAreaId);
    else if (to === "area" && this.activeAreaId) await this.openArea(this.activeAreaId);
    else if (to === "resources") await this.openResources();
    else if (to === "search") await this.openSearch();
    else if (to === "contact" && this.activeContactId) await this.openContact(this.activeContactId, "contacts");
    else await this.openDashboard();
  }

  async openArchive() {
    this.view = "archive";
    this.activeResourceId = null;
    this.loading = true;
    try {
      const [resources, projects, areas] = await Promise.all([
        db.listResources(true), db.listArchivedProjects(), db.listAreas(true),
      ]);
      this.archive = { resources, projects, areas };
      await this.loadCounts();
    } catch (e) { this.#fail(e); } finally { this.loading = false; }
  }

  /* ---- areas ---- */

  async addArea() {
    try {
      const area = await db.createArea("New area");
      this.areas = [area, ...this.areas];
      await this.openArea(area.id);
    } catch (e) { this.#fail(e); }
  }
  async renameArea(id: string, name: string) {
    const a = this.areas.find((x) => x.id === id);
    if (a) { a.name = name; a.updated_at = Date.now(); }
    try { await db.updateArea(id, { name }); } catch (e) { this.#fail(e); }
  }
  async archiveArea(id: string) {
    try {
      await db.updateArea(id, { archived: 1 });
      this.areas = this.areas.filter((a) => a.id !== id);
      if (this.activeAreaId === id) await this.openDashboard();
    } catch (e) { this.#fail(e); }
  }
  async deleteArea(id: string) {
    try {
      await db.deleteArea(id);
      this.areas = this.areas.filter((a) => a.id !== id);
      delete this.projectsByArea[id];
      if (this.activeAreaId === id) await this.openDashboard();
    } catch (e) { this.#fail(e); }
  }

  /* ---- projects ---- */

  async addProject(areaId: string) {
    try {
      const p = await db.createProject(areaId, "New project");
      this.projectsByArea[areaId] = [p, ...(this.projectsByArea[areaId] ?? [])];
      this.expandedAreas[areaId] = true;
      await db.logActivity(p.id, "project_created", "Project created", "");
      void this.loadCounts();
      await this.openProject(p.id, areaId);
    } catch (e) { this.#fail(e); }
  }
  #patchProject(id: string, patch: Partial<Project>) {
    for (const list of Object.values(this.projectsByArea)) {
      const p = list.find((x) => x.id === id);
      if (p) Object.assign(p, patch);
    }
    const ap = this.allProjects.find((x) => x.id === id);
    if (ap) Object.assign(ap, patch);
    if (this.activeProjectObj && this.activeProjectObj.id === id) Object.assign(this.activeProjectObj, patch);
  }
  async renameProject(id: string, name: string) {
    this.#patchProject(id, { name, updated_at: Date.now() });
    try { await db.updateProject(id, { name }); } catch (e) { this.#fail(e); }
  }
  async setProjectStatus(id: string, status: ProjectStatus) {
    this.#patchProject(id, { status });
    const labels: Record<ProjectStatus, string> = { planned: "Planned", in_progress: "In Progress", ongoing: "Ongoing", done: "Done" };
    try {
      await db.updateProject(id, { status });
      await db.logActivity(id, "status_changed", "Status updated", labels[status]);
      if (this.activeProjectId === id) this.projectActivity = await db.listActivity(id);
    } catch (e) { this.#fail(e); }
  }
  async setProjectPriority(id: string, priority: ProjectPriority) {
    this.#patchProject(id, { priority });
    try {
      await db.updateProject(id, { priority });
      await db.logActivity(id, "priority_changed", "Priority updated", priority);
      if (this.activeProjectId === id) this.projectActivity = await db.listActivity(id);
    } catch (e) { this.#fail(e); }
  }
  setProjectDescription(id: string, description: string) {
    this.#patchProject(id, { description });
    if (this.#saveTimer) clearTimeout(this.#saveTimer);
    this.#saveTimer = setTimeout(() => { db.updateProject(id, { description }).catch((e) => this.#fail(e)); }, 350);
  }
  async setProjectDue(id: string, due_at: number | null) {
    this.#patchProject(id, { due_at });
    const detail = due_at != null ? new Date(due_at).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" }) : "cleared";
    try {
      await db.updateProject(id, { due_at });
      await db.logActivity(id, "deadline_updated", "Deadline updated", detail);
      if (this.activeProjectId === id) this.projectActivity = await db.listActivity(id);
    } catch (e) { this.#fail(e); }
  }
  async archiveProject(id: string) {
    const areaId = this.activeProject?.area_id ?? this.activeAreaId;
    try {
      await db.updateProject(id, { archived: 1 });
      if (areaId && this.projectsByArea[areaId])
        this.projectsByArea[areaId] = this.projectsByArea[areaId].filter((p) => p.id !== id);
      if (this.activeProjectId === id) areaId ? await this.openArea(areaId) : await this.openDashboard();
    } catch (e) { this.#fail(e); }
  }
  async deleteProject(id: string) {
    const areaId = this.activeProject?.area_id ?? this.activeAreaId;
    try {
      await db.deleteProject(id);
      if (areaId && this.projectsByArea[areaId])
        this.projectsByArea[areaId] = this.projectsByArea[areaId].filter((p) => p.id !== id);
      if (this.activeProjectId === id) areaId ? await this.openArea(areaId) : await this.openDashboard();
    } catch (e) { this.#fail(e); }
  }

  /* ---- tasks ---- */

  async addTask() {
    if (!this.activeProjectId) return;
    try { this.tasks = [...this.tasks, await db.createTask(this.activeProjectId, "")]; } catch (e) { this.#fail(e); }
  }
  #patchTask(id: string, patch: Partial<Task>) {
    const t = this.tasks.find((x) => x.id === id);
    if (t) Object.assign(t, patch);
  }
  async renameTask(id: string, title: string) {
    this.#patchTask(id, { title, updated_at: Date.now() });
    try { await db.updateTask(id, { title }); } catch (e) { this.#fail(e); }
  }
  async toggleTask(id: string) {
    const t = this.tasks.find((x) => x.id === id);
    if (!t) return;
    const status: TaskStatus = t.status === "done" ? "todo" : "done";
    this.#patchTask(id, { status });
    try {
      await db.updateTask(id, { status });
      if (status === "done" && this.activeProjectId) {
        await db.logActivity(this.activeProjectId, "task_completed", "Task completed", t.title || "Untitled");
        this.projectActivity = await db.listActivity(this.activeProjectId);
      }
    } catch (e) { this.#fail(e); }
  }
  async setTaskDue(id: string, due_at: number | null) {
    this.#patchTask(id, { due_at });
    try { await db.updateTask(id, { due_at }); } catch (e) { this.#fail(e); }
  }
  async deleteTask(id: string) {
    try { await db.deleteTask(id); this.tasks = this.tasks.filter((t) => t.id !== id); } catch (e) { this.#fail(e); }
  }

  // Add a task to a specific project (used by the Areas overview), then refresh.
  async addTaskToProject(projectId: string) {
    try {
      await db.createTask(projectId, "New task");
      this.areaTasksAll = await db.allAreaTasks();
      void this.loadCounts();
    } catch (e) { this.#fail(e); }
  }
  // Toggle a task from the Areas overview list.
  async toggleAreaTask(id: string) {
    const t = this.areaTasksAll.find((x) => x.id === id);
    if (!t) return;
    const status: TaskStatus = t.status === "done" ? "todo" : "done";
    t.status = status;
    try {
      await db.updateTask(id, { status });
      if (status === "done") await db.logActivity(t.project_id, "task_completed", "Task completed", t.title || "Untitled");
    } catch (e) { this.#fail(e); }
  }

  /* ---- resources ---- */

  // Create a resource already linked to the current project/area, and open it.
  async addResourceHere() {
    let type: LinkTargetType | null = null;
    let targetId: string | null = null;
    if (this.view === "project" && this.activeProjectId) { type = "project"; targetId = this.activeProjectId; }
    else if (this.view === "area" && this.activeAreaId) { type = "area"; targetId = this.activeAreaId; }
    try {
      const r = await db.createResource("", "");
      this.resourceCache[r.id] = r;
      if (type && targetId) await db.addLink(r.id, type, targetId);
      if (type === "project" && targetId) await db.logActivity(targetId, "note_added", "Note added", "");
      void this.loadCounts();
      await this.openResource(r.id, this.view);
    } catch (e) { this.#fail(e); }
  }

  // Create a blank resource from the library.
  async addResource() {
    try {
      const r = await db.createResource("", "");
      this.resourceCache[r.id] = r;
      this.library = [r, ...this.library];
      await this.openResource(r.id, "resources");
    } catch (e) { this.#fail(e); }
  }

  updateResource(patch: Partial<Pick<Resource, "title" | "content">>) {
    const r = this.activeResource;
    if (!r) return;
    Object.assign(r, patch);
    r.updated_at = Date.now();
    const id = r.id;
    if (this.#saveTimer) clearTimeout(this.#saveTimer);
    this.#saveTimer = setTimeout(() => { db.updateResource(id, patch).catch((e) => this.#fail(e)); }, 350);
  }

  async loadPickers() {
    try {
      const [projects, tasks, contacts] = await Promise.all([
        db.listAllProjects(), db.listAllTasks(), db.listAllContacts(),
      ]);
      this.pickProjects = projects; this.pickTasks = tasks; this.pickContacts = contacts;
    } catch (e) { this.#fail(e); }
  }

  async addLink(type: LinkTargetType, targetId: string) {
    const r = this.activeResource;
    if (!r) return;
    try {
      await db.addLink(r.id, type, targetId);
      this.resourceLinks = await db.listLinks(r.id);
    } catch (e) { this.#fail(e); }
  }
  async removeLink(linkId: string) {
    const r = this.activeResource;
    if (!r) return;
    try {
      await db.removeLink(linkId);
      this.resourceLinks = await db.listLinks(r.id);
    } catch (e) { this.#fail(e); }
  }

  async archiveResource() {
    const r = this.activeResource;
    if (!r) return;
    try { await db.updateResource(r.id, { archived: 1 }); await this.backFromResource(); } catch (e) { this.#fail(e); }
  }
  async unarchiveResource(id: string) {
    try {
      await db.updateResource(id, { archived: 0 });
      this.archive.resources = this.archive.resources.filter((x) => x.id !== id);
      void this.loadCounts();
    } catch (e) { this.#fail(e); }
  }
  async deleteResource() {
    const r = this.activeResource;
    if (!r) return;
    try { await db.deleteResource(r.id); await this.backFromResource(); } catch (e) { this.#fail(e); }
  }

  /* ---- archive restore ---- */
  async unarchiveProject(id: string) {
    try {
      await db.updateProject(id, { archived: 0 });
      this.archive.projects = this.archive.projects.filter((p) => p.id !== id);
      void this.loadCounts();
    } catch (e) { this.#fail(e); }
  }
  async unarchiveArea(id: string) {
    try {
      await db.updateArea(id, { archived: 0 });
      this.archive.areas = this.archive.areas.filter((a) => a.id !== id);
      await this.loadAreas();
      void this.loadCounts();
    } catch (e) { this.#fail(e); }
  }

  /* ---- calendar ---- */

  // The [start, end) range covering the visible period, snapped to whole days.
  #calRange(): { start: number; end: number } {
    const a = new Date(this.calAnchor);
    if (this.calMode === "month") {
      const first = new Date(a.getFullYear(), a.getMonth(), 1);
      // Grid starts on the Monday on/before the 1st.
      const startDow = (first.getDay() + 6) % 7;
      const start = new Date(first.getFullYear(), first.getMonth(), 1 - startDow);
      const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 42);
      return { start: start.getTime(), end: end.getTime() };
    }
    if (this.calMode === "week") {
      const dow = (a.getDay() + 6) % 7;
      const start = new Date(a.getFullYear(), a.getMonth(), a.getDate() - dow);
      const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 7);
      return { start: start.getTime(), end: end.getTime() };
    }
    // agenda: from today, 60 days ahead
    const start = new Date(a.getFullYear(), a.getMonth(), a.getDate());
    const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 60);
    return { start: start.getTime(), end: end.getTime() };
  }

  async openCalendar() {
    this.view = "calendar";
    this.activeResourceId = null;
    await this.loadCalendar();
  }

  async loadCalendar() {
    this.loading = true;
    try {
      const { start, end } = this.#calRange();
      const base = await db.calendarItems(start, end);
      const dates = await db.allContactDates();
      const birthdays: CalItem[] = [];
      for (const d of dates) {
        for (const occ of this.#occurrences(d.date_at, d.recurring === 1, start, end)) {
          birthdays.push({
            kind: "contactdate", id: d.id, title: d.contact_name + " · " + d.label,
            at: occ, context: "", contactId: d.contact_id,
          });
        }
      }
      this.calItems = [...base, ...birthdays].sort((a, b) => a.at - b.at);
    } catch (e) { this.#fail(e); } finally { this.loading = false; }
  }

  async setCalMode(mode: CalMode) {
    this.calMode = mode;
    await this.loadCalendar();
  }

  async calStep(dir: -1 | 1) {
    const a = new Date(this.calAnchor);
    if (this.calMode === "month") a.setMonth(a.getMonth() + dir);
    else if (this.calMode === "week") a.setDate(a.getDate() + dir * 7);
    else a.setDate(a.getDate() + dir * 30);
    this.calAnchor = a.getTime();
    await this.loadCalendar();
  }

  async calToday() {
    this.calAnchor = Date.now();
    await this.loadCalendar();
  }

  // Click a calendar item: open the underlying entity, or edit the event.
  async openCalItem(item: CalItem) {
    if (item.kind === "project" && item.areaId) await this.openProject(item.id, item.areaId);
    else if (item.kind === "task" && item.areaId) await this.openArea(item.areaId);
    else if (item.kind === "event") await this.editEvent(item.id);
    else if (item.kind === "contactdate" && item.contactId) await this.openContact(item.contactId, "calendar");
  }

  async newEvent(dayStart: number) {
    try {
      const ev = await db.createEvent(dayStart, "");
      this.activeEvent = ev;
      await this.loadCalendar();
    } catch (e) { this.#fail(e); }
  }

  async editEvent(id: string) {
    try {
      const ev = await db.getEvent(id);
      if (ev) this.activeEvent = ev;
    } catch (e) { this.#fail(e); }
  }

  closeEvent() { this.activeEvent = null; }

  async saveEvent(patch: Partial<Pick<CalEvent, "title" | "start_at" | "notes">>) {
    const ev = this.activeEvent;
    if (!ev) return;
    Object.assign(ev, patch);
    try {
      await db.updateEvent(ev.id, patch);
      await this.loadCalendar();
    } catch (e) { this.#fail(e); }
  }

  async deleteEvent() {
    const ev = this.activeEvent;
    if (!ev) return;
    try {
      await db.deleteEvent(ev.id);
      this.activeEvent = null;
      await this.loadCalendar();
    } catch (e) { this.#fail(e); }
  }

  /* ---- CRM: contacts ---- */

  async openContacts() {
    this.view = "contacts";
    this.activeContactId = null;
    this.loading = true;
    try { this.contacts = await db.listContacts(false); } catch (e) { this.#fail(e); } finally { this.loading = false; }
  }

  async openContact(id: string, from: View = this.view) {
    this.contactReturnTo = from === "contact" ? this.contactReturnTo : from;
    this.view = "contact";
    this.activeContactId = id;
    try {
      const [c, dates, projects, notes] = await Promise.all([
        db.getContact(id), db.listContactDates(id), db.listContactProjects(id), db.listResourcesForTarget("contact", id),
      ]);
      if (c) this.contactCache[id] = c;
      this.contactDates = dates;
      this.contactProjects = projects;
      this.contactNotes = notes;
    } catch (e) { this.#fail(e); }
  }

  async backFromContact() {
    const to = this.contactReturnTo;
    if (to === "calendar") await this.openCalendar();
    else await this.openContacts();
  }

  async addContact() {
    try {
      const c = await db.createContact("");
      this.contactCache[c.id] = c;
      this.contacts = [c, ...this.contacts];
      await this.openContact(c.id, "contacts");
    } catch (e) { this.#fail(e); }
  }

  updateContact(patch: Partial<Pick<Contact, "name" | "notes">>) {
    const c = this.activeContact;
    if (!c) return;
    Object.assign(c, patch);
    c.updated_at = Date.now();
    const id = c.id;
    if (this.#saveTimer) clearTimeout(this.#saveTimer);
    this.#saveTimer = setTimeout(() => { db.updateContact(id, patch).catch((e) => this.#fail(e)); }, 350);
  }

  async archiveContact() {
    const c = this.activeContact;
    if (!c) return;
    try { await db.updateContact(c.id, { archived: 1 }); await this.backFromContact(); } catch (e) { this.#fail(e); }
  }
  async deleteContact() {
    const c = this.activeContact;
    if (!c) return;
    try { await db.deleteContact(c.id); await this.backFromContact(); } catch (e) { this.#fail(e); }
  }

  async addContactDate(label: string, dateAt: number) {
    const c = this.activeContact;
    if (!c) return;
    try {
      const cd = await db.addContactDate(c.id, label || "Date", dateAt);
      this.contactDates = [...this.contactDates, cd];
    } catch (e) { this.#fail(e); }
  }
  async updateContactDate(id: string, patch: { label?: string; date_at?: number }) {
    const cd = this.contactDates.find((x) => x.id === id);
    if (cd) Object.assign(cd, patch);
    try { await db.updateContactDate(id, patch); } catch (e) { this.#fail(e); }
  }
  async deleteContactDate(id: string) {
    try { await db.deleteContactDate(id); this.contactDates = this.contactDates.filter((d) => d.id !== id); } catch (e) { this.#fail(e); }
  }

  async addContactProject(projectId: string) {
    const c = this.activeContact;
    if (!c || !projectId) return;
    try {
      await db.addContactProject(c.id, projectId);
      this.contactProjects = await db.listContactProjects(c.id);
    } catch (e) { this.#fail(e); }
  }
  async removeContactProject(linkId: string) {
    const c = this.activeContact;
    if (!c) return;
    try {
      await db.removeContactProject(linkId);
      this.contactProjects = await db.listContactProjects(c.id);
    } catch (e) { this.#fail(e); }
  }
}

export const store = new DanoStore();
