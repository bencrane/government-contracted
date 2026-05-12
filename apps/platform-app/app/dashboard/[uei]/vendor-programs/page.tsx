import SectionPlaceholder from "@/components/dashboard/SectionPlaceholder";

type Props = { params: Promise<{ uei: string }> };

export const metadata = { title: "Vendor programs — Government Contracted" };

export default async function VendorProgramsPage({ params }: Props) {
  const { uei } = await params;
  return (
    <SectionPlaceholder
      eyebrow="Vendor programs"
      title="GSA Advantage discounts and GPO programs."
      description="Negotiated pricing on the things you buy to fulfill contracts — IT hardware, professional services subscriptions, supplies, fleet fuel, travel. GSA schedule-holder reseller discounts and GPO membership pricing."
      backHref={`/dashboard/${uei}`}
    />
  );
}
