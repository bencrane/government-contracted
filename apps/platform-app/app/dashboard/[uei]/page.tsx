import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import IdentityStrip from "@/components/dashboard/IdentityStrip";
import HealthRow from "@/components/dashboard/HealthRow";
import EventFeed from "@/components/dashboard/EventFeed";
import NextDeadlines from "@/components/dashboard/NextDeadlines";
import ActionShortcuts from "@/components/dashboard/ActionShortcuts";
import MockBadge from "@/components/dashboard/MockBadge";
import { getMockDashboard } from "@/lib/mock-dashboard";
import { resolveTenantUei } from "@/lib/tenant";
import { getOverview, getSamProfile } from "@/lib/catalyst/client";
import { hydrateContractor, hydrateSam } from "@/lib/dashboard-adapter";
import { SHOW_MOCK_MARKERS } from "@/lib/flags";

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
  const { uei: raw } = await params;
  const cleanUei = await resolveTenantUei(raw); // auth + membership-set check; 404 on mismatch

  // Out-of-scope surfaces (surety, compliance, deadlines, feed) stay on the mock
  // base until they get their own ingest. The directive's "Overview Aggregates" +
  // entity identity + the SAM health tile are overlaid from real catalyst data.
  const base = getMockDashboard(cleanUei);
  const [overview, sam] = await Promise.all([getOverview(cleanUei), getSamProfile(cleanUei)]);

  const contractor = hydrateContractor(base.contractor, cleanUei, overview, sam);
  const samTile = hydrateSam(base.sam, sam);
  const activeContractsCount = overview?.activeContractCount ?? base.activeContracts.count;
  const recentFeed = base.feed.slice(0, 4);

  return (
    <>
      <IdentityStrip contractor={contractor} flagMock={SHOW_MOCK_MARKERS} />
      <HealthRow
        sam={samTile}
        surety={base.surety}
        worstCompliance={base.worstCompliance}
        activeContractsCount={activeContractsCount}
        flagMock={SHOW_MOCK_MARKERS}
      />

      <section className="flex-1 bg-background">
        <div className="mx-auto max-w-[1400px] px-6 py-8 space-y-12">
          <NextDeadlines
            deadlines={base.deadlines}
            href={`/dashboard/${cleanUei}/compliance`}
            flagMock={SHOW_MOCK_MARKERS}
          />

          <div>
            <div className="mb-4 flex items-end justify-between">
              <div className="flex items-center gap-2">
                <h2 className="font-display text-2xl text-navy-900">What&apos;s new</h2>
                {SHOW_MOCK_MARKERS && <MockBadge />}
              </div>
              <Link
                href={`/dashboard/${cleanUei}/inbox`}
                className="group inline-flex items-center gap-1.5 text-sm font-medium text-navy-700 transition-colors hover:text-navy-800"
              >
                Full inbox
                <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </Link>
            </div>
            <EventFeed events={recentFeed} hideHeader flagMock={SHOW_MOCK_MARKERS} />
          </div>
        </div>
      </section>

      <ActionShortcuts uei={cleanUei} />
    </>
  );
}
