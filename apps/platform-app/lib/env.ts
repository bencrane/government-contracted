import { z } from 'zod';

const schema = z
  .object({
    NEXT_PUBLIC_GC_SUPABASE_URL: z.string().url(),
    NEXT_PUBLIC_GC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
    GC_DB_URL_POOLED: z.string().min(1),
    APP_ENV: z.enum(['dev', 'stg', 'prd']),
    // catalyst_api (core-x) — the private read gateway the BFF proxies to. Optional
    // in dev (the catalyst client falls back to an empty-state path when unset);
    // required in stg/prd — see the fail-closed refine below.
    CATALYST_API_URL: z.string().url().optional(),
    CATALYST_API_TOKEN: z.string().min(1).optional(),
    // HS256 key for the sign-in-scoped tenant cookie (lib/auth/tenant-cookie.ts). Optional
    // in dev (the read path falls back to the live membership query when unset); required
    // in stg/prd by the refine below so the dashboard's cached-read fast path is signed.
    TENANT_COOKIE_SECRET: z.string().min(32).optional(),
  })
  .superRefine((val, ctx) => {
    // Fail-closed: outside dev the BFF must hold both the private URL and the bearer
    // token, so it can never resolve a live tenant against an unauthenticated gateway.
    if (val.APP_ENV !== 'dev') {
      for (const key of ['CATALYST_API_URL', 'CATALYST_API_TOKEN', 'TENANT_COOKIE_SECRET'] as const) {
        if (!val[key]) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [key],
            message: `${key} is required when APP_ENV=${val.APP_ENV}`,
          });
        }
      }
    }
  });

const parsed = schema.safeParse({
  NEXT_PUBLIC_GC_SUPABASE_URL: process.env.NEXT_PUBLIC_GC_SUPABASE_URL,
  NEXT_PUBLIC_GC_SUPABASE_PUBLISHABLE_KEY:
    process.env.NEXT_PUBLIC_GC_SUPABASE_PUBLISHABLE_KEY,
  GC_DB_URL_POOLED: process.env.GC_DB_URL_POOLED,
  APP_ENV: process.env.APP_ENV,
  CATALYST_API_URL: process.env.CATALYST_API_URL,
  CATALYST_API_TOKEN: process.env.CATALYST_API_TOKEN,
  TENANT_COOKIE_SECRET: process.env.TENANT_COOKIE_SECRET,
});

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((i) => `${i.path.join('.')}: ${i.message}`)
    .join('; ');
  throw new Error(`Invalid environment: ${issues}`);
}

export const env = parsed.data;
