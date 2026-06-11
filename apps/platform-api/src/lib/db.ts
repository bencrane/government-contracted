/**
 * Postgres pool for the BFF — the authorization + landing source of truth.
 *
 * Connects to the Supabase POOLED (pgBouncer) endpoint via the same GC_DB_URL_POOLED
 * platform-app uses, so the SSL/auth posture is already proven in prod. govcon has no
 * Supabase service-role key, so the BFF reads the live tables directly (NOT the
 * template's service-role Supabase client). A single process-lifetime pool; max:10
 * covers the per-read authz lookups (the dashboard fires 4 reads at once) plus the
 * landing query without starving the client-side connection budget.
 */
import { Pool } from "pg";

import { env } from "../env.ts";

let _pool: Pool | null = null;

export function pool(): Pool {
  if (!_pool) {
    _pool = new Pool({
      connectionString: env.GC_DB_URL_POOLED,
      max: 10,
      // Bound every hop so a DB/pgBouncer outage degrades to a fast 503 (the entity +
      // landing handlers' try/catch) instead of hanging requests and saturating the pool:
      connectionTimeoutMillis: 5_000, // reject a blackholed connect instead of OS-waiting
      idleTimeoutMillis: 30_000, // release idle clients (also shrinks the idle-drop surface)
      statement_timeout: 8_000, // server-side cancel of a stuck query
      query_timeout: 8_000, // client-side reject of a stuck query
    });
    // pg's Pool is an EventEmitter; when an IDLE pooled client's backend connection
    // drops (pgBouncer recycles idle conns routinely, plus restarts/blips) it emits
    // 'error'. With NO listener, Node rethrows it as an uncaught exception that kills
    // this single long-running process — taking down auth, landing, AND every read.
    // The per-request try/catch can't catch it (it fires off the EventEmitter, between
    // requests). A swallow-and-log listener makes it recoverable: pg discards the dead
    // client and the next query checks out a fresh one.
    _pool.on("error", (err) => {
      console.error("pg pool idle-client error (recovered):", err instanceof Error ? err.message : err);
    });
  }
  return _pool;
}
