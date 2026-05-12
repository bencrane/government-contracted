import PartnerSidebar from "@/components/partner/PartnerSidebar";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { getMockPartner } from "@/lib/mock-partner";

type Props = {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
};

export default async function PartnerLayout({ children, params }: Props) {
  const { slug } = await params;
  const data = getMockPartner(slug);

  return (
    <DashboardShell
      sidebar={<PartnerSidebar slug={slug} partnerName={data.org.name} />}
    >
      {children}
    </DashboardShell>
  );
}
