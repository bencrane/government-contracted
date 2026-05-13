// Minimal mock partner data — enough to render the partner shell and pages.
//
// Real reads will pull from organizations (partner orgs) +
// transfers (CRM pipeline) once the platform is wired to real data.

export type PartnerOrg = {
  slug: string;
  name: string;
  category: "surety_provider" | "capital_provider" | "gpo_provider" | "equipment_lessor" | "consulting_firm";
  plan: "starter" | "growth" | "enterprise";
};

export type PartnerData = {
  org: PartnerOrg;
  pipelineCount: number;
  newTransfersCount: number;
  activeSpecCount: number;
};

const DEFAULT_PARTNER: PartnerOrg = {
  slug: "atlantic-surety-group",
  name: "Atlantic Surety Group",
  category: "surety_provider",
  plan: "growth",
};

export function getMockPartner(slug?: string): PartnerData {
  const targetSlug = slug ?? DEFAULT_PARTNER.slug;
  return {
    org: { ...DEFAULT_PARTNER, slug: targetSlug },
    pipelineCount: 24,
    newTransfersCount: 6,
    activeSpecCount: 3,
  };
}
