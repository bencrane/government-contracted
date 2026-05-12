# syntax=docker/dockerfile:1.7
#
# Standalone Next.js + Doppler container for governmentcontracted.com platform app.
# Build context = repo root (pnpm workspace lives there).

# ---- deps ----
FROM node:20-slim AS deps
RUN apt-get update && apt-get install -y --no-install-recommends curl ca-certificates \
    && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/platform-app/package.json ./apps/platform-app/
RUN pnpm install --frozen-lockfile --filter platform-app

# ---- build ----
FROM node:20-slim AS builder
RUN apt-get update && apt-get install -y --no-install-recommends curl gnupg ca-certificates apt-transport-https \
    && rm -rf /var/lib/apt/lists/*
RUN curl -sLf --retry 3 --tlsv1.2 --proto "=https" \
        "https://packages.doppler.com/public/cli/gpg.DE2A7741A397C129.key" \
        | gpg --dearmor -o /usr/share/keyrings/doppler-archive-keyring.gpg \
    && echo "deb [signed-by=/usr/share/keyrings/doppler-archive-keyring.gpg] https://packages.doppler.com/public/cli/deb/debian any-version main" \
        > /etc/apt/sources.list.d/doppler-cli.list \
    && apt-get update \
    && apt-get install -y --no-install-recommends doppler \
    && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/platform-app/node_modules ./apps/platform-app/node_modules
COPY . .

ARG DOPPLER_TOKEN
ENV DOPPLER_TOKEN=$DOPPLER_TOKEN
WORKDIR /app/apps/platform-app
RUN doppler run -- pnpm build

# ---- runner ----
FROM node:20-slim AS runner
RUN apt-get update && apt-get install -y --no-install-recommends curl gnupg ca-certificates apt-transport-https \
    && rm -rf /var/lib/apt/lists/* \
    && curl -sLf --retry 3 --tlsv1.2 --proto "=https" \
        "https://packages.doppler.com/public/cli/gpg.DE2A7741A397C129.key" \
        | gpg --dearmor -o /usr/share/keyrings/doppler-archive-keyring.gpg \
    && echo "deb [signed-by=/usr/share/keyrings/doppler-archive-keyring.gpg] https://packages.doppler.com/public/cli/deb/debian any-version main" \
        > /etc/apt/sources.list.d/doppler-cli.list \
    && apt-get update \
    && apt-get install -y --no-install-recommends doppler \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# Next.js standalone bundles the server + a slim node_modules into .next/standalone/,
# matching the source tree's apps/platform-app/ path inside the workspace.
COPY --from=builder /app/apps/platform-app/.next/standalone ./
COPY --from=builder /app/apps/platform-app/.next/static ./apps/platform-app/.next/static
COPY --from=builder /app/apps/platform-app/public ./apps/platform-app/public
COPY apps/platform-app/docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

RUN useradd --create-home --shell /bin/sh appuser \
    && chown -R appuser:appuser /app
USER appuser

EXPOSE 3000
ENTRYPOINT ["./docker-entrypoint.sh"]
