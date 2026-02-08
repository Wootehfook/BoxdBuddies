<!-- AI Generated: GitHub Copilot - 2025-09-06 -->

# Security Policy

If you discover a security vulnerability in this project, please follow one of the options below so we can address it promptly:

Please do not include sensitive data (API keys, secrets) in public issues. If you need to share sensitive information, use GitHub's private security advisory flow or contact the maintainers via the repository's security contact.

Maintainers will triage and respond to reports within a reasonable timeframe.

## CI Supply-Chain Hardening

To reduce supply-chain risk, our GitHub Actions workflows install dependencies
with `--ignore-scripts`, which prevents package lifecycle scripts from running
during CI installs. If a workflow legitimately requires install scripts, it must
be explicitly justified and documented in the workflow or security notes.

## Supported Versions

| Version | Status    |
| ------- | --------- |
| 2.0.x   | Supported |

| 1.0.x | Legacy - retired in favor of the v2 web application |

If your affected version is not listed above, please include the exact version or commit SHA when opening a report.

## Contact

Use the repository Security tab to open a private advisory; otherwise tag an issue with `security` and maintainers will follow up.

<!-- End AI Generated -->
