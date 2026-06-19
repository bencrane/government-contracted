"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Landmark, CalendarClock, Building2, Hash } from "lucide-react";

// Sample golden profile — structurally faithful to the real `entity_profile_gold`
// dataset (1 row per UEI, rebuilt nightly from SAM.gov + USAspending): identity,
// SAM registration + expiration, NAICS/PSC, set-aside certs (parsed from
// business_types_raw), lifetime + active obligations, award counts, agency mix,
// and government POCs on file. Fictional entity; numbers illustrative. Tuned to a
// mid-market construction contractor so the visitor sees themselves, not a prime.
const PROFILE = {
  legalName: "Granite Ridge Construction Group, LLC",
  dba: "Granite Ridge",
  uei: "GR7K2M9XLQ84",
  cage: "8J4K2",
  location: "Tampa, FL",
  certs: ["SDVOSB", "HUBZone"],
  sam: {
    status: "Active",
    expires: "Feb 28, 2027",
    daysToExpiration: 255,
    registeredSince: "Jun 2014",
    yearsRegistered: 12,
  },
  naics: {
    primary: {
      code: "236220",
      label: "Commercial & Institutional Building Construction",
    },
    secondary: ["237310", "238190"],
    pscCount: 4,
  },
  obligations: {
    lifetime: 24_600_000,
    active: 8_900_000,
    awardCount: 31,
    activeAwardCount: 9,
  },
  agencies: [
    { name: "U.S. Army Corps of Engineers", amount: 11_200_000 },
    { name: "Dept. of Veterans Affairs", amount: 6_400_000 },
    { name: "GSA · Public Buildings Service", amount: 4_000_000 },
    { name: "Dept. of the Navy · NAVFAC", amount: 3_000_000 },
  ],
  pocs: [
    { name: "Dana R. Whitfield", role: "Electronic Business POC" },
    { name: "Marcus T. Bell", role: "Government Business POC" },
  ],
} as const;

const EASE = [0.16, 1, 0.3, 1] as const;

