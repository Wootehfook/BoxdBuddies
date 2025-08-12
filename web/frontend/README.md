# BoxdBuddies Web Frontend

This is the web version of BoxdBuddies, built with React TypeScript and Vite for Cloudflare Pages deployment.

## Features

- Complete React TypeScript frontend structure
- Vite build system configured for Cloudflare Pages deployment
- Movie comparison interface that matches the desktop app functionality
- TypeScript configuration with strict mode
- Modern React 18 with functional components and hooks
- Mock backend service for demonstration
- Letterboxd-inspired dark theme

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type checking
npm run type-check

# Linting
npm run lint
npm run lint:fix

# Formatting
npm run format
npm run format:check
```

## Build Output

The build process generates a `dist/` folder that is ready for Cloudflare Pages deployment:

- `dist/index.html` - Main HTML file
- `dist/assets/` - CSS and JavaScript bundles

## Demo Mode

This web version includes a mock backend service that simulates the desktop app's functionality with sample data. It demonstrates the complete user interface and workflow without requiring the full Rust backend.

## Deployment

The app is configured for Cloudflare Pages deployment. The build process creates optimized bundles with:

- Vendor chunk separation for better caching
- Minified assets
- Proper asset handling for Cloudflare Pages

## Differences from Desktop App

- Uses mock backend instead of Tauri APIs
- Sample data for demonstration
- Opens Letterboxd links in new tabs instead of default browser
- No window management features (always on top, etc.)
- Local storage for user preferences instead of database
