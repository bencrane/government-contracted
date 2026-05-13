/**
 * D2 — Multi-party signing order on the Documenso envelope:
 *   (1) contractor signs Instrument of Assignment
 *   (2) factor signs Instrument of Assignment
 *   (3) Notice served to CO
 *   (4) Notice served to DO
 *   (5) Notice served to surety (only when has_surety)
 */
import { describe, it, expect } from "vitest";

describe("D2: signing order", () => {
  it("sets sequential recipient order: contractor, factor, CO, DO", async () => {
    const { buildEnvelopeSpec } = await import("@/lib/documenso/envelope");
    const spec = buildEnvelopeSpec({
      assignment_id: "a1",
      contractor_email: "c@example.com",
      factor_email: "f@example.com",
      contracting_officer_email: "co@example.com",
      disbursing_officer_email: "do@example.com",
      has_surety: false,
    });
    const orders = spec.recipients.map((r: { order: number }) => r.order);
    expect(orders).toEqual([1, 2, 3, 4]);
  });

  it("appends surety as recipient 5 when has_surety", async () => {
    const { buildEnvelopeSpec } = await import("@/lib/documenso/envelope");
    const spec = buildEnvelopeSpec({
      assignment_id: "a1",
      contractor_email: "c@example.com",
      factor_email: "f@example.com",
      contracting_officer_email: "co@example.com",
      disbursing_officer_email: "do@example.com",
      surety_email: "s@example.com",
      has_surety: true,
    });
    expect(spec.recipients.length).toBe(5);
    expect(spec.recipients[4].role).toBe("surety");
  });
});
