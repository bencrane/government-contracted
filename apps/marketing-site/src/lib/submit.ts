import {
  claimEntitySchema,
  contactSchema,
  type SubmissionPayload,
} from "@/lib/submissions";

export type ClaimState = {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string>;
  uei?: string;
};

export type ContactState = {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string>;
};

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

/** Map zod issues to first-error-per-field, matching the prior server-action UX. */
function toFieldErrors(issues: { path: (string | number)[]; message: string }[]) {
  const fieldErrors: Record<string, string> = {};
  for (const issue of issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !fieldErrors[key]) {
      fieldErrors[key] = issue.message;
    }
  }
  return fieldErrors;
}

async function postSubmission(path: string, payload: SubmissionPayload) {
  // TODO: platform-api write endpoint not implemented yet
  return fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function submitClaim(raw: {
  uei: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  interests: string;
}): Promise<ClaimState> {
  const normalized = {
    uei: raw.uei.trim().toUpperCase(),
    name: raw.name.trim(),
    email: raw.email.trim(),
    phone: raw.phone.trim(),
    company: raw.company.trim(),
    interests: raw.interests.trim(),
  };

  const parsed = claimEntitySchema.safeParse(normalized);

  if (!parsed.success) {
    return {
      ok: false,
      message: "Check the highlighted fields and try again.",
      fieldErrors: toFieldErrors(parsed.error.issues),
    };
  }

  try {
    // TODO: platform-api write endpoint not implemented yet — /v1/claims
    const res = await postSubmission("/v1/claims", {
      kind: "claim_entity",
      receivedAt: new Date().toISOString(),
      source: "governmentcontracted.com",
      data: parsed.data,
    });

    if (!res.ok) {
      return {
        ok: false,
        message:
          "We couldn't reach the server just now. Try again in a moment, or email us.",
      };
    }
  } catch {
    return {
      ok: false,
      message:
        "We couldn't reach the server just now. Try again in a moment, or email us.",
    };
  }

  return {
    ok: true,
    message:
      "We've got your UEI. Your live SAM.gov profile and the dashboard link are on their way to your inbox.",
    uei: parsed.data.uei,
  };
}

export async function submitContact(raw: {
  name: string;
  email: string;
  company: string;
  uei: string;
  message: string;
}): Promise<ContactState> {
  const normalized = {
    name: raw.name.trim(),
    email: raw.email.trim(),
    company: raw.company.trim(),
    uei: raw.uei.trim().toUpperCase(),
    message: raw.message.trim(),
  };

  const parsed = contactSchema.safeParse(normalized);

  if (!parsed.success) {
    return {
      ok: false,
      message: "Check the highlighted fields and try again.",
      fieldErrors: toFieldErrors(parsed.error.issues),
    };
  }

  try {
    // TODO: platform-api write endpoint not implemented yet — /v1/contact
    const res = await postSubmission("/v1/contact", {
      kind: "contact",
      receivedAt: new Date().toISOString(),
      source: "governmentcontracted.com",
      data: parsed.data,
    });

    if (!res.ok) {
      return {
        ok: false,
        message:
          "We couldn't send that just now. Try again in a moment, or email us directly.",
      };
    }
  } catch {
    return {
      ok: false,
      message:
        "We couldn't send that just now. Try again in a moment, or email us directly.",
    };
  }

  return {
    ok: true,
    message: "Got it. We'll be in touch within two business days.",
  };
}
