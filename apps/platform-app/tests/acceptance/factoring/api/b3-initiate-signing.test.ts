/**
 * B3 — POST /api/assignments/:id/initiate-signing creates a Documenso
 * envelope (via the fixture-mode client per D1) and records the envelope id
 * in `assignment_documents`.
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { Client } from "pg";

const DATABASE_URL = process.env.GC_DB_URL_POOLED;
let client: Client;
let seededAssignmentId: string | null = null;
let seededFactorOrgId: string | null = null;
let seededContractorOrgId: string | null = null;

describe("B3: initiate signing", () => {
  beforeAll(async () => {
    if (!DATABASE_URL) throw new Error("GC_DB_URL_POOLED required");
    client = new Client({ connectionString: DATABASE_URL });
    await client.connect();

    // Seed and commit data so the route handler (separate connection) can see it
    const factorRes = await client.query<{ id: string }>(
      `INSERT INTO organizations (name, slug, category)
       VALUES ('B3 Factor', $1, 'capital_provider') RETURNING id`,
      [`b3-factor-${Math.random().toString(36).slice(2, 8)}`]
    );
    seededFactorOrgId = factorRes.rows[0].id;
    await client.query(
      `INSERT INTO factor_configurations (organization_id, lockbox_bank_name, lockbox_account_number, lockbox_routing_number)
       VALUES ($1, 'B3 Bank', '123456789', '021000021')`,
      [seededFactorOrgId]
    );

    const cRes = await client.query<{ id: string }>(
      `INSERT INTO organizations (name, uei, category)
       VALUES ('B3 Contractor', $1, 'contractor') RETURNING id`,
      [`B3UEI${Math.random().toString(36).slice(2, 6).toUpperCase()}`]
    );
    seededContractorOrgId = cRes.rows[0].id;

    const aRes = await client.query<{ id: string }>(
      `INSERT INTO assignments
         (contractor_org_id, factor_org_id, contract_number, contract_value_cents,
          sole_or_joint_payee, has_surety, status)
       VALUES ($1, $2, 'B3-CONTRACT-001', 100000000, 'sole', false, 'drafted')
       RETURNING id`,
      [seededContractorOrgId, seededFactorOrgId]
    );
    seededAssignmentId = aRes.rows[0].id;
  });

  afterAll(async () => {
    // Clean up seeded data
    if (seededAssignmentId) {
      await client.query("DELETE FROM assignments WHERE id=$1", [seededAssignmentId]).catch(() => {});
    }
    if (seededContractorOrgId) {
      await client.query("DELETE FROM organizations WHERE id=$1", [seededContractorOrgId]).catch(() => {});
    }
    if (seededFactorOrgId) {
      await client.query("DELETE FROM factor_configurations WHERE organization_id=$1", [seededFactorOrgId]).catch(() => {});
      await client.query("DELETE FROM organizations WHERE id=$1", [seededFactorOrgId]).catch(() => {});
    }
    await client.end();
  });

  it("creates a Documenso envelope and records it in assignment_documents", async () => {
    expect(seededAssignmentId).toBeTruthy();

    // Call the route handler
    const { POST } = await import("@/app/api/assignments/[id]/initiate-signing/route");
    const res = await POST(
      new Request(`http://localhost/api/assignments/${seededAssignmentId}/initiate-signing`, {
        method: "POST",
      }),
      { params: Promise.resolve({ id: seededAssignmentId! }) }
    );

    expect(res.status).toBe(200);
    const body = (await res.json()) as { envelope_id: string; status: string };
    expect(body.envelope_id).toMatch(/^fixture_/);

    // Verify the document was recorded (route handler committed it)
    const docs = await client.query(
      "SELECT * FROM assignment_documents WHERE assignment_id=$1",
      [seededAssignmentId]
    );
    expect((docs.rowCount ?? 0)).toBeGreaterThan(0);
    expect(docs.rows[0].documenso_envelope_id).toBe(body.envelope_id);
  });
});
