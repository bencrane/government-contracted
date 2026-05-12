import SectionPlaceholder from "@/components/dashboard/SectionPlaceholder";

type Props = { params: Promise<{ slug: string }> };

export const metadata = { title: "Team — Partner" };

export default async function TeamPage({ params }: Props) {
  const { slug } = await params;
  return (
    <SectionPlaceholder
      eyebrow="Team"
      title="Manage team members and roles."
      description="Invite teammates by email, assign roles (owner, admin, member), audit access. Membership and role changes are written to the audit log."
      backHref={`/partner/${slug}`}
    />
  );
}
