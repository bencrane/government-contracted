/**
 * Test helper — seeds a `perfected` assignment with all required ack rows.
 *
 * IMPORTANT: Uses its own pg.Client connection and COMMITS the data.
 * This is necessary because API route handlers create their own connections
 * and can only see committed rows.
 *
 * Returned shape:
 *   { assignment_id, factor_org_id, contractor_org_id }
 *
 * Caller is responsible for cleanup (DELETE) after the test.
 * Do NOT call inside a BEGIN transaction you plan to ROLLBACK — the seeded
 * rows will persist. Use afterAll/afterEach cleanup instead.
 */
import { Client } from "pg";

const DATABASE_URL = process.env.GC_DB_URL_POOLED;

export interface SeedPerfectedAssignmentResult {
  assignment_id: string;
  factor_org_id: string;
  contractor_org_id: string;
}

export async function seedPerfectedAssignment(
  _client: Client // kept for API compatibility; we use our own connection
): Promise<SeedPerfectedAssignmentResult> {
  const seedClient = new Client({ connectionString: DATABASE_URL });
  await seedClient.connect();

  try {
    // Seed a factor org + config
    const factorOrgRes = await seedClient.query<{ id: string }>(
      `INSERT INTO organizations (name, slug, category)
       VALUES ('Test Factor Seed', $1, 'capital_provider')
       RETURNING id`,
      [`seed-factor-${Math.random().toString(36).slice(2, 8)}`]
    );
    const factor_org_id = factorOrgRes.rows[0].id;

    await seedClient.query(
      `INSERT INTO factor_configurations
         (organization_id, lockbox_bank_name, lockbox_account_number, lockbox_routing_number)
       VALUES ($1, 'Test Bank', '000000001', '021000021')`,
      [factor_org_id]
    );

    // Seed a contractor org
    const contractorOrgRes = await seedClient.query<{ id: string }>(
      `INSERT INTO organizations (name, uei, category)
       VALUES ('Test Contractor Seed', $1, 'contractor')
       RETURNING id`,
      [`SEEDUEI${Math.random().toString(36).slice(2, 8).toUpperCase()}`]
    );
    const contractor_org_id = contractorOrgRes.rows[0].id;

    // Create the assignment in 'perfected' state directly
    const aRes = await seedClient.query<{ id: string }>(
      `INSERT INTO assignments
         (contractor_org_id, factor_org_id, contract_number, contract_value_cents,
          sole_or_joint_payee, has_surety, status)
       VALUES ($1, $2, 'SEED-CONTRACT-001', 500000000, 'sole', false, 'perfected')
       RETURNING id`,
      [contractor_org_id, factor_org_id]
    );
    const assignment_id = aRes.rows[0].id;

    // Seed all required parties as acknowledged
    const parties = [
      { role: "contractor_assignor", status: "signed" },
      { role: "factor_assignee", status: "signed" },
      { role: "contracting_officer", status: "acknowledged" },
      { role: "disbursing_officer", status: "acknowledged" },
    ];
    for (const p of parties) {
      await seedClient.query(
        `INSERT INTO assignment_parties
           (assignment_id, role, email, status, signed_at)
         VALUES ($1, $2, $3, $4, now())`,
        [
          assignment_id,
          p.role,
          `${p.role.replace(/_/g, "-")}@seed.example`,
          p.status,
        ]
      );
    }

    // Seed the state transition log
    const transitions = [
      { prev: "drafted", next: "executed", reason: "contractor + factor signed" },
      { prev: "executed", next: "served", reason: "notice dispatched" },
      { prev: "served", next: "acknowledged", reason: "CO acknowledged" },
      { prev: "acknowledged", next: "perfected", reason: "all gov parties acknowledged" },
    ];
    for (const t of transitions) {
      await seedClient.query(
        `INSERT INTO assignment_state_transitions
           (assignment_id, previous_state, new_state, transition_reason)
         VALUES ($1, $2, $3, $4)`,
        [assignment_id, t.prev, t.next, t.reason]
      );
    }

    return { assignment_id, factor_org_id, contractor_org_id };
  } finally {
    await seedClient.end();
  }
}

/** Clean up seeded data by assignment_id. */
export async function cleanupSeededAssignment(
  assignment_id: string
): Promise<void> {
  const c = new Client({ connectionString: DATABASE_URL });
  await c.connect();
  try {
    // Get org IDs before deleting
    const aRow = await c.query<{ contractor_org_id: string; factor_org_id: string }>(
      "SELECT contractor_org_id, factor_org_id FROM assignments WHERE id=$1",
      [assignment_id]
    );
    if (aRow.rowCount === 0) return;
    const { contractor_org_id, factor_org_id } = aRow.rows[0];

    // Delete in FK-safe order: disbursements -> billing events -> state transitions -> parties -> documents -> assignments -> configs -> orgs
    await c.query("DELETE FROM factor_billing_events WHERE disbursement_id IN (SELECT id FROM disbursements WHERE assignment_id=$1)", [assignment_id]);
    await c.query("DELETE FROM disbursements WHERE assignment_id=$1", [assignment_id]);
    await c.query("DELETE FROM assignments WHERE id=$1", [assignment_id]);
    await c.query("DELETE FROM factor_configurations WHERE organization_id=$1", [factor_org_id]);
    await c.query("DELETE FROM organizations WHERE id=ANY($1)", [[factor_org_id, contractor_org_id]]);
  } finally {
    await c.end();
  }
}
