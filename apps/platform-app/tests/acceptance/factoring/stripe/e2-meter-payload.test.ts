/**
 * E2 — Every meter event includes payload.factor_org_id +
 * payload.disbursement_amount_cents.
 */
import { describe, it, expect } from "vitest";

describe("E2: meter event payload shape", () => {
  it("payload includes factor_org_id and disbursement_amount_cents", async () => {
    const { buildMeterPayload } = await import("@/lib/stripe/meter");
    const payload = buildMeterPayload({
      disbursement_id: "d1",
      factor_org_id: "f1",
      amount_cents: 125_000,
      observed_at: new Date(),
    });
    expect(payload.factor_org_id).toBe("f1");
    expect(payload.disbursement_amount_cents).toBe(125_000);
  });
});
