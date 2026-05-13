/**
 * F3 — public.audit_log captures factor onboarding, assignment create,
 * disbursement create, and Stripe-fire events with appropriate action codes.
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { Client } from "pg";

const DATABASE_URL = process.env.GC_DB_URL_POOLED;
let client: Client;

// Track IDs for cleanup
const createdSlugs: string[] = [];
const createdAssignmentIds: string[] = [];
const createdDisbursementIds: string[] = [];

describe("F3: audit log integration", () => {
  beforeAll(async () => {
    if (!DATABASE_URL) throw new Error("GC_DB_URL_POOLED required");
    client = new Client({ connectionString: DATABASE_URL });
    await client.connect();
  });

  afterAll(async () => {
    // Clean up in FK-safe order
    for (const id of createdDisbursementIds) {
      await client.query("DELETE FROM factor_billing_events WHERE disbursement_id=$1", [id]).catch(() => {});
      await client.query("DELETE FROM disbursements WHERE id=$1", [id]).catch(() => {});
    }
    for (const id of createdAssignmentIds) {
      await client.query("DELETE FROM assignments WHERE id=$1", [id]).catch(() => {});
    }
    for (const slug of createdSlugs) {
      const orgRow = await client.query<{ id: string }>(
        "SELECT id FROM organizations WHERE slug=$1",
        [slug]
      ).catch(() => ({ rows: [] }));
      if (orgRow.rows.length > 0) {
        await client.query("DELETE FROM factor_configurations WHERE organization_id=$1", [orgRow.rows[0].id]).catch(() => {});
        await client.query("DELETE FROM organizations WHERE id=$1", [orgRow.rows[0].id]).catch(() => {});
      }
    }
    await client.end();
  });

  it("writes audit_log entries for onboard/assign/disburse/meter actions", async () => {
    // factor.onboarded — route handler commits its own txn
    const { POST: factorPOST } = await import("@/app/api/factors/route");
    const slug = `f3-factor-${Math.random().toString(36).slice(2, 8)}`;
    createdSlugs.push(slug);

    const factorRes = await factorPOST(
      new Request("http://localhost/api/factors", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: "F3 Test Factor",
          slug,
          lockbox_bank_name: "F3 Bank",
          lockbox_account_number: "888888888",
          lockbox_routing_number: "021000021",
          notification_addresses: { primary: "f3@test.example" },
        }),
      })
    );
    expect(factorRes.status).toBe(201);

    const onboardLog = await client.query(
      "SELECT * FROM audit_log WHERE action='factor.onboarded' ORDER BY created_at DESC LIMIT 1"
    );
    expect((onboardLog.rowCount ?? 0)).toBeGreaterThan(0);

    // assignment.created
    const { POST: assignPOST } = await import("@/app/api/assignments/route");
    const uei = `F3UEI${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const assignRes = await assignPOST(
      new Request("http://localhost/api/assignments", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          factor_slug: slug,
          contractor_uei: uei,
          contract_number: "F3-CONTRACT-001",
          contract_value_cents: 10000000,
          sole_or_joint_payee: "sole",
          has_surety: false,
        }),
      })
    );
    expect(assignRes.status).toBe(201);
    const assignBody = (await assignRes.json()) as { assignment_id: string };
    createdAssignmentIds.push(assignBody.assignment_id);

    const assignLog = await client.query(
      "SELECT * FROM audit_log WHERE action='assignment.created' ORDER BY created_at DESC LIMIT 1"
    );
    expect((assignLog.rowCount ?? 0)).toBeGreaterThan(0);

    // Manually set assignment to 'perfected' so disbursement can be created
    // Must be committed so disbursement route handler can see it
    await client.query(
      "UPDATE assignments SET status='perfected' WHERE id=$1",
      [assignBody.assignment_id]
    );

    // disbursement.observed + stripe.meter.fired
    const { POST: disbPOST } = await import("@/app/api/disbursements/route");
    const disbRes = await disbPOST(
      new Request("http://localhost/api/disbursements", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          assignment_id: assignBody.assignment_id,
          amount_cents: 500000,
          observed_at: new Date().toISOString(),
        }),
      })
    );
    expect(disbRes.status).toBe(201);
    const disbBody = (await disbRes.json()) as { disbursement_id: string };
    createdDisbursementIds.push(disbBody.disbursement_id);

    const disbLog = await client.query(
      "SELECT * FROM audit_log WHERE action='disbursement.observed' ORDER BY created_at DESC LIMIT 1"
    );
    expect((disbLog.rowCount ?? 0)).toBeGreaterThan(0);

    const meterLog = await client.query(
      "SELECT * FROM audit_log WHERE action='stripe.meter.fired' ORDER BY created_at DESC LIMIT 1"
    );
    expect((meterLog.rowCount ?? 0)).toBeGreaterThan(0);
  });
});
