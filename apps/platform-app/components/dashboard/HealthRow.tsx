import { CheckCircle2, AlertTriangle, AlertCircle } from "lucide-react";
import type {
  ComplianceCheck,
  HealthStatus,
  SamRegistration,
  SuretyOnFile,
} from "@/lib/mock-dashboard";
import MockBadge from "@/components/dashboard/MockBadge";

type Props = {
  sam: SamRegistration;
  surety: SuretyOnFile;
  worstCompliance: ComplianceCheck;
  activeContractsCount: number;
  flagMock?: boolean;
};

const statusIcon: Record<HealthStatus, React.ReactNode> = {
  good: <CheckCircle2 className="h-4 w-4" />,
  warn: <AlertTriangle className="h-4 w-4" />,
  alert: <AlertCircle className="h-4 w-4" />,
};

const statusBadge: Record<HealthStatus, string> = {
  good: "border-emerald-200 bg-emerald-50 text-emerald-800",
  warn: "border-amber-200 bg-amber-50 text-amber-800",
  alert: "border-red-200 bg-red-50 text-red-800",
};

export default function HealthRow({ sam, surety, worstCompliance, activeContractsCount, flagMock = false }: Props) {
  return (
    <section className="border-b border-line bg-slate-100/60">
      <div className="mx-auto max-w-[1400px] grid grid-cols-1 divide-y divide-line md:grid-cols-4 md:divide-x md:divide-y-0">
        <Tile
          label="SAM registration"
          value={sam.daysToExpiration <= 0 ? "Expired" : `${sam.daysToExpiration}d`}
          detail={sam.daysToExpiration <= 0 ? "Renew now" : `Expires ${sam.expiresAt}`}
          status={sam.status}
        />
        <Tile
          label="Surety"
          value={surety.aggregateLimit}
          detail={`${surety.surety} · expires ${surety.expires}`}
          status={surety.status}
          isMock={flagMock}
        />
        <Tile
          label="Active contracts"
          value={activeContractsCount.toString()}
          detail="On performance now"
          status="good"
        />
        <Tile
          label={worstCompliance.label}
          value={worstCompliance.status === "good" ? "OK" : worstCompliance.status === "warn" ? "Watch" : "Action"}
          detail={worstCompliance.detail}
          status={worstCompliance.status}
          isMock={flagMock}
        />
      </div>
    </section>
  );
}

function Tile({
  label,
  value,
  detail,
  status,
  isMock = false,
}: {
  label: string;
  value: string;
  detail: string;
  status: HealthStatus;
  isMock?: boolean;
}) {
  return (
    <div className="px-6 py-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">
            {label}
          </p>
          {isMock && <MockBadge />}
        </div>
        <span
          className={`inline-flex items-center gap-1 border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.1em] ${statusBadge[status]}`}
        >
          {statusIcon[status]}
        </span>
      </div>
      <p className={`mt-2 font-display text-2xl ${isMock ? "text-red-600" : "text-navy-900"}`}>{value}</p>
      <p className={`mt-1 text-xs ${isMock ? "text-red-500" : "text-slate-500"}`}>{detail}</p>
    </div>
  );
}
