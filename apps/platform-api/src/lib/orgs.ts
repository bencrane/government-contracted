/**
 * Org membership resolution — the BFF's authorization source of truth.
 *
 * Mirrors platform-app/lib/session.ts (querySessionOrgs) and app/page.tsx's landing
 * query, reading the SAME live tables over the SAME pooled connection. The BFF resolves
 * the authenticated user (JWT `sub` == users.auth_user_id) to their active orgs, and
 * from that derives (a) the post-login landing target and (b) the set of UEIs the user
 * may read — the authorization set the entity routes enforce.
 *
 * Live every call: a revoked membership denies on the next request (no caching of the
 * authorization decision). The scale lever, when needed, is packing org UEIs into the
 * access token via a Supabase custom-access-token hook — which removes the query
 * entirely — NOT an in-process cache that would add a staleness window to a security
 * decision.
 */
import { pool } from "./db.ts";

export interface ActiveOrg {
  orgId: string;
  slug: string | null;
  category: string;
  uei: string | null;
}

/** Every active org membership for an auth user, oldest-first (landing picks the first). */
export async function activeOrgs(authUserId: string): Promise<ActiveOrg[]> {
  const { rows } = await pool().query<{
    organization_id: string;
    slug: string | null;
    category: string;
    uei: string | null;
  }>(
    `SELECT o.id AS organization_id, o.slug, o.category, o.uei
       FROM users u
       JOIN organization_memberships m ON m.user_id = u.id AND m.status = 'active'
       JOIN organizations o ON o.id = m.organization_id
      WHERE u.auth_user_id = $1
      ORDER BY m.created_at ASC`,
    [authUserId],
  );
  return rows.map((r) => ({
    orgId: r.organization_id,
    slug: r.slug,
    category: r.category,
    uei: r.uei,
  }));
}

/** The set of UEIs (uppercased) a user may read — pure, for testability. */
export function ueiSet(orgs: ActiveOrg[]): Set<string> {
  return new Set(
    orgs.map((o) => o.uei?.toUpperCase()).filter((u): u is string => Boolean(u)),
  );
}

/** Live authorization set: the UEIs the authenticated user is an active member of. */
export async function ownedUeis(authUserId: string): Promise<Set<string>> {
  return ueiSet(await activeOrgs(authUserId));
}

export interface Landing {
  redirect: string;
  org: ActiveOrg | null;
}

/**
 * Landing policy — byte-for-byte the decision in platform-app/app/page.tsx:
 * first active org → contractor dashboard (has uei) | partner portal (has slug) |
 * /access-expired (no resolvable destination). Pure, for testability.
 */
export function landingFor(orgs: ActiveOrg[]): Landing {
  const org = orgs[0] ?? null;
  if (!org) return { redirect: "/access-expired", org: null };
  if (org.uei) return { redirect: `/dashboard/${org.uei}`, org };
  if (org.slug) return { redirect: `/partner/${org.slug}/spec`, org };
  return { redirect: "/access-expired", org };
}
