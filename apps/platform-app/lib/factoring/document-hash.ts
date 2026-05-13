/**
 * Document tamper-evidence via SHA-256 content hashing.
 * Hash is stored as lowercase hex in assignment_documents.content_sha256.
 * Recomputed on retrieval; mismatch = tamper alert.
 */
import { createHash } from "node:crypto";

/** Compute SHA-256 of document bytes, returned as lowercase hex. */
export function hashDocument(content: Buffer): string {
  return createHash("sha256").update(content).digest("hex");
}

/**
 * Verify a document against its stored hash.
 * Returns true iff the content hashes to storedHash.
 */
export function verifyDocumentHash(
  content: Buffer,
  storedHash: string
): boolean {
  const computed = hashDocument(content);
  return computed === storedHash;
}
