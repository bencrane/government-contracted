import SectionPlaceholder from "@/components/dashboard/SectionPlaceholder";

type Props = { params: Promise<{ slug: string }> };

export const metadata = { title: "Reports — Partner" };

export default async function ReportsPage({ params }: Props) {
  const { slug } = await params;
  return (
    <SectionPlaceholder
      eyebrow="Reports"
      title="Conversion and yield by spec."
      description="Transfer volume, contact-to-quote conversion, quote-to-won conversion, and cost-per-contractor across your specs. Cohorted by month, segmentable by NAICS and agency."
      backHref={`/partner/${slug}`}
    />
  );
}
