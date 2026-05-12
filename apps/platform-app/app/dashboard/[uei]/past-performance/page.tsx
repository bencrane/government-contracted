import SectionPlaceholder from "@/components/dashboard/SectionPlaceholder";

type Props = { params: Promise<{ uei: string }> };

export const metadata = { title: "Past performance — Government Contracted" };

export default async function PastPerformancePage({ params }: Props) {
  const { uei } = await params;
  return (
    <SectionPlaceholder
      eyebrow="Past performance"
      title="CPARS ratings, exclusions, and recompete radar."
      description="CPARS ratings by contract, exclusions monitoring on you and your sub chain, and recompete windows on contracts ending in the next 6, 12, and 18 months."
      backHref={`/dashboard/${uei}`}
    />
  );
}
