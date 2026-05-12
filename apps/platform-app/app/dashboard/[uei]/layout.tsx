import ContractorSidebar from "@/components/dashboard/ContractorSidebar";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { getMockDashboard } from "@/lib/mock-dashboard";

type Props = {
  children: React.ReactNode;
  params: Promise<{ uei: string }>;
};

export default async function ContractorShell({ children, params }: Props) {
  const { uei } = await params;
  const cleanUei = uei.toUpperCase().replace(/[^A-HJ-NP-Z0-9]/g, "");
  const data = getMockDashboard(cleanUei);

  return (
    <DashboardShell
      sidebar={
        <ContractorSidebar
          uei={cleanUei}
          contractorName={data.contractor.legalBusinessName}
        />
      }
    >
      {children}
    </DashboardShell>
  );
}
