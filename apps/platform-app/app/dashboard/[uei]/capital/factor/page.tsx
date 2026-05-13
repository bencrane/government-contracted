/**
 * C2: Assignment intake page at /dashboard/[uei]/capital/factor
 * Form for contractor to initiate an assignment.
 */

interface Props {
  params: Promise<{ uei: string }>;
}

export default async function FactorIntakePage({ params }: Props) {
  const { uei } = await params;

  return (
    <div className="max-w-lg mx-auto py-12 px-4">
      <h1 className="text-2xl font-bold mb-2">Assign Contract Receivables</h1>
      <p className="text-sm text-gray-500 mb-8">
        Assign monies due under a federal contract to a factor (financial
        institution) under the Assignment of Claims Act (FAR Subpart 32.8).
      </p>

      <form
        action="/api/assignments"
        method="POST"
        className="space-y-5"
      >
        <input type="hidden" name="contractor_uei" value={uei} />

        <div>
          <label
            htmlFor="contract_number"
            className="block text-sm font-medium mb-1"
          >
            Contract Number
          </label>
          <input
            id="contract_number"
            name="contract_number"
            type="text"
            required
            className="w-full border rounded px-3 py-2 text-sm"
            placeholder="e.g. W912DR-26-C-0001"
          />
        </div>

        <div>
          <label
            htmlFor="factor_slug"
            className="block text-sm font-medium mb-1"
          >
            Factor (Financial Institution)
          </label>
          <input
            id="factor_slug"
            name="factor_slug"
            type="text"
            required
            className="w-full border rounded px-3 py-2 text-sm"
            placeholder="Factor slug"
          />
        </div>

        <div>
          <label
            htmlFor="contract_value_cents"
            className="block text-sm font-medium mb-1"
          >
            Contract Value (cents)
          </label>
          <input
            id="contract_value_cents"
            name="contract_value_cents"
            type="number"
            required
            min="1"
            className="w-full border rounded px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label
            htmlFor="sole_or_joint_payee"
            className="block text-sm font-medium mb-1"
          >
            Payee Type
          </label>
          <select
            id="sole_or_joint_payee"
            name="sole_or_joint_payee"
            required
            className="w-full border rounded px-3 py-2 text-sm"
          >
            <option value="sole">Sole payee</option>
            <option value="joint">Joint payee</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <input
            id="has_surety"
            name="has_surety"
            type="checkbox"
            value="true"
          />
          <label htmlFor="has_surety" className="text-sm">
            Performance/payment bond (surety party required)
          </label>
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white rounded px-4 py-2 font-medium hover:bg-blue-700"
        >
          Submit Assignment
        </button>
      </form>
    </div>
  );
}
