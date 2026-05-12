import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import IdentityStrip from "@/components/dashboard/IdentityStrip";
import HealthRow from "@/components/dashboard/HealthRow";
import EventFeed from "@/components/dashboard/EventFeed";
import NextDeadlines from "@/components/dashboard/NextDeadlines";
import ActionShortcuts from "@/components/dashboard/ActionShortcuts";
import { getMockDashboard } from "@/lib/mock-dashboard";

type Props = {
  params: Promise<{ uei: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { uei } = await params;
  const cleanUei = uei.toUpperCase().slice(0, 12);
  return {
    title: `UEI ${cleanUei} · Dashboard — Government Contracted`,
    description: "Your live SAM.gov profile, awards history, and active contracts.",
  };
}

export default async function DashboardPage({ params }: Props) {
  const { uei } = await params;
  const cleanUei = uei.toUpperCase().replace(/[^A-HJ-NP-Z0-9]/g, "");
  if (!cleanUei || cleanUei.length < 3) notFound();

  const data = getMockDashboard(cleanUei);
  const recentFeed = data.feed.slice(0, 4);

  return (
    <>
      <IdentityStrip contractor={data.contractor} />
      <HealthRow
        sam={data.sam}
        surety={data.surety}
        worstCompliance={data.worstCompliance}
        activeContractsCount={data.activeContracts.count}
      />

      <section className="flex-1 bg-background">
        <div className="mx-auto max-w-[1400px] px-6 py-8 space-y-12">
          <NextDeadlines
            deadlines={data.deadlines}
            href={`/dashboard/${cleanUei}/compliance`}
          />

          <div>
            <div className="mb-4 flex items-end justify-between">
              <h2 className="font-display text-2xl text-navy-900">What&apos;s new</h2>
              <Link
                href={`/dashboard/${cleanUei}/inbox`}
                className="group inline-flex items-center gap-1.5 text-sm font-medium text-navy-700 transition-colors hover:text-navy-800"
              >
                Full inbox
                <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </Link>
            </div>
            <EventFeed events={recentFeed} hideHeader />
          </div>
        </div>
      </section>

      <ActionShortcuts uei={cleanUei} />
    </>
  );
}
