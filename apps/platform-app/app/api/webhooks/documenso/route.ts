/**
 * POST /api/webhooks/documenso
 * Validates HMAC signature, parses event, updates assignment_parties.
 * B4 acceptance constraint.
 */
import { NextRequest, NextResponse } from "next/server";
import { Client } from "pg";
import { verifySignature } from "@/lib/documenso/signature";
import { maybeAdvanceState } from "@/lib/factoring/state-machine";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const bodyText = await req.text();
  const signature = req.headers.get("x-documenso-signature") ?? "";
  const secret = process.env.DOCUMENSO_WEBHOOK_SECRET ?? "";

  if (!secret || !verifySignature(bodyText, signature, secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: { event: string; envelope_id: string; recipient_email?: string };
  try {
    event = JSON.parse(bodyText);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { envelope_id, recipient_email } = event;

  const client = new Client({
    connectionString: process.env.GC_DB_URL_POOLED,
  });

  try {
    await client.connect();

    // Find the assignment document matching this envelope
    const docRow = await client.query<{
      assignment_id: string;
      id: string;
    }>(
      "SELECT id, assignment_id FROM assignment_documents WHERE documenso_envelope_id = $1",
      [envelope_id]
    );

    if ((docRow.rowCount ?? 0) === 0) {
      return NextResponse.json({ error: "Envelope not found" }, { status: 404 });
    }

    const { assignment_id } = docRow.rows[0];

    await client.query("BEGIN");

    // Determine new party status from event type
    let newPartyStatus: "signed" | "acknowledged" = "signed";
    if (
      event.event === "document.completed" ||
      event.event === "envelope.acknowledged"
    ) {
      newPartyStatus = "acknowledged";
    } else if (
      event.event === "document.signed" ||
      event.event === "envelope.signed"
    ) {
      newPartyStatus = "signed";
    }

    // Update the matching party row
    if (recipient_email) {
      await client.query(
        `UPDATE assignment_parties
         SET status = $1, signed_at = now(), updated_at = now()
         WHERE assignment_id = $2 AND email = $3`,
        [newPartyStatus, assignment_id, recipient_email]
      );
    } else {
      // Update all parties on the envelope
      const signableRoles = ["contractor_assignor", "factor_assignee"];
      const ackRoles = [
        "contracting_officer",
        "disbursing_officer",
        "surety",
      ];
      const targetRoles =
        newPartyStatus === "signed" ? signableRoles : ackRoles;
      await client.query(
        `UPDATE assignment_parties
         SET status = $1, signed_at = now(), updated_at = now()
         WHERE assignment_id = $2 AND role = ANY($3)`,
        [newPartyStatus, assignment_id, targetRoles]
      );
    }

    // Also update document status
    if (
      event.event === "document.completed" ||
      event.event === "envelope.completed"
    ) {
      await client.query(
        `UPDATE assignment_documents
         SET status = 'executed', updated_at = now()
         WHERE documenso_envelope_id = $1`,
        [envelope_id]
      );
    } else {
      await client.query(
        `UPDATE assignment_documents
         SET status = 'signed', updated_at = now()
         WHERE documenso_envelope_id = $1`,
        [envelope_id]
      );
    }

    await client.query("COMMIT");

    // Re-evaluate state machine outside transaction (separate connection op)
    await maybeAdvanceState(client, assignment_id, null);

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("POST /api/webhooks/documenso error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  } finally {
    await client.end().catch(() => {});
  }
}
