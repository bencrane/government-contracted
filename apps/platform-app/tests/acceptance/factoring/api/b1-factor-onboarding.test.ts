/**
 * B1 — POST /api/factors creates an organizations row (category='capital_provider')
 *       paired with a factor_configurations row. Returns 201 with the new slug.
 *       Duplicate slug returns 409 idempotently (no second row created).
 *
 * Test invokes the Next.js route handler directly via dynamic import. Reads/
 * writes the live `public.*` schema; isolation via transactional rollback.
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from "vitest";
import { Client } from "pg";

// Factor onboarding is now gated by requirePlatformAdmin (lib/tenant.ts) — it
// provisions a capital_provider org + lockbox banking config with no owning tenant
// to check membership against, so the route demands an authenticated session AND an
// active platform-admin grant, resolved through @/lib/session. The session is stood
// in here; `session` is mutable so the negative paths (anonymous, non-admin) can be
// exercised against the same route.
const session = vi.hoisted(() => ({
  userId: "b1-admin-auth-user" as string | null,
  isAdmin: true,
}));
vi.mock("@/lib/session", () => ({
  getSessionUserId: async () => session.userId,
  isSessionPlatformAdmin: async () => session.userId !== null && session.isAdmin,
  getSessionOrgs: async () => [],
  getSessionOrgUeis: async () => new Set<string>(),
}));

const DATABASE_URL = process.env.GC_DB_URL_POOLED;
let client: Client;

const validPayload = () => ({
  name: "Test Factor LLC",
  slug: `test-factor-${Math.random().toString(36).slice(2, 8)}`,
  lockbox_bank_name: "JPMorgan Chase",
  lockbox_account_number: "9999999999",
  lockbox_routing_number: "021000021",
  notification_addresses: { primary: "ops@testfactor.example" },
});

describe("B1: factor onboarding", () => {
  beforeAll(async () => {
    if (!DATABASE_URL) throw new Error("GC_DB_URL_POOLED required");
    client = new Client({ connectionString: DATABASE_URL });
    await client.connect();
  });

  afterAll(async () => {
    await client.end();
  });

  beforeEach(async () => {
    // Default to an authorized platform admin; negative-path tests override locally.
    session.userId = "b1-admin-auth-user";
    session.isAdmin = true;
    await client.query("BEGIN");
  });

  afterEach(async () => {
    await client.query("ROLLBACK");
  });

  it("creates organization + factor_configurations and returns 201", async () => {
    const { POST } = await import("@/app/api/factors/route");
    const payload = validPayload();
    const res = await POST(
      new Request("http://localhost/api/factors", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      })
    );
    expect(res.status).toBe(201);
    const body = (await res.json()) as { slug: string };
    expect(body.slug).toBe(payload.slug);

    const orgs = await client.query(
      "SELECT id FROM organizations WHERE slug = $1 AND category = 'capital_provider'",
      [payload.slug]
    );
    expect(orgs.rowCount).toBe(1);

    const cfgs = await client.query(
      "SELECT organization_id FROM factor_configurations WHERE organization_id = $1",
      [orgs.rows[0].id]
    );
    expect(cfgs.rowCount).toBe(1);
  });

  it("returns 409 on duplicate slug (idempotent — no second row)", async () => {
    const { POST } = await import("@/app/api/factors/route");
    const payload = validPayload();

    const first = await POST(
      new Request("http://localhost/api/factors", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      })
    );
    expect(first.status).toBe(201);

    const second = await POST(
      new Request("http://localhost/api/factors", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      })
    );
    expect(second.status).toBe(409);

    const orgs = await client.query(
      "SELECT count(*)::int as n FROM organizations WHERE slug = $1",
      [payload.slug]
    );
    expect(orgs.rows[0].n).toBe(1);
  });

  it("rejects an anonymous caller with 401 and creates nothing", async () => {
    session.userId = null;
    session.isAdmin = false;
    const { POST } = await import("@/app/api/factors/route");
    const payload = validPayload();
    const res = await POST(
      new Request("http://localhost/api/factors", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      })
    );
    expect(res.status).toBe(401);

    const orgs = await client.query(
      "SELECT count(*)::int as n FROM organizations WHERE slug = $1",
      [payload.slug]
    );
    expect(orgs.rows[0].n).toBe(0);
  });

  it("rejects an authenticated non-admin with 403 and creates nothing", async () => {
    session.userId = "b1-non-admin-user";
    session.isAdmin = false;
    const { POST } = await import("@/app/api/factors/route");
    const payload = validPayload();
    const res = await POST(
      new Request("http://localhost/api/factors", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      })
    );
    expect(res.status).toBe(403);

    const orgs = await client.query(
      "SELECT count(*)::int as n FROM organizations WHERE slug = $1",
      [payload.slug]
    );
    expect(orgs.rows[0].n).toBe(0);
  });
});
