import Link from "next/link";
import Wordmark from "./Wordmark";

const links = [
  { href: "/opportunities", label: "Opportunities" },
  { href: "/resources", label: "Resources" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/claim", label: "Claim Your Entity" },
];

export default function SiteFooter() {
  return (
    <footer className="border-t border-line bg-slate-100">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <Wordmark />
          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-700">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="transition-colors hover:text-navy-700"
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="mt-6 flex flex-col gap-2 border-t border-line pt-4 text-xs text-slate-500 md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} Government Contracted</p>
          <p>Independent. Not affiliated with SAM.gov, GSA, or any federal agency.</p>
        </div>
      </div>
    </footer>
  );
}
