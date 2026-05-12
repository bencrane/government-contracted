import SectionPlaceholder from "@/components/dashboard/SectionPlaceholder";

type Props = { params: Promise<{ slug: string }> };

export const metadata = { title: "Locked specs — Partner" };

export default async function SpecListPage({ params }: Props) {
  const { slug } = await params;
  return (
    <SectionPlaceholder
      eyebrow="Locked specs"
      title="Audience specifications you've locked in."
      description="Each spec is a typed filter against SAM.gov + USAspending: NAICS, set-aside, agency mix, award-value bands, performance geography, recompete windows. Locked specs power your transfer feed."
      backHref={`/partner/${slug}`}
    />
  );
}
