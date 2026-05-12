import SectionPlaceholder from "@/components/dashboard/SectionPlaceholder";

type Props = { params: Promise<{ slug: string }> };

export const metadata = { title: "Billing — Partner" };

export default async function BillingPage({ params }: Props) {
  const { slug } = await params;
  return (
    <SectionPlaceholder
      eyebrow="Billing"
      title="Plan, invoices, and payment method."
      description="Current plan and seat count, invoice history, payment method on file. Stripe-backed; portal opens in a new tab for self-service changes."
      backHref={`/partner/${slug}`}
    />
  );
}
