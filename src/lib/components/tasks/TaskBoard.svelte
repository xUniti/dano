<script lang="ts">
  import { tasks as taskDb } from "$lib/db";
  import { dueLabel, isOverdue } from "$lib/date";
  import type { Task, TaskStatus, TaskPriority } from "$lib/types";

  interface Props {
    items: Task[];
    reload: () => void;
  }
  let { items, reload }: Props = $props();

  const columns: { status: TaskStatus; label: string }[] = [
    { status: "todo", label: "Todo" },
    { status: "doing", label: "Doing" },
    { status: "waiting", label: "Waiting" },
    { status: "done", label: "Done" },
  ];

  const prioColor: Record<TaskPriority, string> = {
    p1: "bg-red-500/80",
    p2: "bg-amber-500/80",
    p3: "bg-accent/60",
    p4: "bg-fg/25",
  };

  let dragId = $state<string | null>(null);
  let overCol = $state<TaskStatus | null>(null);

  function byStatus(s: TaskStatus): Task[] {
    return items.filter((t) => t.status === s);
  }

  async function drop(status: TaskStatus) {
    overCol = null;
    const id = dragId;
    dragId = null;
    if (!id) return;
    const task = items.find((t) => t.id === id);
    if (!task || task.status === status) return;
    await taskDb.setStatus(id, status);
    reload();
  }
</script>

<div class="grid grid-cols-1 gap-3 p-6 sm:grid-cols-2 lg:grid-cols-4">
  {#each columns as col (col.status)}
    <div
      role="list"
      ondragover={(e) => (e.preventDefault(), (overCol = col.status))}
      ondragleave={() => (overCol === col.status ? (overCol = null) : null)}
      ondrop={() => drop(col.status)}
      class="flex min-h-32 flex-col gap-2 rounded-xl border p-2 transition-colors
        {overCol === col.status ? 'border-accent/50 bg-accent/5' : 'border-fg/10 bg-fg/[0.02]'}"
    >
      <div class="flex items-center justify-between px-1 py-0.5">
        <span class="text-xs font-medium text-fg/70">{col.label}</span>
        <span class="text-[10px] text-fg/30">{byStatus(col.status).length}</span>
      </div>

      {#each byStatus(col.status) as task (task.id)}
        <div
          role="listitem"
          draggable="true"
          ondragstart={() => (dragId = task.id)}
          ondragend={() => ((dragId = null), (overCol = null))}
          class="cursor-grab rounded-lg border border-fg/5 bg-surface p-2.5 active:cursor-grabbing"
        >
          <div class="flex items-start gap-2">
            <span class="mt-1 h-2 w-2 shrink-0 rounded-full {prioColor[task.priority]}"></span>
            <span class="text-sm {task.status === 'done' ? 'text-fg/40 line-through' : 'text-fg/90'}"
              >{task.title}</span
            >
          </div>
          {#if task.due_at != null}
            <div
              class="mt-1.5 pl-4 text-[11px] {isOverdue(task.due_at) && task.status !== 'done'
                ? 'text-red-400'
                : 'text-fg/40'}"
            >
              {dueLabel(task.due_at)}
            </div>
          {/if}
        </div>
      {/each}
    </div>
  {/each}
</div>
