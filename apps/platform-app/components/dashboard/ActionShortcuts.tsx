import Link from "next/link";
import { FileSearch, ShieldCheck, Wallet, ClipboardCheck } from "lucide-react";

const shortcuts = [
  {
    href: "opportunities",
    label: "Find solicitations",
    icon: <FileSearch className="h-4 w-4" />,
  },
  {
    href: "surety",
    label: "Request surety quote",
    icon: <ShieldCheck className="h-4 w-4" />,
  },
  {
    href: "capital",
    label: "Capital options",
    icon: <Wallet className="h-4 w-4" />,
  },
  {
    href: "compliance",
    label: "Compliance checklist",
    icon: <ClipboardCheck className="h-4 w-4" />,
  },
];

export default function ActionShortcuts({ uei }: { uei: string }) {
  return (
    <section className="border-t border-line bg-slate-100">
      <div className="mx-auto max-w-[1400px] px-6 py-8">
        <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">
          Quick actions
        </p>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {shortcuts.map((s) => (
            <Link
              key={s.href}
              href={`/dashboard/${uei}/${s.href}`}
              className="group flex items-center gap-3 border border-line bg-surface px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:border-navy-300 hover:text-navy-800"
            >
              <span className="text-copper-600">{s.icon}</span>
              {s.label}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
