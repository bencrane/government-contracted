import Link from "next/link";
import {
  FileSearch,
  ShieldCheck,
  Wallet,
  Tag,
  Cog,
  ClipboardCheck,
  ArrowUpRight,
} from "lucide-react";
import { CATEGORIES, type CategorySlug } from "@/lib/opportunities";

const icons: Record<CategorySlug, React.ReactNode> = {
  opportunities: <FileSearch className="h-5 w-5" />,
  surety: <ShieldCheck className="h-5 w-5" />,
  capital: <Wallet className="h-5 w-5" />,
  "vendor-programs": <Tag className="h-5 w-5" />,
  equipment: <Cog className="h-5 w-5" />,
  compliance: <ClipboardCheck className="h-5 w-5" />,
};

export default function CategoryGrid({
  variant = "preview",
}: {
  variant?: "preview" | "hub";
}) {
  return (
    <div className="grid gap-px border border-line bg-line md:grid-cols-2 lg:grid-cols-3">
      {CATEGORIES.map((c) => (
        <Link
          key={c.slug}
          href={`/opportunities/${c.slug}`}
          className="group flex flex-col bg-surface p-8 transition-colors hover:bg-navy-50/40"
        >
          <div className="flex items-center justify-between">
            <span className="inline-flex h-10 w-10 items-center justify-center border border-navy-200 bg-navy-50 text-navy-700">
              {icons[c.slug]}
            </span>
            <ArrowUpRight className="h-4 w-4 text-slate-400 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-navy-600" />
          </div>
          <h3 className="font-display mt-6 text-2xl text-navy-900">
            {c.title}
          </h3>
          <p className="mt-2 text-[15px] leading-relaxed text-slate-600">
            {variant === "hub" ? c.blurb : c.headline}
          </p>
        </Link>
      ))}
    </div>
  );
}
