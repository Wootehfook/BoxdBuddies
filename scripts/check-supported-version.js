#!/usr/bin/env node
// AI Generated: GitHub Copilot - 2025-08-08
// Ensures SECURITY.md Supported Versions matches the current major version in package.json
// eslint-disable-next-line n/no-unsupported-features/es-builtins
const fs = require('fs');
const path = require('path');

const root = process.cwd();
const pkgPath = path.join(root, 'package.json');
const secPath = path.join(root, 'SECURITY.md');

const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
const sec = fs.readFileSync(secPath, 'utf8');

const [major] = (pkg.version || '').split('.');
if (!major) {
  console.error('Could not parse package.json version');
  process.exit(2);
}

const expected = `| ${major}.0.x   |`;
if (!sec.includes(expected)) {
  console.error(
    `SECURITY.md Supported Versions is out of date. Expected row starting with: ${expected}`
  );
  process.exit(1);
}
console.log('SECURITY.md Supported Versions is up to date.');
