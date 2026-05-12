import SectionPlaceholder from "@/components/dashboard/SectionPlaceholder";

type Props = { params: Promise<{ uei: string }> };

export const metadata = { title: "Equipment — Government Contracted" };

export default async function EquipmentPage({ params }: Props) {
  const { uei } = await params;
  return (
    <SectionPlaceholder
      eyebrow="Equipment"
      title="Financing for specialty equipment."
      description="Specialty equipment financing for ITAR-compliant tooling, secured-facility build-outs, contract-specific vehicles, lab instruments, and field hardware. Lenders that understand contract-tied collateral."
      backHref={`/dashboard/${uei}`}
    />
  );
}
