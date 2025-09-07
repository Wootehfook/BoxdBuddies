// AI Generated: GitHub Copilot - 2025-08-29T12:00:00Z
// Provide DOM type fallbacks for environments where lib.dom isn't available in TS config
// This file is intentionally minimal and only declares the HTMLDialogElement used in App.tsx
declare global {
  interface HTMLDialogElement extends HTMLElement {
    showModal?: () => void;
    close?: () => void;
  }
}

export {};
