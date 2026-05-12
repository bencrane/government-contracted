import SectionPlaceholder from "@/components/dashboard/SectionPlaceholder";

type Props = { params: Promise<{ slug: string }> };

export const metadata = { title: "Overview — Partner" };

export default async function PartnerOverviewPage({ params }: Props) {
  const { slug } = await params;
  return (
    <SectionPlaceholder
      eyebrow="Partner overview"
      title="Pipeline at a glance."
      description="Active spec, new transfers since last login, pipeline by disposition, and the contractors in your funnel right now."
      backHref={`/partner/${slug}/transfers`}
      backLabel="Open Transfer Inbox"
    />
  );
}
