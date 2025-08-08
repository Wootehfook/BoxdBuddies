# 🎬 BoxdBuddies v1.0.0 Release Notes

## 🚀 First Public Release - August 2025

## 📥 Downloads

| Platform | Architecture          | File           | Direct Download                                                                                                                       |
| -------- | --------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Windows  | x64                   | MSI Installer  | [BoxdBuddies_1.0.0_x64_en-US.msi](https://github.com/Wootehfook/BoxdBuddies/releases/download/v1.0.0/BoxdBuddies_1.0.0_x64_en-US.msi) |
| macOS    | Apple Silicon (ARM64) | DMG            | [BoxdBuddies_1.0.0_aarch64.dmg](https://github.com/Wootehfook/BoxdBuddies/releases/download/v1.0.0/BoxdBuddies_1.0.0_aarch64.dmg)     |
| Linux    | x86_64                | DEB / AppImage | Available in the release assets (see above)                                                                                           |
| All      | N/A                   | Checksums      | [CHECKSUMS.txt](https://github.com/Wootehfook/BoxdBuddies/releases/download/v1.0.0/CHECKSUMS.txt)                                     |

### Verify Integrity

```bash
sha256sum -c CHECKSUMS.txt | grep -i boxdbuddies
```

Files should report `OK`. If not, re-download or report an issue.

**BoxdBuddies** is now ready for public use! Compare Letterboxd watchlists with friends to find movies you all want to watch.

### ✨ Key Features

- **🔗 Letterboxd Integration**: Automatically scrapes your Letterboxd profile and friends list
- **🤖 Smart Caching**: Intelligent database caching for lightning-fast comparisons
- **🎬 TMDB Enhancement**: Rich movie data with posters, ratings, descriptions, and director information
- **👥 Multi-Friend Comparison**: Compare watchlists between you and multiple friends simultaneously
- **📱 Cross-Platform**: Native desktop app for Windows, macOS, and Linux
- **🎨 Beautiful UI**: Letterboxd-inspired dark theme with responsive design
- **🔒 Privacy-First**: All data stored locally, no cloud storage or tracking

### 🛠️ Technical Highlights

- **Tauri Framework**: Rust backend with React TypeScript frontend
- **Production Ready**: Zero clippy warnings, comprehensive error handling
- **Professional Code Quality**: ESLint, Prettier, pre-commit hooks, CI/CD pipeline
- **Security Focused**: Input validation, sanitized HTML parsing, environment variable configuration
- **Accessibility**: WCAG 2.1 compliance, keyboard navigation, screen reader support

### 📋 System Requirements

- **Windows**: Windows 10 or later
- **macOS**: macOS 10.15 (Catalina) or later
- **Linux**: Most modern distributions with WebKit support

### 🔧 Installation

1. Download the appropriate installer for your platform from the [Releases](https://github.com/Wootehfook/BoxdBuddies/releases) page
2. Run the installer and follow the setup instructions
3. Launch BoxdBuddies and enter your Letterboxd username
4. Optionally add your TMDB API key for enhanced movie data
5. Start comparing watchlists with friends!

### 🎯 What's Next

- **Enhanced Filtering**: More advanced filtering and sorting options
- **Export Features**: Export comparison results to various formats
- **Social Features**: Share favorite movies and recommendations
- **Mobile Support**: Native mobile applications
- **Cloud Sync**: Optional cloud backup for settings and preferences

### 🐛 Known Issues

None currently reported! This is a stable, production-ready release.

### 📚 Documentation

- [Setup Guide](SETUP.md)
- [Contributing Guidelines](CONTRIBUTING.md)
- [User Manual](docs/USER_GUIDE.md)
- [Developer Documentation](docs/DEVELOPMENT.md)

### 🙏 Acknowledgments

Special thanks to:

- **Letterboxd** for providing the platform that inspired this tool
- **The Movie Database (TMDB)** for comprehensive movie metadata
- **Tauri Community** for the excellent cross-platform framework
- **Open Source Contributors** for the amazing ecosystem of tools and libraries

### 🤖 AI Development Transparency

This project represents a collaboration between human creativity and AI assistance:

- **Concept & Direction**: Originated by Woo T. Fook (idea, requirements, testing, project vision)
- **Implementation**: Substantial portions of the codebase developed with **GitHub Copilot** assistance
- **AI Attribution**: All AI-generated code sections are clearly marked with timestamps and model identification
- **Quality Assurance**: Human oversight for architecture decisions, testing, and final validation

The codebase includes comprehensive AI attribution comments throughout core files including the React frontend (App.tsx), Rust backend (main.rs), and testing infrastructure. This represents a modern development approach combining human insight with AI productivity tools.

For transparency about specific AI contributions, developers can review the timestamped "AI Generated: GitHub Copilot" comments throughout the source code.

### 📝 License

BoxdBuddies is licensed under the [AGPL-3.0 License](LICENSE) with commercial use restrictions. See [THIRD_PARTY_LICENSES.md](THIRD_PARTY_LICENSES.md) for dependency licenses.

---

## Enjoy discovering movies with your friends! 🍿🎭

For support, bug reports, or feature requests, visit our [GitHub Issues](https://github.com/Wootehfook/BoxdBuddies/issues) page.
