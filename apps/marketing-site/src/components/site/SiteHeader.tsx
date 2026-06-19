import { useState } from "react";
import { NavLink } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui";
import Wordmark from "./Wordmark";

/** Site chrome — the single biggest cohesion fix. Real navigation on every page
 *  so the seven routes read as one document, not disconnected PDFs. Links use the
 *  eyebrow token (uppercase, the body system's micro-label voice); the active
 *  route is copper. The persistent secondary Claim button never fights an in-page
 *  primary. Mobile collapses the links into a sharp-cornered disclosure while the
 *  Claim button stays visible. */
const NAV = [
  { to: "/opportunities", label: "Opportunities" },
  { to: "/resources", label: "Resources" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
] as const;

function navLinkClass({ isActive }: { isActive: boolean }) {
  return cn(
    "text-eyebrow font-sans uppercase transition-colors",
    isActive ? "text-copper-600" : "text-slate-500 hover:text-navy-900",
  );
}

export default function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-6">
        <Wordmark />

        <nav aria-label="Primary" className="hidden items-center gap-8 md:flex">
          {NAV.map((item) => (
            <NavLink key={item.to} to={item.to} className={navLinkClass}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Button
            to="/claim"
            variant="secondary"
            size="sm"
            className="whitespace-nowrap"
          >
            <span className="md:hidden">Claim</span>
            <span className="hidden md:inline">Claim your entity</span>
          </Button>
          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center border border-line-strong text-navy-800 transition-colors hover:border-copper-500 hover:text-copper-700 md:hidden"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {open && (
        <nav
          aria-label="Primary"
          className="border-t border-line bg-background md:hidden"
        >
          <ul className="mx-auto max-w-7xl px-6 py-2">
            {NAV.map((item) => (
              <li key={item.to} className="border-b border-line last:border-b-0">
                <NavLink
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      "block py-4 text-eyebrow font-sans uppercase transition-colors",
                      isActive ? "text-copper-600" : "text-slate-600 hover:text-navy-900",
                    )
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
