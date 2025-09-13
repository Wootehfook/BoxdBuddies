# 🎬 Boxdbud.io

![Boxdbud.io brand](./docs/brand/boxdbud.io.svg)

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![React](https://img.shields.io/badge/React-18-blue)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Cloudflare](https://img.shields.io/badge/Cloudflare-Pages-orange)](https://pages.cloudflare.com/)

**Find movies all your friends want to watch.**

Boxdbud.io connects to Letterboxd, compares multiple watchlists, and shows you the common movies for your next group watch.

## 🚀 Live Application

**[Launch Boxdbud.io →](https://boxdbud.pages.dev)**

Brand colors:

- `#ff8000` — boxdbud
- `#00e054` — . (dot)
- `#40bcf4` — io

- **No Installation Required**: Instant access from any modern web browser.

## ✨ Features

- ✔️ **Letterboxd Integration**: Scrapes complete watchlists with full pagination support.
- 👥 **Multi-User Comparison**: Compare watchlists between yourself and up to 4 friends.
- 🚀 **TMDB Enhancement**: Enriches movies with posters, ratings, genres, and director info.
- ⚡ **Intelligent Caching**: Utilizes a Cloudflare D1 database for rapid subsequent comparisons.
- 🎨 **Responsive Design**: A clean, Letterboxd-inspired dark theme that works on any screen size.
- 🔒 **Secure by Design**: All external API interactions are handled server-side; no user API keys are required or stored.

---

## 📖 User Guide

### Step 1: Access the Application

Navigate to **[boxdbud.pages.dev](https://boxdbud.pages.dev)**.

### Step 2: Enter Usernames

1. **Your Username**: Enter your exact Letterboxd username.

### Step 3: Compare and View Results

1. Click **"Compare Watchlists"**. The app will scan all watchlists and find common movies.
2. Results are sorted to show movies that the most friends have on their watchlists.
3. Click any movie poster to view detailed information on [Letterboxd](https://letterboxd.com).

---

## 🛠️ Development Setup

Interested in contributing? Here’s how to get the development environment running.

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- [Git](https://git-scm.com/)
- A code editor (VS Code is recommended)

### Installation

1. **Clone the repository**:

````bash
git clone https://github.com/your-username/BoxdBuddies.git
    ```bash
    git clone https://github.com/your-username/BoxdBuddies.git
    cd BoxdBuddies
    ```

2. **Install dependencies**:

    ```bash
    npm install
    ```

3. **Start the development server**:

    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:5173`.

### Project Structure

```text
BoxdBuddies/
├── src/                    # React frontend source
├── functions/              # Cloudflare Functions (serverless backend)
├── migrations/             # Cloudflare D1 database schema
├── public/                 # Static assets
├── .github/                # GitHub workflows and configurations
├── wrangler.toml           # Cloudflare configuration
└── README.md               # This file
````

---

## 🤝 Contributing

We welcome contributions! Please follow these guidelines to help us keep the project organized and maintainable.

### Git Workflow

1. Create a feature branch: `git checkout -b feature/your-feature-name`
2. Make your changes and test them locally.
3. Format your code: `npm run lint`
4. Commit your changes using the [Conventional Commits](https://www.conventionalcommits.org/) format.
5. Push to your fork and create a Pull Request.

### Code Style

- **TypeScript/React**: Adheres to the project's ESLint and Prettier configurations.
- **Cloudflare Functions**: Follow modern TypeScript and Cloudflare Workers best practices.
- **AI Attribution**: Any AI-generated code must include a comment with the timestamp and model identity (e.g., `// AI Generated: GitHub Copilot - 2025-08-15`).

---

## 🛡️ Security Policy

This project prioritizes security. All API keys are managed via Cloudflare secrets, and no sensitive user data is stored.

### Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

- Use the **"Report a vulnerability"** feature under the "Security" tab in the GitHub repository.
- We aim to acknowledge reports within 48 hours and provide regular updates until resolution.

### Contributor Best Practices

- Never commit API keys, passwords, or other sensitive data.
- Validate all external inputs within your code.
- Keep dependencies updated and run `npm audit` regularly.

---

## 📄 License

BoxdBuddies is licensed under the **GNU Affero General Public License v3.0 (AGPL-3.0)**.

**In short, this means:**

- ✅ You can use, modify, and share it for personal projects.
- ✅ You must share the source code of any modifications you distribute.
- ❌ **Commercial use is strictly prohibited.** You cannot sell it, charge for access, or include it in proprietary software.

See the `LICENSE` file for full details.
