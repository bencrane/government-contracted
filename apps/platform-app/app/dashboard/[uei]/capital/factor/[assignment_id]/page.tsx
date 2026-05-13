/**
 * C3: Assignment detail page at /dashboard/[uei]/capital/factor/[assignment_id]
 * Shows state timeline, per-party status table, documents, and initiate-signing CTA.
 */
import { getAssignmentDetail } from "@/lib/factoring/queries";

interface Props {
  params: Promise<{ uei: string; assignment_id: string }>;
}

const STATE_ORDER = [
  "drafted",
  "executed",
  "served",
  "acknowledged",
  "perfected",
];

const ROLE_LABELS: Record<string, string> = {
  contractor_assignor: "Contractor (Assignor)",
  factor_assignee: "Factor (Assignee)",
  contracting_officer: "Contracting Officer",
  disbursing_officer: "Disbursing Officer",
  surety: "Surety",
};

export default async function AssignmentDetailPage({ params }: Props) {
  const { uei, assignment_id } = await params;

  let detail;
  try {
    detail = await getAssignmentDetail(assignment_id);
  } catch {
    detail = null;
  }

  if (!detail) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <p className="text-red-600">Assignment not found.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-12 px-4 space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-1">
          Assignment — {detail.contract_number}
        </h1>
        <p className="text-sm text-gray-500">
          Contractor UEI: {uei} · Status:{" "}
          <span className="font-medium capitalize">{detail.status}</span>
        </p>
      </div>

      {/* State machine timeline */}
      <section>
        <h2 className="text-lg font-semibold mb-3">Status Timeline</h2>
        <ol className="flex gap-2 flex-wrap">
          {STATE_ORDER.map((s) => (
            <li
              key={s}
              className={`px-3 py-1 rounded text-sm capitalize border ${
                s === detail.status
                  ? "bg-blue-600 text-white border-blue-600 font-semibold"
                  : STATE_ORDER.indexOf(s) <
                    STATE_ORDER.indexOf(detail.status)
                  ? "bg-green-100 border-green-300 text-green-700"
                  : "border-gray-200 text-gray-400"
              }`}
            >
              {s}
            </li>
          ))}
        </ol>
      </section>

      {/* Per-party status */}
      <section>
        <h2 className="text-lg font-semibold mb-3">Parties</h2>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2 font-medium">Party</th>
              <th className="text-left py-2 font-medium">Email</th>
              <th className="text-left py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {detail.parties.map((p) => (
              <tr key={p.role} className="border-b">
                <td className="py-2">
                  {ROLE_LABELS[p.role] ?? p.role}
                </td>
                <td className="py-2 text-gray-500">{p.email}</td>
                <td className="py-2 capitalize">{p.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Documents */}
      {detail.documents.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-3">Documents</h2>
          <ul className="space-y-2">
            {detail.documents.map((doc) => (
              <li key={doc.id} className="flex items-center justify-between border rounded px-4 py-2 text-sm">
                <span className="capitalize">
                  {doc.document_type.replace(/_/g, " ")}
                </span>
                <span className="text-gray-400 capitalize">{doc.status}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Initiate signing CTA */}
      {detail.status === "drafted" && (
        <section>
          <form
            action={`/api/assignments/${assignment_id}/initiate-signing`}
            method="POST"
          >
            <button
              type="submit"
              className="bg-blue-600 text-white rounded px-6 py-2 font-medium hover:bg-blue-700"
            >
              Initiate Signing
            </button>
          </form>
        </section>
      )}
    </div>
  );
}
