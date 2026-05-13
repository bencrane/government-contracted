/**
 * C4: Partner factor pipeline at /partner/[slug]/factor-pipeline
 * Shows the factor's active assignments grouped by state.
 */
import { getFactorPipeline } from "@/lib/factoring/queries";

interface Props {
  params: Promise<{ slug: string }>;
}

const STATUS_LABELS: Record<string, string> = {
  drafted: "Drafted",
  executed: "Executed",
  served: "Served",
  acknowledged: "Acknowledged",
  perfected: "Perfected",
  terminated: "Terminated",
  rejected: "Rejected",
};

const STATUS_ORDER = [
  "drafted",
  "executed",
  "served",
  "acknowledged",
  "perfected",
];

export default async function FactorPipelinePage({ params }: Props) {
  const { slug } = await params;

  let pipeline;
  try {
    pipeline = await getFactorPipeline(slug);
  } catch {
    pipeline = {
      drafted: [],
      executed: [],
      served: [],
      acknowledged: [],
      perfected: [],
      terminated: [],
      rejected: [],
    };
  }

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <h1 className="text-2xl font-bold mb-8">Factor Pipeline</h1>

      {STATUS_ORDER.map((state) => {
        const assignments =
          pipeline[state as keyof typeof pipeline] ?? [];
        return (
          <section key={state} className="mb-8">
            <h2 className="text-lg font-semibold mb-3 capitalize">
              {STATUS_LABELS[state] ?? state}
            </h2>
            {assignments.length === 0 ? (
              <p className="text-sm text-gray-400">No assignments.</p>
            ) : (
              <ul className="space-y-2">
                {assignments.map((a) => (
                  <li
                    key={a.id}
                    className="border rounded px-4 py-3 text-sm"
                  >
                    {a.contract_number}
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}
