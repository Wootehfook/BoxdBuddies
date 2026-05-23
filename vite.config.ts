import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
// AI Generated: GitHub Copilot (GPT-4o) - 2026-04-29
export default defineConfig({
  plugins: [react()],

  // Configuration for Cloudflare Pages deployment
  base: "/",

  // Build configuration
  // NOTE: Vite 8 uses Rolldown (Rust-based) as the default bundler and minifier.
  // BREAKING CHANGE (Vite 8 / rolldown): manualChunks no longer accepts a plain
  // object — it must be a function. A plain object caused a fatal runtime crash:
  //   "Invalid type: Expected Function but received Object"
  // The function form is backward-compatible with Vite 7 as well.
  // Updated: GitHub Copilot (GPT-4o) — 2026-04-29
  build: {
    outDir: "dist",
    assetsDir: "assets",
    sourcemap: false,
    minify: true,
    rollupOptions: {
      output: {
        // manualChunks must be a function in Vite 8 / rolldown (object form removed)
        manualChunks: (id: string) => {
          if (id.includes("node_modules/react/") || id.includes("node_modules/react-dom/")) {
            return "vendor";
          }
        },
      },
    },
  },

  // Development server configuration
  server: {
    port: 3000,
    open: true,
    host: true,
  },

  // Preview server configuration
  preview: {
    port: 4173,
    host: true,
  },
});
