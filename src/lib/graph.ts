// DANO graph engine — every relationship except the FK shortcuts
// (project_id, goal_id, area_id) flows through the universal `links` table.
// All link SQL lives here; reads/writes go through db().

import { db, now, uid, people } from "./db";
import type { EntityType, Link, RelationType } from "./types";

export interface EntityRef {
  type: EntityType;
  id: string;
}

export interface Neighbor extends EntityRef {
  relation: RelationType;
  /** "out" = this entity is the link source; "in" = it is the target. */
  direction: "out" | "in";
  linkId: string;
}

/** Create a link a → b. Idempotent on the unique tuple. Bumps people interaction. */
export async function link(
  a: EntityRef,
  b: EntityRef,
  relation: RelationType = "related_to",
): Promise<void> {
  const conn = await db();
  await conn.execute(
    `INSERT INTO links (id, source_type, source_id, target_type, target_id, relation_type, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (source_type, source_id, target_type, target_id, relation_type) DO NOTHING`,
    [uid(), a.type, a.id, b.type, b.id, relation, now()],
  );
  if (a.type === "person") await people.touch(a.id);
  if (b.type === "person") await people.touch(b.id);
}

/** Remove links a → b. If relation is omitted, removes every relation between them. */
export async function unlink(
  a: EntityRef,
  b: EntityRef,
  relation?: RelationType,
): Promise<void> {
  const conn = await db();
  if (relation) {
    await conn.execute(
      `DELETE FROM links WHERE source_type=$1 AND source_id=$2 AND target_type=$3 AND target_id=$4 AND relation_type=$5`,
      [a.type, a.id, b.type, b.id, relation],
    );
  } else {
    await conn.execute(
      `DELETE FROM links WHERE source_type=$1 AND source_id=$2 AND target_type=$3 AND target_id=$4`,
      [a.type, a.id, b.type, b.id],
    );
  }
}

/** All raw link rows touching an entity, as source OR target, newest first. */
export async function linksFor(entity: EntityRef): Promise<Link[]> {
  const conn = await db();
  return conn.select<Link[]>(
    `SELECT * FROM links
     WHERE (source_type=$1 AND source_id=$2) OR (target_type=$1 AND target_id=$2)
     ORDER BY created_at DESC`,
    [entity.type, entity.id],
  );
}

/** Entities linked to/from this one (the other end of every link), newest first. */
export async function neighbors(
  entity: EntityRef,
  opts: { type?: EntityType; relation?: RelationType } = {},
): Promise<Neighbor[]> {
  const rows = await linksFor(entity);
  const out: Neighbor[] = rows.map((l) => {
    const isSource = l.source_type === entity.type && l.source_id === entity.id;
    return isSource
      ? { type: l.target_type, id: l.target_id, relation: l.relation_type, direction: "out", linkId: l.id }
      : { type: l.source_type, id: l.source_id, relation: l.relation_type, direction: "in", linkId: l.id };
  });
  return out.filter(
    (n) =>
      (!opts.type || n.type === opts.type) &&
      (!opts.relation || n.relation === opts.relation),
  );
}

/** True if any link exists between a and b in either direction. */
export async function isLinked(a: EntityRef, b: EntityRef): Promise<boolean> {
  const conn = await db();
  const rows = await conn.select<{ n: number }[]>(
    `SELECT COUNT(*) AS n FROM links
     WHERE (source_type=$1 AND source_id=$2 AND target_type=$3 AND target_id=$4)
        OR (source_type=$3 AND source_id=$4 AND target_type=$1 AND target_id=$2)`,
    [a.type, a.id, b.type, b.id],
  );
  return (rows[0]?.n ?? 0) > 0;
}
