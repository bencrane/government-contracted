import SectionPlaceholder from "@/components/dashboard/SectionPlaceholder";

type Props = { params: Promise<{ uei: string }> };

export const metadata = { title: "Active contracts — Government Contracted" };

export default async function ActiveContractsPage({ params }: Props) {
  const { uei } = await params;
  return (
    <SectionPlaceholder
      eyebrow="Active contracts"
      title="Contracts you're currently performing on."
      description="Funding obligations, periods of performance, option-year decision windows, agency POCs, and modification history. Direct view into your USAspending awards filtered to active status."
      backHref={`/dashboard/${uei}`}
    />
  );
}
