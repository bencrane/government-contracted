import SectionPlaceholder from "@/components/dashboard/SectionPlaceholder";

type Props = { params: Promise<{ uei: string }> };

export const metadata = { title: "Surety bonds — Government Contracted" };

export default async function SuretyPage({ params }: Props) {
  const { uei } = await params;
  return (
    <SectionPlaceholder
      eyebrow="Surety bonds"
      title="Bid, performance, and payment bonds."
      description="Quotes from independent surety agents that write contractors at your bonding capacity, your NAICS, and your past-performance profile. Aggregate capacity increases when you're near the limit."
      backHref={`/dashboard/${uei}`}
    />
  );
}
