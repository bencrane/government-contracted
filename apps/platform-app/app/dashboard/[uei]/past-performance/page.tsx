import { resolveTenantUei } from "@/lib/tenant";
import { getPastPerformance } from "@/lib/catalyst/client";
import PastPerformanceSurface from "@/components/dashboard/PastPerformanceSurface";

type Props = { params: Promise<{ uei: string }> };

export const metadata = { title: "Past performance — Government Contracted" };

export default async function PastPerformancePage({ params }: Props) {
  const { uei: raw } = await params;
  const uei = await resolveTenantUei(raw); // auth + membership-set check; 404 on mismatch
  const data = await getPastPerformance(uei);
  return <PastPerformanceSurface uei={uei} data={data} />;
}
