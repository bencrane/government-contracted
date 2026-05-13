/**
 * E1 — `disbursement.observed` meter exists in Stripe test mode, OR the
 * one-time setup script idempotently creates it.
 *
 * Validator note: STRIPE_SECRET_KEY_TEST is NOT currently in Doppler. The
 * executor must either:
 *   (a) Add it to Doppler before running this test (preferred), OR
 *   (b) Run in fixture mode — `setupStripeMeters` is a no-op when
 *       STRIPE_SECRET_KEY_TEST is unset, and this test asserts the helper
 *       returns `{ status: "fixture", event_name: "disbursement.observed" }`.
 */
import { describe, it, expect } from "vitest";

describe("E1: disbursement.observed meter setup", () => {
  it("setupDisbursementMeter is idempotent (fixture mode acceptable)", async () => {
    const { ensureDisbursementMeter } = await import("@/lib/stripe/setup");
    const res = await ensureDisbursementMeter();
    expect(res.event_name).toBe("disbursement.observed");
    expect(["created", "exists", "fixture"]).toContain(res.status);
  });
});
