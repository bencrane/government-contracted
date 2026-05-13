/**
 * B6 — POST /api/disbursements rejects creates against non-perfected
 * assignments with 422. Manual entry form for v1 (no AP webhook).
 */
import { describe, it, expect } from "vitest";

describe("B6: disbursement intake", () => {
  it("rejects POST against a drafted assignment with 422", async () => {
    const { POST } = await import("@/app/api/disbursements/route");
    const res = await POST(
      new Request("http://localhost/api/disbursements", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          assignment_id: "00000000-0000-0000-0000-000000000000",
          amount_cents: 100_00,
          observed_at: new Date().toISOString(),
        }),
      })
    );
    expect(res.status).toBe(422);
  });
});
