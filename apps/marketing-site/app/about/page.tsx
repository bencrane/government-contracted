import Link from "next/link";
import { ArrowRight } from "lucide-react";

export const metadata = {
  title: "About — Government Contracted",
  description:
    "Government Contracted is a dashboard built on the SAM.gov registry and USAspending awards data. For registered federal contractors.",
};

export default function AboutPage() {
  return (
    <>
      <section className="seal-wash relative overflow-hidden border-b border-line">
        <div aria-hidden className="absolute inset-0 paper-grid opacity-40" />

        <div className="relative mx-auto max-w-6xl px-6 pt-12 pb-12 md:pt-16 md:pb-16">
          <p className="text-[13px] font-semibold uppercase tracking-[0.18em] text-copper-600">
            About
          </p>
          <h1 className="font-display mt-3 text-4xl leading-[1.05] text-navy-900 text-balance md:text-5xl">
            Built for registered federal contractors.
          </h1>

          <div className="mt-8 grid gap-8 text-base leading-relaxed text-slate-700 md:grid-cols-2 md:gap-12">
            <p>
              Government Contracted is a dashboard built on the SAM.gov
              entity registry and the USAspending awards corpus. We index
              every active US contractor every day, and every federal
              contract action back to FY2008.
            </p>
            <p>
              When something in your entity changes — a SAM renewal window
              opens, an award gets obligated, a recompete window opens on
              your incumbent contract, an exclusion appears in your sub
              chain — it shows up in your dashboard.
            </p>
          </div>
        </div>
      </section>

      <section className="border-b border-line">
        <div className="mx-auto max-w-7xl px-6 py-16 md:py-20">
          <div className="grid gap-px border border-line bg-line md:grid-cols-3">
            <Pillar
              eyebrow="Federal data, daily"
              body="SAM.gov publishes daily entity updates: registration status, NAICS, set-aside eligibility, expirations, exclusions. USAspending publishes every federal contract action. We ingest both every 24 hours and join them by UEI."
            />
            <Pillar
              eyebrow="Matched to your entity"
              body="Solicitations match your NAICS and set-aside. Surety and capital quotes route to providers that write contractors at your bonding capacity and your agency mix. Compliance reminders track your specific filing cadence."
            />
            <Pillar
              eyebrow="Yours to leave"
              body="One-click account deletion removes your profile and history. Your UEI stays public information (it always was). Nothing we built around it stays."
            />
          </div>
        </div>
      </section>

      <section className="border-b border-line bg-slate-100">
        <div className="mx-auto max-w-7xl px-6 py-16 md:py-20">
          <div className="grid gap-10 md:grid-cols-12 md:gap-14">
            <div className="md:col-span-4">
              <p className="text-[13px] font-semibold uppercase tracking-[0.18em] text-copper-600">
                The model
              </p>
              <h2 className="font-display mt-3 text-3xl leading-tight text-navy-900 md:text-4xl text-balance">
                Free for federal contractors.
              </h2>
            </div>
            <div className="md:col-span-8 space-y-4 text-base leading-relaxed text-slate-700">
              <p>
                Government Contracted stays free for registered entities.
                The site is paid for by the providers that show up in your
                dashboard when they fit your profile — surety agents,
                capital lenders, vendor program operators, equipment
                financiers, compliance and capture consultancies. They get
                access to engaged contractor traffic with verified entity
                and awards data. You decide whether to take the
                conversation.
              </p>
              <p>
                Independent operation. The SAM.gov registry and the
                USAspending corpus are public federal data; we index them
                and put them to work in your dashboard.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-7xl px-6 py-16 md:py-20">
          <div className="border border-navy-200 bg-gradient-to-br from-navy-50 via-slate-50 to-slate-50 p-10 md:p-14">
            <div className="grid gap-8 md:grid-cols-12 md:items-center">
              <div className="md:col-span-8">
                <h2 className="font-display text-3xl text-navy-900 md:text-4xl text-balance">
                  Claim your entity.
                </h2>
                <p className="mt-3 max-w-xl text-slate-700">
                  UEI and email. Dashboard link in your inbox.
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
        </div>
      </section>
    </>
  );
}

function Pillar({ eyebrow, body }: { eyebrow: string; body: string }) {
  return (
    <div className="bg-surface p-7 md:p-8">
      <p className="text-[13px] font-semibold uppercase tracking-[0.18em] text-copper-600">
        {eyebrow}
      </p>
      <p className="mt-4 text-[15px] leading-relaxed text-slate-700">{body}</p>
    </div>
  );
}
