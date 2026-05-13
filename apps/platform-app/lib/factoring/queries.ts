/**
 * Factoring read queries for UI pages.
 */
import { Client } from "pg";

const DATABASE_URL = process.env.GC_DB_URL_POOLED;

function getClient(): Client {
  return new Client({ connectionString: DATABASE_URL });
}

export interface AssignmentParty {
  role: string;
  status: string;
  signed_at: string | null;
  email: string;
  name: string | null;
}

export interface AssignmentDocument {
  id: string;
  documenso_envelope_id: string;
  document_type: string;
  status: string;
  content_sha256: string | null;
}

export interface AssignmentTransition {
  id: string;
  previous_state: string;
  new_state: string;
  transition_reason: string | null;
  created_at: string;
}

export interface AssignmentDetail {
  id: string;
  status: string;
  contract_number: string;
  contract_value_cents: number;
  has_surety: boolean;
  parties: AssignmentParty[];
  documents: AssignmentDocument[];
  transitions: AssignmentTransition[];
  created_at: string;
}

export async function getAssignmentDetail(
  assignmentId: string
): Promise<AssignmentDetail | null> {
  const client = getClient();
  await client.connect();
  try {
    const aRow = await client.query(
      `SELECT id, status, contract_number, contract_value_cents, has_surety, created_at
       FROM assignments WHERE id = $1`,
      [assignmentId]
    );
    if (aRow.rowCount === 0) return null;
    const a = aRow.rows[0];

    const parties = await client.query<AssignmentParty>(
      `SELECT role, status, signed_at, email, name
       FROM assignment_parties WHERE assignment_id = $1
       ORDER BY created_at`,
      [assignmentId]
    );

    const docs = await client.query<AssignmentDocument>(
      `SELECT id, documenso_envelope_id, document_type, status, content_sha256
       FROM assignment_documents WHERE assignment_id = $1
       ORDER BY created_at`,
      [assignmentId]
    );

    const transitions = await client.query<AssignmentTransition>(
      `SELECT id, previous_state, new_state, transition_reason, created_at
       FROM assignment_state_transitions WHERE assignment_id = $1
       ORDER BY created_at`,
      [assignmentId]
    );

    return {
      ...a,
      parties: parties.rows,
      documents: docs.rows,
      transitions: transitions.rows,
    };
  } finally {
    await client.end();
  }
}

export interface PipelineGroup {
  drafted: Array<{ id: string; contract_number: string }>;
  executed: Array<{ id: string; contract_number: string }>;
  served: Array<{ id: string; contract_number: string }>;
  acknowledged: Array<{ id: string; contract_number: string }>;
  perfected: Array<{ id: string; contract_number: string }>;
  terminated: Array<{ id: string; contract_number: string }>;
  rejected: Array<{ id: string; contract_number: string }>;
}

export async function getFactorPipeline(
  factorSlug: string
): Promise<PipelineGroup> {
  const client = getClient();
  await client.connect();
  try {
    const result = await client.query<{
      id: string;
      contract_number: string;
      status: string;
    }>(
      `SELECT a.id, a.contract_number, a.status
       FROM assignments a
       JOIN organizations o ON o.id = a.factor_org_id
       WHERE o.slug = $1
       AND a.status NOT IN ('terminated', 'rejected')
       ORDER BY a.created_at DESC`,
      [factorSlug]
    );

    const groups: PipelineGroup = {
      drafted: [],
      executed: [],
      served: [],
      acknowledged: [],
      perfected: [],
      terminated: [],
      rejected: [],
    };

    for (const row of result.rows) {
      const key = row.status as keyof PipelineGroup;
      if (key in groups) {
        groups[key].push({ id: row.id, contract_number: row.contract_number });
      }
    }
    return groups;
  } finally {
    await client.end();
  }
}
