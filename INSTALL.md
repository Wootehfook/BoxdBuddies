# 🚀 BoxdBuddies Installation Guide

## Quick Installation

### Windows

1. Download `BoxdBuddies_x.x.x_x64_en-US.msi` from [Releases](https://github.com/Wootehfook/BoxdBuddies/releases)
2. Double-click the MSI file to run the installer
3. Follow the installation wizard prompts
4. Launch BoxdBuddies from your Start Menu or Desktop shortcut

### macOS

1. Download `BoxdBuddies_x.x.x_x64.dmg` from [Releases](https://github.com/Wootehfook/BoxdBuddies/releases)
2. Open the DMG file
3. Drag BoxdBuddies to your Applications folder
4. Launch from Applications or Spotlight search

### Linux

#### Ubuntu/Debian (.deb package)

```bash
# Download the .deb file, then:
sudo dpkg -i BoxdBuddies_x.x.x_amd64.deb
sudo apt-get install -f  # Fix any missing dependencies
```

#### Universal Linux (.AppImage)

```bash
# Download the .AppImage file, then:
chmod +x BoxdBuddies_x.x.x_x86_64.AppImage
./BoxdBuddies_x.x.x_x86_64.AppImage
```

## System Requirements

- **Windows**: Windows 10 or later (64-bit)
- **macOS**: macOS 10.15 (Catalina) or later
- **Linux**: Most modern distributions with WebKit support
- **Internet**: Required for initial setup and TMDB movie data

## First Launch Setup

1. **Enter Letterboxd Username**
   - Use your exact Letterboxd username (case-sensitive)
   - Your profile must be public to access friends and watchlists

2. **TMDB API Key (Optional)**
   - Get a free key from [themoviedb.org/settings/api](https://www.themoviedb.org/settings/api)
   - Enables movie posters, ratings, and descriptions
   - Can be skipped for basic functionality

3. **Friend Discovery**
   - BoxdBuddies automatically scans your Letterboxd friends
   - May take a moment depending on friend count

## Troubleshooting

### Windows

- **"Windows protected your PC"**: Click "More info" → "Run anyway"
- **Antivirus warning**: Add BoxdBuddies to your antivirus whitelist
- **Installation fails**: Run as Administrator

### macOS

- **"Cannot be opened"**: Right-click → "Open" → "Open" to bypass Gatekeeper
- **App damaged**: Run `xattr -cr /Applications/BoxdBuddies.app` in Terminal

### Linux

- **Permission denied**: Make sure the AppImage is executable (`chmod +x`)
- **Missing dependencies**: Install webkit2gtk development packages
- **Won't launch**: Check that you have a desktop environment with WebKit support

## Security Notes

- BoxdBuddies stores all data locally on your device
- No telemetry, tracking, or cloud storage
- Your Letterboxd credentials are never stored
- TMDB API keys are stored locally in encrypted format

## Uninstallation

### Windows

- Use "Add or Remove Programs" in Windows Settings
- Or run the uninstaller from the installation directory

### macOS

- Drag BoxdBuddies from Applications to Trash
- Remove `~/Library/Application Support/BoxdBuddies` if desired

### Linux

```bash
# For .deb package:
sudo apt remove boxdbuddies

# For AppImage:
# Simply delete the .AppImage file
rm BoxdBuddies_x.x.x_x86_64.AppImage
```

## Need Help?

- 📚 [User Guide](docs/USER_GUIDE.md)
- 🐛 [Report Issues](https://github.com/Wootehfook/BoxdBuddies/issues)
- 💬 [GitHub Discussions](https://github.com/Wootehfook/BoxdBuddies/discussions)

---

**Enjoy comparing watchlists with your friends! 🎬🍿**
