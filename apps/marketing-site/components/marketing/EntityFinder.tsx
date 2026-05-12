"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Search, Loader2, ArrowRight, Building2, Landmark, AlertCircle } from "lucide-react";
import { searchEntity, type EntitySearchResult } from "@/lib/actions/search-entity";

const SUGGESTIONS = [
  "Lockheed Martin",
  "Booz Allen Hamilton",
  "SAIC",
  "Leidos",
  "RTX",
];

export default function EntityFinder() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<EntitySearchResult | null>(null);
  const [pending, startTransition] = useTransition();

  function runSearch(q: string) {
    setQuery(q);
    if (!q.trim()) {
      setResult(null);
      return;
    }
    startTransition(async () => {
      const r = await searchEntity(q);
      setResult(r);
    });
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    runSearch(query);
  }

  return (
    <div className="overflow-hidden border border-line-strong bg-white shadow-[0_1px_0_rgba(15,26,46,0.04),0_24px_60px_-30px_rgba(15,26,46,0.18)]">
      {/* header */}
      <div className="border-b border-line bg-slate-50 px-6 py-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          Try it · live data from USAspending.gov
        </p>
        <p className="mt-1 font-display text-lg text-navy-900">
          Look up any federal contractor.
        </p>
      </div>

      {/* search input */}
      <form onSubmit={onSubmit} className="border-b border-line px-6 py-5">
        <label className="block">
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-slate-500">
            UEI or company name
          </span>
          <div className="mt-2 flex items-center gap-2 border border-line-strong bg-white px-3 py-2.5 focus-within:border-navy-500 focus-within:ring-2 focus-within:ring-navy-500/20">
            <Search className="h-4 w-4 flex-none text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. Booz Allen Hamilton — or GR89GQ5C3HC4"
              className="flex-1 bg-transparent text-[15px] text-navy-900 placeholder-slate-400 focus:outline-none"
              autoComplete="off"
              spellCheck={false}
            />
            <button
              type="submit"
              disabled={pending || query.trim().length < 3}
              className="inline-flex items-center gap-1.5 bg-navy-700 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-navy-800 disabled:opacity-50"
            >
              {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Search"}
            </button>
          </div>
        </label>

        {!result && !pending && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-[11px] text-slate-500">Try:</span>
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => runSearch(s)}
                className="border border-line bg-slate-50 px-2 py-0.5 text-[11px] text-slate-600 transition-colors hover:border-copper-300 hover:text-copper-700"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </form>

      {/* result body */}
      <div className="min-h-[280px]">
        {pending && <ResultSkeleton />}
        {!pending && !result && <EmptyState />}
        {!pending && result?.ok === false && <ErrorState message={result.message} />}
        {!pending && result?.ok === true && <EntityCard result={result} />}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="px-6 py-10 text-center">
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-400">
        Awaiting query
      </p>
      <p className="mt-3 text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
        Enter a UEI or contractor name above. We&apos;ll pull their lifetime
        federal obligations, top agencies, and largest awards — live.
      </p>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="px-6 py-10 text-center">
      <AlertCircle className="mx-auto h-6 w-6 text-copper-600" />
      <p className="mt-3 text-sm text-slate-700 max-w-md mx-auto leading-relaxed">
        {message}
      </p>
    </div>
  );
}

function ResultSkeleton() {
  return (
    <div className="space-y-4 px-6 py-6">
      <div className="h-4 w-2/3 bg-slate-100" />
      <div className="h-10 w-1/2 bg-slate-100" />
      <div className="grid grid-cols-2 gap-3">
        <div className="h-16 bg-slate-100" />
        <div className="h-16 bg-slate-100" />
      </div>
      <div className="h-32 bg-slate-100" />
    </div>
  );
}

function EntityCard({ result }: { result: Extract<EntitySearchResult, { ok: true }> }) {
  const topAgency = result.agencies[0];
  return (
    <div className="px-6 py-5 space-y-5">
      {/* identity */}
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">
          UEI {result.uei}
        </p>
        <p className="mt-1 font-display text-xl text-navy-900 leading-tight">
          {result.legalName}
        </p>
      </div>

      {/* the headline number */}
      <div className="grid grid-cols-2 gap-3 border-y border-line py-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">
            Obligated since FY08
          </p>
          <p className="mt-1 font-display text-2xl text-navy-900">
            {formatAmount(result.totalSinceFy08)}
          </p>
        </div>
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">
            Top agency
          </p>
          <p className="mt-1 font-display text-base text-navy-900 leading-snug">
            {topAgency?.name ?? "—"}
          </p>
          {topAgency && (
            <p className="text-xs text-slate-500">
              {formatAmount(topAgency.amount)} · {pct(topAgency.amount, result.totalSinceFy08)}
            </p>
          )}
        </div>
      </div>

      {/* agency mix */}
      {result.agencies.length > 1 && (
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500 mb-2">
            Agency mix
          </p>
          <ul className="space-y-1.5">
            {result.agencies.slice(0, 4).map((a) => {
              const p = result.totalSinceFy08 > 0 ? a.amount / result.totalSinceFy08 : 0;
              return (
                <li key={a.agencyId} className="flex items-center gap-3 text-sm">
                  <Landmark className="h-3.5 w-3.5 flex-none text-copper-600" />
                  <span className="flex-1 truncate text-slate-700">{a.name}</span>
                  <span className="font-mono text-xs text-slate-500 tabular-nums">
                    {formatAmount(a.amount)}
                  </span>
                  <span className="w-12 font-mono text-[10px] text-slate-400 tabular-nums text-right">
                    {(p * 100).toFixed(0)}%
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* top awards */}
      {result.topAwards.length > 0 && (
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500 mb-2">
            Largest individual awards
          </p>
          <ul className="space-y-1.5">
            {result.topAwards.slice(0, 3).map((a) => (
              <li key={a.awardId} className="flex items-center gap-3 text-sm">
                <Building2 className="h-3.5 w-3.5 flex-none text-copper-600" />
                <span className="flex-1 truncate text-slate-700 font-mono text-xs">
                  {a.awardId}
                </span>
                <span className="font-mono text-xs text-slate-500 tabular-nums">
                  {formatAmount(a.amount)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* CTA */}
      <div className="border-t border-line pt-4">
        <Link
          href={`/claim?uei=${encodeURIComponent(result.uei)}`}
          className="group inline-flex w-full items-center justify-center gap-2 bg-navy-700 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-navy-800"
        >
          Claim this entity
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
        <p className="mt-2 text-center text-[11px] text-slate-500">
          Free for contractors. UEI {result.uei} · email is all we need.
        </p>
      </div>
    </div>
  );
}

function formatAmount(n: number): string {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

function pct(part: number, whole: number): string {
  if (whole <= 0) return "—";
  return `${((part / whole) * 100).toFixed(0)}% of total`;
}
