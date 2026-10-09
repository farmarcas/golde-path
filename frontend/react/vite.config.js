import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Dentro do Docker a API se chama `api`; fora dele, use API_PROXY_TARGET=http://localhost:4000.
const target = process.env.API_PROXY_TARGET || "http://localhost:4000";

export default defineConfig({
  plugins: [react()],
  server: {
    watch: { usePolling: true },
    proxy: {
      "/api": target,
      "/health": target,
    },
  },
});
