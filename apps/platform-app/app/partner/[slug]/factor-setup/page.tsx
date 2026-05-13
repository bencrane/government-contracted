/**
 * C1: Factor onboarding page at /partner/[slug]/factor-setup
 * Multi-step form: basic info → lockbox bank info → notification addresses.
 */

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function FactorSetupPage({ params }: Props) {
  const { slug } = await params;

  return (
    <div className="max-w-xl mx-auto py-12 px-4">
      <h1 className="text-2xl font-bold mb-2">Factor Setup</h1>
      <p className="text-sm text-gray-500 mb-8">
        Configure your factor profile for <strong>{slug}</strong>.
      </p>

      <form action="/api/factors" method="POST" className="space-y-6">
        <input type="hidden" name="slug" value={slug} />

        {/* Basic info */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Basic Information</h2>
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1">
              Organization Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              className="w-full border rounded px-3 py-2 text-sm"
              placeholder="e.g. Capitol Surety Partners"
            />
          </div>
        </section>

        {/* Lockbox bank info */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Lockbox Bank Information</h2>
          <div>
            <label
              htmlFor="lockbox_bank_name"
              className="block text-sm font-medium mb-1"
            >
              Lockbox Bank Name
            </label>
            <input
              id="lockbox_bank_name"
              name="lockbox_bank_name"
              type="text"
              required
              className="w-full border rounded px-3 py-2 text-sm"
              placeholder="e.g. JPMorgan Chase"
            />
          </div>
          <div>
            <label
              htmlFor="lockbox_account_number"
              className="block text-sm font-medium mb-1"
            >
              Lockbox Account Number
            </label>
            <input
              id="lockbox_account_number"
              name="lockbox_account_number"
              type="text"
              required
              className="w-full border rounded px-3 py-2 text-sm"
              placeholder="Account number"
            />
          </div>
          <div>
            <label
              htmlFor="lockbox_routing_number"
              className="block text-sm font-medium mb-1"
            >
              Routing Number
            </label>
            <input
              id="lockbox_routing_number"
              name="lockbox_routing_number"
              type="text"
              required
              pattern="[0-9]{9}"
              className="w-full border rounded px-3 py-2 text-sm"
              placeholder="9-digit routing number"
            />
          </div>
        </section>

        {/* Notification addresses */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Notification Addresses</h2>
          <div>
            <label
              htmlFor="notification_email"
              className="block text-sm font-medium mb-1"
            >
              Primary Notification Email
            </label>
            <input
              id="notification_email"
              name="notification_email"
              type="email"
              className="w-full border rounded px-3 py-2 text-sm"
              placeholder="ops@yourfactor.com"
            />
          </div>
        </section>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white rounded px-4 py-2 font-medium hover:bg-blue-700"
        >
          Complete Setup
        </button>
      </form>
    </div>
  );
}
