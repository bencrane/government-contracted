import GoldenProfilePreview from "@/components/marketing/GoldenProfilePreview";
import CategoryGrid from "@/components/marketing/CategoryGrid";
import Manifesto from "@/components/marketing/Manifesto";

export default function HomePage() {
  return (
    <>
      {/* HERO */}
      <section className="seal-wash relative overflow-hidden border-b border-line">
        <div aria-hidden className="absolute inset-0 paper-grid opacity-60" />

        <div className="relative mx-auto max-w-7xl px-6 pt-16 pb-20 md:pt-24">
          <div className="grid items-center gap-14 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-6">
              <p className="text-[13px] font-semibold uppercase tracking-[0.18em] text-copper-600">
                For registered federal contractors
              </p>
              <h1 className="font-display mt-5 text-5xl leading-[1.02] text-navy-900 text-balance md:text-[64px]">
                Your entity.<br />
                <span className="text-navy-700">Your awards.</span><br />
                One dashboard.
              </h1>
              <p className="mt-7 max-w-xl text-lg leading-relaxed text-slate-700">
                Live SAM.gov profile, every federal contract action since
                FY08, and quotes on surety, capital, vendor programs,
                equipment, and compliance — pegged to your UEI.
              </p>
            </div>

            <div className="lg:col-span-6">
              <GoldenProfilePreview />
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="border-b border-line bg-navy-900 text-slate-100">
        <div className="mx-auto max-w-7xl px-6 py-20 md:py-24">
          <div className="mb-14 max-w-3xl">
            <p className="text-[13px] font-semibold uppercase tracking-[0.18em] text-copper-300">
              How it works
            </p>
            <h2 className="font-display mt-4 text-4xl leading-tight text-white md:text-5xl text-balance">
              From UEI to a live dashboard in about thirty seconds.
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

      {/* WHAT'S INSIDE */}
      <section id="whats-inside" className="border-b border-line">
        <div className="mx-auto max-w-7xl px-6 py-20 md:py-24">
          <div className="mb-10 max-w-3xl">
            <p className="text-[13px] font-semibold uppercase tracking-[0.18em] text-copper-600">
              What&apos;s inside
            </p>
            <h2 className="font-display mt-4 text-4xl leading-tight text-navy-900 md:text-5xl text-balance">
              Solicitations to surety to capital — pegged to your UEI, in
              one place.
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-slate-700">
              Each category matches against your live SAM.gov profile and
              your awards history. The same UEI that unlocked your dashboard
              is what brokers, lenders, and consultancies see when they
              reach out.
            </p>
          </div>

          <CategoryGrid />
        </div>
      </section>

      {/* MANIFESTO — ends the page. The manifesto's final line is the CTA. */}
      <Manifesto />
    </>
  );
}
