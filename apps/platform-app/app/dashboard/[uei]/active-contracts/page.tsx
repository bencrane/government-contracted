import { resolveTenantUei } from "@/lib/tenant";
import { getActiveContracts } from "@/lib/catalyst/client";
import ActiveContractsSurface from "@/components/dashboard/ActiveContractsSurface";

type Props = { params: Promise<{ uei: string }> };

export const metadata = { title: "Active contracts — Government Contracted" };

export default async function ActiveContractsPage({ params }: Props) {
  const { uei: raw } = await params;
  const uei = await resolveTenantUei(raw); // auth + membership-set check; 404 on mismatch
  const data = await getActiveContracts(uei);
  return <ActiveContractsSurface uei={uei} data={data} />;
}
