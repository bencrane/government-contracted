/**
 * F2 — Every state transition writes exactly one
 * `assignment_state_transitions` row with previous_state, new_state,
 * actor_user_id, transition_reason, created_at.
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { Client } from "pg";
import { applyTransition } from "@/lib/factoring/state-machine";
import type { AssignmentStatus } from "@/lib/factoring/state-machine";

const DATABASE_URL = process.env.GC_DB_URL_POOLED;
let client: Client;

describe("F2: state transition log", () => {
  beforeAll(async () => {
    if (!DATABASE_URL) throw new Error("GC_DB_URL_POOLED required");
    client = new Client({ connectionString: DATABASE_URL });
    await client.connect();
  });

  afterAll(async () => {
    await client.end();
  });

  it("logs one row per transition with all required columns populated", async () => {
    await client.query("BEGIN");
    try {
      // Seed minimal assignment
      const fRes = await client.query<{ id: string }>(
        `INSERT INTO organizations (name, slug, category)
         VALUES ('F2 Factor', $1, 'capital_provider') RETURNING id`,
        [`f2-factor-${Math.random().toString(36).slice(2, 8)}`]
      );
      const factorOrgId = fRes.rows[0].id;
      await client.query(
        `INSERT INTO factor_configurations (organization_id, lockbox_bank_name, lockbox_account_number, lockbox_routing_number)
         VALUES ($1, 'F2 Bank', '111111111', '021000021')`,
        [factorOrgId]
      );
      const cRes = await client.query<{ id: string }>(
        `INSERT INTO organizations (name, uei, category)
         VALUES ('F2 Contractor', $1, 'contractor') RETURNING id`,
        [`F2UEI${Math.random().toString(36).slice(2, 6).toUpperCase()}`]
      );

      const aRes = await client.query<{ id: string }>(
        `INSERT INTO assignments
           (contractor_org_id, factor_org_id, contract_number, contract_value_cents,
            sole_or_joint_payee, has_surety, status)
         VALUES ($1, $2, 'F2-TRANSITION-001', 100000000, 'sole', false, 'drafted')
         RETURNING id`,
        [cRes.rows[0].id, factorOrgId]
      );
      const assignmentId = aRes.rows[0].id;

      // Apply a transition
      await applyTransition(
        client,
        assignmentId,
        "drafted" as AssignmentStatus,
        "executed" as AssignmentStatus,
        null,
        "F2 test: contractor + factor signed"
      );

      const rows = await client.query(
        `SELECT id, assignment_id, previous_state, new_state, actor_user_id,
                transition_reason, created_at
         FROM assignment_state_transitions WHERE assignment_id=$1`,
        [assignmentId]
      );

      expect(rows.rowCount).toBe(1);
      const row = rows.rows[0];
      expect(row.assignment_id).toBe(assignmentId);
      expect(row.previous_state).toBe("drafted");
      expect(row.new_state).toBe("executed");
      expect(row.transition_reason).toBe("F2 test: contractor + factor signed");
      expect(row.created_at).toBeTruthy();
      // actor_user_id may be null when system triggers
    } finally {
      await client.query("ROLLBACK");
    }
  });
});
