import type { NextConfig } from 'next';
import path from 'node:path';

const nextConfig: NextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  // pnpm workspace lives at the repo root; tell Next where to trace from so
  // the standalone output includes hoisted node_modules from the workspace.
  outputFileTracingRoot: path.join(__dirname, '../../'),
};

export default nextConfig;
