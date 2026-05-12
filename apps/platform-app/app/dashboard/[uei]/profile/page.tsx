import SectionPlaceholder from "@/components/dashboard/SectionPlaceholder";

type Props = { params: Promise<{ uei: string }> };

export const metadata = { title: "SAM.gov profile — Government Contracted" };

export default async function ProfilePage({ params }: Props) {
  const { uei } = await params;
  return (
    <SectionPlaceholder
      eyebrow="SAM.gov profile"
      title="Your live entity record."
      description="Registration status, expiration, NAICS, set-aside eligibility, addresses, POCs, and CAGE — pulled fresh from SAM.gov daily. Full surface lands in the next iteration."
      backHref={`/dashboard/${uei}`}
    />
  );
}
