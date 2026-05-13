/**
 * Documenso webhook signature verification.
 * HMAC-SHA256 of the raw request body using DOCUMENSO_WEBHOOK_SECRET.
 */
import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Verify a Documenso webhook signature.
 * @param body - raw request body string
 * @param signature - hex digest from x-documenso-signature header
 * @param secret - DOCUMENSO_WEBHOOK_SECRET
 */
export function verifySignature(
  body: string,
  signature: string,
  secret: string
): boolean {
  const expected = createHmac("sha256", secret).update(body).digest("hex");
  try {
    return timingSafeEqual(
      Buffer.from(expected, "hex"),
      Buffer.from(signature, "hex")
    );
  } catch {
    return false;
  }
}
