export default function Manifesto() {
  return (
    <section className="border-b border-line bg-navy-900 text-slate-100">
      <div className="mx-auto max-w-4xl px-6 py-24 md:py-28">
        <p className="font-mono text-[13px] font-semibold uppercase tracking-[0.18em] text-copper-300">
          Why this exists
        </p>
        <h2 className="font-display mt-5 text-4xl leading-[1.1] text-white text-balance md:text-5xl">
          Every federal dollar is public. The work is assembling them into one
          surface a contractor can actually use.
        </h2>

        <div className="copper-rule mt-12" />

        <div className="mt-12 space-y-6 text-[17px] leading-relaxed text-slate-300">
          <p>
            A registered contractor spends thirty minutes a week in SAM.gov,
            an hour on the phone with their surety agent, a half-day chasing a
            solicitation in beta.SAM, and another two days tracking down the
            right capital partner. The data is all public. The friction is the
            product.
          </p>
          <p>
            <span className="text-white">USAspending</span> publishes every contract
            action. <span className="text-white">SAM.gov</span> publishes every entity
            registration, NAICS, set-aside designation, and expiration.{" "}
            <span className="text-white">CPARS</span> publishes every past-performance
            rating. <span className="text-white">SAM exclusions</span> publishes every
            debarment. Nothing here is proprietary or scraped. We index it,
            join it on UEI, and put it where contractors actually look:
            one dashboard.
          </p>
          <p>
            Free for registered contractors. Paid for by the partners — surety
            agents, capital lenders, vendor program operators, equipment
            financiers, compliance and capture consultancies — who want to
            reach contractors at their specific underwriting profile. The
            contractor decides whether to take the conversation. No cold lists,
            no scraped emails, no sold data.
          </p>
          <p className="text-white">
            If you have an active SAM registration, this is for you. Type your
            UEI above. We have your awards.
          </p>
        </div>
      </div>
    </section>
  );
}
