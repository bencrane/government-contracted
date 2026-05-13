/**
 * Build Documenso envelope specs from assignment data.
 *
 * Signing order (FAR 32.805 procedure):
 *   1. contractor_assignor — signs Instrument of Assignment
 *   2. factor_assignee     — signs Instrument of Assignment
 *   3. contracting_officer — approves (acknowledges) Notice of Assignment
 *   4. disbursing_officer  — approves (acknowledges) Notice of Assignment
 *   5. surety              — approves (acknowledges) Notice of Assignment (has_surety only)
 *
 * Documenso roles:
 *   - contractor_assignor, factor_assignee: "signer"
 *   - contracting_officer, disbursing_officer, surety: "approver"
 */

export interface EnvelopeRecipientSpec {
  role: string;
  documenso_role: "signer" | "approver";
  email: string;
  name?: string;
  order: number;
}

export interface EnvelopeSpec {
  assignment_id: string;
  recipients: EnvelopeRecipientSpec[];
}

export interface BuildEnvelopeSpecInput {
  assignment_id: string;
  contractor_email: string;
  contractor_name?: string;
  factor_email: string;
  factor_name?: string;
  contracting_officer_email: string;
  contracting_officer_name?: string;
  disbursing_officer_email: string;
  disbursing_officer_name?: string;
  surety_email?: string;
  surety_name?: string;
  has_surety: boolean;
}

export function buildEnvelopeSpec(input: BuildEnvelopeSpecInput): EnvelopeSpec {
  const recipients: EnvelopeRecipientSpec[] = [
    {
      role: "contractor_assignor",
      documenso_role: "signer",
      email: input.contractor_email,
      name: input.contractor_name,
      order: 1,
    },
    {
      role: "factor_assignee",
      documenso_role: "signer",
      email: input.factor_email,
      name: input.factor_name,
      order: 2,
    },
    {
      role: "contracting_officer",
      documenso_role: "approver",
      email: input.contracting_officer_email,
      name: input.contracting_officer_name,
      order: 3,
    },
    {
      role: "disbursing_officer",
      documenso_role: "approver",
      email: input.disbursing_officer_email,
      name: input.disbursing_officer_name,
      order: 4,
    },
  ];

  if (input.has_surety && input.surety_email) {
    recipients.push({
      role: "surety",
      documenso_role: "approver",
      email: input.surety_email,
      name: input.surety_name,
      order: 5,
    });
  }

  return {
    assignment_id: input.assignment_id,
    recipients,
  };
}
