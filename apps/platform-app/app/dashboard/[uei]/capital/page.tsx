import SectionPlaceholder from "@/components/dashboard/SectionPlaceholder";

type Props = { params: Promise<{ uei: string }> };

export const metadata = { title: "Capital — Government Contracted" };

export default async function CapitalPage({ params }: Props) {
  const { uei } = await params;
  return (
    <SectionPlaceholder
      eyebrow="Capital"
      title="Working capital, mobilization, and factoring."
      description="Lines of credit, contract-mobilization loans, and government-receivables factoring matched to your invoicing cadence and the agencies you bill. Lenders that understand FAR payment cycles."
      backHref={`/dashboard/${uei}`}
    />
  );
}
