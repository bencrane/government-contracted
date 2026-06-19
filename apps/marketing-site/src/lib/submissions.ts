import { z } from "zod";

// SAM.gov UEI: 12 alphanumeric characters, excludes letters I and O for clarity.
// We accept any 12 alphanumeric here — server-side resolution against
// SAM.gov / our entity index will reject malformed ones with a clearer error.
const ueiRegex = /^[A-HJ-NP-Z0-9]{12}$/i;

export const claimEntitySchema = z.object({
  uei: z
    .string()
    .min(12, "UEI is 12 characters")
    .max(12, "UEI is 12 characters")
    .regex(ueiRegex, "UEI must be 12 alphanumeric characters (no I or O)"),
  name: z.string().min(2, "Your name is required").max(120),
  email: z.string().email("Valid email is required").max(200),
  phone: z.string().max(40).optional().or(z.literal("")),
  company: z.string().max(200).optional().or(z.literal("")),
  interests: z.string().max(2000).optional().or(z.literal("")),
});

export type ClaimEntityInput = z.infer<typeof claimEntitySchema>;

export const contactSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email().max(200),
  company: z.string().max(200).optional().or(z.literal("")),
  uei: z.string().max(12).optional().or(z.literal("")),
  message: z.string().min(5).max(4000),
});

export type ContactInput = z.infer<typeof contactSchema>;

export type SubmissionKind = "claim_entity" | "contact";

export type SubmissionPayload = {
  kind: SubmissionKind;
  receivedAt: string;
  source: "governmentcontracted.com";
  data: Record<string, unknown>;
};
