import SectionPlaceholder from "@/components/dashboard/SectionPlaceholder";

type Props = { params: Promise<{ slug: string }> };

export const metadata = { title: "Pipeline — Partner" };

export default async function PipelinePage({ params }: Props) {
  const { slug } = await params;
  return (
    <SectionPlaceholder
      eyebrow="Pipeline"
      title="Your CRM funnel."
      description="Contractors by disposition: new, contacted, quoted, won, lost. Drag between columns or update inline."
      backHref={`/partner/${slug}`}
    />
  );
}
