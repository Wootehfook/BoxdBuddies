# Third-Party Licenses and Attributions

BoxdBuddy uses various open source libraries and services. This document provides attribution and license information for all third-party components.

## 📄 Summary

BoxdBuddy is licensed under **AGPL-3.0-or-later** with commercial use prohibition. All dependencies are compatible with this license.

---

## 🎯 Frontend Dependencies (JavaScript/TypeScript)

### Runtime Dependencies

#### [React](https://github.com/facebook/react) - v18.2.0

- **License**: MIT
- **Purpose**: Frontend UI framework
- **Compatible**: ✅ (MIT compatible with AGPL-3.0)

#### [react-dom](https://github.com/facebook/react) - v18.2.0

- **License**: MIT
- **Purpose**: React DOM rendering
- **Compatible**: ✅ (MIT compatible with AGPL-3.0)

### Development Dependencies

All development dependencies (ESLint, TypeScript, Vite, Prettier, etc.) are used only during build process and are not distributed. These include MIT, Apache-2.0, and other permissive licenses, all compatible with AGPL-3.0.

---

## 🌐 Backend Dependencies (Cloudflare)

### Cloudflare Services

#### [Cloudflare Pages](https://pages.cloudflare.com/)

- **Service**: Cloudflare Pages for static hosting and Functions
- **Terms**: [Cloudflare Terms of Service](https://www.cloudflare.com/terms/)
- **Purpose**: Web application hosting and serverless functions

#### [Cloudflare D1](https://developers.cloudflare.com/d1/)

- **Service**: Cloudflare D1 SQLite database
- **Terms**: [Cloudflare Terms of Service](https://www.cloudflare.com/terms/)
- **Purpose**: Structured data storage and caching

#### [Cloudflare KV](https://developers.cloudflare.com/kv/)

- **Service**: Cloudflare Workers KV for key-value storage
- **Terms**: [Cloudflare Terms of Service](https://www.cloudflare.com/terms/)
- **Purpose**: High-performance caching layer

---

## 🦀 Backend Dependencies (Rust)

#### [tauri](https://github.com/tauri-apps/tauri) - v1.6

- **License**: Apache-2.0 OR MIT
- **Purpose**: Desktop application framework
- **Compatible**: ✅ (Permissive licenses compatible with AGPL-3.0)

#### [serde](https://github.com/serde-rs/serde) - v1.0

- **License**: Apache-2.0 OR MIT
- **Purpose**: Serialization/deserialization framework
- **Compatible**: ✅ (Permissive licenses compatible with AGPL-3.0)

#### [reqwest](https://github.com/seanmonstar/reqwest) - v0.11

- **License**: Apache-2.0 OR MIT
- **Purpose**: HTTP client for web scraping and API requests
- **Compatible**: ✅ (Permissive licenses compatible with AGPL-3.0)

#### [tokio](https://github.com/tokio-rs/tokio) - v1.0

- **License**: MIT
- **Purpose**: Asynchronous runtime for Rust
- **Compatible**: ✅ (MIT compatible with AGPL-3.0)

#### [scraper](https://github.com/causal-agent/scraper) - v0.20

- **License**: ISC
- **Purpose**: HTML parsing for Letterboxd scraping
- **Compatible**: ✅ (ISC compatible with AGPL-3.0)

#### [rusqlite](https://github.com/rusqlite/rusqlite) - v0.31

- **License**: MIT
- **Purpose**: SQLite database interface
- **Compatible**: ✅ (MIT compatible with AGPL-3.0)

#### [chrono](https://github.com/chronotope/chrono) - v0.4

- **License**: Apache-2.0 OR MIT
- **Purpose**: Date and time handling
- **Compatible**: ✅ (Permissive licenses compatible with AGPL-3.0)

#### Additional Rust Dependencies

- **uuid**: Apache-2.0 OR MIT ✅
- **dirs**: Apache-2.0 OR MIT ✅
- **fastrand**: Apache-2.0 OR MIT ✅
- **regex**: Apache-2.0 OR MIT ✅
- **serde_json**: Apache-2.0 OR MIT ✅

---

## 🌐 External Services

### The Movie Database (TMDB)

- **Website**: https://www.themoviedb.org/
- **API Terms**: https://www.themoviedb.org/documentation/api/terms-of-use
- **Usage**: Movie data enhancement (posters, ratings, descriptions)
- **Attribution**: "This product uses the TMDB API but is not endorsed or certified by TMDB."
- **Compliance**: ✅ Users provide their own API keys, proper attribution included

### Letterboxd

- **Website**: https://letterboxd.com/
- **Terms**: https://letterboxd.com/legal/terms-of-use/
- **Usage**: Public profile scraping for watchlist data
- **Compliance**: ✅ Scraping only public profiles, respectful rate limiting, non-commercial use

---

## 🎨 Fonts and Assets

### Application Icons

- **Source**: Custom created or royalty-free
- **License**: Public domain or CC0
- **Usage**: Application branding and interface icons

### Movie Emoji and Unicode Characters

- **Source**: Unicode Consortium
- **License**: Unicode License
- **Usage**: Interface decoration (🎬, ⭐, etc.)

---

## 🔍 License Compatibility Analysis

### AGPL-3.0 Compatibility

- **MIT**: ✅ Compatible (permissive)
- **Apache-2.0**: ✅ Compatible (permissive)
- **ISC**: ✅ Compatible (permissive)
- **Unicode**: ✅ Compatible (permissive)

### Commercial Use Prohibition

BoxdBuddies adds commercial use prohibition to AGPL-3.0. All dependencies remain under their original permissive licenses, which allow this additional restriction.

---

## 📋 Compliance Checklist

- [x] ✅ All dependencies use permissive licenses compatible with AGPL-3.0
- [x] ✅ No GPL/LGPL dependencies that would require license compatibility
- [x] ✅ External service usage complies with terms of service
- [x] ✅ Proper attribution for TMDB API usage
- [x] ✅ Respectful usage of Letterboxd public data
- [x] ✅ No trademark violations or brand misuse

---

## 🆔 Full License Information

Complete license texts for all dependencies can be found in:

- `node_modules/*/LICENSE` files for NPM packages
- `~/.cargo/registry/src/*/LICENSE*` files for Rust crates
- Online at respective project repositories

---

## 📞 License Questions or Concerns

If you have questions about licensing or discover any compliance issues:

1. **Create an Issue**: https://github.com/Wootehfook/BoxdBuddies/issues
2. **Security Email**: [Security contact from SECURITY.md]
3. **Legal Review**: All licenses reviewed as of August 3, 2025

---

**Last Updated**: August 3, 2025  
**Review Status**: ✅ Approved for public release  
**Next Review**: With major dependency updates
