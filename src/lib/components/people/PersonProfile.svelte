<script lang="ts">
  import { people as peopleDb, peopleDates as datesDb, entityLabel, archiveEntity, restoreEntity } from "$lib/db";
  import { toasts } from "$lib/stores/toast.svelte";
  import { linksFor } from "$lib/graph";
  import { fullName, initials, strength, daysSinceInteraction, daysUntilBirthday, isFollowUpDue } from "$lib/people";
  import { dueLabel } from "$lib/date";
  import type { Person, PersonDate, EntityType } from "$lib/types";

  interface Props {
    personId: string;
    onChange: () => void;
  }
  let { personId, onChange }: Props = $props();

  let person = $state<Person | null>(null);
  let dates = $state<PersonDate[]>([]);
  let timeline = $state<{ type: EntityType; id: string; label: string; relation: string; at: number; href?: string }[]>([]);
  let linkCount = $state(0);

  // new important date
  let dLabel = $state("");
  let dDate = $state("");

  async function load() {
    const p = await peopleDb.get(personId);
    if (!p) return;
    person = p;
    dates = await datesDb.forPerson(personId);
    const links = await linksFor({ type: "person", id: personId });
    linkCount = links.length;
    timeline = await Promise.all(
      links.map(async (l) => {
        const isSource = l.source_type === "person" && l.source_id === personId;
        const otherType = (isSource ? l.target_type : l.source_type) as EntityType;
        const otherId = isSource ? l.target_id : l.source_id;
        const label = await entityLabel(otherType, otherId);
        return {
          type: otherType,
          id: otherId,
          label,
          relation: l.relation_type,
          at: l.created_at,
          href: otherType === "project" ? `/projects/${otherId}` : undefined,
        };
      }),
    );
  }

  $effect(() => {
    personId;
    load();
  });

  const str = $derived(person ? strength(person, linkCount) : null);
  const strColor: Record<string, string> = {
    Strong: "bg-emerald-500/15 text-emerald-300",
    Warm: "bg-accent/15 text-accent",
    Cooling: "bg-amber-500/15 text-amber-300",
    Cold: "bg-fg/10 text-fg/45",
  };

  async function save(patch: Partial<Person>) {
    if (!person) return;
    await peopleDb.update(person.id, patch);
    await load();
    onChange();
  }

  async function addDate() {
    if (!dLabel.trim() || !dDate) return;
    await datesDb.create(personId, dLabel.trim(), dDate, true);
    dLabel = "";
    dDate = "";
    await load();
  }
  async function removeDate(id: string) {
    await datesDb.remove(id);
    await load();
  }

  async function del() {
    if (!person) return;
    const pid = person.id;
    await archiveEntity("person", pid);
    onChange();
    toasts.show("Person archived", {
      action: { label: "Undo", run: async () => { await restoreEntity("person", pid); onChange(); } },
    });
  }

  function fmtDate(ms: number): string {
    return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(ms);
  }
</script>

