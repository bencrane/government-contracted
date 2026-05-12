"use server";

import { redirect } from "next/navigation";
import {
  claimEntitySchema,
  deliverSubmission,
} from "@/lib/submissions";

export type ClaimState = {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string>;
  uei?: string;
};

export async function submitClaim(
  _prev: ClaimState,
  formData: FormData,
): Promise<ClaimState> {
  const raw = {
    uei: String(formData.get("uei") ?? "").trim().toUpperCase(),
    name: String(formData.get("name") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim(),
    phone: String(formData.get("phone") ?? "").trim(),
    company: String(formData.get("company") ?? "").trim(),
    interests: String(formData.get("interests") ?? "").trim(),
  };

  const parsed = claimEntitySchema.safeParse(raw);

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string" && !fieldErrors[key]) {
        fieldErrors[key] = issue.message;
      }
    }
    return {
      ok: false,
      message: "Check the highlighted fields and try again.",
      fieldErrors,
    };
  }

  await deliverSubmission({
    kind: "claim_entity",
    receivedAt: new Date().toISOString(),
    source: "governmentcontracted.com",
    data: parsed.data,
  });

  // Hand the contractor off to the platform app to sign in / claim their dashboard.
  const platformUrl =
    process.env.NEXT_PUBLIC_PLATFORM_URL ?? "https://app.governmentcontracted.com";
  redirect(`${platformUrl}/login?email=${encodeURIComponent(parsed.data.email)}`);
}