const TABS = [
  { id: "agencies", label: "Agencies" },
  { id: "registration", label: "Registration" },
  { id: "contacts", label: "Contacts" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function GoldenProfilePreview() {
  const [tab, setTab] = useState<TabId>("agencies");

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE }}
      className="overflow-hidden border border-line-strong bg-white shadow-[0_1px_0_rgba(15,26,46,0.04),0_24px_60px_-30px_rgba(15,26,46,0.18)]"
    >
      {/* header — identity (persistent) */}
      <div className="border-b border-line bg-slate-50 px-6 py-5">
        <p className="font-display text-[22px] leading-tight text-navy-900">
          {PROFILE.legalName}
        </p>
        <p className="mt-1.5 font-mono text-[11px] tracking-tight text-slate-500">
          UEI {PROFILE.uei} · CAGE {PROFILE.cage} · {PROFILE.location}
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center gap-1.5 border border-success/30 bg-success/5 px-2 py-0.5 text-[11px] font-medium text-success">
            <span className="h-1.5 w-1.5 rounded-full bg-success" />
            SAM {PROFILE.sam.status}
          </span>
          {PROFILE.certs.map((c) => (
            <span
              key={c}
              className="border border-copper-200 bg-copper-50 px-2 py-0.5 text-[11px] font-semibold tracking-wide text-copper-700"
            >
              {c}
            </span>
          ))}
        </div>
      </div>

      {/* headline obligations (persistent — the hook stays in view) */}
      <div className="grid grid-cols-3 divide-x divide-line border-b border-line">
        <Kpi label="Lifetime awards" value={usd(PROFILE.obligations.lifetime)} />
        <Kpi label="Active value" value={usd(PROFILE.obligations.active)} accent />
        <Kpi
          label="Awards"
          value={`${PROFILE.obligations.awardCount}`}
          sub={`${PROFILE.obligations.activeAwardCount} active`}
        />
      </div>

      {/* tab bar */}
      <div role="tablist" aria-label="Profile detail" className="flex border-b border-line px-3">
        {TABS.map((t) => {
          const active = t.id === tab;
          return (
            <button
              key={t.id}
              role="tab"
              type="button"
              aria-selected={active}
              onClick={() => setTab(t.id)}
              className="relative px-3 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] outline-none focus-visible:text-navy-900"
            >
              <span
                className={
                  active
                    ? "text-navy-900"
                    : "text-slate-400 transition-colors hover:text-slate-600"
                }
              >
                {t.label}
              </span>
              {active && (
                <motion.span
                  layoutId="gp-tab-underline"
                  className="absolute inset-x-3 -bottom-px h-0.5 bg-copper-500"
                  transition={{ duration: 0.3, ease: EASE }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* tab content — fixed height + clipped so the card never changes size */}
      <div className="h-[236px] overflow-hidden border-b border-line">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: EASE }}
          >
            {tab === "agencies" && <AgenciesPanel />}
            {tab === "registration" && <RegistrationPanel />}
            {tab === "contacts" && <ContactsPanel />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* CTA + data provenance */}
      <div className="px-6 py-5">
        <Link
          href="/claim"
          className="flex w-full items-center justify-center gap-2 bg-navy-700 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-navy-800"
        >
          Claim your entity
          <ArrowRight className="h-4 w-4" />
        </Link>
        <p className="mt-2.5 text-center text-[11px] text-slate-500">
          Sourced from SAM.gov + USAspending.gov.
        </p>
      </div>
    </motion.div>
  );
}

function AgenciesPanel() {
  const lifetimeTotal = PROFILE.obligations.lifetime;
  const topAgency = PROFILE.agencies[0].amount;
  return (
    <div className="px-6 py-5">
      <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">
        Where the work comes from
      </p>
      <ul className="space-y-3">
        {PROFILE.agencies.map((a, i) => {
          const share = (a.amount / lifetimeTotal) * 100;
          const barPct = (a.amount / topAgency) * 100;
          return (
            <li key={a.name}>
              <div className="flex items-center gap-3 text-sm">
                <Landmark className="h-3.5 w-3.5 flex-none text-copper-600" />
                <span className="flex-1 truncate text-slate-700">{a.name}</span>
                <span className="font-mono text-xs tabular-nums text-slate-500">
                  {usd(a.amount)}
                </span>
                <span className="w-9 text-right font-mono text-[10px] tabular-nums text-slate-400">
                  {share.toFixed(0)}%
                </span>
              </div>
              <div className="mt-1.5 ml-[26px] h-1.5 bg-slate-100">
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.6, delay: 0.08 + i * 0.07, ease: EASE }}
                  style={{ width: `${barPct}%` }}
                  className="h-full origin-left bg-copper-500"
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function RegistrationPanel() {
  return (
    <div className="grid grid-cols-2 gap-px bg-line">
      <Fact
        icon={<CalendarClock className="h-3.5 w-3.5" />}
        label="SAM expires"
        value={PROFILE.sam.expires}
        sub={`in ${PROFILE.sam.daysToExpiration} days`}
      />
      <Fact
        icon={<CalendarClock className="h-3.5 w-3.5" />}
        label="Registered"
        value={`${PROFILE.sam.yearsRegistered} yrs`}
        sub={`since ${PROFILE.sam.registeredSince}`}
      />
      <Fact
        icon={<Building2 className="h-3.5 w-3.5" />}
        label="Primary NAICS"
        value={PROFILE.naics.primary.code}
        sub={PROFILE.naics.primary.label}
      />
      <Fact
        icon={<Hash className="h-3.5 w-3.5" />}
        label="Also coded"
        value={PROFILE.naics.secondary.join(" · ")}
        sub={`+ ${PROFILE.naics.pscCount} PSC codes`}
      />
    </div>
  );
}

function ContactsPanel() {
  return (
    <div className="px-6 py-5">
      <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">
        Government POCs on file
      </p>
      <ul className="space-y-2.5">
        {PROFILE.pocs.map((p) => (
          <li key={p.name} className="flex items-center gap-3 text-sm">
            <span className="inline-flex h-7 w-7 flex-none items-center justify-center border border-line bg-slate-50 font-mono text-[10px] font-semibold text-slate-500">
              {initials(p.name)}
            </span>
            <span className="flex-1 truncate text-slate-700">{p.name}</span>
            <span className="font-mono text-[11px] text-slate-400">{p.role}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Kpi({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div className="px-4 py-4">
      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>
      <p
        className={`mt-1 font-display text-2xl leading-none ${
          accent ? "text-copper-700" : "text-navy-900"
        }`}
      >
        {value}
      </p>
      {sub && <p className="mt-1 text-[11px] text-slate-500">{sub}</p>}
    </div>
  );
}

function Fact({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="bg-surface px-6 py-4">
      <p className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-slate-500">
        <span className="text-copper-600">{icon}</span>
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-navy-800">{value}</p>
      {sub && <p className="truncate text-[11px] text-slate-500">{sub}</p>}
    </div>
  );
}

function usd(n: number): string {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

function initials(name: string): string {
  const parts = name.replace(/[^A-Za-z .]/g, "").split(" ").filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}
