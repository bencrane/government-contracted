/**
 * D4 — Documenso recipient roles. Government recipients (CO, DO, surety)
 * are `approver` (ack receipt), not `signer`. Contractor + factor are
 * `signer` (execute the Instrument of Assignment).
 */
import { describe, it, expect } from "vitest";

describe("D4: recipient roles", () => {
  it("uses signer role only for contractor + factor", async () => {
    const { buildEnvelopeSpec } = await import("@/lib/documenso/envelope");
    const spec = buildEnvelopeSpec({
      assignment_id: "a1",
      contractor_email: "c@example.com",
      factor_email: "f@example.com",
      contracting_officer_email: "co@example.com",
      disbursing_officer_email: "do@example.com",
      has_surety: false,
    });
    const byRole: Record<string, string> = {};
    for (const r of spec.recipients as Array<{ role: string; documenso_role: string }>) {
      byRole[r.role] = r.documenso_role;
    }
    expect(byRole.contractor_assignor).toBe("signer");
    expect(byRole.factor_assignee).toBe("signer");
    expect(byRole.contracting_officer).toBe("approver");
    expect(byRole.disbursing_officer).toBe("approver");
  });
});
