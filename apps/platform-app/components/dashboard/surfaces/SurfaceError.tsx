'use client';

/** Error boundary shared by the catalyst-backed dashboard surfaces. */
export default function SurfaceError({ reset }: { error: Error; reset: () => void }) {
  return (
    <section className="flex-1">
      <div className="mx-auto max-w-xl px-6 py-24 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-red-700">
          Couldn&apos;t load this surface
        </p>
        <h1 className="font-display mt-3 text-2xl text-navy-900">
          The data service didn&apos;t respond.
        </h1>
        <p className="mt-3 text-sm text-slate-500">
          This is a transient read error, not a change to your record.
        </p>
        <button
          onClick={reset}
          className="mt-6 inline-flex items-center border border-navy-200 px-4 py-2 text-sm font-medium text-navy-700 transition-colors hover:bg-slate-50"
        >
          Try again
        </button>
      </div>
    </section>
  );
}
