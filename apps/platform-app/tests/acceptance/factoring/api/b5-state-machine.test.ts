/**
 * B5 — State machine. Per FAR 32.802/32.805:
 *
 *   drafted     — instrument drafted, parties listed
 *   executed    — contractor + factor have signed (both assignment_parties
 *                 rows status='signed')
 *   served      — notice envelopes dispatched to CO + DO (+ surety if
 *                 has_surety). Per-recipient row status='pending'.
 *   acknowledged— at least one gov-party row status='acknowledged'.
 *                 (informational sub-state; not a terminal)
 *   perfected   — ALL required gov parties acknowledged.
 *
 * Each transition writes a row to assignment_state_transitions.
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { Client } from "pg";
import { evaluateTransition, maybeAdvanceState, applyTransition } from "@/lib/factoring/state-machine";
import type { AssignmentStatus } from "@/lib/factoring/state-machine";

const DATABASE_URL = process.env.GC_DB_URL_POOLED;
let client: Client;

async function seedDraftedAssignment(c: Client): Promise<{
  assignment_id: string;
  factor_org_id: string;
  contractor_org_id: string;
}> {
  const factorRes = await c.query<{ id: string }>(
    `INSERT INTO organizations (name, slug, category)
     VALUES ($1, $2, 'capital_provider') RETURNING id`,
    [`B5 Factor`, `b5-factor-${Math.random().toString(36).slice(2, 8)}`]
  );
  const factor_org_id = factorRes.rows[0].id;
  await c.query(
    `INSERT INTO factor_configurations (organization_id, lockbox_bank_name, lockbox_account_number, lockbox_routing_number)
     VALUES ($1, 'B5 Bank', '111111111', '021000021')`,
    [factor_org_id]
  );
  const contractorRes = await c.query<{ id: string }>(
    `INSERT INTO organizations (name, uei, category)
     VALUES ($1, $2, 'contractor') RETURNING id`,
    [`B5 Contractor`, `B5UEI${Math.random().toString(36).slice(2, 6).toUpperCase()}`]
  );
  const contractor_org_id = contractorRes.rows[0].id;

  const aRes = await c.query<{ id: string }>(
    `INSERT INTO assignments
       (contractor_org_id, factor_org_id, contract_number, contract_value_cents,
        sole_or_joint_payee, has_surety, status)
     VALUES ($1, $2, 'B5-TEST-001', 100000000, 'sole', false, 'drafted')
     RETURNING id`,
    [contractor_org_id, factor_org_id]
  );
  const assignment_id = aRes.rows[0].id;

  for (const role of [
    "contractor_assignor",
    "factor_assignee",
    "contracting_officer",
    "disbursing_officer",
  ]) {
    await c.query(
      `INSERT INTO assignment_parties (assignment_id, role, email, status)
       VALUES ($1, $2, $3, 'pending')`,
      [assignment_id, role, `${role}@b5.example`]
    );
  }
  return { assignment_id, factor_org_id, contractor_org_id };
}

describe("B5: state machine", () => {
  beforeAll(async () => {
    if (!DATABASE_URL) throw new Error("GC_DB_URL_POOLED required");
    client = new Client({ connectionString: DATABASE_URL });
    await client.connect();
  });

  afterAll(async () => {
    await client.end();
  });

  it("transitions drafted -> executed when contractor + factor both signed", async () => {
    await client.query("BEGIN");
    try {
      const { assignment_id } = await seedDraftedAssignment(client);

      // Sign contractor
      await client.query(
        `UPDATE assignment_parties SET status='signed', signed_at=now()
         WHERE assignment_id=$1 AND role='contractor_assignor'`,
        [assignment_id]
      );
      // No transition yet
      let row = await client.query<{ status: string }>(
        "SELECT status FROM assignments WHERE id=$1",
        [assignment_id]
      );
      expect(row.rows[0].status).toBe("drafted");

      // Sign factor
      await client.query(
        `UPDATE assignment_parties SET status='signed', signed_at=now()
         WHERE assignment_id=$1 AND role='factor_assignee'`,
        [assignment_id]
      );

      const newState = await maybeAdvanceState(client, assignment_id, null);
      expect(newState).toBe("executed");

      row = await client.query<{ status: string }>(
        "SELECT status FROM assignments WHERE id=$1",
        [assignment_id]
      );
      expect(row.rows[0].status).toBe("executed");
    } finally {
      await client.query("ROLLBACK");
    }
  });

  it("transitions executed -> served when notice envelopes dispatched", async () => {
    await client.query("BEGIN");
    try {
      const { assignment_id } = await seedDraftedAssignment(client);

      // Advance to executed first
      await client.query(
        `UPDATE assignment_parties SET status='signed', signed_at=now()
         WHERE assignment_id=$1 AND role IN ('contractor_assignor','factor_assignee')`,
        [assignment_id]
      );
      await maybeAdvanceState(client, assignment_id, null);

      // Transition to served (triggered by API explicitly)
      await applyTransition(
        client,
        assignment_id,
        "executed",
        "served",
        null,
        "notice dispatched to CO + DO"
      );

      const row = await client.query<{ status: string }>(
        "SELECT status FROM assignments WHERE id=$1",
        [assignment_id]
      );
      expect(row.rows[0].status).toBe("served");
    } finally {
      await client.query("ROLLBACK");
    }
  });

  it("transitions to perfected only when ALL required gov parties acknowledged", async () => {
    await client.query("BEGIN");
    try {
      const { assignment_id } = await seedDraftedAssignment(client);

      // Advance to served
      await client.query(
        `UPDATE assignment_parties SET status='signed'
         WHERE assignment_id=$1 AND role IN ('contractor_assignor','factor_assignee')`,
        [assignment_id]
      );
      await maybeAdvanceState(client, assignment_id, null);
      await applyTransition(client, assignment_id, "executed", "served", null, "notice dispatched");

      // Only CO acks — should not be perfected
      await client.query(
        `UPDATE assignment_parties SET status='acknowledged'
         WHERE assignment_id=$1 AND role='contracting_officer'`,
        [assignment_id]
      );
      let newState = await maybeAdvanceState(client, assignment_id, null);
      expect(newState).toBe("acknowledged"); // sub-state, not perfected

      // DO acks — now all required parties (CO+DO, has_surety=false) are acked
      await client.query(
        `UPDATE assignment_parties SET status='acknowledged'
         WHERE assignment_id=$1 AND role='disbursing_officer'`,
        [assignment_id]
      );
      newState = await maybeAdvanceState(client, assignment_id, null);
      expect(newState).toBe("perfected");

      const row = await client.query<{ status: string }>(
        "SELECT status FROM assignments WHERE id=$1",
        [assignment_id]
      );
      expect(row.rows[0].status).toBe("perfected");
    } finally {
      await client.query("ROLLBACK");
    }
  });

  it("writes exactly one assignment_state_transitions row per transition", async () => {
    await client.query("BEGIN");
    try {
      const { assignment_id } = await seedDraftedAssignment(client);

      await client.query(
        `UPDATE assignment_parties SET status='signed'
         WHERE assignment_id=$1 AND role IN ('contractor_assignor','factor_assignee')`,
        [assignment_id]
      );
      await maybeAdvanceState(client, assignment_id, null);

      const transitions = await client.query<{ new_state: string }>(
        "SELECT new_state FROM assignment_state_transitions WHERE assignment_id=$1",
        [assignment_id]
      );
      expect(transitions.rowCount).toBe(1);
      expect(transitions.rows[0].new_state).toBe("executed");
    } finally {
      await client.query("ROLLBACK");
    }
  });
});
