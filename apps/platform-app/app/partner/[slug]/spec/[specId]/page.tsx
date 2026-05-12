import SectionPlaceholder from "@/components/dashboard/SectionPlaceholder";

type Props = { params: Promise<{ slug: string; specId: string }> };

export const metadata = { title: "Spec detail — Partner" };

export default async function SpecDetailPage({ params }: Props) {
  const { slug, specId } = await params;
  return (
    <SectionPlaceholder
      eyebrow={`Spec · ${specId}`}
      title="Spec detail."
      description="Filter criteria, locked audience size, matches over time, current pipeline by disposition, conversion metrics."
      backHref={`/partner/${slug}/spec`}
      backLabel="Back to specs"
    />
  );
}
