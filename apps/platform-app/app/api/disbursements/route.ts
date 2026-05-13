/**
 * POST /api/disbursements — record an observed government payment.
 * Rejects if assignment is not in 'perfected' state (422).
 * On success: creates disbursements row + factor_billing_events row + fires Stripe meter.
 * B6, B7 acceptance constraints.
 */
import { NextRequest, NextResponse } from "next/server";
import { Client } from "pg";
import { z } from "zod";
import { fireMeterEvent, buildMeterPayload } from "@/lib/stripe/meter";

const schema = z.object({
  assignment_id: z.string().uuid(),
  amount_cents: z.number().int().positive(),
  observed_at: z.string().datetime(),
  notes: z.string().optional(),
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 422 }
    );
  }

  const data = parsed.data;
  const client = new Client({
    connectionString: process.env.GC_DB_URL_POOLED,
  });

  try {
    await client.connect();

    // Check assignment exists and is perfected
    const aRow = await client.query<{
      id: string;
      status: string;
      factor_org_id: string;
    }>(
      "SELECT id, status, factor_org_id FROM assignments WHERE id = $1",
      [data.assignment_id]
    );

    if ((aRow.rowCount ?? 0) === 0) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 422 });
    }

    const assignment = aRow.rows[0];

    if (assignment.status !== "perfected") {
      return NextResponse.json(
        {
          error: `Cannot record disbursement for assignment in state: ${assignment.status}`,
        },
        { status: 422 }
      );
    }

    await client.query("BEGIN");

    // Create disbursement
    const dResult = await client.query<{ id: string }>(
      `INSERT INTO disbursements (assignment_id, amount_cents, observed_at, notes)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [
        data.assignment_id,
        data.amount_cents,
        data.observed_at,
        data.notes ?? null,
      ]
    );
    const disbursementId = dResult.rows[0].id;

    // Fire Stripe meter event
    const meterPayload = buildMeterPayload({
      disbursement_id: disbursementId,
      factor_org_id: assignment.factor_org_id,
      amount_cents: data.amount_cents,
      observed_at: new Date(data.observed_at),
    });

    const meterResult = await fireMeterEvent({
      event_name: "disbursement.observed",
      payload: meterPayload,
      idempotency_key: disbursementId,
    });

    // Record billing event
    const billingStatus = meterResult.id.startsWith("fixture_")
      ? "fixture"
      : "fired";

    await client.query(
      `INSERT INTO factor_billing_events
         (disbursement_id, stripe_meter_event_id, payload, status)
       VALUES ($1, $2, $3, $4)`,
      [
        disbursementId,
        meterResult.id,
        JSON.stringify(meterPayload),
        billingStatus,
      ]
    );

    // Audit log
    await client.query(
      `INSERT INTO audit_log (action, target_type, target_id, payload)
       VALUES ('disbursement.observed', 'disbursement', $1, $2)`,
      [
        disbursementId,
        JSON.stringify({
          assignment_id: data.assignment_id,
          amount_cents: data.amount_cents,
          stripe_event_id: meterResult.id,
        }),
      ]
    );

    // Audit: stripe meter fired
    await client.query(
      `INSERT INTO audit_log (action, target_type, target_id, payload)
       VALUES ('stripe.meter.fired', 'disbursement', $1, $2)`,
      [
        disbursementId,
        JSON.stringify({
          event_name: "disbursement.observed",
          event_id: meterResult.id,
        }),
      ]
    );

    await client.query("COMMIT");

    return NextResponse.json(
      { disbursement_id: disbursementId, billing_event_id: meterResult.id },
      { status: 201 }
    );
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("POST /api/disbursements error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  } finally {
    await client.end().catch(() => {});
  }
}
