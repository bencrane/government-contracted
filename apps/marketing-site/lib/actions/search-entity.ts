"use server";

import { agencyMix, searchAwards, type UspAgencyAggregate, type UspAward } from "@/lib/usaspending";

export type EntitySearchResult = {
  ok: true;
  uei: string;
  legalName: string;
  topAwards: UspAward[];
  agencies: UspAgencyAggregate[];
  totalSinceFy08: number;
} | {
  ok: false;
  message: string;
};

const UEI_RX = /^[A-HJ-NP-Z0-9]{12}$/i;

function isUei(s: string) {
  return UEI_RX.test(s.trim());
}

export async function searchEntity(query: string): Promise<EntitySearchResult> {
  const q = query.trim();
  if (q.length < 3) {
    return { ok: false, message: "Type at least 3 characters." };
  }

  const searchTerm = isUei(q) ? q.toUpperCase() : q;
  const awards = await searchAwards(searchTerm, 5);

  if (awards.length === 0) {
    return {
      ok: false,
      message: isUei(q)
        ? `No federal contract awards found for UEI ${q.toUpperCase()}. SAM-registered but unawarded entities won't show here.`
        : `No federal contractor named "${q}" found. Try the legal business name as filed with SAM.gov, or the UEI.`,
    };
  }

  // Use the top award's UEI + recipient name as the canonical match.
  // If the user searched by name, this resolves to the highest-obligated UEI matching that name.
  const top = awards[0];
  const agencies = await agencyMix(top.recipientUei, 5);
  const totalSinceFy08 = agencies.reduce((sum, a) => sum + a.amount, 0);

  return {
    ok: true,
    uei: top.recipientUei,
    legalName: top.recipientName,
    topAwards: awards,
    agencies,
    totalSinceFy08,
  };
}
