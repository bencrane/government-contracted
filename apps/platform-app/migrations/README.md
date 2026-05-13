# Migrations

The platform-app's dedicated Postgres database. Tables live in `public.*`.
Apply via the pooled connection string in Doppler.

```bash
# From apps/platform-app/
doppler run -- psql "$GC_DB_URL_POOLED" -f migrations/001_initial.sql
```

Migrations are forward-only. To roll back, write a new migration that reverses
the change.
