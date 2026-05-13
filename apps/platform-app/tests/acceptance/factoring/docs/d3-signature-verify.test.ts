/**
 * D3 — Webhook signature verification (negative + positive).
 */
import { describe, it, expect } from "vitest";
import { createHmac } from "node:crypto";

describe("D3: signature verification", () => {
  it("rejects bad signature", async () => {
    const { verifySignature } = await import("@/lib/documenso/signature");
    expect(verifySignature("body", "deadbeef", "secret")).toBe(false);
  });

  it("accepts valid signature", async () => {
    const { verifySignature } = await import("@/lib/documenso/signature");
    const body = '{"event":"envelope.signed"}';
    const sig = createHmac("sha256", "secret").update(body).digest("hex");
    expect(verifySignature(body, sig, "secret")).toBe(true);
  });
});
