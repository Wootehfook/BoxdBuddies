#!/usr/bin/env node
/* eslint-env node */
// AI Generated: Claude Opus 4.8 - 2026-07-18
// Ensures SECURITY.md Supported Versions matches the current major version in package.json
const fs = require('node:fs');
const path = require('node:path');

function fail(msg, code = 1) {
  console.error(msg);
  process.exit(code);
}

const root = process.cwd();
const pkgPath = path.join(root, 'package.json');
const secPath = path.join(root, 'SECURITY.md');

if (!fs.existsSync(pkgPath)) fail('package.json not found', 2);
if (!fs.existsSync(secPath)) fail('SECURITY.md not found', 2);

let pkg;
try {
  pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
} catch (e) {
  fail(`Failed to read package.json: ${e.message}`, 2);
}

let sec;
try {
  sec = fs.readFileSync(secPath, 'utf8');
} catch (e) {
  fail(`Failed to read SECURITY.md: ${e.message}`, 2);
}

const ver = typeof pkg.version === 'string' ? pkg.version.trim() : '';
const match = ver.match(/^(\d+)\.(\d+)\.(\d+)$/);
if (!match) {
  fail('package.json version must be semver (x.y.z)', 2);
}
const major = match[1];

// Be tolerant of table spacing by normalizing pipe spacing: "| 1.0.x |" -> "|1.0.x|"
// split/trim instead of /\s*\|\s*/g, which backtracks super-linearly (sonar S8786)
const normalized = sec
  .split('\n')
  .map((line) =>
    line
      .split('|')
      .map((cell) => cell.trim())
      .join('|')
      .trim()
  )
  .join('\n');

if (!normalized.includes(`|${major}.0.x|`)) {
  fail(
    `SECURITY.md Supported Versions is out of date. Expected a table cell like: "| ${major}.0.x |"`,
    1
  );
}

console.log('SECURITY.md Supported Versions is up to date.');
