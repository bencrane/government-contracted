import Link from "next/link";
import { ArrowRight } from "lucide-react";
import CategoryGrid from "@/components/marketing/CategoryGrid";

export const metadata = {
  title: "Opportunities — Government Contracted",
  description:
    "What your entity unlocks: bid leads, surety, capital, vendor programs, equipment, and compliance.",
};

export default function OpportunitiesPage() {
  return (
    <>
      <section className="seal-wash border-b border-line">
        <div className="mx-auto max-w-7xl px-6 pt-16 pb-12 md:pt-20">
          <p className="text-[13px] font-semibold uppercase tracking-[0.18em] text-copper-600">
            Opportunities
          </p>
          <h1 className="font-display mt-4 text-5xl leading-[1.05] text-navy-900 text-balance md:text-6xl">
            What your entity unlocks.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-700">
            Six categories. Each one matches against your live SAM.gov
            profile and your awards history and shows up in your dashboard
            when it fits.
          </p>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-7xl px-6 py-16 md:py-20">
          <CategoryGrid variant="hub" />
        </div>
      </section>

      <section className="border-t border-line bg-slate-100">
        <div className="mx-auto max-w-7xl px-6 py-20 md:py-24">
          <div className="grid gap-10 md:grid-cols-12 md:items-center">
            <div className="md:col-span-8">
              <p className="text-[13px] font-semibold uppercase tracking-[0.18em] text-copper-600">
                Claim first
              </p>
              <h2 className="font-display mt-3 text-3xl leading-tight text-navy-900 md:text-4xl text-balance">
                These match against your live entity profile.
              </h2>
              <p className="mt-4 max-w-xl text-slate-700">
                Claim your UEI, get your dashboard link by email, and see
                opportunities that fit your NAICS, set-aside, agency mix,
                and past performance.
              </p>
            </div>
            <div className="md:col-span-4 md:text-right">
              <Link
                href="/claim"
                className="inline-flex items-center justify-center gap-2 bg-navy-700 px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-navy-800"
              >
                Claim Your Entity
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
