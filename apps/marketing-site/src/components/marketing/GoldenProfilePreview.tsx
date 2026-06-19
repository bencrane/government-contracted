import { motion } from "framer-motion";
import { ArrowRight, Landmark, CalendarClock, Building2, Hash } from "lucide-react";
import { Button, Card, Badge, Stat, Tabs, MonoLabel, type TabItem } from "@/components/ui";
import { EASE_BRAND } from "@/components/ui/tabs";

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

const TABS: TabItem[] = [
  { id: "agencies", label: "Agencies", panel: <AgenciesPanel /> },
  { id: "registration", label: "Registration", panel: <RegistrationPanel /> },
  { id: "contacts", label: "Contacts", panel: <ContactsPanel /> },
];

export default function GoldenProfilePreview() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE_BRAND }}
    >
      <Card elevation="raised" className="overflow-hidden">
        {/* header — identity (persistent) */}
        <div className="border-b border-line bg-slate-50 px-6 py-5">
          <p className="font-display text-[22px] leading-tight text-navy-900">
            {PROFILE.legalName}
          </p>
          <p className="mt-1.5 font-mono text-[11px] tracking-tight text-slate-500">
            UEI {PROFILE.uei} · CAGE {PROFILE.cage} · {PROFILE.location}
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <Badge tone="success" dot>
              SAM {PROFILE.sam.status}
            </Badge>
            {PROFILE.certs.map((c) => (
              <Badge key={c} tone="copper">
                {c}
              </Badge>
            ))}
          </div>
        </div>

        {/* headline obligations (persistent — the hook stays in view) */}
        <div className="grid grid-cols-3 divide-x divide-line border-b border-line">
          <Stat label="Lifetime awards" value={usd(PROFILE.obligations.lifetime)} />
          <Stat label="Active value" value={usd(PROFILE.obligations.active)} accent />
          <Stat
            label="Awards"
            value={`${PROFILE.obligations.awardCount}`}
            sub={`${PROFILE.obligations.activeAwardCount} active`}
          />
        </div>

        {/* tab bar + panels — fixed-height so the card never reflows */}
        <Tabs items={TABS} defaultId="agencies" panelHeight={236} ariaLabel="Profile detail" />

        {/* CTA + data provenance — static arrow, single Button source */}
        <div className="px-6 py-5">
          <Button to="/claim" size="sm" fullWidth trailingIcon={ArrowRight}>
            Claim your entity
          </Button>
          <p className="mt-2.5 text-center text-[11px] text-slate-500">
            Sourced from SAM.gov + USAspending.gov.
          </p>
        </div>
      </Card>
    </motion.div>
  );
}

function AgenciesPanel() {
  const lifetimeTotal = PROFILE.obligations.lifetime;
  const topAgency = PROFILE.agencies[0].amount;
  return (
    <div className="px-6 py-5">
      <MonoLabel as="p" className="mb-3">
        Where the work comes from
      </MonoLabel>
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
                  transition={{ duration: 0.6, delay: 0.08 + i * 0.07, ease: EASE_BRAND }}
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
      <Stat
        size="fact"
        className="bg-surface px-6"
        icon={<CalendarClock className="h-3.5 w-3.5" />}
        label="SAM expires"
        value={PROFILE.sam.expires}
        sub={`in ${PROFILE.sam.daysToExpiration} days`}
      />
      <Stat
        size="fact"
        className="bg-surface px-6"
        icon={<CalendarClock className="h-3.5 w-3.5" />}
        label="Registered"
        value={`${PROFILE.sam.yearsRegistered} yrs`}
        sub={`since ${PROFILE.sam.registeredSince}`}
      />
      <Stat
        size="fact"
        className="bg-surface px-6"
        icon={<Building2 className="h-3.5 w-3.5" />}
        label="Primary NAICS"
        value={PROFILE.naics.primary.code}
        sub={PROFILE.naics.primary.label}
      />
      <Stat
        size="fact"
        className="bg-surface px-6"
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
      <MonoLabel as="p" className="mb-3">
        Government POCs on file
      </MonoLabel>
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
