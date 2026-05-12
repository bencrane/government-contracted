import SectionPlaceholder from "@/components/dashboard/SectionPlaceholder";

type Props = { params: Promise<{ uei: string }> };

export const metadata = { title: "Compliance — Government Contracted" };

export default async function CompliancePage({ params }: Props) {
  const { uei } = await params;
  return (
    <SectionPlaceholder
      eyebrow="Compliance"
      title="Filing deadlines and certifications."
      description="SAM renewal, CMMC, NIST 800-171, set-aside recertification, exclusions monitoring, CPARS rebuttal windows — pegged to your entity's actual cadence. Full surface lands in the next iteration."
      backHref={`/dashboard/${uei}`}
    />
  );
}
