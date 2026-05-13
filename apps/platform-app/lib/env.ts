import { z } from 'zod';

const schema = z.object({
  NEXT_PUBLIC_GC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_GC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  GC_DB_URL_POOLED: z.string().min(1),
  APP_ENV: z.enum(['dev', 'stg', 'prd']),
});

const parsed = schema.safeParse({
  NEXT_PUBLIC_GC_SUPABASE_URL: process.env.NEXT_PUBLIC_GC_SUPABASE_URL,
  NEXT_PUBLIC_GC_SUPABASE_PUBLISHABLE_KEY:
    process.env.NEXT_PUBLIC_GC_SUPABASE_PUBLISHABLE_KEY,
  GC_DB_URL_POOLED: process.env.GC_DB_URL_POOLED,
  APP_ENV: process.env.APP_ENV,
});

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((i) => `${i.path.join('.')}: ${i.message}`)
    .join('; ');
  throw new Error(`Invalid environment: ${issues}`);
}

export const env = parsed.data;
