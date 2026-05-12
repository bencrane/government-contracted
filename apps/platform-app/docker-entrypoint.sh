#!/usr/bin/env sh
set -eu

# Next.js standalone output for a pnpm workspace replicates the source path,
# so the server entry lives at apps/platform-app/server.js (not ./server.js).
# DOPPLER_TOKEN service token is scoped to a single Doppler config (prd here),
# so project + config are inferred. Real env values live inside Doppler.
exec doppler run -- node apps/platform-app/server.js
