/**
 * Stripe metered billing for disbursement.observed events.
 *
 * Fixture mode when STRIPE_SECRET_KEY_TEST is unset:
 *   returns { ok: true, id: 'fixture_evt_<rand>' }
 */
import { randomBytes } from "node:crypto";

export interface MeterEventPayload {
  factor_org_id: string;
  disbursement_amount_cents: number;
  disbursement_id?: string;
  observed_at?: string;
}

export interface MeterEventInput {
  disbursement_id: string;
  factor_org_id: string;
  amount_cents: number;
  observed_at: Date;
}

export interface FireMeterEventInput {
  event_name: string;
  payload: MeterEventPayload;
  idempotency_key?: string;
}

export interface FireMeterEventResult {
  ok: boolean;
  id: string;
}

/** Build the payload for a disbursement.observed meter event. */
export function buildMeterPayload(input: MeterEventInput): MeterEventPayload {
  return {
    factor_org_id: input.factor_org_id,
    disbursement_amount_cents: input.amount_cents,
    disbursement_id: input.disbursement_id,
    observed_at: input.observed_at.toISOString(),
  };
}

/** Fire a Stripe meter event. Fixture mode when secret key is absent. */
export async function fireMeterEvent(
  input: FireMeterEventInput
): Promise<FireMeterEventResult> {
  if (!process.env.STRIPE_SECRET_KEY_TEST) {
    return { ok: true, id: `fixture_evt_${randomBytes(8).toString("hex")}` };
  }
  // Real path: deferred instantiation to avoid throw at import time.
  const { default: Stripe } = await import("stripe");
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY_TEST, {
    apiVersion: "2026-04-22.dahlia",
  });
  const event = await stripe.billing.meterEvents.create(
    {
      event_name: input.event_name,
      payload: {
        stripe_customer_id: "", // set upstream if available
        value: String(input.payload.disbursement_amount_cents),
      },
    },
    input.idempotency_key
      ? { idempotencyKey: input.idempotency_key }
      : undefined
  );
  return { ok: true, id: event.identifier ?? `stripe_${randomBytes(4).toString("hex")}` };
}
