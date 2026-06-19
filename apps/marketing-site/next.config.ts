import type { NextConfig } from 'next';
import path from 'node:path';

const nextConfig: NextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  // Pin the standalone file-tracing root to the monorepo root (two levels up from
  // this app). Otherwise Next.js infers it from lockfile location, which is
  // ambiguous when running inside a git worktree nested under the main checkout
  // (two lockfiles) and fragile for the `output: 'standalone'` Docker build, which
  // must capture the pnpm-hoisted node_modules at the repo root.
  outputFileTracingRoot: path.join(__dirname, '../..'),
};

export default nextConfig;
