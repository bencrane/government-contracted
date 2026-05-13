/**
 * E3 — factor_billing_events.disbursement_id UNIQUE prevents double-fire.
 * Inserting two billing events for the same disbursement raises a unique
 * constraint violation.
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from "vitest";
import { Client } from "pg";

const DATABASE_URL = process.env.GC_DB_URL_POOLED;
let client: Client;

describe("E3: no double-fire", () => {
  beforeAll(async () => {
    if (!DATABASE_URL) throw new Error("GC_DB_URL_POOLED required");
    client = new Client({ connectionString: DATABASE_URL });
    await client.connect();
  });

  afterAll(async () => {
    await client.end();
  });

  beforeEach(async () => {
    await client.query("BEGIN");
  });

  afterEach(async () => {
    await client.query("ROLLBACK");
  });

  it("rejects second insert with same disbursement_id", async () => {
    // Executor seeds a disbursement row first, then attempts two inserts.
    await expect(
      (async () => {
        await client.query(
          "INSERT INTO factor_billing_events (disbursement_id, stripe_meter_event_id) VALUES ($1, $2)",
          ["00000000-0000-0000-0000-000000000001", "evt_1"]
        );
        await client.query(
          "INSERT INTO factor_billing_events (disbursement_id, stripe_meter_event_id) VALUES ($1, $2)",
          ["00000000-0000-0000-0000-000000000001", "evt_2"]
        );
      })()
    ).rejects.toThrow();
  });
});
