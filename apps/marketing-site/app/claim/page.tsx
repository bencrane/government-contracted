import { Activity, BadgeCheck, Clock, Mail } from "lucide-react";
import ClaimForm from "@/components/forms/ClaimForm";

export const metadata = {
  title: "Claim Your Entity — Government Contracted",
  description: "Claim your SAM.gov entity. See your live registration and awards history.",
};

type SearchParams = Promise<{ uei?: string; next?: string }>;

const items = [
  {
    icon: <Activity className="h-5 w-5" />,
    title: "Your live SAM.gov profile",
    body: "Registration status, expiration, NAICS, set-aside eligibility, exclusion check, lifetime awards, active contracts. Refreshed daily.",
  },
  {
    icon: <BadgeCheck className="h-5 w-5" />,
    title: "Registered entities only",
    body: "Government Contracted is for entities with an active SAM.gov registration. We verify against the federal registry before sending your dashboard link.",
  },
  {
    icon: <Mail className="h-5 w-5" />,
    title: "Email tied to events",
    body: "We email when something in your entity shifts: a SAM renewal window opens, a recompete window opens on an agency where you have past performance, a solicitation matches your NAICS, a compliance deadline approaches.",
  },
  {
    icon: <Clock className="h-5 w-5" />,
    title: "Thirty seconds",
    body: "UEI and email is all we need to look you up. The dashboard link lands in your inbox within a few minutes.",
  },
];

export default async function ClaimPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { uei } = await searchParams;

  return (
    <section className="relative overflow-hidden">
      <div aria-hidden className="absolute inset-0 paper-grid opacity-40" />

      <div className="relative mx-auto max-w-6xl px-6 pt-16 pb-24 md:pt-20">
        <div className="grid gap-14 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-copper-600">
              Claim Your Entity
            </p>
            <h1 className="font-display mt-4 text-5xl leading-[1.05] text-navy-900 text-balance">
              UEI in. Dashboard out.
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-slate-700">
              Enter your UEI and email. We pull your live SAM.gov profile
              and email the dashboard link to you within a few minutes.
            </p>

            <ul className="mt-10 space-y-5">
              {items.map((r) => (
                <li key={r.title} className="flex gap-4">
                  <span className="mt-0.5 inline-flex h-9 w-9 flex-none items-center justify-center border border-navy-200 bg-navy-50 text-navy-700">
                    {r.icon}
                  </span>
                  <div>
                    <p className="text-[15px] font-semibold text-navy-900">
                      {r.title}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-slate-600">
                      {r.body}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-7">
            <div className="border border-line-strong bg-surface p-7 shadow-[0_24px_60px_-30px_rgba(15,26,46,0.18)] md:p-10">
              <ClaimForm defaultUei={uei} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
