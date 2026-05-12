import Link from "next/link";
import { ArrowRight, FileText, Calendar, AlertCircle } from "lucide-react";

export const metadata = {
  title: "Resources — Government Contracted",
  description:
    "Federal acquisition updates, compliance deadlines, and capture notes for registered contractors.",
};

type Resource = {
  category: "Regulatory" | "Compliance" | "Capture";
  date: string;
  title: string;
  blurb: string;
};

const resources: Resource[] = [
  {
    category: "Regulatory",
    date: "Apr 22, 2026",
    title: "CMMC 2.0 Level 2 enforcement: the assessment timeline that's actually being used",
    blurb:
      "DoD contracts with CDI now require Level 2 third-party assessment. What's accepted today, what's still pending CIO review, and how to time your C3PAO engagement.",
  },
  {
    category: "Compliance",
    date: "Apr 9, 2026",
    title: "SAM renewal traps: the three reasons registrations expire even when you 'renewed'",
    blurb:
      "POC verification, EFT failures, and FAR/DFARS reps & certs lapsing in the middle of a renewal cycle. How to clear all three before the 365-day clock runs out.",
  },
  {
    category: "Capture",
    date: "Mar 28, 2026",
    title: "Reading the agency forecast: which Q3 FY26 forecasts will actually result in solicitations",
    blurb:
      "Forecast accuracy varies wildly by agency. Which forecast formats correlate with on-time solicitation drops, and which are aspirational at best.",
  },
  {
    category: "Regulatory",
    date: "Mar 14, 2026",
    title: "Set-aside size standard revisions: the NAICS codes changing in 2026",
    blurb:
      "SBA's revised receipts-based size standards take effect mid-year. Which NAICS are moving up, which are moving down, and what it does to your competitive set.",
  },
  {
    category: "Compliance",
    date: "Feb 28, 2026",
    title: "CPARS rebuttal window: the 14-day clock and what actually moves a rating",
    blurb:
      "What constitutes a substantive rebuttal vs. one that gets boilerplated back. Examples of language that's resulted in a rating revision in the past year.",
  },
];

const categoryStyles: Record<Resource["category"], string> = {
  Regulatory: "bg-navy-50 text-navy-800 border-navy-200",
  Compliance: "bg-slate-100 text-slate-700 border-line-strong",
  Capture: "bg-copper-50 text-copper-800 border-copper-200",
};

const categoryIcons: Record<Resource["category"], React.ReactNode> = {
  Regulatory: <FileText className="h-3.5 w-3.5" />,
  Compliance: <Calendar className="h-3.5 w-3.5" />,
  Capture: <AlertCircle className="h-3.5 w-3.5" />,
};

export default function ResourcesPage() {
  return (
    <>
      <section className="seal-wash border-b border-line">
        <div className="mx-auto max-w-7xl px-6 pt-16 pb-12 md:pt-20">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-copper-600">
            Resources
          </p>
          <h1 className="font-display mt-4 text-5xl leading-[1.05] text-navy-900 text-balance md:text-6xl">
            FAR, compliance, capture —<br />
            <span className="text-navy-700">in plain English.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-700">
            Federal acquisition updates, compliance deadline reminders, and
            capture notes for registered contractors.
          </p>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-7xl px-6 py-16 md:py-20">
          <ul className="divide-y divide-line border-y border-line">
            {resources.map((r) => (
              <li key={r.title} className="py-8">
                <div className="grid gap-6 md:grid-cols-12">
                  <div className="md:col-span-3">
                    <span
                      className={`inline-flex items-center gap-1.5 border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.12em] ${categoryStyles[r.category]}`}
                    >
                      {categoryIcons[r.category]}
                      {r.category}
                    </span>
                    <p className="mt-3 text-xs text-slate-500">{r.date}</p>
                  </div>
                  <div className="md:col-span-9">
                    <h2 className="font-display text-2xl leading-tight text-navy-900">
                      {r.title}
                    </h2>
                    <p className="mt-3 text-[15px] leading-relaxed text-slate-700">
                      {r.blurb}
                    </p>
                    <p className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-navy-700">
                      Full write-up coming soon
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="border-t border-line bg-slate-100">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="border border-navy-200 bg-white p-8 md:p-10">
            <div className="grid gap-8 md:grid-cols-12 md:items-center">
              <div className="md:col-span-8">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-copper-600">
                  Compliance reminders
                </p>
                <h2 className="font-display mt-3 text-2xl text-navy-900 md:text-3xl text-balance">
                  Filing deadlines pegged to your entity.
                </h2>
                <p className="mt-3 text-slate-700">
                  SAM renewal, CMMC assessment windows, set-aside
                  recertification, FAR/DFARS reps &amp; certs — reminders
                  set to your specific filing cadence.
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
