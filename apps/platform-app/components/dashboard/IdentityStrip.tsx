import { MapPin } from "lucide-react";
import type { ContractorProfile } from "@/lib/mock-dashboard";
import MockBadge from "@/components/dashboard/MockBadge";

export default function IdentityStrip({
  contractor,
  flagMock = false,
}: {
  contractor: ContractorProfile;
  flagMock?: boolean;
}) {
  return (
    <section className="border-b border-line bg-surface">
      <div className="mx-auto max-w-[1400px] px-6 py-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">
              UEI {contractor.uei} · CAGE {contractor.cageCode}
            </p>
            <h1 className="font-display mt-1 text-3xl text-navy-900">
              {contractor.legalBusinessName}
            </h1>
            {contractor.dba && (
              <p className={`mt-1 text-sm ${flagMock ? "text-red-600" : "text-slate-500"}`}>
                d/b/a {contractor.dba}
                {flagMock && <MockBadge className="ml-2 align-middle" />}
              </p>
            )}
            <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-slate-500">
              <MapPin className="h-3 w-3" />
              {contractor.legalAddress.city}, {contractor.legalAddress.state} ·{" "}
              {contractor.naicsPrimary.code} {contractor.naicsPrimary.description}
            </p>
          </div>
          <div className="grid grid-cols-3 gap-6 md:gap-10">
            <Stat label="Awards lifetime" value={`$${(contractor.awardsLifetime / 1_000_000).toFixed(1)}M`} />
            <Stat label="Contracts" value={contractor.contractsLifetime.toString()} />
            <Stat
              label="Active"
              value={`${contractor.activeContracts} · $${(contractor.activeContractObligated / 1_000_000).toFixed(1)}M`}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 font-display text-xl text-navy-900">{value}</p>
    </div>
  );
}
