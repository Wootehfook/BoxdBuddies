import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],

  // Configuration for Cloudflare Pages deployment
  base: "/",

  // Build configuration
  // NOTE: Vite 8 replaced esbuild (JS-based) with Rolldown (Rust-based) as the default
  // bundler and minifier. The "esbuild" minifier option is no longer bundled in Vite 8;
  // using "rolldown" (the new default) provides faster, native-speed minification.
  // Author: Woo T. Fook | Built by AI (GitHub Copilot / GPT-4o) — 2026-04-29
  build: {
    outDir: "dist",
    assetsDir: "assets",
    sourcemap: false,
    minify: "rolldown",
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
