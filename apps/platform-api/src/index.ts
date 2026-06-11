/**
 * government-contracted platform-api — read-only Hono BFF for the signed-in app.
 *
 * Responsibilities (phase-2 scaffold):
 * - Validate govcon Supabase JWTs (ES256 + JWKS) — see auth.ts
 * - /health (unauthenticated) for Railway liveness probes
 * - /api/v1/me (auth-required) echoes the validated user
 * - /api/v1/entities/:uei/* (auth-required) brokers the 4 core-x catalyst_api reads
 *   over the private network, holding COREX_SERVICE_TOKEN so core-x stays private
 *
 * Deferred (later phase-2 steps, intentionally NOT here yet):
 * - /api/v1/me/landing — resolve the user's first active org → redirect target
 *   (replaces app/page.tsx's membership query). Needs a Supabase read path; lands
 *   with the auth/landing move (step 3), not the scaffold.
 * - Repointing platform-app at this BFF (step 2 cutover, reversible).
 */

import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { requestId } from "hono/request-id";

import { type AuthVariables, requireUser } from "./auth.ts";
import { allowedOrigins, env } from "./env.ts";
import { entityRoutes } from "./routes/entities.ts";

const app = new Hono<{ Variables: AuthVariables & { requestId: string } }>();

app.use("*", requestId());

app.use(
  "*",
  cors({
    origin: allowedOrigins,
    credentials: true,
    // Read-only BFF: only GET (+ preflight). No mutation verbs are exposed.
    allowMethods: ["GET", "OPTIONS"],
    allowHeaders: ["Authorization", "Content-Type"],
  }),
);

app.get("/health", (c) =>
  c.json({ status: "ok", app_env: env.APP_ENV, ts: new Date().toISOString() }),
);

app.get("/api/v1/me", requireUser, (c) => {
  const user = c.get("user");
  return c.json({ user_id: user.user_id, email: user.email, app_env: env.APP_ENV });
});

app.route("/api/v1/entities", entityRoutes);

const port = process.env.PORT ? Number.parseInt(process.env.PORT, 10) : 8000;
console.log(`platform-api listening on :${port} [${env.APP_ENV}]`);

serve({ fetch: app.fetch, port });
