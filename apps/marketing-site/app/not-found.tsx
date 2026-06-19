import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function NotFound() {
  return (
    <section className="mx-auto max-w-3xl px-6 py-32 text-center">
      <p className="text-[13px] font-semibold uppercase tracking-[0.18em] text-copper-600">
        404 / Not found
      </p>
      <h1 className="font-display mt-4 text-5xl text-navy-900 md:text-6xl text-balance">
        That page isn't on the docket.
      </h1>
      <p className="mt-6 text-slate-600">
        The page you're looking for isn't here. Back to the front, or claim your entity.
      </p>
      <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 bg-navy-700 px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-navy-800"
        >
          Home
          <ArrowRight className="h-4 w-4" />
        </Link>
        <Link
          href="/claim"
          className="inline-flex items-center justify-center gap-2 border border-line-strong px-6 py-3.5 text-sm font-semibold text-slate-700 transition-colors hover:border-copper-500 hover:text-copper-700"
        >
          Claim Your Entity
        </Link>
      </div>
    </section>
  );
}
