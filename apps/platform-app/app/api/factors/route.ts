/**
 * POST /api/factors — factor onboarding.
 * Creates an organizations row (category='capital_provider') + factor_configurations.
 * Idempotent on duplicate slug — returns 409.
 * B1 acceptance constraint.
 */
import { NextRequest, NextResponse } from "next/server";
import { Client } from "pg";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  lockbox_bank_name: z.string().min(1),
  lockbox_account_number: z.string().min(1),
  lockbox_routing_number: z.string().length(9),
  notification_addresses: z.record(z.string()).default({}),
  default_doc_template: z.string().optional(),
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

    // Check for duplicate slug
    const existing = await client.query(
      "SELECT id FROM organizations WHERE slug = $1",
      [data.slug]
    );
    if ((existing.rowCount ?? 0) > 0) {
      return NextResponse.json(
        { error: "Slug already exists" },
        { status: 409 }
      );
    }

    await client.query("BEGIN");

    const orgResult = await client.query<{ id: string }>(
      `INSERT INTO organizations (name, slug, category)
       VALUES ($1, $2, 'capital_provider')
       RETURNING id`,
      [data.name, data.slug]
    );
    const orgId = orgResult.rows[0].id;

    await client.query(
      `INSERT INTO factor_configurations
         (organization_id, lockbox_bank_name, lockbox_account_number,
          lockbox_routing_number, notification_addresses, default_doc_template)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        orgId,
        data.lockbox_bank_name,
        data.lockbox_account_number,
        data.lockbox_routing_number,
        JSON.stringify(data.notification_addresses),
        data.default_doc_template ?? null,
      ]
    );

    // Audit log
    await client.query(
      `INSERT INTO audit_log (action, target_type, target_id, payload)
       VALUES ('factor.onboarded', 'organization', $1, $2)`,
      [orgId, JSON.stringify({ slug: data.slug, name: data.name })]
    );

    await client.query("COMMIT");

    return NextResponse.json({ slug: data.slug, organization_id: orgId }, { status: 201 });
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("POST /api/factors error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  } finally {
    await client.end().catch(() => {});
  }
}
