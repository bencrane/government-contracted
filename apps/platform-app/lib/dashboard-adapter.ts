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
import type { ContractorProfile, SamRegistration, HealthStatus } from '@/lib/mock-dashboard';
import type { OverviewPayload, SamProfilePayload } from '@/lib/catalyst/types';
import { formatDate } from '@/components/dashboard/surfaces/primitives';

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
