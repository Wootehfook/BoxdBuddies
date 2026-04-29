import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],

  // Configuration for Cloudflare Pages deployment
  base: "/",

  // Build configuration
  // NOTE: Vite 8 uses Rolldown (Rust-based) as the default bundler and minifier.
  // Setting minify: true enables Rolldown's built-in native minifier (the new default).
  // The string "rolldown" is NOT a valid minify value — it causes a runtime crash.
  // Author: Woo T. Fook | Built by AI (GitHub Copilot, model: GPT-4o) — 2026-04-29
  build: {
    outDir: "dist",
    assetsDir: "assets",
    sourcemap: false,
    minify: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
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
