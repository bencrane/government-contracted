/**
 * F1 — Document content SHA-256 stored on retrieval; mismatch flagged.
 *
 * Implementation note: `content_sha256` is a `text` column storing the
 * lowercase hex digest of the bytes returned from Documenso's "download
 * signed document" API. Recomputed on every retrieval. Mismatch is
 * tamper-evidence — log to audit_log + return 409 from the download
 * endpoint.
 */
import { describe, it, expect } from "vitest";
import { createHash } from "node:crypto";

describe("F1: document content hash", () => {
  it("computes the stored hash as lowercase hex SHA-256", async () => {
    const { hashDocument } = await import("@/lib/factoring/document-hash");
    const sample = Buffer.from("test content");
    const expected = createHash("sha256").update(sample).digest("hex");
    expect(hashDocument(sample)).toBe(expected);
  });

  it("detects tampering when recomputed digest differs from stored", async () => {
    const { verifyDocumentHash } = await import("@/lib/factoring/document-hash");
    expect(
      verifyDocumentHash(Buffer.from("a"), createHash("sha256").update("b").digest("hex"))
    ).toBe(false);
    expect(
      verifyDocumentHash(Buffer.from("a"), createHash("sha256").update("a").digest("hex"))
    ).toBe(true);
  });
});
