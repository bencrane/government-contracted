import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    // env.ts validates at import time and exits if anything is missing. Tests exercise
    // the auth gate + pure helpers, not a live upstream — so inject dummy-but-valid
    // values here. No real Supabase/core-x call is made (the auth tests fail before
    // any JWKS fetch; the helpers are pure).
    env: {
      GC_SUPABASE_URL: "https://example.supabase.co",
      COREX_API_URL: "http://localhost:9",
      COREX_SERVICE_TOKEN: "test-token",
      GC_DB_URL_POOLED: "postgres://user:pw@localhost:5432/db",
      APP_ENV: "dev",
    },
  },
});
