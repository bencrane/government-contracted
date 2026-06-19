export type CategorySlug =
  | "opportunities"
  | "surety"
  | "capital"
  | "vendor-programs"
  | "equipment"
  | "compliance";

export type Category = {
  slug: CategorySlug;
  title: string;
  shortName: string;
  headline: string;
  blurb: string;
  whatYouGet: string[];
  goodIf: string[];
};

export const CATEGORIES: Category[] = [
  {
    slug: "opportunities",
    title: "Opportunities",
    shortName: "Opportunities",
    headline: "Bid leads matched to your NAICS, set-aside, and past performance.",
    blurb:
      "Active solicitations from SAM.gov, agency forecasts, and recompete windows pulled out months before they're posted. Filtered by your primary and secondary NAICS, your set-aside eligibility, your performance geography, and the agencies you've already won with.",
    whatYouGet: [
      "Daily-refreshed solicitations matched to your NAICS and set-aside profile",
      "Recompete radar — incumbents on contracts ending in 6, 12, 18 months",
      "Agency forecast pipeline visibility before the solicitation drops",
      "Past-performance-similar matches across agency lines you haven't bid yet",
      "Sub-contracting opportunities on primes' team rosters when they're looking",
    ],
    goodIf: [
      "Your capture team is hunting in SAM.gov manually and missing recompetes",
      "You've never bid outside your home agency but your NAICS qualifies elsewhere",
      "You're a sub looking for primes that need your size standard or socio-economic designation",
    ],
  },
  {
    slug: "surety",
    title: "Surety Bonds",
    shortName: "Surety",
    headline: "Bid, performance, and payment bonds — from sureties that write your size and history.",
    blurb:
      "Quotes routed to independent surety agents and underwriters that write contractors at your bonding capacity, your NAICS, and your past-performance profile. Bid bonds, performance and payment bonds (Miller Act), and aggregate capacity increases.",
    whatYouGet: [
      "Two-to-four bond quotes against your UEI and financials",
      "Agents that specialize in your work (construction, IT services, professional services, manufacturing)",
      "Bonding-capacity reviews ahead of a recompete that pushes you past your aggregate",
      "Federal Miller Act–compliant bonds for any contract over $150K",
      "SBA bond guarantee program access for emerging contractors who don't yet qualify standard",
    ],
    goodIf: [
      "Your current single-project or aggregate limit is the bottleneck on what you can bid",
      "You're new to federal work and your surety wrote your commercial bonds at lower limits",
      "Your last submission was declined and you don't know what underwriting actually flagged",
    ],
  },
  {
    slug: "capital",
    title: "Capital",
    shortName: "Capital",
    headline: "Working capital, mobilization financing, and contract factoring.",
    blurb:
      "Lines of credit, contract-mobilization loans, and government-receivables factoring matched to your invoicing cadence and the agencies you bill. The Treasury pays — but rarely on the terms your payroll needs.",
    whatYouGet: [
      "Mobilization financing on awarded contracts before the first invoice clears",
      "Factoring of federal receivables at rates priced to your agency mix and DPO history",
      "Working-capital lines secured against your government A/R, not your real estate",
      "Bridge financing between option-year exercise and the next funding obligation",
      "Lenders that understand FAR payment cycles and won't ding you for 30-day Treasury holds",
    ],
    goodIf: [
      "You just won an award and need cash for ramp-up before invoice #1 goes out",
      "Your bank line is collateralized on personal assets and you've outgrown it",
      "You're carrying $500K+ in 45+ day federal receivables and your cash flow shows it",
    ],
  },
  {
    slug: "vendor-programs",
    title: "Vendor Programs",
    shortName: "Vendor Programs",
    headline: "GSA Advantage discounts, GPO programs, and prime-vendor relationships.",
    blurb:
      "Negotiated pricing on the things you buy to fulfill contracts — IT hardware, professional services subscriptions, office and field supplies, vehicles, fleet fuel. GSA schedule-holder discounts, GPO membership programs, and direct prime-vendor relationships you'd otherwise have to negotiate one-off.",
    whatYouGet: [
      "GPO membership pricing on supplies, IT, and services — no minimum spend",
      "Schedule-holder reseller discounts on Cisco, Dell, Microsoft, ServiceNow, AWS, Azure",
      "Fleet fuel and maintenance programs for contractors with vehicles on government sites",
      "Travel programs with per-diem-aware booking and GovCon-compliant audit trails",
      "Direct purchasing relationships with primes for sub-contracted material flow",
    ],
    goodIf: [
      "You're buying through retail or commercial channels because GSA pricing felt out of reach",
      "Your IT refresh on an active contract is squeezing margin you priced last year",
      "You operate vehicles on contract sites and your current fuel card has no audit reporting",
    ],
  },
  {
    slug: "equipment",
    title: "Equipment",
    shortName: "Equipment",
    headline: "Financing for the specialty equipment your contract requires.",
    blurb:
      "Specialty equipment financing for ITAR-compliant manufacturing tooling, secured-facility build-outs, contract-specific vehicles, lab instruments, and field hardware. Lenders that understand contract-tied collateral and won't recall the lease when the option year doesn't exercise.",
    whatYouGet: [
      "Soft pulls on initial qualification (hard pulls only after you accept a term sheet)",
      "Lenders that understand contract-tied collateral and option-year risk",
      "Lease-to-own structures that match your period of performance",
      "ITAR-compliant lender relationships when the equipment falls under export control",
      "Refinance comparisons on existing equipment notes priced at 2024-era rates",
    ],
    goodIf: [
      "You just won a contract that requires equipment you don't yet own",
      "Your dealer's captive finance is the only option you've been quoted",
      "You're sitting on a high-rate equipment note from when SOFR peaked",
    ],
  },
  {
    slug: "compliance",
    title: "Compliance",
    shortName: "Compliance",
    headline: "Filing deadlines and certifications tracked against your registration.",
    blurb:
      "SAM.gov renewal reminders, CMMC and NIST 800-171 readiness, FAR/DFARS clause tracking, set-aside recertification, exclusion-list monitoring on your subs, and CPARS rebuttal windows — all pegged to your entity's actual cadence.",
    whatYouGet: [
      "SAM registration renewal reminders ahead of the 365-day deadline",
      "CMMC and NIST 800-171 readiness assessments for the level your contracts require",
      "Set-aside recertification reminders (size standard, 8(a), WOSB, HUBZone, SDVOSB, VOSB)",
      "Exclusion list (SAM exclusions / EPLS) monitoring on you and your subs",
      "CPARS notification and rebuttal-window tracking",
    ],
    goodIf: [
      "Your SAM expiration is inside 90 days and nobody owns the renewal",
      "Your DoD contracts have a CMMC clause and you haven't started the gap analysis",
      "You're 8(a) graduating, HUBZone redesignated, or your size standard is changing",
    ],
  },
];

export function categoryBySlug(slug: string): Category | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}

export function federalStats() {
  return {
    registeredEntities: "1.74M",
    registeredEntitiesFull: "1,740,000",
    contractsLifetimeTracked: "21.7M",
    annualObligations: "$759B",
    activeSolicitationsToday: "12,400",
  };
}
