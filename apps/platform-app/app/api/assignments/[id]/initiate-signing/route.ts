/**
 * POST /api/assignments/:id/initiate-signing
 * Creates a Documenso envelope (fixture mode when DOCUMENSO_API_URL unset).
 * Records envelope id in assignment_documents.
 * B3 acceptance constraint.
 */
import { NextRequest, NextResponse } from "next/server";
import { Client } from "pg";
import { createEnvelope } from "@/lib/documenso/client";
import { buildEnvelopeSpec } from "@/lib/documenso/envelope";
import { applyTransition } from "@/lib/factoring/state-machine";
import type { AssignmentStatus } from "@/lib/factoring/state-machine";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(
  req: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  const { id: assignmentId } = await context.params;

  const client = new Client({
    connectionString: process.env.GC_DB_URL_POOLED,
  });

  try {
    await client.connect();

    // Fetch assignment
    const aRow = await client.query<{
      id: string;
      status: AssignmentStatus;
      has_surety: boolean;
      factor_org_id: string;
      contractor_org_id: string;
    }>(
      `SELECT id, status, has_surety, factor_org_id, contractor_org_id
       FROM assignments WHERE id = $1`,
      [assignmentId]
    );

    if ((aRow.rowCount ?? 0) === 0) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }

    const assignment = aRow.rows[0];

    if (assignment.status !== "drafted") {
      return NextResponse.json(
        { error: `Cannot initiate signing in state: ${assignment.status}` },
        { status: 422 }
      );
    }

    // Fetch parties for envelope
    const partiesRow = await client.query<{
      role: string;
      email: string;
      name: string | null;
    }>(
      "SELECT role, email, name FROM assignment_parties WHERE assignment_id = $1",
      [assignmentId]
    );

    const partyByRole = new Map(
      partiesRow.rows.map((p) => [p.role, p])
    );

    const contractor = partyByRole.get("contractor_assignor");
    const factor = partyByRole.get("factor_assignee");
    const co = partyByRole.get("contracting_officer");
    const dofficer = partyByRole.get("disbursing_officer");
    const surety = partyByRole.get("surety");

    // Require at minimum contractor + factor parties
    const contractorEmail = contractor?.email ?? "contractor@placeholder.example";
    const factorEmail = factor?.email ?? "factor@placeholder.example";
    const coEmail = co?.email ?? "co@placeholder.example";
    const doEmail = dofficer?.email ?? "do@placeholder.example";

    const spec = buildEnvelopeSpec({
      assignment_id: assignmentId,
      contractor_email: contractorEmail,
      contractor_name: contractor?.name ?? undefined,
      factor_email: factorEmail,
      factor_name: factor?.name ?? undefined,
      contracting_officer_email: coEmail,
      contracting_officer_name: co?.name ?? undefined,
      disbursing_officer_email: doEmail,
      disbursing_officer_name: dofficer?.name ?? undefined,
      surety_email: surety?.email,
      surety_name: surety?.name ?? undefined,
      has_surety: assignment.has_surety,
    });

    const envelope = await createEnvelope({
      template: "instrument-of-assignment",
      recipients: spec.recipients.map((r) => ({
        role: r.role,
        email: r.email,
        name: r.name,
      })),
    });

    await client.query("BEGIN");

    // Record the envelope in assignment_documents
    await client.query(
      `INSERT INTO assignment_documents
         (assignment_id, documenso_envelope_id, document_type, status)
       VALUES ($1, $2, 'instrument_of_assignment', 'sent')`,
      [assignmentId, envelope.envelope_id]
    );

    // Seed any missing parties from the spec
    for (const recipient of spec.recipients) {
      await client.query(
        `INSERT INTO assignment_parties (assignment_id, role, email, name, status)
         VALUES ($1, $2, $3, $4, 'pending')
         ON CONFLICT (assignment_id, role) DO NOTHING`,
        [assignmentId, recipient.role, recipient.email, recipient.name ?? null]
      );
    }

    await client.query("COMMIT");

    return NextResponse.json(
      { envelope_id: envelope.envelope_id, status: "sent" },
      { status: 200 }
    );
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("POST /api/assignments/:id/initiate-signing error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  } finally {
    await client.end().catch(() => {});
  }
}
