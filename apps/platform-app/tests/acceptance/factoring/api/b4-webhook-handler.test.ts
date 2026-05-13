/**
 * B4 — POST /api/webhooks/documenso validates HMAC signature using
 * DOCUMENSO_WEBHOOK_SECRET, parses the event, updates the matching
 * assignment_parties row. Bad signature returns 401; unknown envelope 404.
 */
import { describe, it, expect } from "vitest";
import { createHmac } from "node:crypto";

describe("B4: Documenso webhook handler", () => {
  it("returns 401 on invalid signature", async () => {
    const { POST } = await import("@/app/api/webhooks/documenso/route");
    const body = JSON.stringify({ event: "envelope.signed", envelope_id: "fixture_e1" });
    const res = await POST(
      new Request("http://localhost/api/webhooks/documenso", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-documenso-signature": "deadbeef",
        },
        body,
      })
    );
    expect(res.status).toBe(401);
  });

  it("returns 404 for unknown envelope_id", async () => {
    process.env.DOCUMENSO_WEBHOOK_SECRET = "test-secret";
    const { POST } = await import("@/app/api/webhooks/documenso/route");
    const body = JSON.stringify({ event: "envelope.signed", envelope_id: "fixture_missing" });
    const signature = createHmac("sha256", "test-secret").update(body).digest("hex");
    const res = await POST(
      new Request("http://localhost/api/webhooks/documenso", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-documenso-signature": signature,
        },
        body,
      })
    );
    expect(res.status).toBe(404);
  });
});
