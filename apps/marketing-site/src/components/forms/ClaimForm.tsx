import { type FormEvent, useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { submitClaim, type ClaimState } from "@/lib/submit";
import { Button } from "@/components/ui";
import { Field, TextArea, TextInput } from "./Field";

const initial: ClaimState = { ok: false };

export default function ClaimForm({
  defaultUei,
  compact = false,
}: {
  defaultUei?: string;
  compact?: boolean;
}) {
  const [state, setState] = useState<ClaimState>(initial);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setPending(true);
    const result = await submitClaim({
      uei: String(form.get("uei") ?? ""),
      name: String(form.get("name") ?? ""),
      email: String(form.get("email") ?? ""),
      phone: String(form.get("phone") ?? ""),
      company: String(form.get("company") ?? ""),
      interests: String(form.get("interests") ?? ""),
    });
    setPending(false);
    setState(result);
  }

  if (state.ok) {
    return (
      <div className="border border-copper-200 bg-copper-50 p-8 text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-copper-600" />
        <h3 className="font-display mt-5 text-2xl text-navy-900">
          Entity claimed.
        </h3>
        <p className="mt-3 text-sm leading-relaxed text-slate-700">
          {state.message}
        </p>
        {state.uei && (
          <p className="mt-4 text-[11px] uppercase tracking-[0.14em] text-slate-500 font-mono">
            UEI {state.uei}
          </p>
        )}
      </div>
    );
  }

  const err = state.fieldErrors ?? {};

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {state.message && !state.ok && (
        <div className="border border-copper-300 bg-copper-50 px-4 py-3 text-sm text-copper-800">
          {state.message}
        </div>
      )}

      <Field
        name="uei"
        label="SAM.gov UEI"
        hint="12-character Unique Entity Identifier (no I or O)"
        required
        error={err.uei}
      >
        <TextInput
          name="uei"
          placeholder="e.g. ABC123DEF456"
          defaultValue={defaultUei}
          required
          invalid={!!err.uei}
        />
      </Field>

      {!compact && (
        <Field name="company" label="Legal Business Name" hint="Optional — we'll pull it from SAM.gov" error={err.company}>
          <TextInput
            name="company"
            placeholder="As filed with SAM.gov"
            invalid={!!err.company}
          />
        </Field>
      )}

      <div className={compact ? "space-y-5" : "grid gap-5 md:grid-cols-2"}>
        <Field name="name" label="Your Name" required error={err.name}>
          <TextInput
            name="name"
            placeholder="Full name"
            required
            invalid={!!err.name}
          />
        </Field>
        <Field name="email" label="Email" required error={err.email}>
          <TextInput
            name="email"
            type="email"
            placeholder="you@yourcompany.com"
            required
            invalid={!!err.email}
          />
        </Field>
      </div>

      {!compact && (
        <>
          <Field name="phone" label="Phone" hint="Optional" error={err.phone}>
            <TextInput
              name="phone"
              type="tel"
              placeholder="(555) 555-0100"
              invalid={!!err.phone}
            />
          </Field>

          <Field
            name="interests"
            label="What are you looking at right now?"
            hint="Optional — bid leads, surety, capital, vendor programs, equipment, compliance. Pick none, one, or all."
            error={err.interests}
          >
            <TextArea
              name="interests"
              rows={3}
              placeholder="e.g. Recompete coming up Q3, surety capacity is the bottleneck."
              invalid={!!err.interests}
            />
          </Field>
        </>
      )}

      <div className="flex justify-center border-t border-line pt-5">
        <SubmitButton pending={pending} />
      </div>
    </form>
  );
}

function SubmitButton({ pending }: { pending: boolean }) {
  return (
    <Button type="submit" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Claiming
        </>
      ) : (
        "Claim Entity"
      )}
    </Button>
  );
}
