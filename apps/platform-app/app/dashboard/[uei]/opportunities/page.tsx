import SectionPlaceholder from "@/components/dashboard/SectionPlaceholder";

type Props = { params: Promise<{ uei: string }> };

export const metadata = { title: "Solicitations — Government Contracted" };

export default async function OpportunitiesPage({ params }: Props) {
  const { uei } = await params;
  return (
    <SectionPlaceholder
      eyebrow="Solicitations"
      title="Bid leads matched to your entity."
      description="Active solicitations filtered by your primary and secondary NAICS, set-aside eligibility, performance geography, and agencies where you've already won. Recompete radar and forecast pipeline included."
      backHref={`/dashboard/${uei}`}
    />
  );
}
