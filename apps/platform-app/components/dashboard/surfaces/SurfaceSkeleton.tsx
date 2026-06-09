/** Loading skeleton shared by the catalyst-backed dashboard surfaces. */
export default function SurfaceSkeleton() {
  return (
    <section className="flex-1 animate-pulse">
      <div className="border-b border-line bg-surface">
        <div className="mx-auto max-w-[1400px] px-6 py-6">
          <div className="h-2 w-16 bg-slate-200" />
          <div className="mt-3 h-7 w-72 bg-slate-200" />
          <div className="mt-3 h-3 w-48 bg-slate-100" />
        </div>
      </div>
      <div className="mx-auto max-w-[1400px] space-y-6 px-6 py-8">
        {[0, 1, 2].map((i) => (
          <div key={i} className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {[0, 1, 2, 3].map((j) => (
              <div key={j}>
                <div className="h-2 w-20 bg-slate-100" />
                <div className="mt-2 h-4 w-28 bg-slate-200" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
