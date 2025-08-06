# Dependency Review Policy - BoxdBuddies

This document explains how we handle dependency security in the BoxdBuddies project.

## Security Philosophy

We prioritize **actual security vulnerabilities** over governance scores. Our dependency review process focuses on:

1. **High/Critical Vulnerabilities**: Block deployment
2. **License Compatibility**: Ensure compatibility with AGPL-3.0 project license
3. **Runtime Dependencies**: Focus on production security impact

## OpenSSF Scorecard Handling

Many established npm packages have low OpenSSF Scorecard scores due to:

- Infrequent updates (stable, mature packages)
- Different maintenance models
- Lack of automated tooling adoption

**Our Approach**: We allow packages with scores ≥2.0 if they are:

- Widely adopted in the ecosystem
- Have stable APIs and long development history
- Are development/build-time dependencies
- Don't contain actual security vulnerabilities

## Approved Low-Score Dependencies

The following packages are explicitly allowed despite low OpenSSF scores:

| Package             | Score | Justification                                      |
| ------------------- | ----- | -------------------------------------------------- |
| `inherits`          | 2.6   | Core Node.js utility, stable for years             |
| `human-signals`     | 2.8   | Signal handling, maintained by trusted developer   |
| `graceful-fs`       | 2.5   | File system wrapper, ecosystem standard            |
| `get-caller-file`   | 2.4   | Stack trace utility, specific use case             |
| `fs.realpath`       | 2.5   | File system utilities, core functionality          |
| `ejs`               | 2.9   | Template engine, established and stable            |
| `deepmerge`         | 2.1   | Object merging, stable API                         |
| `cross-spawn`       | 2.9   | Process spawning, essential cross-platform utility |
| `bs-logger`         | 1.7   | Logging utility, build-time dependency             |
| `@bcoe/v8-coverage` | 2.4   | Code coverage tooling, development only            |

## Security Review Process

1. **Automated Scanning**: GitHub Dependabot + npm audit
2. **Vulnerability Assessment**: Focus on exploitable security issues
3. **License Review**: Ensure compatibility with AGPL-3.0 (allows GPL-compatible licenses)
4. **Impact Analysis**: Runtime vs development dependency classification

## Escalation

If dependency review blocks legitimate changes:

1. Check if the package is in the approved list
2. Assess the actual security risk vs governance score
3. Update the configuration if the package meets our criteria
4. Document the decision in this policy

## Updates

This policy is reviewed quarterly and updated based on:

- New security research and best practices
- Ecosystem changes in package maintenance
- Project security requirements evolution
