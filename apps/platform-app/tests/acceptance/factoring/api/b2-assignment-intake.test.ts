/**
 * B2 — POST /api/assignments creates a row in `drafted` state. See directive
 * constraint B2 for payload shape.
 */
import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { Client } from "pg";

// Authenticated session: a member of the capital_provider org "test-factor-b2".
// The route now enforces tenant isolation (caller must own the factor org), so
// the test stands in a session rather than posting anonymously.
vi.mock("@/lib/session", () => ({
  getSessionUserId: async () => "b2-auth-user",
  getSessionOrgs: async () => [
    { orgId: "00000000-0000-0000-0000-0000000000b2", slug: "test-factor-b2", category: "capital_provider", uei: null },
  ],
  getSessionOrgUeis: async () => new Set<string>(),
}));

const DATABASE_URL = process.env.GC_DB_URL_POOLED;
let client: Client;

describe("B2: assignment intake", () => {
  beforeAll(async () => {
    if (!DATABASE_URL) throw new Error("GC_DB_URL_POOLED required");
    client = new Client({ connectionString: DATABASE_URL });
    await client.connect();

    // Seed a test factor for B2 tests
    await client.query("BEGIN");
    try {
      await client.query(
        `INSERT INTO organizations (name, slug, category)
         VALUES ('B2 Test Factor', 'test-factor-b2', 'capital_provider')
         ON CONFLICT (slug) DO NOTHING`
      );
      const orgRes = await client.query<{ id: string }>(
        "SELECT id FROM organizations WHERE slug='test-factor-b2'"
      );
      if (orgRes.rows.length > 0) {
        await client.query(
          `INSERT INTO factor_configurations
             (organization_id, lockbox_bank_name, lockbox_account_number, lockbox_routing_number)
           VALUES ($1, 'B2 Bank', '222222222', '021000021')
           ON CONFLICT (organization_id) DO NOTHING`,
          [orgRes.rows[0].id]
        );
      }
      await client.query("COMMIT");
    } catch {
      await client.query("ROLLBACK");
    }
  });

  afterAll(async () => {
    await client.end();
  });

  it("creates an assignment in drafted state and returns 201", async () => {
    const { POST } = await import("@/app/api/assignments/route");
    const res = await POST(
      new Request("http://localhost/api/assignments", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          factor_slug: "test-factor-b2",
          contractor_uei: "ACMETESTUEI123",
          contract_number: "W912DR-26-C-0001",
          contract_value_cents: 5_000_000_00,
          sole_or_joint_payee: "sole",
          has_surety: false,
        }),
      })
    );
    expect(res.status).toBe(201);
    const body = (await res.json()) as { assignment_id: string; status: string };
    expect(body.assignment_id).toMatch(/^[0-9a-f-]{36}$/);
    expect(body.status).toBe("drafted");
  });
});
