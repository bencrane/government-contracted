import { TrendingUp, Building2, BadgeCheck, Award, Calendar, Landmark } from "lucide-react";

type Row = {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail?: string;
  status?: "good" | "warn" | "neutral";
};

const rows: Row[] = [
  {
    icon: <BadgeCheck className="h-4 w-4" />,
    label: "SAM Registration",
    value: "Active",
    detail: "Expires Sep 14, 2026",
    status: "good",
  },
  {
    icon: <Calendar className="h-4 w-4" />,
    label: "Years Registered",
    value: "9 yrs · 2 mo",
    detail: "Initial reg Mar 2017",
  },
  {
    icon: <Building2 className="h-4 w-4" />,
    label: "Primary NAICS",
    value: "541330",
    detail: "Engineering Services",
  },
  {
    icon: <Award className="h-4 w-4" />,
    label: "Awards Lifetime",
    value: "$4.2M",
    detail: "17 contracts since 2019",
    status: "good",
  },
  {
    icon: <Landmark className="h-4 w-4" />,
    label: "Active Contracts",
    value: "3",
    detail: "$1.1M obligated · 2 agencies",
    status: "good",
  },
  {
    icon: <TrendingUp className="h-4 w-4" />,
    label: "YoY Award Growth",
    value: "+38%",
    detail: "FY24 vs FY23 obligations",
    status: "good",
  },
];

export default function ProfilePreview() {
  return (
    <div className="overflow-hidden border border-line-strong bg-white shadow-[0_1px_0_rgba(15,26,46,0.04),0_24px_60px_-30px_rgba(15,26,46,0.18)]">
      {/* header */}
      <div className="flex items-center justify-between border-b border-line bg-slate-50 px-6 py-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Entity Profile · Preview
          </p>
          <p className="mt-1 font-display text-lg text-navy-900">
            Acme Federal Services LLC
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            UEI
          </p>
          <p className="mt-1 font-mono text-sm text-navy-800">ABC123DEF456</p>
        </div>
      </div>

      {/* live indicator */}
      <div className="flex items-center gap-2 border-b border-line bg-navy-50/50 px-6 py-2">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-navy-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-navy-600" />
        </span>
        <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-navy-800">
          Live · Refreshed 4 hours ago from SAM.gov + USAspending
        </span>
      </div>

      {/* rows */}
      <ul className="divide-y divide-line">
        {rows.map((row) => (
          <li
            key={row.label}
            className="flex items-center justify-between px-6 py-4"
          >
            <div className="flex items-center gap-3">
              <span
                className={`inline-flex h-7 w-7 items-center justify-center border ${
                  row.status === "good"
                    ? "border-copper-200 bg-copper-50 text-copper-700"
                    : "border-line bg-slate-50 text-slate-500"
                }`}
              >
                {row.icon}
              </span>
              <div>
                <p className="text-sm font-medium text-navy-800">{row.label}</p>
                {row.detail && (
                  <p className="text-xs text-slate-500">{row.detail}</p>
                )}
              </div>
            </div>
            <p
              className={`font-display text-lg ${
                row.status === "good" ? "text-navy-900" : "text-navy-800"
              }`}
            >
              {row.value}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
