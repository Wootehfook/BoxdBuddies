<!-- AI Generated: GitHub Copilot (Claude Haiku 4.5) - 2026-02-21 -->

# BoxdBuddies DevContainer Setup

This directory contains the development container configuration for BoxdBuddies. A dev container provides a consistent, isolated development environment using Docker.

## 📋 What's Included

### Base Environment

- **Node.js LTS** - JavaScript runtime
- **Python 3.12** - For development scripts and tools
- **Git** - Version control
- **Zsh with Oh My Zsh** - Enhanced shell experience

### VS Code Extensions

#### Code Editors & Formatters

- **Prettier** - Code formatter
- **ESLint** - JavaScript linter
- **TypeScript** - Advanced TypeScript support

#### Development Tools

- **SonarLint** - Real-time code quality and security analysis
- **Error Lens** - Inline error and warning display
- **GitLens** - Git integrations and blame information
- **Vitest Explorer** - Test UI and runner
- **REST Client** - API testing within VS Code

#### Productivity

- **GitHub Copilot** - AI code suggestions
- **GitHub Pull Request and Issues** - GitHub integration
- **Tailwind CSS IntelliSense** - CSS utility class support
- **Makefile Tools** - Makefile support

### Port Forwarding

- **5173** - Vite frontend development server
- **3000** - Preview/alternative port
- **8787** - Cloudflare Pages dev server
- **1420** - Additional development port

### Git Integration

- SSH keys are mounted from your host (`~/.ssh`)
- Git config is mounted from your host (`~/.gitconfig`)
- Husky git hooks are automatically configured

## 🚀 Quick Start

### Option 1: VS Code Remote Containers (Recommended)

1. **Install the Remote - Containers extension** (if not already installed):
   - Open VS Code
   - Go to Extensions
   - Search for "Remote - Containers"
   - Install the extension from Microsoft

2. **Open the project in a container**:
   - Open the BoxdBuddies project in VS Code
   - Click the "Dev Containers" icon in the bottom-left corner
   - Select "Reopen in Container"
   - Wait for VS Code to build and start the container
   - The post-create script will run automatically

3. **Start developing**:
   ```bash
   npm run dev
   ```

### Option 2: Command Line

```bash
# Open in VS Code with Remote Containers
code --remote containers/$(pwd) .

# Or if already in the project
# Just click the Dev Containers icon and select "Reopen in Container"
```

## 📦 Post-Create Automation

When the container launches, the `post-create.sh` script automatically:

1. ✅ Installs npm dependencies
2. ✅ Configures git hooks (Husky)
3. ✅ Creates `.env.local` template for secrets
4. ✅ Runs TypeScript type checking
5. ✅ Runs ESLint to check code quality
6. ✅ Displays setup completion message with next steps

## 🔐 Environment Variables

### Local Development (`.env.local`)

After the container starts, you may need to add secrets to `.env.local`:

```bash
# Cloudflare Secrets (for backend development)
TMDB_API_KEY=your_tmdb_api_key
ADMIN_SECRET=your_admin_secret

# Local API URL
VITE_API_URL=http://localhost:8787
```

To set Cloudflare secrets:

```bash
wrangler secret put TMDB_API_KEY
wrangler secret put ADMIN_SECRET
```

## 📝 Common Development Commands

### Frontend Development

```bash
npm run dev              # Start dev server (port 5173)
npm run build            # Build for production
npm run preview          # Preview production build
```

### Testing

```bash
npm run test             # Run tests once
npm run test:watch       # Run tests in watch mode
```

### Code Quality

```bash
npm run lint             # Check for linting issues
npm run lint:fix         # Auto-fix linting issues
npm run format           # Format code with Prettier
npm run format:check     # Check formatting without changing files
npm run type-check       # Verify TypeScript types
```

### Backend (Cloudflare)

```bash
npm run cloudflare:dev   # Run local Cloudflare Pages dev server
npm run build            # Build project for deployment
npm run cloudflare:deploy # Deploy to Cloudflare Pages
```

## 🔍 Code Quality Tools

### SonarLint

- Real-time code quality and security analysis
- Works in **local mode** (no connection needed) or
- **Connected mode** for team rulesets (requires SonarCloud account)

**To enable Connected Mode:**

1. Install SonarLint extension (already installed)
2. Open VS Code settings
3. Search for "SonarLint"
4. Configure SonarCloud connection with:
   - Organization: `Wootehfook`
   - Project Key: `BoxdBuddies`

### ESLint & Prettier

- Automatically enabled with format-on-save
- Run `npm run lint` to check
- Run `npm run format` to auto-fix

### TypeScript

- Strict type checking enabled
- Run `npm run type-check` to verify

## 🐳 Container Customization

### Rebuild the Container

If you modify `devcontainer.json`, rebuild with:

1. Open the Command Palette (`Ctrl+Shift+P`)
2. Select "Remote-Containers: Rebuild Container"

### Mount Additional Directories

Edit `devcontainer.json` to mount additional host directories:

```json
"mounts": [
  "source=/path/to/host/dir,target=/home/node/container/path,type=bind"
]
```

### Add More Extensions

Add extension IDs to `customizations.vscode.extensions` in `devcontainer.json`:

```json
"extensions": [
  "publisher.extension-id"
]
```

## 🆘 Troubleshooting

### Container won't start

- Check Docker is running
- Check available disk space
- Try: `Remote-Containers: Rebuild Container`

### Port conflicts

- If a port is already in use, VS Code will assign an alternate port
- Check the "Forwarded Ports" panel for actual ports

### Git credentials not working

- Ensure `~/.ssh` and `~/.gitconfig` exist on host
- Check SSH key permissions: `chmod 600 ~/.ssh/id_*`

### npm install permission denied (EACCES)

This occurs when npm tries to rename files in `node_modules` on a cross-platform (Windows/Linux) mount.

**Solution:**

```bash
# Option 1: Clean and reinstall
rm -rf node_modules package-lock.json
npm ci --prefer-offline

# Option 2: Run npm as root (one-time fix)
sudo npm ci --prefer-offline

# Option 3: Use npm clean-install instead
npm ci --prefer-offline --no-save
```

### npm modules are very slow to install

- This is normal in containers on first startup
- Subsequent installs will be faster due to caching
- Consider running `npm ci` instead of `npm install`

### SonarLint not showing issues

- Make sure the SonarLint extension is installed and active
- Try restarting VS Code
- Check SonarLint output panel for errors

### Type-check or linting errors on startup

- These are non-blocking and won't prevent the container from starting
- Fix them with:
  ```bash
  npm run type-check  # Check types
  npm run lint:fix    # Auto-fix linting issues
  npm run format      # Auto-format code
  ```

## 📚 Additional Resources

- [Development Guide](../README.md)
- [Backend API Contracts](../functions/README.md)
- [Contributing Guidelines](../README.md#-contributing)
- [VS Code Remote Containers Docs](https://code.visualstudio.com/docs/remote/remote-overview)

## 🔧 For Contributors

If you modify this devcontainer setup:

1. Update this README with your changes
2. Test the setup in a fresh container
3. Include a note in your PR about what changed
4. Ensure the post-create script is executable: `chmod +x .devcontainer/post-create.sh`

---

**Happy coding! 🎬**
