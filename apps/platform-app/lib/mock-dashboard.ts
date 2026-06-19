// Mock dashboard data for one example contractor.
//
// Real reads live in data-engine-x (USAspending contracts, SAM.gov entities,
// derived parquet via DuckDB-on-R2). The Tier 2 derived-parquet pattern is
// being established in the FMCSA platform first; once that pattern is proven
// end-to-end, these mocks swap one-for-one for real reads via the same
// pattern, table-by-table.
//
// Until then: contractor lookups by UEI return this dataset regardless of
// which UEI is in the URL. Shape parity matters more than content fidelity.

export type SamStatus = "active" | "pending" | "expired";
export type HealthStatus = "good" | "warn" | "alert";

export type ContractorProfile = {
  uei: string;
  cageCode: string;
  ein: string;
  legalBusinessName: string;
  dba?: string;
  status: SamStatus;
  samExpirationDate: string;
  daysToSamExpiration: number;
  naicsPrimary: { code: string; description: string };
  naicsSecondary: { code: string; description: string }[];
  setAsideEligibility: string[];
  registeredSince: string;
  yearsRegistered: { years: number; months: number };
  awardsLifetime: number;
  contractsLifetime: number;
  activeContracts: number;
  activeContractObligated: number;
  domicileState: string;
  performanceStates: string[];
  refreshedAt: string;
  legalAddress: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  pocPrimary: { name: string; title: string; email: string; phone: string };
};

export type SamRegistration = {
  registeredAt: string;
  daysSinceRegistered: number;
  expiresAt: string;
  daysToExpiration: number;
  status: HealthStatus;
};

export type SuretyOnFile = {
  surety: string;
  aggregateLimit: string;
  singleProjectLimit: string;
  effective: string;
  expires: string;
  daysToExpiration: number;
  status: HealthStatus;
  agent: { name: string; phone: string };
  history: {
    type: string;
    surety: string;
    effective: string;
    expired: string;
  }[];
};

export type CparsRating = {
  agency: string;
  contractNumber: string;
  rating: "exceptional" | "very_good" | "satisfactory" | "marginal" | "unsatisfactory";
  period: string;
  contractValue: number;
};

export type Award = {
  id: string;
  contractNumber: string;
  agency: string;
  subAgency?: string;
  description: string;
  obligatedAmount: number;
  potentialAmount: number;
  awardDate: string;
  periodStart: string;
  periodEnd: string;
  daysToEnd: number;
  setAside?: string;
  naicsCode: string;
  status: "active" | "completed" | "terminated";
};

export type PastPerformanceSnapshot = {
  awardsLifetime: number;
  contractsLifetime: number;
  cparsAverageRating: "exceptional" | "very_good" | "satisfactory" | "marginal";
  exclusionsStatus: "clean" | "listed";
  exclusionsLastChecked: string;
  recompetesIn12Mo: number;
  cparsRatings: CparsRating[];
};

export type ActiveContract = Award;

export type ActiveContractsSnapshot = {
  count: number;
  totalObligated: number;
  agencies: string[];
  contracts: ActiveContract[];
};

export type ComplianceCheck = {
  id: string;
  type: "SAM" | "CMMC" | "NIST-800-171" | "Set-Aside" | "Exclusions" | "Reps-Certs" | "CPARS";
  label: string;
  status: HealthStatus;
  detail: string;
  dueDate?: string;
};

export type ComplianceSnapshot = {
  samRenewal: { dueDate: string; status: HealthStatus };
  cmmc: {
    level: "Level 1" | "Level 2" | "Level 3" | "Not assessed";
    status: HealthStatus;
    lastAssessment?: string;
  };
  nist800_171: { status: HealthStatus; selfAssessmentDate?: string };
  setAsideRecertification: { dueDate?: string; status: HealthStatus };
  exclusions: { status: HealthStatus; lastChecked: string };
  cpars: { openRebuttalWindows: number; status: HealthStatus };
  checks: ComplianceCheck[];
};

export type Deadline = {
  id: string;
  type: string;
  label: string;
  dueDate: string;
  daysToDue: number;
  status: HealthStatus;
  /** false ⇒ hydrated from live data; absent/true ⇒ mock placeholder. */
  isMock?: boolean;
};

export type FeedEvent = {
  id: string;
  category:
    | "compliance"
    | "opportunities"
    | "surety"
    | "capital"
    | "vendor_programs"
    | "equipment"
    | "past_performance"
    | "active_contracts"
    | "sam_registration";
  timestamp: string;
  relativeTime: string;
  title: string;
  body: string;
  primaryAction?: { label: string; href: string };
  secondaryAction?: { label: string; href: string };
  status?: HealthStatus;
  /** false ⇒ hydrated from live data; absent/true ⇒ mock placeholder. */
  isMock?: boolean;
};

