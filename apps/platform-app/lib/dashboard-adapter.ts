/**
 * Overlay real catalyst_api data onto the Overview dashboard shell.
 *
 * Scope is deliberately narrow (operator directive: "Overview Aggregates"): this
 * hydrates the entity identity + the four aggregate headlines (lifetime value,
 * lifetime contract count, active count, active obligated) from entity_profile_gold
 * + the SAM profile, and the SAM-registration health tile. Everything else on the
 * Overview page — surety, compliance, deadlines, event feed — is a separate surface
 * with no data source in this directive and stays on its existing mock until wired.
 *
 * Pure mapping (no I/O): real values win when present; null/undefined falls back to
 * the mock base so the page still renders in dev (no catalyst gateway).
 */
import type {
  ContractorProfile,
  SamRegistration,
  HealthStatus,
  ComplianceCheck,
  Deadline,
  FeedEvent,
} from '@/lib/mock-dashboard';
import type { OverviewPayload, SamProfilePayload } from '@/lib/catalyst/types';
import { formatDate } from '@/components/dashboard/surfaces/primitives';

/** SAM advises starting the renewal cycle this many days before expiration. */
const RENEWAL_WINDOW_DAYS = 90;

export function healthFromDays(days: number | null | undefined): HealthStatus {
  if (days == null) return 'good';
  if (days <= 0) return 'alert';
  if (days <= 60) return 'warn';
  return 'good';
}

export function hydrateContractor(
  base: ContractorProfile,
  uei: string,
  overview: OverviewPayload | null,
  sam: SamProfilePayload | null,
): ContractorProfile {
  return {
    ...base,
    uei,
    cageCode: sam?.cageCode ?? base.cageCode,
    legalBusinessName: sam?.legalBusinessName ?? base.legalBusinessName,
    legalAddress: {
      ...base.legalAddress,
      city: sam?.physicalAddress.city ?? base.legalAddress.city,
      state: sam?.physicalAddress.state ?? base.legalAddress.state,
    },
    naicsPrimary: sam?.primaryNaics
      ? { code: sam.primaryNaics, description: '' } // NAICS title is a GAP on the SAM path
      : base.naicsPrimary,
    awardsLifetime: overview?.lifetimeAwardValue ?? base.awardsLifetime,
    contractsLifetime: overview?.totalContractCount ?? base.contractsLifetime,
    activeContracts: overview?.activeContractCount ?? base.activeContracts,
    activeContractObligated: overview?.activeContractValue ?? base.activeContractObligated,
  };
}

export function hydrateSam(base: SamRegistration, sam: SamProfilePayload | null): SamRegistration {
  if (!sam) return base;
  return {
    ...base,
    registeredAt: sam.registrationDate ? formatDate(sam.registrationDate) : base.registeredAt,
    expiresAt: sam.expirationDate ? formatDate(sam.expirationDate) : base.expiresAt,
    daysToExpiration: sam.daysUntilExpiration ?? base.daysToExpiration,
    status: healthFromDays(sam.daysUntilExpiration),
  };
}

// ─── SAM-renewal cluster ──────────────────────────────────────────────────────
// Real renewal status/deadline/feed item, all derived from the one live datum we
// already fetch: sam-profile.expirationDate / daysUntilExpiration. Each builder
// returns null when that datum is absent (dev/no-gateway), so the caller falls
// back to — and keeps flagging — the mock placeholder.

/** Renewal urgency: open the window at the 90-day mark, alert once expired. */
export function renewalStatus(days: number | null | undefined): HealthStatus {
  if (days == null) return 'good';
  if (days <= 0) return 'alert';
  if (days <= RENEWAL_WINDOW_DAYS) return 'warn';
  return 'good';
}

/** Shift an ISO date (YYYY-MM-DD) back by `days`, returning YYYY-MM-DD. */
function isoMinusDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

function hasRenewalFields(
  sam: SamProfilePayload | null,
): sam is SamProfilePayload & { expirationDate: string; daysUntilExpiration: number } {
  return sam != null && sam.expirationDate != null && sam.daysUntilExpiration != null;
}

/** Tile-4 compliance check, live from the SAM expiration. */
export function renewalCheck(sam: SamProfilePayload | null): ComplianceCheck | null {
  if (!hasRenewalFields(sam)) return null;
  const days = sam.daysUntilExpiration;
  const detail =
    days <= 0
      ? `Registration expired ${Math.abs(days)} days ago. Renew now to restore award eligibility.`
      : days <= RENEWAL_WINDOW_DAYS
        ? `${days} days until expiration. Renew now to avoid a lapse in eligibility.`
        : `${days} days until expiration. Renewal window opens at the ${RENEWAL_WINDOW_DAYS}-day mark.`;
  return {
    id: 'ck-sam',
    type: 'SAM',
    label: 'SAM registration renewal',
    status: renewalStatus(days),
    detail,
    dueDate: formatDate(sam.expirationDate),
  };
}

/** "Begin SAM renewal cycle" deadline = expiration − 90 days. */
export function renewalDeadline(sam: SamProfilePayload | null): Deadline | null {
  if (!hasRenewalFields(sam)) return null;
  const daysToDue = sam.daysUntilExpiration - RENEWAL_WINDOW_DAYS;
  return {
    id: 'dl-sam-renewal',
    type: 'SAM Renewal',
    label: 'Begin SAM renewal cycle',
    dueDate: formatDate(isoMinusDays(sam.expirationDate, RENEWAL_WINDOW_DAYS)),
    daysToDue,
    status: daysToDue <= 0 ? 'warn' : 'good',
    isMock: false,
  };
}

/** "SAM renewal window" feed item, live from the SAM expiration. */
export function renewalFeedEvent(sam: SamProfilePayload | null, uei: string): FeedEvent | null {
  if (!hasRenewalFields(sam)) return null;
  const days = sam.daysUntilExpiration;
  const opensIn = days - RENEWAL_WINDOW_DAYS;
  const title =
    days <= 0
      ? 'SAM registration has expired'
      : opensIn > 0
        ? `SAM renewal window opens in ${opensIn} days`
        : `SAM renewal window is open — ${days} days to expiration`;
  return {
    id: 'f-sam-renewal',
    category: 'compliance',
    timestamp: sam.expirationDate,
    relativeTime: 'Live',
    title,
    body: `${formatDate(sam.expirationDate)} is your registration expiration. Start the renewal cycle at the ${RENEWAL_WINDOW_DAYS}-day mark to avoid a lapse in award eligibility.`,
    status: renewalStatus(days),
    primaryAction: { label: 'Renewal checklist', href: `/dashboard/${uei}/compliance` },
    isMock: false,
  };
}
