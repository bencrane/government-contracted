import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import IdentityStrip from "@/components/dashboard/IdentityStrip";
import HealthRow from "@/components/dashboard/HealthRow";
import EventFeed from "@/components/dashboard/EventFeed";
import NextDeadlines from "@/components/dashboard/NextDeadlines";
import ActionShortcuts from "@/components/dashboard/ActionShortcuts";
import { getMockDashboard } from "@/lib/mock-dashboard";
import { resolveTenantUei } from "@/lib/tenant";
import { getOverview, getSamProfile } from "@/lib/catalyst/client";
import {
  hydrateContractor,
  hydrateSam,
  renewalCheck,
  renewalDeadline,
  renewalFeedEvent,
} from "@/lib/dashboard-adapter";
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

  // SAM-renewal cluster: derive the renewal tile, deadline, and feed item from the
  // live SAM expiration. Each builder returns null when that datum is absent, in
  // which case the mock placeholder stays in place (and stays flagged).
  const renewal = renewalCheck(sam);
  const worstCompliance = renewal ?? base.worstCompliance;
  const complianceMock = SHOW_MOCK_MARKERS && renewal == null;

  const renewalDl = renewalDeadline(sam);
  const deadlines = renewalDl
    ? base.deadlines.map((d) => (d.type === "SAM Renewal" ? renewalDl : d))
    : base.deadlines;

  const renewalEvent = renewalFeedEvent(sam, cleanUei);
  const feed = renewalEvent
    ? base.feed.map((e) => (e.category === "compliance" ? renewalEvent : e))
    : base.feed;
  const recentFeed = feed.slice(0, 4);

  return (
    <>
      <IdentityStrip contractor={contractor} flagMock={SHOW_MOCK_MARKERS} />
      <HealthRow
        sam={samTile}
        surety={base.surety}
        worstCompliance={worstCompliance}
        activeContractsCount={activeContractsCount}
        suretyMock={SHOW_MOCK_MARKERS}
        complianceMock={complianceMock}
      />

      <section className="flex-1 bg-background">
        <div className="mx-auto max-w-[1400px] px-6 py-8 space-y-12">
          <NextDeadlines
            deadlines={deadlines}
            href={`/dashboard/${cleanUei}/compliance`}
            flagMock={SHOW_MOCK_MARKERS}
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
            <EventFeed events={recentFeed} hideHeader flagMock={SHOW_MOCK_MARKERS} />
          </div>
        </div>
      </section>

      <ActionShortcuts uei={cleanUei} />
    </>
  );
}
