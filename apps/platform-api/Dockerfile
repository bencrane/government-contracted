# syntax=docker/dockerfile:1.7
#
# platform-api — read-only Hono BFF (Node 20 + tsx) for governmentcontracted.com.
# Build context = repo ROOT (the pnpm workspace lives there):
#   docker build -f apps/platform-api/Dockerfile <repo-root>
#
# Runs TypeScript from source via tsx (no compile step — faithful to the template's
# "run from source" posture). Secrets are injected at RUNTIME by the Doppler CLI
# using DOPPLER_TOKEN injected by Railway. PORT is injected by Railway.

# ---- deps ----
# Mirror the platform-app image: copy only the root manifests + this app's
# package.json, then a filtered, frozen install. pnpm tolerates the absent sibling
# workspace manifests under --filter (same pattern the platform-app Dockerfile uses).
FROM node:20-slim AS deps
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/platform-api/package.json ./apps/platform-api/
RUN pnpm install --frozen-lockfile --filter platform-api

# ---- runner ----
FROM node:20-slim AS runner
RUN apt-get update && apt-get install -y --no-install-recommends curl gnupg ca-certificates apt-transport-https \
    && curl -sLf --retry 3 --tlsv1.2 --proto "=https" \
        "https://packages.doppler.com/public/cli/gpg.DE2A7741A397C129.key" \
        | gpg --dearmor -o /usr/share/keyrings/doppler-archive-keyring.gpg \
    && echo "deb [signed-by=/usr/share/keyrings/doppler-archive-keyring.gpg] https://packages.doppler.com/public/cli/deb/debian any-version main" \
        > /etc/apt/sources.list.d/doppler-cli.list \
    && apt-get update \
    && apt-get install -y --no-install-recommends doppler \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
ENV NODE_ENV=production

# pnpm hoists to the root store with per-app symlink farms — copy both node_modules
# from the deterministic deps stage. These are the SINGLE source of dependencies.
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/platform-api/node_modules ./apps/platform-api/node_modules
# Copy ONLY source — explicitly, not the whole app dir — so the host's macOS-arch
# node_modules / any local .env never overlay the clean deps-stage install or leak
# into the image. The build stays reproducible from the lockfile alone.
COPY package.json pnpm-workspace.yaml ./
COPY apps/platform-api/package.json apps/platform-api/tsconfig.json ./apps/platform-api/
COPY apps/platform-api/src ./apps/platform-api/src

WORKDIR /app/apps/platform-api

RUN useradd --create-home --shell /bin/sh appuser && chown -R appuser:appuser /app
USER appuser

# Railway injects $PORT at runtime; default to 8000 for local docker runs.
EXPOSE 8000
# Run TS from source via tsx as a Node loader — no package manager at runtime. (pnpm
# would force corepack to re-fetch its pinned tarball under appuser on every cold
# start, a boot-time network dependency that hard-fails on restricted egress.)
CMD ["doppler", "run", "--", "node", "--import", "tsx", "src/index.ts"]
