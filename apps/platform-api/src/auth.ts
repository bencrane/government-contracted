/**
 * Supabase access-token validation via JWKS (the BFF auth gate).
 *
 * The govcon Supabase project issues asymmetric (ES256) access tokens and publishes
 * its signing keys at `/auth/v1/.well-known/jwks.json`. The SPA attaches the session
 * access_token as `Authorization: Bearer <jwt>`; this middleware verifies signature +
 * issuer + audience LOCALLY (zero network round-trip after the first JWKS fetch) and
 * stashes the user on the Hono context before any handler runs.
 *
 * This is the phase-2 home of platform-app/lib/auth/jwt.ts — the SAME verifier
 * (`createRemoteJWKSet` + `jwtVerify`, issuer + audience `authenticated`), reshaped
 * from a Next server helper into Hono middleware that mirrors
 * rare-structure-hq/apps/platform-api/src/auth.ts.
 */

import type { MiddlewareHandler } from "hono";
import { HTTPException } from "hono/http-exception";
import { createRemoteJWKSet, jwtVerify } from "jose";

import { SUPABASE_ISSUER, SUPABASE_JWKS_URL } from "./env.ts";

export type CurrentUser = {
  user_id: string;
  email: string;
};

export type AuthVariables = {
  user: CurrentUser;
};

// Fetched once and cached by jose (with its own rotation refresh); steady-state
// verification is pure CPU.
const jwks = createRemoteJWKSet(new URL(SUPABASE_JWKS_URL));

export const requireUser: MiddlewareHandler<{ Variables: AuthVariables }> = async (c, next) => {
  const authHeader = c.req.header("authorization");

  if (!authHeader || !authHeader.toLowerCase().startsWith("bearer ")) {
    throw new HTTPException(401, { message: "Missing bearer token" });
  }

  const token = authHeader.slice("bearer ".length).trim();

  try {
    const { payload } = await jwtVerify(token, jwks, {
      issuer: SUPABASE_ISSUER,
      audience: "authenticated",
    });

    const userId = payload.sub;
    if (!userId) {
      throw new HTTPException(401, { message: "Token missing sub claim" });
    }

    const email = typeof payload.email === "string" ? payload.email : "";

    c.set("user", { user_id: userId, email });
    await next();
  } catch (err) {
    // Expired / wrong-issuer / bad-signature / unreachable-JWKS → unauthenticated.
    if (err instanceof HTTPException) throw err;
    // Log the verifier detail server-side ONLY. Never surface jose internals (which
    // failure mode fired, JWKS-infra vs token-side) to an unauthenticated caller —
    // that leaks posture and aids forgery probing for zero operational benefit.
    console.warn(
      `requireUser: token verification failed: ${err instanceof Error ? err.message : "unknown"}`,
    );
    throw new HTTPException(401, { message: "Invalid token" });
  }
};
