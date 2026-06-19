import type { SamProfilePayload } from '@/lib/catalyst/types';
import {
  EmptySurface,
  Field,
  GapNote,
  StatusPill,
  SurfaceHeader,
  Value,
  formatDate,
} from '@/components/dashboard/surfaces/primitives';

/**
 * SAM.gov entity profile — authored directly against the catalyst_api wire
 * contract. GAP fields (POC email/phone, physical street, mailing address) render
 * explicit empty-states; business_types is shown raw, unparsed (operator ruling).
 */
export default function SamProfileSurface({
  uei,
  profile,
}: {
  uei: string;
  profile: SamProfilePayload | null;
}) {
  if (!profile) {
    return (
      <>
        <SurfaceHeader eyebrow="SAM.gov profile" title="Your live entity record." backHref={`/dashboard/${uei}`} />
        <EmptySurface note="No active SAM.gov registration found for this entity yet." />
      </>
    );
  }

  const addr = profile.physicalAddress;
  const cityLine = [addr.city, addr.state, addr.zip].filter(Boolean).join(', ');

  return (
    <section className="flex-1">
      <SurfaceHeader
        eyebrow="SAM.gov profile"
        title={profile.legalBusinessName ?? 'Entity record'}
        backHref={`/dashboard/${uei}`}
      >
        <p className="mt-2 flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.16em] text-slate-500">
          <span>UEI {profile.uei ?? uei}</span>
          <span>·</span>
          <span>
            CAGE <Value value={profile.cageCode} reason="—" />
          </span>
          <StatusPill status={profile.registrationStatus} />
        </p>
      </SurfaceHeader>

      <div className="mx-auto max-w-[1400px] space-y-10 px-6 py-8">
        <Block title="Registration">
          <Field label="Status"><StatusPill status={profile.registrationStatus} /></Field>
          <Field label="Registered"><Value value={formatDate(profile.registrationDate)} reason="—" /></Field>
          <Field label="Activated"><Value value={formatDate(profile.activationDate)} reason="—" /></Field>
          <Field label="Expires">
            {profile.expirationDate ? (
              <>
                {formatDate(profile.expirationDate)}
                {profile.daysUntilExpiration != null && (
                  <span className="ml-2 text-xs text-slate-500">
                    ({profile.daysUntilExpiration <= 0 ? 'expired' : `${profile.daysUntilExpiration}d left`})
                  </span>
                )}
              </>
            ) : (
              <GapNote reason="—" />
            )}
          </Field>
        </Block>

        <Block title="Classifications">
          <Field label="Primary NAICS"><Value value={profile.primaryNaics} reason="—" /></Field>
          <Field label="Secondary NAICS">
            <Value value={profile.secondaryNaics.join(', ')} reason="None on file" />
          </Field>
          <Field label="PSC codes">
            <Value value={profile.pscCodes.join(', ')} reason="None on file" />
          </Field>
          <Field label="SAM business types (raw)">
            <Value value={profile.businessTypesRaw} reason="None on file" />
          </Field>
        </Block>

        <Block title="Physical address">
          <Field label="Street"><GapNote reason="Not publicly available" /></Field>
          <Field label="City / State / ZIP"><Value value={cityLine} reason="Not publicly available" /></Field>
          <Field label="Mailing address"><GapNote reason="Not publicly available" /></Field>
        </Block>

        <div>
          <h2 className="font-display mb-4 text-xl text-navy-900">Government points of contact</h2>
          {profile.governmentPocs.length === 0 ? (
            <p className="text-sm text-slate-500">No POC slots populated for this entity.</p>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {profile.governmentPocs.map((poc, i) => (
                <div key={`${poc.type}-${poc.pocSlotNo ?? i}`} className="border border-line bg-surface p-4">
                  <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-copper-700">
                    {(poc.type ?? 'poc').replace(/_/g, ' ')}
                  </p>
                  <p className="mt-1 text-sm font-medium text-navy-900">
                    <Value value={poc.fullName} reason="Unnamed" />
                  </p>
                  <p className="text-xs text-slate-500"><Value value={poc.title} reason="—" /></p>
                  <p className="mt-1 text-xs text-slate-500">
                    <Value value={[poc.city, poc.state].filter(Boolean).join(', ')} reason="—" />
                  </p>
                  <p className="mt-2 text-xs text-slate-400">
                    Email / phone: <GapNote reason="Not publicly available" />
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="font-display mb-4 text-xl text-navy-900">{title}</h2>
      <div className="grid grid-cols-2 gap-6 md:grid-cols-4">{children}</div>
    </div>
  );
}