export type InboxCategory =
  | "compliance"
  | "opportunities"
  | "surety"
  | "capital"
  | "vendor_programs"
  | "equipment"
  | "past_performance"
  | "active_contracts"
  | "sam_registration"
  | "system";

export type InboxMessage = {
  id: string;
  category: InboxCategory;
  subject: string;
  preview: string;
  body: string;
  fromName: string;
  fromEmail: string;
  sentAt: string;
  relativeTime: string;
  read: boolean;
  important: boolean;
  primaryAction?: { label: string; href: string };
};

export type NotificationCadence = "immediate" | "daily_digest" | "weekly_digest" | "off";

export type NotificationPreference = {
  category: InboxCategory;
  label: string;
  description: string;
  cadence: NotificationCadence;
};

export type DashboardData = {
  contractor: ContractorProfile;
  sam: SamRegistration;
  surety: SuretyOnFile;
  worstCompliance: ComplianceCheck;
  pastPerformance: PastPerformanceSnapshot;
  activeContracts: ActiveContractsSnapshot;
  compliance: ComplianceSnapshot;
  deadlines: Deadline[];
  feed: FeedEvent[];
  inbox: InboxMessage[];
  notificationPreferences: NotificationPreference[];
};

const DEFAULT_UEI = "ABC123DEF456";

