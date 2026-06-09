import type { ActiveContractsPayload, AwardLineItem } from '@/lib/catalyst/types';
import {
  EmptySurface,
  SurfaceHeader,
  Value,
  formatDate,
  formatUsd,
} from '@/components/dashboard/surfaces/primitives';

/**
 * Active prime contracts (PoP not elapsed). count + totalObligated are the
 * pre-materialized gold headlines; the rows are award_search line items. GAP
 * dimensions (option-year windows, agency POCs, modification history) render as a
 * standing "pending upstream ingest" note rather than fabricated columns.
 */
export default function ActiveContractsSurface({
  uei,
  data,
}: {
  uei: string;
  data: ActiveContractsPayload | null;
}) {
  if (!data || (data.count ?? 0) === 0) {
    return (
      <>
        <SurfaceHeader eyebrow="Active contracts" title="Contracts you're currently performing on." backHref={`/dashboard/${uei}`} />
        <EmptySurface note="No active prime contracts on record for this entity." />
      </>
    );
  }

  return (
    <section className="flex-1">
      <SurfaceHeader eyebrow="Active contracts" title="Contracts you're currently performing on." backHref={`/dashboard/${uei}`}>
        <div className="mt-4 flex flex-wrap gap-8">
          <Headline label="Active" value={String(data.count ?? 0)} />
          <Headline label="Obligated" value={formatUsd(data.totalObligated)} />
          <Headline label="Agencies" value={String(data.agencies.length)} />
        </div>
      </SurfaceHeader>

      <div className="mx-auto max-w-[1400px] px-6 py-8">
        <p className="mb-4 text-xs text-slate-400">
          Option-year decision windows, agency POCs, and modification history are{' '}
          <span className="italic">pending upstream ingest</span> — not yet available from USAspending.
        </p>
        <div className="overflow-hidden border border-line">
          <table className="w-full text-sm">
            <thead className="bg-slate-100/60">
              <tr className="text-left font-mono text-[10px] uppercase tracking-[0.14em] text-slate-500">
                <Th>Contract</Th>
                <Th>Awarding agency</Th>
                <Th className="text-right">Obligated</Th>
                <Th>Period of performance</Th>
                <Th className="text-right">Days left</Th>
                <Th>Set-aside</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {data.contracts.map((c, i) => (
                <Row key={c.awardId ?? i} c={c} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function Row({ c }: { c: AwardLineItem }) {
  return (
    <tr className="align-top">
      <td className="px-4 py-3">
        <p className="font-mono text-xs text-navy-900"><Value value={c.displayAwardId ?? c.awardId} reason="—" /></p>
        <p className="mt-0.5 max-w-md truncate text-xs text-slate-500" title={c.description ?? undefined}>
          <Value value={c.description} reason="No description" />
        </p>
      </td>
      <td className="px-4 py-3 text-navy-900"><Value value={c.awardingAgency} reason="—" /></td>
      <td className="px-4 py-3 text-right tabular-nums text-navy-900">{formatUsd(c.obligation)}</td>
      <td className="px-4 py-3 text-xs text-slate-600">
        {formatDate(c.periodStart)} → {formatDate(c.periodEnd)}
      </td>
      <td className="px-4 py-3 text-right tabular-nums text-slate-600">
        {c.daysToEnd == null ? '—' : c.daysToEnd <= 0 ? 'ended' : `${c.daysToEnd}d`}
      </td>
      <td className="px-4 py-3 text-xs text-slate-600"><Value value={c.setAside} reason="None" /></td>
    </tr>
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

function Th({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <th className={`px-4 py-2 font-normal ${className}`}>{children}</th>;
}
