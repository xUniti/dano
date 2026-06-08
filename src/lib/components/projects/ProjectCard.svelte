<script lang="ts" module>
  import type { ProjectStatus } from "$lib/types";

  export const statusPill: Record<ProjectStatus, string> = {
    active: "bg-sky-500/15 text-sky-300",
    planned: "bg-amber-500/15 text-amber-300",
    completed: "bg-emerald-500/15 text-emerald-300",
    archived: "bg-white/10 text-white/40",
  };
</script>

<script lang="ts">
  import { dueLabel, isOverdue } from "$lib/date";
  import type { Project } from "$lib/types";

  interface Props {
    project: Project;
  }
  let { project }: Props = $props();
</script>

<a
  href="/projects/{project.id}"
  class="group block rounded-xl border border-white/10 bg-white/[0.03] p-4 transition-all hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.05]"
>
  <div class="flex items-start justify-between gap-3">
    <h3 class="truncate text-sm font-medium text-white/90 group-hover:text-white">{project.name}</h3>
    <span class="shrink-0 rounded px-1.5 py-0.5 text-[10px] capitalize {statusPill[project.status]}"
      >{project.status}</span
    >
  </div>

  {#if project.description}
    <p class="mt-1 line-clamp-2 text-xs text-white/40">{project.description}</p>
  {/if}

  <!-- Progress -->
  <div class="mt-3 flex items-center gap-2">
    <div class="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
      <div class="h-full rounded-full bg-sky-400/80 transition-all" style="width: {project.progress}%"></div>
    </div>
    <span class="text-[10px] tabular-nums text-white/40">{project.progress}%</span>
  </div>

  {#if project.due_at != null}
    <div class="mt-2 text-[11px] {isOverdue(project.due_at) ? 'text-red-400' : 'text-white/40'}">
      Due {dueLabel(project.due_at)}
    </div>
  {/if}
</a>
