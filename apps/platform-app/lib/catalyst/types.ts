/**
 * Wire contracts for the catalyst_api (core-x) entity surfaces.
 *
 * These mirror the catalyst_api Pydantic models 1:1 (camelCase on the wire via its
 * alias generator) — the BFF does envelope-unwrap only, no per-field transform.
 * Every `null` here is a real GAP in the gold layer, not a placeholder: the source
 * dataset does not carry the field. The frontend renders explicit empty-states for
 * these rather than fabricating a value.
 *
 * Source of truth: core-x/apps/catalyst_api/src/models.py.
 */

export interface Address {
  /** GAP — sam_entity_master carries no street line. Always null. */
  street: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
}

export interface SamPoc {
  /** sam_pocs.poc_type, e.g. electronic_business | past_performance | government_business (+ *_alt) */
  type: string | null;
  pocSlotNo: number | null;
  fullName: string | null;
  title: string | null;
  city: string | null;
  state: string | null;
  /** GAP — sam_pocs carries no email column. Always null. */
  email: string | null;
  /** GAP — sam_pocs carries no phone column. Always null. */
  phone: string | null;
}

export interface SamProfilePayload {
  uei: string | null;
  cageCode: string | null;
  legalBusinessName: string | null;
  /** DERIVED: 'active' | 'expired' (expiration_date vs today). */
  registrationStatus: string | null;
  registrationDate: string | null;
  activationDate: string | null;
  expirationDate: string | null;
  daysUntilExpiration: number | null;
  primaryNaics: string | null;
  secondaryNaics: string[];
  pscCodes: string[];
  /** Raw ~-delimited SAM business_types. NOT parsed (operator ruling). */
  businessTypesRaw: string | null;
  physicalAddress: Address;
  /** GAP — no mailing address at source. Always null. */
  mailingAddress: Address | null;
  governmentPocs: SamPoc[];
}

export interface AwardLineItem {
  awardId: string | null;
  displayAwardId: string | null;
  category: string | null;
  type: string | null;
  obligation: number | null;
  amount: number | null;
  naics: string | null;
  naicsDescription: string | null;
  pscDescription: string | null;
  fundingAgency: string | null;
  awardingAgency: string | null;
  setAside: string | null;
  description: string | null;
  awardDate: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  daysToEnd: number | null;
  /** DERIVED: 'active' | 'completed'. */
  status: string | null;
  isActive: boolean | null;
  /** GAP — no subtier column in award_search. Always null. */
  subAgency: string | null;
  /** GAP — no option-year metadata. Always null. */
  optionYearDecisionWindow: string | null;
  /** GAP — no contracting-officer fields. Always null. */
  agencyPoc: string | null;
  /** GAP — modification history not materialized. Always null. */
  modifications: unknown[] | null;
}

export interface ActiveContractsPayload {
  count: number | null;
  totalObligated: number | null;
  agencies: string[];
  contracts: AwardLineItem[];
}

export interface OverviewPayload {
  uei: string | null;
  lifetimeAwardValue: number | null;
  activeContractValue: number | null;
  totalContractCount: number | null;
  activeContractCount: number | null;
  hasFederalAwards: boolean | null;
  asOfDate: string | null;
}

export interface PastPerformancePayload {
  closedCount: number | null;
  awardsLifetime: number | null;
  contractsLifetime: number | null;
  contracts: AwardLineItem[];
  /** GAP — no CPARS dataset. Always empty. */
  cparsRatings: unknown[];
  /** GAP. */
  cparsAverageRating: number | null;
  /** GAP — no SAM exclusions dataset. */
  exclusionsStatus: string | null;
  /** GAP. */
  exclusionsLastChecked: string | null;
  /** GAP — no option/recompete metadata. */
  recompetesIn12Mo: number | null;
}
