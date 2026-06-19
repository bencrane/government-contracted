import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [react(), tailwindcss(), tsconfigPaths()],
  resolve: {
    alias: {
      "@": "/src",
    },
  },
  server: {
    // Bind 0.0.0.0 (IPv4 + IPv6) so the preview harness's IPv4 health check can
    // reach the dev server; localhost-only binds IPv6 (::1) and the probe fails.
    host: true,
    port: 3003,
  },
});
