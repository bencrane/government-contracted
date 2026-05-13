/**
 * Stripe setup — ensures the disbursement.observed meter exists.
 * Fixture mode when STRIPE_SECRET_KEY_TEST is unset.
 */

export interface EnsureMeterResult {
  status: "created" | "exists" | "fixture";
  event_name: string;
}

/** Idempotently ensures the disbursement.observed meter exists. */
export async function ensureDisbursementMeter(): Promise<EnsureMeterResult> {
  if (!process.env.STRIPE_SECRET_KEY_TEST) {
    return { status: "fixture", event_name: "disbursement.observed" };
  }
  const { default: Stripe } = await import("stripe");
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY_TEST, {
    apiVersion: "2026-04-22.dahlia",
  });
  // Check if it already exists
  const meters = await stripe.billing.meters.list({ status: "active" });
  const existing = meters.data.find(
    (m: { event_name: string }) => m.event_name === "disbursement.observed"
  );
  if (existing) {
    return { status: "exists", event_name: "disbursement.observed" };
  }
  // Create it
  await stripe.billing.meters.create({
    display_name: "Disbursement Observed",
    event_name: "disbursement.observed",
    default_aggregation: { formula: "sum" },
  });
  return { status: "created", event_name: "disbursement.observed" };
}
