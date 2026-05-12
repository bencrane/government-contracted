import SectionPlaceholder from "@/components/dashboard/SectionPlaceholder";

type Props = { params: Promise<{ uei: string }> };

export const metadata = { title: "Inbox — Government Contracted" };

export default async function InboxPage({ params }: Props) {
  const { uei } = await params;
  return (
    <SectionPlaceholder
      eyebrow="Inbox"
      title="System notifications for your entity."
      description="Archive of every event we've surfaced — SAM renewal windows, award obligations, recompete openings, CPARS ratings, surety quotes, capital offers, compliance reminders."
      backHref={`/dashboard/${uei}`}
    />
  );
}
