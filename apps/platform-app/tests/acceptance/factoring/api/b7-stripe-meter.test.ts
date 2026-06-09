/**
 * B7 — Disbursement fires Stripe `disbursement.observed` meter event exactly
 *      once per disbursement row. Mocked via `nock`/vi.mock against
 *      `STRIPE_API_BASE`. Fixture mode is acceptable.
 */
import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { seedPerfectedAssignment, cleanupSeededAssignment } from "../_helpers/seed-perfected-assignment";

// Authenticated session for tenant isolation: the disbursement route now requires
// the caller to be a member of the factor org that owns the assignment. The seeded
// factor_org_id is injected into the session mock at runtime (see beforeAll).
const sessionState = vi.hoisted(() => ({ orgs: [] as Array<{ orgId: string; slug: string | null; category: string; uei: string | null }> }));
vi.mock("@/lib/session", () => ({
  getSessionUserId: async () => "b7-auth-user",
  getSessionOrgs: async () => sessionState.orgs,
  getSessionOrgUeis: async () => new Set<string>(),
}));

// Mock the meter module so we can spy on it
vi.mock("@/lib/stripe/meter", () => ({
  buildMeterPayload: vi.fn((input: {
    disbursement_id: string;
    factor_org_id: string;
    amount_cents: number;
    observed_at: Date;
  }) => ({
    factor_org_id: input.factor_org_id,
    disbursement_amount_cents: input.amount_cents,
    disbursement_id: input.disbursement_id,
    observed_at: input.observed_at.toISOString(),
  })),
  fireMeterEvent: vi.fn().mockResolvedValue({ ok: true, id: "fixture_evt_test" }),
}));

let seededAssignmentId: string | null = null;
let seededFactorOrgId: string | null = null;

describe("B7: Stripe meter event on disbursement", () => {
  beforeAll(async () => {
    // Seed committed data for route handler visibility
    const { Client } = await import("pg");
    const dummy = new (Client as any)();
    const result = await seedPerfectedAssignment(dummy);
    seededAssignmentId = result.assignment_id;
    seededFactorOrgId = result.factor_org_id;
    // Authorize the session as the owning factor org for the isolation check.
    sessionState.orgs = [
      { orgId: result.factor_org_id, slug: null, category: "capital_provider", uei: null },
    ];
  });

  afterAll(async () => {
    if (seededAssignmentId) {
      await cleanupSeededAssignment(seededAssignmentId);
    }
  });

  it("fires exactly one disbursement.observed meter event with required payload", async () => {
    expect(seededAssignmentId).toBeTruthy();
    expect(seededFactorOrgId).toBeTruthy();

    const { fireMeterEvent } = await import("@/lib/stripe/meter");
    const meterSpy = vi.mocked(fireMeterEvent);
    meterSpy.mockClear();

    const { POST } = await import("@/app/api/disbursements/route");
    const res = await POST(
      new Request("http://localhost/api/disbursements", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          assignment_id: seededAssignmentId,
          amount_cents: 1_250_000,
          observed_at: new Date().toISOString(),
        }),
      })
    );
    expect(res.status).toBe(201);

    expect(meterSpy).toHaveBeenCalledTimes(1);
    const call = meterSpy.mock.calls[0][0];
    expect(call.event_name).toBe("disbursement.observed");
    expect(call.payload.factor_org_id).toBe(seededFactorOrgId);
    expect(call.payload.disbursement_amount_cents).toBe(1_250_000);
  });
});
