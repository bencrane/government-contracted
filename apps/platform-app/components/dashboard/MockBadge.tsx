/**
 * Red "MOCK" marker for Overview tiles/sections whose values are fabricated
 * placeholders (lib/mock-dashboard.ts) — not sourced from catalyst_api or Postgres.
 * Rendered only when the composition root passes flagMock (non-prd); see lib/flags.ts.
 */
export default function MockBadge({ className = "" }: { className?: string }) {
  return (
    <span
      title="Fabricated placeholder — not sourced from live data"
      className={`inline-flex items-center border border-red-400 bg-red-50 px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-red-600 ${className}`}
    >
      Mock
    </span>
  );
}
