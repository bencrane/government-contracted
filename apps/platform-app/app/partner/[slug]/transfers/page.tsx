import SectionPlaceholder from "@/components/dashboard/SectionPlaceholder";

type Props = { params: Promise<{ slug: string }> };

export const metadata = { title: "Transfer Inbox — Partner" };

export default async function TransfersPage({ params }: Props) {
  const { slug } = await params;
  return (
    <SectionPlaceholder
      eyebrow="Transfer inbox"
      title="New contractor matches."
      description="Every contractor that matched your spec since you last cleared the inbox. Match criteria and signal context attached to each row."
      backHref={`/partner/${slug}`}
    />
  );
}
