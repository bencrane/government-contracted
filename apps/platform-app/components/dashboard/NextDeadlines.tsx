import Link from "next/link";
import { ArrowUpRight, AlertTriangle, CheckCircle2, AlertCircle } from "lucide-react";
import type { Deadline, HealthStatus } from "@/lib/mock-dashboard";

const statusIcon: Record<HealthStatus, React.ReactNode> = {
  good: <CheckCircle2 className="h-3.5 w-3.5" />,
  warn: <AlertTriangle className="h-3.5 w-3.5" />,
  alert: <AlertCircle className="h-3.5 w-3.5" />,
};

const statusTint: Record<HealthStatus, string> = {
  good: "text-emerald-700",
  warn: "text-amber-700",
  alert: "text-red-700",
};

export default function NextDeadlines({
  deadlines,
  href,
}: {
  deadlines: Deadline[];
  href: string;
}) {
  return (
    <div>
      <div className="mb-4 flex items-end justify-between">
        <h2 className="font-display text-2xl text-navy-900">Next deadlines</h2>
        <Link
          href={href}
          className="group inline-flex items-center gap-1.5 text-sm font-medium text-navy-700 transition-colors hover:text-navy-800"
        >
          All compliance
          <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </Link>
      </div>
      <ul className="divide-y divide-line border border-line bg-surface">
        {deadlines.map((d) => (
          <li key={d.id} className="flex items-center justify-between px-5 py-4">
            <div className="flex items-center gap-3">
              <span className={statusTint[d.status]}>{statusIcon[d.status]}</span>
              <div>
                <p className="text-sm font-semibold text-navy-900">{d.label}</p>
                <p className="text-xs text-slate-500">
                  {d.type} · due {d.dueDate}
                </p>
              </div>
            </div>
            <p className="font-mono text-xs text-slate-500">{d.daysToDue}d</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
