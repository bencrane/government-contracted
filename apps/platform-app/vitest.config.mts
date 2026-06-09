import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
import tsconfigPaths from "vite-tsconfig-paths";
import react from "@vitejs/plugin-react";

const emptyStub = fileURLToPath(new URL("./tests/stubs/empty.ts", import.meta.url));

export default defineConfig({
  plugins: [
    tsconfigPaths(),
    react(),
  ],
  resolve: {
    alias: {
      // The `server-only` / `client-only` marker packages throw when imported
      // outside their intended bundler condition. Under vitest (node) they are
      // no-ops so server modules (lib/session, lib/tenant, lib/catalyst) import cleanly.
      "server-only": emptyStub,
      "client-only": emptyStub,
    },
  },
  test: {
    environment: "node", // default; UI tests override via @vitest-environment jsdom
    setupFiles: ["./vitest.setup.ts"],
    testTimeout: 30_000,
    pool: "forks",
    poolOptions: { forks: { singleFork: true } },
  },
});
