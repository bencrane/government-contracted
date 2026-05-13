/**
 * D1 — Documenso client uses recorded fixtures (no live URL required).
 *
 * Validator decision: self-hosted Documenso is NOT available in this env at
 * harness time (no DOCUMENSO_API_URL secret in Doppler, no local instance,
 * no docker-compose pre-staged). The executor wires `lib/documenso/client.ts`
 * to either (a) hit a live URL if `DOCUMENSO_API_URL` is set, OR (b) play
 * recorded fixtures from `tests/acceptance/factoring/_fixtures/documenso/*.json`.
 *
 * This test verifies the fixture-mode path. Test 0 of D-suite.
 */
import { describe, it, expect, vi } from "vitest";

describe("D1: Documenso client fixture mode", () => {
  it("returns fixture response when DOCUMENSO_API_URL is unset", async () => {
    const oldUrl = process.env.DOCUMENSO_API_URL;
    delete process.env.DOCUMENSO_API_URL;
    try {
      const { createEnvelope } = await import("@/lib/documenso/client");
      const res = await createEnvelope({
        template: "instrument-of-assignment",
        recipients: [
          { role: "contractor_assignor", email: "c@example.com" },
          { role: "factor_assignee", email: "f@example.com" },
        ],
      });
      expect(res.envelope_id).toMatch(/^fixture_/);
      expect(res.status).toBe("created");
    } finally {
      if (oldUrl !== undefined) process.env.DOCUMENSO_API_URL = oldUrl;
    }
  });
});