export function getMockDashboard(uei?: string): DashboardData {
  const targetUei = (uei ?? DEFAULT_UEI).toUpperCase().slice(0, 12) || DEFAULT_UEI;

  const contractor: ContractorProfile = {
    uei: targetUei,
    cageCode: "8K2Y4",
    ein: "82-1834729",
    legalBusinessName: "Acme Federal Services LLC",
    dba: "Acme Federal",
    status: "active",
    samExpirationDate: "Sep 14, 2026",
    daysToSamExpiration: 126,
    naicsPrimary: { code: "541330", description: "Engineering Services" },
    naicsSecondary: [
      { code: "541512", description: "Computer Systems Design Services" },
      { code: "541611", description: "Administrative Management Consulting" },
      { code: "541330", description: "Engineering Services" },
    ],
    setAsideEligibility: ["Small Business", "SDVOSB", "HUBZone"],
    registeredSince: "Mar 14, 2017",
    yearsRegistered: { years: 9, months: 2 },
    awardsLifetime: 4_217_400,
    contractsLifetime: 17,
    activeContracts: 3,
    activeContractObligated: 1_105_200,
    domicileState: "VA",
    performanceStates: ["VA", "MD", "DC", "DE", "PA", "WV"],
    refreshedAt: "4 hours ago",
    legalAddress: {
      street: "8200 Greensboro Dr Ste 900",
      city: "McLean",
      state: "VA",
      zip: "22102",
    },
    pocPrimary: {
      name: "Jordan Mehta",
      title: "Director of Contracts",
      email: "jordan.mehta@acmefederal.com",
      phone: "(703) 555-0118",
    },
  };

  const sam: SamRegistration = {
    registeredAt: "Mar 14, 2017",
    daysSinceRegistered: 3_348,
    expiresAt: "Sep 14, 2026",
    daysToExpiration: 126,
    status: "warn",
  };

  const surety: SuretyOnFile = {
    surety: "Liberty Mutual Surety",
    aggregateLimit: "$5,000,000",
    singleProjectLimit: "$1,500,000",
    effective: "Jan 1, 2026",
    expires: "Jan 1, 2027",
    daysToExpiration: 235,
    status: "good",
    agent: { name: "Atlantic Surety Group", phone: "(703) 555-0241" },
    history: [
      {
        type: "Performance/Payment",
        surety: "Liberty Mutual Surety",
        effective: "Jan 1, 2026",
        expired: "—",
      },
      {
        type: "Performance/Payment",
        surety: "Travelers Casualty",
        effective: "Jan 1, 2025",
        expired: "Jan 1, 2026",
      },
    ],
  };

  const cparsRatings: CparsRating[] = [
    {
      agency: "Department of the Army",
      contractNumber: "W912DR-24-D-0017",
      rating: "very_good",
      period: "FY2024",
      contractValue: 870_000,
    },
    {
      agency: "Department of the Navy",
      contractNumber: "N00024-23-C-4419",
      rating: "exceptional",
      period: "FY2023",
      contractValue: 1_220_000,
    },
    {
      agency: "GSA / FAS",
      contractNumber: "47QRAA22D004F",
      rating: "satisfactory",
      period: "FY2023",
      contractValue: 318_000,
    },
  ];

  const activeAwards: ActiveContract[] = [
    {
      id: "aw-1",
      contractNumber: "W912DR-26-C-0044",
      agency: "Department of the Army",
      subAgency: "USACE — Baltimore District",
      description: "Civil engineering design support, multi-site",
      obligatedAmount: 540_000,
      potentialAmount: 1_870_000,
      awardDate: "Jan 28, 2026",
      periodStart: "Feb 1, 2026",
      periodEnd: "Jan 31, 2027",
      daysToEnd: 265,
      setAside: "SDVOSB",
      naicsCode: "541330",
      status: "active",
    },
    {
      id: "aw-2",
      contractNumber: "47QRAA26D0119",
      agency: "General Services Administration",
      subAgency: "FAS",
      description: "MAS IT-70 task order: federal cloud migration support",
      obligatedAmount: 412_000,
      potentialAmount: 1_240_000,
      awardDate: "Nov 14, 2025",
      periodStart: "Dec 1, 2025",
      periodEnd: "Nov 30, 2026",
      daysToEnd: 203,
      naicsCode: "541512",
      status: "active",
    },
    {
      id: "aw-3",
      contractNumber: "N00024-25-D-7711",
      agency: "Department of the Navy",
      subAgency: "NAVSEA",
      description: "Engineering analysis support — option year 1",
      obligatedAmount: 153_200,
      potentialAmount: 612_800,
      awardDate: "Jun 3, 2025",
      periodStart: "Jul 1, 2025",
      periodEnd: "Jun 30, 2026",
      daysToEnd: 50,
      naicsCode: "541330",
      status: "active",
    },
  ];

  const pastPerformance: PastPerformanceSnapshot = {
    awardsLifetime: contractor.awardsLifetime,
    contractsLifetime: contractor.contractsLifetime,
    cparsAverageRating: "very_good",
    exclusionsStatus: "clean",
    exclusionsLastChecked: "4 hours ago",
    recompetesIn12Mo: 2,
    cparsRatings,
  };

  const activeContracts: ActiveContractsSnapshot = {
    count: activeAwards.length,
    totalObligated: activeAwards.reduce((sum, a) => sum + a.obligatedAmount, 0),
    agencies: ["Department of the Army", "GSA", "Department of the Navy"],
    contracts: activeAwards,
  };

  const compliance: ComplianceSnapshot = {
    samRenewal: { dueDate: "Sep 14, 2026", status: "warn" },
    cmmc: { level: "Level 2", status: "warn", lastAssessment: "Nov 2024 (self)" },
    nist800_171: { status: "good", selfAssessmentDate: "Feb 12, 2026" },
    setAsideRecertification: { dueDate: "Mar 14, 2027", status: "good" },
    exclusions: { status: "good", lastChecked: "4 hours ago" },
    cpars: { openRebuttalWindows: 0, status: "good" },
    checks: [
      {
        id: "ck-sam",
        type: "SAM",
        label: "SAM registration renewal",
        status: "warn",
        detail: "126 days until expiration. Start the renewal at 90 days.",
        dueDate: "Sep 14, 2026",
      },
      {
        id: "ck-cmmc",
        type: "CMMC",
        label: "CMMC Level 2 third-party assessment",
        status: "warn",
        detail: "Active DoD contract has CDI clause; current Level 2 is self-assessed.",
      },
      {
        id: "ck-nist",
        type: "NIST-800-171",
        label: "NIST 800-171 self-assessment",
        status: "good",
        detail: "SPRS score 88 of 110 posted Feb 12, 2026.",
      },
      {
        id: "ck-setaside",
        type: "Set-Aside",
        label: "SDVOSB recertification",
        status: "good",
        detail: "Next recertification due Mar 14, 2027.",
      },
      {
        id: "ck-excl",
        type: "Exclusions",
        label: "Exclusions list check",
        status: "good",
        detail: "No exclusions for entity or known subs. Last checked 4 hours ago.",
      },
    ],
  };

  const worstCompliance: ComplianceCheck =
    compliance.checks.find((c) => c.status === "alert") ??
    compliance.checks.find((c) => c.status === "warn") ??
    compliance.checks[0];

  const deadlines: Deadline[] = [
    {
      id: "dl-1",
      type: "SAM Renewal",
      label: "Begin SAM renewal cycle",
      dueDate: "Jun 16, 2026",
      daysToDue: 36,
      status: "warn",
    },
    {
      id: "dl-2",
      type: "Option Exercise",
      label: "Navy NAVSEA option-year decision window opens",
      dueDate: "May 30, 2026",
      daysToDue: 19,
      status: "warn",
    },
    {
      id: "dl-3",
      type: "Reps & Certs",
      label: "Annual FAR/DFARS reps & certs update",
      dueDate: "Sep 14, 2026",
      daysToDue: 126,
      status: "good",
    },
  ];

  const feed: FeedEvent[] = [
    {
      id: "f-1",
      category: "active_contracts",
      timestamp: "2026-05-11T13:24:00Z",
      relativeTime: "2 hours ago",
      title: "Modification posted: W912DR-26-C-0044",
      body: "Funding obligation increased by $112,000 against task order mod P00002.",
      status: "good",
      primaryAction: { label: "View contract", href: `/dashboard/${targetUei}/active-contracts` },
    },
    {
      id: "f-2",
      category: "opportunities",
      timestamp: "2026-05-11T11:02:00Z",
      relativeTime: "4 hours ago",
      title: "3 new solicitations matched your NAICS 541330",
      body: "USACE Norfolk, USACE Mobile, and NAVFAC Atlantic posted A/E support solicitations matching your set-aside.",
      primaryAction: { label: "See solicitations", href: `/dashboard/${targetUei}/opportunities` },
    },
    {
      id: "f-3",
      category: "compliance",
      timestamp: "2026-05-11T08:15:00Z",
      relativeTime: "7 hours ago",
      title: "SAM renewal window opens in 36 days",
      body: "Sep 14, 2026 is your registration expiration. Start the renewal cycle at 90 days to avoid lapses in award eligibility.",
      status: "warn",
      primaryAction: { label: "Renewal checklist", href: `/dashboard/${targetUei}/compliance` },
    },
    {
      id: "f-4",
      category: "past_performance",
      timestamp: "2026-05-10T19:48:00Z",
      relativeTime: "yesterday",
      title: "CPARS rating posted: W912DR-24-D-0017",
      body: "Army rated 'Very Good' across all six dimensions. No rebuttal needed; period closes May 24.",
      status: "good",
      primaryAction: { label: "View CPARS", href: `/dashboard/${targetUei}/past-performance` },
    },
    {
      id: "f-5",
      category: "surety",
      timestamp: "2026-05-09T14:30:00Z",
      relativeTime: "2 days ago",
      title: "Surety quote received: Atlantic Surety Group",
      body: "Aggregate-limit increase from $5M to $8M; rate 1.4% on the first $1.5M, 1.8% above.",
      primaryAction: { label: "Review quote", href: `/dashboard/${targetUei}/surety` },
    },
  ];

  const inbox: InboxMessage[] = feed.map((f, i) => ({
    id: `inb-${i + 1}`,
    category: f.category as InboxCategory,
    subject: f.title,
    preview: f.body,
    body: f.body,
    fromName: "Government Contracted",
    fromEmail: "alerts@governmentcontracted.com",
    sentAt: f.timestamp,
    relativeTime: f.relativeTime,
    read: i > 2,
    important: i === 2,
    primaryAction: f.primaryAction,
  }));

  const notificationPreferences: NotificationPreference[] = [
    {
      category: "sam_registration",
      label: "SAM registration",
      description: "Renewal windows, expiration risk, registration-status changes.",
      cadence: "immediate",
    },
    {
      category: "compliance",
      label: "Compliance",
      description: "CMMC, NIST 800-171, set-aside recertification, FAR/DFARS reps & certs.",
      cadence: "immediate",
    },
    {
      category: "active_contracts",
      label: "Active contracts",
      description: "Modifications, option exercises, period-of-performance ends, funding obligations.",
      cadence: "immediate",
    },
    {
      category: "opportunities",
      label: "Opportunities",
      description: "Solicitations matching your NAICS, set-aside, and past performance.",
      cadence: "daily_digest",
    },
    {
      category: "past_performance",
      label: "Past performance",
      description: "CPARS ratings posted, rebuttal windows, exclusion alerts on subs.",
      cadence: "immediate",
    },
    {
      category: "surety",
      label: "Surety",
      description: "Quotes, capacity increases, expiration reminders.",
      cadence: "weekly_digest",
    },
    {
      category: "capital",
      label: "Capital",
      description: "Mobilization financing, factoring quotes, working-capital lines.",
      cadence: "weekly_digest",
    },
    {
      category: "vendor_programs",
      label: "Vendor programs",
      description: "GPO offers, GSA Advantage reseller pricing, fleet program updates.",
      cadence: "weekly_digest",
    },
    {
      category: "equipment",
      label: "Equipment",
      description: "Financing offers, refinance opportunities on existing notes.",
      cadence: "off",
    },
    {
      category: "system",
      label: "System",
      description: "Account, billing, and security notifications.",
      cadence: "immediate",
    },
  ];

  return {
    contractor,
    sam,
    surety,
    worstCompliance,
    pastPerformance,
    activeContracts,
    compliance,
    deadlines,
    feed,
    inbox,
    notificationPreferences,
  };
}
