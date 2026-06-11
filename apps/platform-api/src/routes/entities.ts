/**
 * entities broker — proxies authenticated reads to the core-x catalyst_api
 * (Gen-3 read gateway): UEI → SAM profile / award surfaces.
 *
 * Trust model (two hops, distinct credentials):
 *   1. The SPA sends the user's Supabase access_token; `requireUser` validates it
 *      here (end-user identity / app-level auth).
 *   2. The BFF then calls core-x with the INTERNAL operator service token
 *      (`COREX_SERVICE_TOKEN`) as Bearer — the user's JWT is NOT forwarded. core-x
 *      runs on the private network and is never exposed to the public web; the BFF
 *      is its only caller.
 *
 * Routes (mounted at /api/v1/entities — mirror core-x verbatim):
 *   GET /:uei/overview            → core-x GET /api/v1/entities/:uei/overview
 *   GET /:uei/sam-profile         → core-x GET /api/v1/entities/:uei/sam-profile
 *   GET /:uei/active-contracts    → …/active-contracts?limit=N   (N clamped 1..100)
 *   GET /:uei/past-performance    → …/past-performance?limit=N   (N clamped 1..100)
 *
 * core-x response status + body (the `{ data }` envelope, 404 empty outcomes, error
 * bodies) pass through verbatim. The BFF synthesizes nothing.
 */

import { type Context, Hono } from "hono";
import { HTTPException } from "hono/http-exception";

import { requireUser, type AuthVariables } from "../auth.ts";
import { env } from "../env.ts";
import { ownedUeis } from "../lib/orgs.ts";

export const entityRoutes = new Hono<{ Variables: AuthVariables }>();

// Every entity surface is auth-gated. The mount order in index.ts puts this whole
// router behind the Supabase JWT check.
entityRoutes.use("*", requireUser);

// SAM.gov UEI: exactly 12 alphanumerics. Validating here is both a correctness guard
// and an SSRF/path-injection guard — a regex-locked UEI cannot escape the entities
// path or smuggle a query string into the upstream URL.
export const UEI_RE = /^[A-Za-z0-9]{12}$/;

// Per-call ceiling so a slow / unreachable core-x degrades to a 502 instead of
// hanging the BFF event loop. core-x reads are gold point-lookups (sub-second);
// 10s is generous headroom over a cold gateway start.
const REQUEST_TIMEOUT_MS = 10_000;

// core-x bounds limit to [1, 100] (default 25). Clamp on our side too so a hostile or
// fat-fingered value never reaches upstream and we keep a single source of defaults.
export function clampLimit(raw: string | undefined): number {
  const n = raw ? Number.parseInt(raw, 10) : 25;
  if (!Number.isFinite(n)) return 25;
  return Math.min(100, Math.max(1, n));
}

async function proxy(
  c: Context<{ Variables: AuthVariables }>,
  surface: string,
  qs = "",
): Promise<Response> {
  const raw = c.req.param("uei");
  if (!raw || !UEI_RE.test(raw)) {
    throw new HTTPException(400, { message: "Malformed UEI" });
  }
  // Canonicalize to uppercase ONCE and use it for BOTH the authz check and the upstream
  // URL. Stored UEIs are uppercase and core-x's lookup is case-sensitive, so a single
  // canonical form keeps the owned-set comparison and the core-x query byte-identical —
  // a caller sending a lowercase (owned) UEI must not pass authz and then 404 at core-x.
  const uei = raw.toUpperCase();

  // Authorization: the UEI must belong to one of the caller's ACTIVE orgs. A non-owned
  // UEI returns 404 — indistinguishable from "core-x doesn't know this entity" — so the
  // surface cannot enumerate which UEIs exist or are provisioned. The membership is
  // resolved live (a revoked membership denies immediately). The Next app also authorizes
  // upstream (resolveTenantUei); this makes the BFF self-sufficient for the SPA, which
  // will call it directly with no upstream guard.
  const user = c.get("user");
  let owned: Set<string>;
  try {
    owned = await ownedUeis(user.user_id);
  } catch (err) {
    // DB unavailable → cannot authorize. Fail to a 503 the client degrades to empty-state
    // (same posture as core-x-unavailable), never an open read and never a 500.
    const name = err instanceof Error ? err.name : "error";
    throw new HTTPException(503, { message: `authorization unavailable (${name})` });
  }
  if (!owned.has(uei)) {
    console.warn(`entities: user ${user.user_id} denied UEI ${uei} (not an active-org UEI)`);
    throw new HTTPException(404, { message: "Not found" });
  }

  const url = `${env.COREX_API_URL}/api/v1/entities/${uei}/${surface}${qs}`;

  let res: Response;
  let body: string;
  try {
    // core-x opens Lance per-request (latest committed version); these are always
    // live reads. undici's fetch has no HTTP cache store, so no cache directive is
    // needed — the request is uncached by construction. The body read is INSIDE this
    // try as well: AbortSignal.timeout governs the whole fetch lifecycle including the
    // response stream, so a stalled or mid-stream-reset body degrades to a 502 exactly
    // like a connection-phase failure — never an uncaught throw that Hono renders 500.
    res = await fetch(url, {
      headers: { Authorization: `Bearer ${env.COREX_SERVICE_TOKEN}` },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    body = await res.text();
  } catch (err) {
    const name = err instanceof Error ? err.name : "error";
    throw new HTTPException(502, { message: `core-x unreachable (${name})` });
  }

  // Pass core-x's status + body through verbatim — including 404 (unknown entity /
  // no footprint, a valid empty outcome the consumer maps to its empty-state).
  const contentType = res.headers.get("content-type") ?? "application/json";
  return new Response(body, { status: res.status, headers: { "content-type": contentType } });
}

entityRoutes.get("/:uei/overview", (c) => proxy(c, "overview"));

entityRoutes.get("/:uei/sam-profile", (c) => proxy(c, "sam-profile"));

entityRoutes.get("/:uei/active-contracts", (c) =>
  proxy(c, "active-contracts", `?limit=${clampLimit(c.req.query("limit"))}`),
);

entityRoutes.get("/:uei/past-performance", (c) =>
  proxy(c, "past-performance", `?limit=${clampLimit(c.req.query("limit"))}`),
);
