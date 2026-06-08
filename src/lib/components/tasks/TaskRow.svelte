<script lang="ts">
  import { tasks as taskDb, archiveEntity, restoreEntity } from "$lib/db";
  import { toasts } from "$lib/stores/toast.svelte";
  import { dueLabel, isOverdue, msToDateInput, dateInputToMs } from "$lib/date";
  import type { Task, TaskPriority } from "$lib/types";

  interface Props {
    task: Task;
    projectName?: string | null;
    reload: () => void;
  }
  let { task, projectName = null, reload }: Props = $props();

  let editing = $state(false);
  let draftTitle = $state(""); // populated when entering edit mode

  const prioColor: Record<TaskPriority, string> = {
    p1: "bg-red-500/80",
    p2: "bg-amber-500/80",
    p3: "bg-accent/60",
    p4: "bg-fg/25",
  };
  const nextPrio: Record<TaskPriority, TaskPriority> = { p1: "p2", p2: "p3", p3: "p4", p4: "p1" };

  async function toggleDone() {
    await taskDb.setStatus(task.id, task.status === "done" ? "todo" : "done");
    reload();
  }
  async function cyclePriority() {
    await taskDb.update(task.id, { priority: nextPrio[task.priority] });
    reload();
  }
  async function setStatus(e: Event) {
    await taskDb.setStatus(task.id, (e.currentTarget as HTMLSelectElement).value as Task["status"]);
    reload();
  }
  async function setDue(e: Event) {
    await taskDb.update(task.id, { due_at: dateInputToMs((e.currentTarget as HTMLInputElement).value) });
    reload();
  }
  async function setDueQuick(deltaDays: number | null) {
    let due_at: number | null = null;
    if (deltaDays != null) {
      const d = new Date();
      d.setDate(d.getDate() + deltaDays);
      d.setHours(23, 59, 59, 999);
      due_at = d.getTime();
    }
    await taskDb.update(task.id, { due_at });
    reload();
  }
  async function commitTitle() {
    editing = false;
    const t = draftTitle.trim();
    if (t && t !== task.title) {
      await taskDb.update(task.id, { title: t });
      reload();
    } else {
      draftTitle = task.title;
    }
  }
  async function remove() {
    await archiveEntity("task", task.id);
    reload();
    toasts.show("Task archived", {
      action: { label: "Undo", run: async () => { await restoreEntity("task", task.id); reload(); } },
    });
  }
</script>

<div
  class="group flex items-center gap-3 rounded-lg border border-fg/5 bg-fg/[0.02] px-3 py-2 hover:border-fg/10"
>
  <input
    type="checkbox"
    checked={task.status === "done"}
    onchange={toggleDone}
    class="h-4 w-4 shrink-0 cursor-pointer accent-accent"
  />

  <button
    type="button"
    onclick={cyclePriority}
    title="Priority {task.priority}"
    class="h-2.5 w-2.5 shrink-0 rounded-full {prioColor[task.priority]}"
    aria-label="Cycle priority"
  ></button>

  <div class="min-w-0 flex-1">
    {#if editing}
      <!-- svelte-ignore a11y_autofocus -->
      <input
        bind:value={draftTitle}
        onblur={commitTitle}
        onkeydown={(e) => e.key === "Enter" && commitTitle()}
        autofocus
        class="w-full rounded bg-fg/10 px-1 py-0.5 text-sm outline-none"
      />
    {:else}
      <button
        type="button"
        ondblclick={() => ((editing = true), (draftTitle = task.title))}
        class="block w-full truncate text-left text-sm {task.status === 'done'
          ? 'text-fg/35 line-through'
          : 'text-fg/90'}"
      >
        {task.title}
      </button>
    {/if}
  </div>

  {#if projectName}
    <span class="shrink-0 rounded bg-fg/5 px-1.5 py-0.5 text-[10px] text-fg/40">{projectName}</span>
  {/if}

  {#if task.due_at != null}
    <span
      class="shrink-0 text-[11px] {isOverdue(task.due_at) && task.status !== 'done'
        ? 'text-red-400'
        : 'text-fg/40'}"
    >
      {dueLabel(task.due_at)}
    </span>
  {/if}

  <!-- Controls revealed on hover, keyboard-reachable -->
  <div class="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
    <button type="button" onclick={() => setDueQuick(0)} class="rounded bg-fg/5 px-1.5 py-0.5 text-[10px] text-fg/55 hover:bg-fg/10 hover:text-fg/80">Today</button>
    <button type="button" onclick={() => setDueQuick(1)} class="rounded bg-fg/5 px-1.5 py-0.5 text-[10px] text-fg/55 hover:bg-fg/10 hover:text-fg/80">Tom</button>
    {#if task.due_at != null}
      <button type="button" onclick={() => setDueQuick(null)} aria-label="Clear due date" class="rounded bg-fg/5 px-1.5 py-0.5 text-[10px] text-fg/55 hover:bg-fg/10 hover:text-fg/80">✕</button>
    {/if}
    <input
      type="date"
      value={msToDateInput(task.due_at)}
      onchange={setDue}
      class="rounded bg-fg/5 px-1 py-0.5 text-[11px] text-fg/60 [color-scheme:dark]"
    />
    <select
      value={task.status}
      onchange={setStatus}
      class="rounded bg-fg/5 px-1 py-0.5 text-[11px] text-fg/60"
    >
      <option value="todo">Todo</option>
      <option value="doing">Doing</option>
      <option value="waiting">Waiting</option>
      <option value="done">Done</option>
    </select>
    <button
      type="button"
      onclick={remove}
      class="rounded px-1.5 py-0.5 text-[11px] text-fg/40 hover:bg-red-500/20 hover:text-red-300"
      aria-label="Delete task"
    >
      ✕
    </button>
  </div>
</div>
