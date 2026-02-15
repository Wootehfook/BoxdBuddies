import js from "@eslint/js";
import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";

export default [
  // AI Generated: GitHub Copilot - 2025-08-15
  // Ignore generated/build artifacts and vendor directories to keep lint signal clean
  {
    ignores: [
      "dist/**",
      "web/**/dist/**",
      "coverage/**",
      "node_modules/**",
      "src-tauri/target/**",
      "src-tauri/gen/**",
      "**/*.min.js",
    ],
  },
  js.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        console: "readonly",
        window: "readonly",
        document: "readonly",
        process: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        MouseEvent: "readonly",
        HTMLElement: "readonly",
        HTMLDialogElement: "readonly",
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
      react: reactPlugin,
      "react-hooks": reactHooksPlugin,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "no-console": ["warn", { allow: ["error"] }],
      "prefer-const": "error",
      "no-case-declarations": "warn",
    },
    settings: {
      react: {
        version: "detect",
      },
    },
  },
  // AI Generated: GitHub Copilot - 2025-08-16
  // Cloudflare Workers functions configuration
  {
    files: ["functions/**/*.{js,ts}"],
    languageOptions: {
      globals: {
        Response: "readonly",
        Request: "readonly",
        URL: "readonly",
        fetch: "readonly",
        console: "readonly",
        globalThis: "readonly",
        setTimeout: "readonly",
        Promise: "readonly",
        JSON: "readonly",
        Date: "readonly",
        Number: "readonly",
        Array: "readonly",
        Object: "readonly",
        Math: "readonly",
        parseInt: "readonly",
        encodeURIComponent: "readonly",
        caches: "readonly"
      },
    },
    rules: {
      "no-useless-escape": "off",
      "no-console": ["warn", { allow: ["error", "warn", "log"] }],
      "@typescript-eslint/no-explicit-any": "off"
    },
  },
  // AI Generated: GitHub Copilot (GPT-5.2-Codex) - 2026-02-15
  // Cloudflare Worker configuration (standalone worker project)
  {
    files: ["workers/**/*.{js,ts}"],
    languageOptions: {
      globals: {
        Response: "readonly",
        Request: "readonly",
        URL: "readonly",
        fetch: "readonly",
        console: "readonly",
        globalThis: "readonly",
        setTimeout: "readonly",
        Promise: "readonly",
        JSON: "readonly",
        Date: "readonly",
        Number: "readonly",
        Array: "readonly",
        Object: "readonly",
        Math: "readonly",
        parseInt: "readonly",
        encodeURIComponent: "readonly",
        caches: "readonly",
        D1Database: "readonly",
        ScheduledEvent: "readonly",
      },
    },
    rules: {
      "no-useless-escape": "off",
      "no-console": ["warn", { allow: ["error", "warn", "log"] }],
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
  // AI Generated: GitHub Copilot - 2025-08-03
  // Allow console statements in logger utility
  {
    files: ["**/utils/logger.ts"],
    rules: {
      "no-console": "off",
    },
  },
];