{#if person}
  <div class="h-full overflow-y-auto">
    <!-- Header -->
    <div class="flex items-center gap-4 border-b border-fg/10 px-6 py-5">
      <div class="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-accent/30 to-indigo-500/20 text-lg font-semibold text-fg">
        {initials(person)}
      </div>
      <div class="min-w-0 flex-1">
        <div class="flex gap-2">
          <input
            value={person.first_name}
            onblur={(e) => save({ first_name: (e.currentTarget as HTMLInputElement).value })}
            placeholder="First"
            class="w-32 bg-transparent text-lg font-semibold outline-none placeholder:text-fg/30"
          />
          <input
            value={person.last_name}
            onblur={(e) => save({ last_name: (e.currentTarget as HTMLInputElement).value })}
            placeholder="Last"
            class="w-32 bg-transparent text-lg font-semibold outline-none placeholder:text-fg/30"
          />
        </div>
        {#if str}
          <div class="mt-1 flex items-center gap-2">
            <span class="rounded px-1.5 py-0.5 text-[10px] {strColor[str.label]}">{str.label} · {str.score}</span>
            {#if isFollowUpDue(person)}
              <span class="rounded bg-red-500/15 px-1.5 py-0.5 text-[10px] text-red-300">Follow up</span>
            {/if}
            <span class="text-[11px] text-fg/35">
              {#if daysSinceInteraction(person) == null}Never contacted{:else}Last touch {daysSinceInteraction(person)}d ago{/if}
            </span>
          </div>
        {/if}
      </div>
      <button type="button" onclick={del} class="self-start rounded-md px-2 py-1 text-xs text-fg/40 hover:bg-amber-500/15 hover:text-amber-300">Archive</button>
    </div>

    <div class="grid gap-6 p-6 lg:grid-cols-2">
      <!-- Details -->
      <div class="space-y-4">
        <div class="grid grid-cols-2 gap-3">
          <label class="block"><span class="mb-1 block text-xs text-fg/45">Email</span>
            <input type="email" inputmode="email" autocomplete="email" placeholder="name@example.com" value={person.email} onblur={(e) => save({ email: (e.currentTarget as HTMLInputElement).value })}
              class="w-full rounded-lg border border-fg/10 bg-fg/[0.03] px-2.5 py-1.5 text-sm outline-none focus:border-fg/30 placeholder:text-fg/25 invalid:border-red-400/40" /></label>
          <label class="block"><span class="mb-1 block text-xs text-fg/45">Phone</span>
            <input type="tel" inputmode="tel" autocomplete="tel" placeholder="+1 555 000 0000" value={person.phone} onblur={(e) => save({ phone: (e.currentTarget as HTMLInputElement).value })}
              class="w-full rounded-lg border border-fg/10 bg-fg/[0.03] px-2.5 py-1.5 text-sm outline-none focus:border-fg/30 placeholder:text-fg/25" /></label>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <label class="block"><span class="mb-1 block text-xs text-fg/45">Birthday</span>
            <input type="date" value={person.birthday ?? ""} onchange={(e) => save({ birthday: (e.currentTarget as HTMLInputElement).value || null })}
              class="w-full rounded-lg border border-fg/10 bg-fg/[0.03] px-2.5 py-1.5 text-sm outline-none [color-scheme:dark] focus:border-fg/30" />
            {#if daysUntilBirthday(person.birthday) != null}
              <span class="mt-1 block text-[11px] text-fg/40">in {daysUntilBirthday(person.birthday)}d</span>
            {/if}
          </label>
          <label class="block"><span class="mb-1 block text-xs text-fg/45">Tags</span>
            <input value={person.relationship_tags} onblur={(e) => save({ relationship_tags: (e.currentTarget as HTMLInputElement).value })}
              placeholder="friend, work…"
              class="w-full rounded-lg border border-fg/10 bg-fg/[0.03] px-2.5 py-1.5 text-sm outline-none placeholder:text-fg/25 focus:border-fg/30" /></label>
        </div>
        <label class="block"><span class="mb-1 block text-xs text-fg/45">Notes</span>
          <textarea value={person.notes} onblur={(e) => save({ notes: (e.currentTarget as HTMLTextAreaElement).value })} rows="3"
            class="w-full resize-y rounded-lg border border-fg/10 bg-fg/[0.03] px-2.5 py-1.5 text-sm outline-none focus:border-fg/30"></textarea></label>

        <!-- Important dates -->
        <div>
          <div class="mb-1.5 text-xs text-fg/45">Important dates</div>
          <div class="space-y-1">
            {#each dates as d (d.id)}
              <div class="flex items-center gap-2 text-sm">
                <span class="text-fg/80">{d.label}</span>
                <span class="text-fg/40">{d.date}</span>
                <button type="button" onclick={() => removeDate(d.id)} class="ml-auto text-[11px] text-fg/30 hover:text-red-300">✕</button>
              </div>
            {/each}
          </div>
          <div class="mt-2 flex gap-2">
            <input bind:value={dLabel} placeholder="Label (Anniversary…)" class="flex-1 rounded-md border border-fg/10 bg-fg/[0.03] px-2 py-1 text-xs outline-none placeholder:text-fg/25" />
            <input type="date" bind:value={dDate} class="rounded-md border border-fg/10 bg-fg/[0.03] px-2 py-1 text-xs outline-none [color-scheme:dark]" />
            <button type="button" onclick={addDate} class="rounded-md bg-fg/10 px-2 py-1 text-xs hover:bg-fg/15">Add</button>
          </div>
        </div>
      </div>

      <!-- Timeline -->
      <div>
        <div class="mb-2 text-xs uppercase tracking-wide text-fg/35">Relationship timeline</div>
        {#if timeline.length === 0}
          <p class="text-sm text-fg/30">No connections yet. Mention this person in a note (@name) or link them elsewhere.</p>
        {:else}
          <ol class="relative space-y-3 border-l border-fg/10 pl-4">
            {#each timeline as e (e.type + e.id + e.at)}
              <li class="relative">
                <span class="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-accent/70"></span>
                <div class="text-sm text-fg/85">
                  <span class="text-fg/40">{e.relation.replace("_", " ")}</span>
                  {#if e.href}<a href={e.href} class="text-accent hover:underline">{e.label}</a>{:else}<span class="text-fg/40">{e.type}:</span> {e.label}{/if}
                </div>
                <div class="text-[11px] text-fg/35">{fmtDate(e.at)}</div>
              </li>
            {/each}
          </ol>
        {/if}
      </div>
    </div>
  </div>
{:else}
  <div class="flex h-full items-center justify-center text-sm text-fg/30">Loading…</div>
{/if}
