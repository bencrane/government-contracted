import SectionPlaceholder from "@/components/dashboard/SectionPlaceholder";

type Props = { params: Promise<{ uei: string }> };

export const metadata = { title: "Settings — Government Contracted" };

export default async function SettingsPage({ params }: Props) {
  const { uei } = await params;
  return (
    <SectionPlaceholder
      eyebrow="Settings"
      title="Account, members, and notifications."
      description="Invite teammates, manage roles, configure notification cadence per category, manage your billing (if applicable), or delete your account and remove your profile."
      backHref={`/dashboard/${uei}`}
    />
  );
}
