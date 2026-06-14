import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";

export default defineConfig({
  plugins: [
    TanStackRouterVite({
      routesDirectory: "./routes",
      generatedRouteTree: "./routeTree.gen.ts",
    }),
    react(),
  ],
  resolve: {
    alias: [
      { find: "@/components/ui", replacement: path.resolve(__dirname, "components") },
      { find: "@", replacement: path.resolve(__dirname, ".") },
    ],
  },
  server: {
    port: 5173,
  },
  build: {
    chunkSizeWarningLimit: 1200,
  },
});
