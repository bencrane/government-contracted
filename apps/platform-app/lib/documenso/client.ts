/**
 * Documenso client — fixture mode when DOCUMENSO_API_URL is unset.
 * Real impl hits the Documenso REST API; fixture impl reads recorded JSON.
 *
 * v1.1: set DOCUMENSO_API_URL in Doppler to enable live mode.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { randomBytes } from "node:crypto";

const FIXTURE_DIR = join(
  process.cwd(),
  "tests/acceptance/factoring/_fixtures/documenso"
);

function loadFixture(name: string): unknown {
  const path = join(FIXTURE_DIR, `${name}.json`);
  return JSON.parse(readFileSync(path, "utf-8"));
}

export interface EnvelopeRecipient {
  role: string;
  email: string;
  name?: string;
}

export interface CreateEnvelopeSpec {
  template: string;
  recipients: EnvelopeRecipient[];
}

export interface CreateEnvelopeResult {
  envelope_id: string;
  status: string;
}

export async function createEnvelope(
  spec: CreateEnvelopeSpec
): Promise<CreateEnvelopeResult> {
  const apiUrl = process.env.DOCUMENSO_API_URL;
  if (!apiUrl) {
    // Fixture mode — return recorded response
    const fixture = loadFixture("create-envelope-success") as CreateEnvelopeResult;
    return {
      envelope_id: `fixture_${randomBytes(8).toString("hex")}`,
      status: fixture.status ?? "created",
    };
  }
  // Live mode
  const res = await fetch(`${apiUrl}/api/v1/envelopes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.DOCUMENSO_API_KEY ?? ""}`,
    },
    body: JSON.stringify(spec),
  });
  if (!res.ok) {
    throw new Error(`Documenso createEnvelope failed: ${res.status}`);
  }
  return res.json() as Promise<CreateEnvelopeResult>;
}
