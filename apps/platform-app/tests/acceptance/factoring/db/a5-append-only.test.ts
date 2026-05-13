/**
 * A5 — assignment_state_transitions is append-only.
 *
 * Behavior: any UPDATE or DELETE against
 * `public.assignment_state_transitions` must error. The migration enforces
 * this via REVOKE + a BEFORE trigger (recommended) OR via RLS (acceptable).
 * Validator does not pin the mechanism, only the behavior.
 *
 * This test will FAIL until 002_factoring.sql exists, applies, and enforces
 * the invariant.
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { Client } from "pg";

const DATABASE_URL = process.env.GC_DB_URL_POOLED;

describe("A5: assignment_state_transitions append-only", () => {
  let client: Client;

  beforeAll(async () => {
    if (!DATABASE_URL) throw new Error("GC_DB_URL_POOLED required");
    client = new Client({ connectionString: DATABASE_URL });
    await client.connect();
  });

  afterAll(async () => {
    await client.end();
  });

  it("rejects UPDATE on assignment_state_transitions", async () => {
    await client.query("BEGIN");
    try {
      // Seed a row first (the schema must allow INSERT but reject UPDATE).
      await client.query(
        "INSERT INTO assignment_state_transitions (assignment_id, previous_state, new_state, transition_reason) VALUES (gen_random_uuid(), 'drafted', 'executed', 'test-seed')"
      );
      await expect(
        client.query(
          "UPDATE assignment_state_transitions SET new_state = 'rejected' WHERE transition_reason = 'test-seed'"
        )
      ).rejects.toThrow();
    } finally {
      await client.query("ROLLBACK");
    }
  });

  it("rejects DELETE on assignment_state_transitions", async () => {
    await client.query("BEGIN");
    try {
      await client.query(
        "INSERT INTO assignment_state_transitions (assignment_id, previous_state, new_state, transition_reason) VALUES (gen_random_uuid(), 'drafted', 'executed', 'test-seed')"
      );
      await expect(
        client.query(
          "DELETE FROM assignment_state_transitions WHERE transition_reason = 'test-seed'"
        )
      ).rejects.toThrow();
    } finally {
      await client.query("ROLLBACK");
    }
  });
});
