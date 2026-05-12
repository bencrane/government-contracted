import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import ProfilePreview from "@/components/marketing/ProfilePreview";
import CategoryGrid from "@/components/marketing/CategoryGrid";

export default function HomePage() {
  return (
    <>
      {/* HERO */}
      <section className="seal-wash relative overflow-hidden border-b border-line">
        <div aria-hidden className="absolute inset-0 paper-grid opacity-60" />

        <div className="relative mx-auto max-w-7xl px-6 pt-16 pb-20 md:pt-24">
          <div className="grid items-center gap-14 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-7">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-copper-600">
                For registered federal contractors
              </p>
              <h1 className="font-display mt-5 text-5xl leading-[1.02] text-navy-900 text-balance md:text-[64px]">
                Your entity.<br />
                <span className="text-navy-700">One dashboard.</span>
              </h1>
              <p className="mt-7 max-w-xl text-lg leading-relaxed text-slate-700">
                Live SAM.gov profile, your awards history, and quotes on
                surety bonds, working capital, vendor programs, equipment,
                and compliance — pegged to your UEI.
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link
                  href="/claim"
                  className="group inline-flex items-center justify-center gap-2 bg-navy-700 px-7 py-4 text-[15px] font-semibold text-white transition-colors hover:bg-navy-800"
                >
                  Claim Your Entity
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link
                  href="#whats-inside"
                  className="group inline-flex items-center justify-center gap-2 border border-line-strong bg-white px-7 py-4 text-[15px] font-semibold text-slate-800 transition-colors hover:border-copper-500 hover:text-copper-700"
                >
                  See What's Inside
                  <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Link>
              </div>

              <p className="mt-8 text-xs text-slate-500">
                30 seconds. UEI and email.
              </p>
            </div>

            <div className="lg:col-span-5">
              <ProfilePreview />
            </div>
          </div>
        </div>
      </section>

      {/* WHAT'S INSIDE */}
      <section id="whats-inside" className="border-b border-line">
        <div className="mx-auto max-w-7xl px-6 py-20 md:py-24">
          <div className="mb-12 max-w-3xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-copper-600">
              What's inside
            </p>
            <h2 className="font-display mt-4 text-4xl leading-tight text-navy-900 md:text-5xl text-balance">
              Six things your entity unlocks.
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-slate-700">
              Each one is matched against your live SAM.gov profile and your
              awards history. Solicitations against your NAICS and set-aside.
              Surety against your bonding capacity. Capital against your
              receivables. Compliance against your filing cadence.
            </p>
          </div>

          <CategoryGrid />

          <div className="mt-10 flex justify-center">
            <Link
              href="/opportunities"
              className="group inline-flex items-center gap-2 text-sm font-medium text-navy-700 transition-colors hover:text-navy-800"
            >
              Browse all opportunities
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="border-b border-line bg-slate-100">
        <div className="mx-auto max-w-7xl px-6 py-20 md:py-24">
          <div className="mb-14 max-w-3xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-copper-600">
              How it works
            </p>
            <h2 className="font-display mt-4 text-4xl leading-tight text-navy-900 md:text-5xl text-balance">
              Three steps.
            </h2>
          </div>

          <ol className="grid gap-px border border-line bg-line md:grid-cols-3">
            {[
              {
                step: "01",
                title: "Claim your entity",
                body: "UEI and email. 30 seconds. We send a private dashboard link to the address you give us.",
              },
              {
                step: "02",
                title: "Your live profile lands in your dashboard",
                body: "SAM registration, NAICS, addresses, expiration, exclusion check, lifetime awards, active contracts, agency mix. Refreshed against SAM.gov + USAspending every 24 hours.",
              },
              {
                step: "03",
                title: "Opportunities match against your profile",
                body: "Solicitations match your NAICS and set-aside. Surety and capital quotes route to providers that write contractors like you. Compliance reminders track your actual filing cadence.",
              },
            ].map((s) => (
              <li key={s.step} className="bg-surface p-8 md:p-10">
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-copper-600">
                  Step {s.step}
                </p>
                <h3 className="font-display mt-5 text-2xl text-navy-900">
                  {s.title}
                </h3>
                <p className="mt-3 text-[15px] leading-relaxed text-slate-700">
                  {s.body}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* CLAIM CTA */}
      <section>
        <div className="mx-auto max-w-7xl px-6 py-20 md:py-24">
          <div className="border border-navy-200 bg-gradient-to-br from-navy-50 via-slate-50 to-slate-50 p-10 md:p-14">
            <div className="grid gap-10 md:grid-cols-12 md:items-center">
              <div className="md:col-span-8">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-copper-600">
                  Claim your entity
                </p>
                <h2 className="font-display mt-3 text-4xl leading-tight text-navy-900 md:text-5xl text-balance">
                  Your dashboard, in a few minutes.
                </h2>
                <p className="mt-4 max-w-xl text-slate-700">
                  UEI and email. We pull your live profile and send the
                  dashboard link to your inbox.
                </p>
              </div>
              <div className="md:col-span-4 md:text-right">
                <Link
                  href="/claim"
                  className="inline-flex items-center justify-center gap-2 bg-navy-700 px-7 py-4 text-[15px] font-semibold text-white transition-colors hover:bg-navy-800"
                >
                  Claim Your Entity
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
