// AI Generated: GitHub Copilot - 2025-08-16

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App-web.tsx";
import "./styles.css";
import { WebCacheService } from "./services/webCacheService.ts";

// Clean up expired cache entries on startup
WebCacheService.clearExpiredEntries();

// Check if we're in a Tauri environment
const isTauri = typeof window !== "undefined" && "__TAURI__" in window;

if (!isTauri) {
  // Web-only initialization
  // eslint-disable-next-line no-console
  console.log("🌐 BoxdBuddy Web Mode - Running in browser");

  // Add web-specific styles or configurations here
  document.documentElement.classList.add("web-mode");
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
