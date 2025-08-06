# Security Policy

## 🔒 Supported Versions

BoxdBuddies is currently in active development. Security updates will be provided for:

| Version | Supported               |
| ------- | ----------------------- |
| 0.1.x   | ✅ **Currently Active** |

## 🛡️ Security Features

### Built-in Security Measures

- **Tauri Security**: Content Security Policy (CSP) and API allowlisting
- **Input Validation**: All external inputs (Letterboxd scraping, TMDB API) are validated
- **Environment Variables**: Sensitive configuration stored securely
- **No Hardcoded Secrets**: API keys managed through environment variables
- **Database Security**: SQLite with parameterized queries to prevent injection

### Data Handling

- **Local Storage Only**: All data stays on your device
- **No User Tracking**: No analytics or telemetry collection
- **Respect for Source APIs**: Complies with TMDB and Letterboxd terms of service

## 🚨 Reporting Security Vulnerabilities

**Please do NOT report security vulnerabilities through public GitHub issues.**

### How to Report

1. **GitHub Security Advisories**: Use the "Security" tab → "Report a vulnerability" (preferred)
2. **Email**: For sensitive issues, contact via GitHub profile
3. **Include**:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact assessment
   - Suggested fix (if known)

### What to Expect

- **Acknowledgment**: Within 48 hours
- **Initial Assessment**: Within 5 business days
- **Regular Updates**: Every 7 days until resolution
- **Public Disclosure**: After fix is available (coordinated disclosure)

## 🔍 Security Scope

### In Scope

- Application security vulnerabilities
- Data handling issues
- Authentication/authorization flaws
- Code injection vulnerabilities
- Dependency vulnerabilities

### Out of Scope

- Social engineering attacks
- Physical security issues
- Denial of service attacks
- Issues requiring physical access to the device

## 🛠️ Security Best Practices for Contributors

### Code Security

- Never commit API keys, passwords, or sensitive data
- Use parameterized queries for database operations
- Validate all external inputs
- Follow secure coding guidelines for Rust and TypeScript
- Run security linters and dependency checks

### Dependencies

- Keep dependencies updated
- Regularly run `npm audit` and `cargo audit`
- Review new dependencies for security issues
- Use minimal required permissions

### Environment

- Use `.env` files for local development
- Never commit `.env` files to version control
- Rotate API keys regularly
- Use strong, unique passwords

## 🔐 Responsible Disclosure

We believe in responsible disclosure and will:

1. **Acknowledge** your report promptly
2. **Investigate** thoroughly and fairly
3. **Fix** vulnerabilities as quickly as possible
4. **Credit** researchers appropriately (if desired)
5. **Coordinate** public disclosure timing

## 📋 Security Checklist for Releases

Before each release, we verify:

- [ ] All dependencies are up to date
- [ ] Security linting passes
- [ ] No hardcoded secrets present
- [ ] Input validation is comprehensive
- [ ] Error messages don't leak sensitive information
- [ ] Authentication/authorization works correctly

## 🏆 Recognition

We appreciate security researchers who help improve BoxdBuddies. With your permission, we will:

- Credit you in our security acknowledgments
- Include your name in release notes (if applicable)
- Provide a reference for responsible disclosure

## 📞 Security Resources

- [Tauri Security Guide](https://tauri.app/v1/guides/building/security/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Rust Security Guidelines](https://doc.rust-lang.org/cargo/reference/semver.html)
- [Node.js Security](https://nodejs.org/en/security/)

## 📄 License and Commercial Use

**Important Security Note**: This project is licensed under AGPL-3.0 and prohibits commercial use. Any attempts to circumvent this license for commercial purposes may constitute a security and legal violation.

---

_Last Updated: August 2, 2025_
