import type { PastPerformancePayload, AwardLineItem } from '@/lib/catalyst/types';
import {
  SurfaceHeader,
  Value,
  formatDate,
  formatUsd,
} from '@/components/dashboard/surfaces/primitives';

/**
 * Past performance — closed prime contracts + lifetime headlines from the gold
 * row. CPARS ratings, exclusions monitoring, and recompete radar are GAPs (no
 * source dataset) and render as explicit "pending upstream ingest" panels rather
 * than fabricated ratings.
 */
export default function PastPerformanceSurface({
  uei,
  data,
}: {
  uei: string;
  data: PastPerformancePayload | null;
}) {
  const contracts: AwardLineItem[] = data?.contracts ?? [];

  return (
    <section className="flex-1">
      <SurfaceHeader eyebrow="Past performance" title="Your delivery record." backHref={`/dashboard/${uei}`}>
        <div className="mt-4 flex flex-wrap gap-8">
          <Headline label="Lifetime awarded" value={formatUsd(data?.awardsLifetime ?? null)} />
          <Headline label="Lifetime contracts" value={data?.contractsLifetime != null ? String(data.contractsLifetime) : '—'} />
          <Headline label="Closed" value={data?.closedCount != null ? String(data.closedCount) : '—'} />
        </div>
      </SurfaceHeader>

      <div className="mx-auto max-w-[1400px] space-y-10 px-6 py-8">
        <div>
          <h2 className="font-display mb-4 text-xl text-navy-900">Completed contracts</h2>
          {contracts.length === 0 ? (
            <p className="text-sm text-slate-500">No completed prime contracts on record.</p>
          ) : (
            <div className="overflow-hidden border border-line">
              <table className="w-full text-sm">
                <thead className="bg-slate-100/60">
                  <tr className="text-left font-mono text-[10px] uppercase tracking-[0.14em] text-slate-500">
                    <th className="px-4 py-2 font-normal">Contract</th>
                    <th className="px-4 py-2 font-normal">Awarding agency</th>
                    <th className="px-4 py-2 text-right font-normal">Obligated</th>
                    <th className="px-4 py-2 font-normal">Ended</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {contracts.map((c, i) => (
                    <tr key={c.awardId ?? i}>
                      <td className="px-4 py-3 font-mono text-xs text-navy-900">
                        <Value value={c.displayAwardId ?? c.awardId} reason="—" />
                      </td>
                      <td className="px-4 py-3 text-navy-900"><Value value={c.awardingAgency} reason="—" /></td>
                      <td className="px-4 py-3 text-right tabular-nums text-navy-900">{formatUsd(c.obligation)}</td>
                      <td className="px-4 py-3 text-xs text-slate-600">{formatDate(c.periodEnd)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <GapPanel title="CPARS ratings" note="Pending upstream ingest — no CPARS dataset wired yet." />
          <GapPanel title="Exclusions monitoring" note="Pending upstream ingest — SAM exclusions feed not yet wired." />
          <GapPanel title="Recompete radar" note="Pending upstream ingest — option/recompete metadata not yet available." />
        </div>
      </div>
    </section>
  );
}

function GapPanel({ title, note }: { title: string; note: string }) {
  return (
    <div className="border border-dashed border-line bg-slate-50/50 p-5">
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">{title}</p>
      <p className="mt-2 text-sm italic text-slate-400">{note}</p>
    </div>
  );
}

function Headline({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-1 font-display text-2xl text-navy-900">{value}</p>
    </div>
  );
}
