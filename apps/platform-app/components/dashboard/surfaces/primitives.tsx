/**
 * Shared presentational primitives for the catalyst-backed dashboard surfaces.
 *
 * The GAP empty-states are first-class here: a field the gold layer does not carry
 * renders an explicit muted note ("Not publicly available" / "Pending upstream
 * ingest"), never a blank or a fabricated value (operator ruling #1).
 */
import type { ReactNode } from 'react';

export function formatUsd(value: number | null | undefined): string {
  if (value == null) return '—';
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toLocaleString('en-US')}`;
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' });
}

export function GapNote({ reason }: { reason: string }) {
  return <span className="text-sm italic text-slate-400">{reason}</span>;
}

/** Render a value, or a GAP note when it is null/empty. */
export function Value({
  value,
  reason = 'Not publicly available',
}: {
  value: ReactNode | null | undefined;
  reason?: string;
}) {
  const empty =
    value == null || value === '' || (Array.isArray(value) && value.length === 0);
  return empty ? <GapNote reason={reason} /> : <>{value}</>;
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-1 text-sm text-navy-900">{children}</p>
    </div>
  );
}

export function SurfaceHeader({
  eyebrow,
  title,
  backHref,
  children,
}: {
  eyebrow: string;
  title: string;
  backHref: string;
  children?: ReactNode;
}) {
  return (
    <div className="border-b border-line bg-surface">
      <div className="mx-auto max-w-[1400px] px-6 py-6">
        <a
          href={backHref}
          className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500 hover:text-navy-700"
        >
          ← Overview
        </a>
        <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-copper-700">
          {eyebrow}
        </p>
        <h1 className="font-display mt-1 text-3xl text-navy-900">{title}</h1>
        {children}
      </div>
    </div>
  );
}

const PILL: Record<string, string> = {
  active: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  expired: 'border-red-200 bg-red-50 text-red-800',
  completed: 'border-slate-200 bg-slate-50 text-slate-600',
};

export function StatusPill({ status }: { status: string | null | undefined }) {
  if (!status) return <GapNote reason="Unknown" />;
  const cls = PILL[status] ?? 'border-slate-200 bg-slate-50 text-slate-600';
  return (
    <span
      className={`inline-flex items-center border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.1em] ${cls}`}
    >
      {status}
    </span>
  );
}

export function EmptySurface({ note }: { note: string }) {
  return (
    <div className="mx-auto max-w-[1400px] px-6 py-16 text-center">
      <p className="text-sm text-slate-500">{note}</p>
    </div>
  );
}
