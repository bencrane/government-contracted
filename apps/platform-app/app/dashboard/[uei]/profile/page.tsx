import { resolveTenantUei } from "@/lib/tenant";
import { getSamProfile } from "@/lib/catalyst/client";
import SamProfileSurface from "@/components/dashboard/SamProfileSurface";

type Props = { params: Promise<{ uei: string }> };

export const metadata = { title: "SAM.gov profile — Government Contracted" };

export default async function ProfilePage({ params }: Props) {
  const { uei: raw } = await params;
  const uei = await resolveTenantUei(raw); // auth + membership-set check; 404 on mismatch
  const profile = await getSamProfile(uei);
  return <SamProfileSurface uei={uei} profile={profile} />;
}
