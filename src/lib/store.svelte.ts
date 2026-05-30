// DANO reactive store (Svelte 5 runes) — PARA + Resources (Phase B).

import type {
  Area, LinkTargetType, Project, ProjectStatus, Resource, Task, TaskStatus,
} from "./types";
import * as db from "./db";
import type { DetailedLink } from "./db";

type View = "dashboard" | "area" | "project" | "resources" | "resource" | "archive";

class DanoStore {
  view = $state<View>("dashboard");

  areas = $state<Area[]>([]);
  expandedAreas = $state<Record<string, boolean>>({});
  projectsByArea = $state<Record<string, Project[]>>({});

  activeAreaId = $state<string | null>(null);
  activeProjectId = $state<string | null>(null);
  tasks = $state<Task[]>([]);

  // Resources linked to the open project / area.
  contextResources = $state<Resource[]>([]);

  // Dashboard
  dashboard = $state<{
    upcoming: Awaited<ReturnType<typeof db.upcoming>>;
    activeProjects: Awaited<ReturnType<typeof db.activeProjects>>;
    inbox: Resource[];
  }>({ upcoming: [], activeProjects: [], inbox: [] });

  // Resources library + open resource
  library = $state<Resource[]>([]);
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

  #saveTimer: ReturnType<typeof setTimeout> | null = null;

  #fail(e: unknown) { this.error = e instanceof Error ? e.message : String(e); }

  get activeArea(): Area | null {
    return this.areas.find((a) => a.id === this.activeAreaId) ?? null;
  }
  get activeProject(): Project | null {
    if (!this.activeProjectId) return null;
    for (const list of Object.values(this.projectsByArea)) {
      const p = list.find((x) => x.id === this.activeProjectId);
      if (p) return p;
    }
    return null;
  }
  get activeResource(): Resource | null {
    return this.activeResourceId ? this.resourceCache[this.activeResourceId] ?? null : null;
  }

  async init() {
    await this.loadAreas();
    await this.openDashboard();
    this.ready = true;
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
      const [up, active, inbox] = await Promise.all([db.upcoming(), db.activeProjects(), db.listInboxResources()]);
      this.dashboard = { upcoming: up, activeProjects: active, inbox };
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
    try { this.contextResources = await db.listResourcesForTarget("area", id); } catch (e) { this.#fail(e); }
  }

  async openProject(id: string, areaId: string) {
    this.view = "project";
    this.activeAreaId = areaId; this.activeProjectId = id; this.activeResourceId = null;
    this.loading = true;
    try {
      const [tasks, res] = await Promise.all([db.listTasks(id, false), db.listResourcesForTarget("project", id)]);
      this.tasks = tasks; this.contextResources = res;
    } catch (e) { this.#fail(e); } finally { this.loading = false; }
  }

  async openResources() {
    this.view = "resources";
    this.activeResourceId = null;
    this.loading = true;
    try { this.library = await db.listResources(false); } catch (e) { this.#fail(e); } finally { this.loading = false; }
  }

  async openResource(id: string, from: View = this.view) {
    this.returnTo = from === "resource" ? this.returnTo : from;
    this.view = "resource";
    this.activeResourceId = id;
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
      await this.openProject(p.id, areaId);
    } catch (e) { this.#fail(e); }
  }
  #patchProject(id: string, patch: Partial<Project>) {
    for (const list of Object.values(this.projectsByArea)) {
      const p = list.find((x) => x.id === id);
      if (p) Object.assign(p, patch);
    }
  }
  async renameProject(id: string, name: string) {
    this.#patchProject(id, { name, updated_at: Date.now() });
    try { await db.updateProject(id, { name }); } catch (e) { this.#fail(e); }
  }
  async setProjectStatus(id: string, status: ProjectStatus) {
    this.#patchProject(id, { status });
    try { await db.updateProject(id, { status }); } catch (e) { this.#fail(e); }
  }
  async setProjectDue(id: string, due_at: number | null) {
    this.#patchProject(id, { due_at });
    try { await db.updateProject(id, { due_at }); } catch (e) { this.#fail(e); }
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
    try { await db.updateTask(id, { status }); } catch (e) { this.#fail(e); }
  }
  async setTaskDue(id: string, due_at: number | null) {
    this.#patchTask(id, { due_at });
    try { await db.updateTask(id, { due_at }); } catch (e) { this.#fail(e); }
  }
  async deleteTask(id: string) {
    try { await db.deleteTask(id); this.tasks = this.tasks.filter((t) => t.id !== id); } catch (e) { this.#fail(e); }
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
      const [projects, tasks] = await Promise.all([db.listAllProjects(), db.listAllTasks()]);
      this.pickProjects = projects; this.pickTasks = tasks;
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
    } catch (e) { this.#fail(e); }
  }
  async unarchiveArea(id: string) {
    try {
      await db.updateArea(id, { archived: 0 });
      this.archive.areas = this.archive.areas.filter((a) => a.id !== id);
      await this.loadAreas();
    } catch (e) { this.#fail(e); }
  }
}

export const store = new DanoStore();
