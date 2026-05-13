/**
 * POST /api/assignments — contractor assignment intake.
 * Creates an assignments row in 'drafted' state.
 * B2 acceptance constraint.
 */
import { NextRequest, NextResponse } from "next/server";
import { Client } from "pg";
import { z } from "zod";

const schema = z.object({
  factor_slug: z.string().min(1),
  contractor_uei: z.string().min(1),
  contract_number: z.string().min(1),
  contract_value_cents: z.number().int().positive(),
  sole_or_joint_payee: z.enum(["sole", "joint"]),
  has_surety: z.boolean().default(false),
  // Optional party emails for immediate party seeding
  contractor_email: z.string().email().optional(),
  contractor_name: z.string().optional(),
  contracting_officer_email: z.string().email().optional(),
  contracting_officer_name: z.string().optional(),
  disbursing_officer_email: z.string().email().optional(),
  disbursing_officer_name: z.string().optional(),
  surety_email: z.string().email().optional(),
  surety_name: z.string().optional(),
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

    // Resolve factor org
    const factorRow = await client.query<{ id: string }>(
      "SELECT id FROM organizations WHERE slug = $1 AND category = 'capital_provider'",
      [data.factor_slug]
    );
    if ((factorRow.rowCount ?? 0) === 0) {
      return NextResponse.json(
        { error: `Factor not found: ${data.factor_slug}` },
        { status: 422 }
      );
    }
    const factorOrgId = factorRow.rows[0].id;

    // Resolve or create contractor org by UEI
    let contractorOrgId: string;
    const contractorRow = await client.query<{ id: string }>(
      "SELECT id FROM organizations WHERE uei = $1",
      [data.contractor_uei]
    );
    if ((contractorRow.rowCount ?? 0) > 0) {
      contractorOrgId = contractorRow.rows[0].id;
    } else {
      // Auto-create contractor org stub
      const newOrg = await client.query<{ id: string }>(
        `INSERT INTO organizations (name, uei, category)
         VALUES ($1, $2, 'contractor')
         RETURNING id`,
        [`Contractor ${data.contractor_uei}`, data.contractor_uei]
      );
      contractorOrgId = newOrg.rows[0].id;
    }

    await client.query("BEGIN");

    const aResult = await client.query<{ id: string }>(
      `INSERT INTO assignments
         (contractor_org_id, factor_org_id, contract_number,
          contract_value_cents, sole_or_joint_payee, has_surety, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'drafted')
       RETURNING id`,
      [
        contractorOrgId,
        factorOrgId,
        data.contract_number,
        data.contract_value_cents,
        data.sole_or_joint_payee,
        data.has_surety,
      ]
    );
    const assignmentId = aResult.rows[0].id;

    // Seed assignment_parties
    const partiesToSeed: Array<{
      role: string;
      email: string;
      name?: string;
    }> = [];

    if (data.contractor_email) {
      partiesToSeed.push({
        role: "contractor_assignor",
        email: data.contractor_email,
        name: data.contractor_name,
      });
    }
    if (data.contracting_officer_email) {
      partiesToSeed.push({
        role: "contracting_officer",
        email: data.contracting_officer_email,
        name: data.contracting_officer_name,
      });
    }
    if (data.disbursing_officer_email) {
      partiesToSeed.push({
        role: "disbursing_officer",
        email: data.disbursing_officer_email,
        name: data.disbursing_officer_name,
      });
    }
    if (data.has_surety && data.surety_email) {
      partiesToSeed.push({
        role: "surety",
        email: data.surety_email,
        name: data.surety_name,
      });
    }

    for (const party of partiesToSeed) {
      await client.query(
        `INSERT INTO assignment_parties (assignment_id, role, email, name, status)
         VALUES ($1, $2, $3, $4, 'pending')
         ON CONFLICT (assignment_id, role) DO NOTHING`,
        [assignmentId, party.role, party.email, party.name ?? null]
      );
    }

    // Audit log
    await client.query(
      `INSERT INTO audit_log (action, target_type, target_id, payload)
       VALUES ('assignment.created', 'assignment', $1, $2)`,
      [
        assignmentId,
        JSON.stringify({
          contract_number: data.contract_number,
          factor_slug: data.factor_slug,
          contractor_uei: data.contractor_uei,
        }),
      ]
    );

    await client.query("COMMIT");

    return NextResponse.json(
      { assignment_id: assignmentId, status: "drafted" },
      { status: 201 }
    );
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("POST /api/assignments error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  } finally {
    await client.end().catch(() => {});
  }
}
