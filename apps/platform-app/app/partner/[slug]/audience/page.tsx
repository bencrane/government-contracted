import SectionPlaceholder from "@/components/dashboard/SectionPlaceholder";

type Props = { params: Promise<{ slug: string }> };

export const metadata = { title: "Audience browser — Partner" };

export default async function AudienceBrowserPage({ params }: Props) {
  const { slug } = await params;
  return (
    <SectionPlaceholder
      eyebrow="Audience browser"
      title="Browse and filter the contractor universe."
      description="Faceted search over registered SAM.gov entities + their USAspending awards history. Filter by NAICS, set-aside, agency, award-value band, performance state, recompete window. Build a spec from any view."
      backHref={`/partner/${slug}`}
    />
  );
}
