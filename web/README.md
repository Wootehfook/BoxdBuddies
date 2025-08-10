# BoxdBuddies Web Version

This is the web version of BoxdBuddies, deployed to GitHub Pages for public testing and feedback.

## 🌐 Live Demo

Visit the live web application: [https://wootehfook.github.io/BoxdBuddies/](https://wootehfook.github.io/BoxdBuddies/)

## 🏗️ Architecture

### Frontend (GitHub Pages)
- **Technology**: React + TypeScript + Vite
- **Deployment**: Automatic deployment via GitHub Actions
- **Location**: `web/frontend/`
- **Build**: `npm run build` creates optimized production build

### Backend (Cloudflare Worker)
- **Technology**: TypeScript Workers API
- **Location**: `web/api/`  
- **Functionality**: Letterboxd scraping and TMDB movie enhancement
- **Deployment**: Manual deployment with `wrangler publish`

## 🚀 Deployment Process

### Automatic Frontend Deployment

The frontend automatically deploys to GitHub Pages when changes are merged to main:

1. **Trigger**: Push to `main` branch with changes in `web/frontend/`
2. **Build**: GitHub Actions builds the React app with Vite
3. **Deploy**: Artifacts are deployed to GitHub Pages
4. **Live**: Available at the GitHub Pages URL

### Manual API Deployment

The Cloudflare Worker API requires manual deployment:

```bash
cd web/api
npm install
npx wrangler login
npx wrangler publish
```

## 🔧 Development

### Frontend Development

```bash
cd web/frontend
npm install
npm run dev    # Start development server
npm run build  # Build for production
npm run lint   # Lint code
```

### API Development

```bash
cd web/api  
npm install
npx wrangler dev    # Start local development
npx wrangler publish # Deploy to Cloudflare
```

## 🌍 Environment Variables

### Frontend (.env)
```
VITE_API_BASE_URL=https://your-worker.your-subdomain.workers.dev
```

### Cloudflare Worker (wrangler.toml)
```toml
[vars]
ALLOWED_ORIGINS = "https://wootehfook.github.io,http://localhost:3000"
```

## 📁 File Structure

```
web/
├── frontend/          # React web application
│   ├── src/
│   │   ├── App.tsx           # Main app component (web-compatible)
│   │   ├── services/         # Web API service (replaces Tauri)
│   │   └── utils/            # Web-compatible utilities
│   ├── dist/                 # Built artifacts (GitHub Pages)
│   └── package.json
├── api/               # Cloudflare Worker API  
│   ├── src/
│   │   └── index.ts          # Worker with Letterboxd scraping
│   ├── wrangler.toml         # Cloudflare configuration
│   └── package.json
└── README.md          # This file
```

## 🔄 Differences from Desktop Version

### Removed Features
- ❌ Window controls (pin, focus)
- ❌ Local SQLite database
- ❌ Offline caching 
- ❌ Tauri-specific APIs

### Added Features  
- ✅ Web-compatible localStorage for preferences
- ✅ Cloudflare Worker backend for scraping
- ✅ CORS support for cross-origin requests
- ✅ Responsive web design
- ✅ GitHub Pages deployment

## 🧪 Testing Process

This web version supports the iterative feedback cycle:

1. **Deploy** → Automatic GitHub Pages deployment
2. **Test** → Public testing at the live URL
3. **Adjust** → Make improvements based on feedback  
4. **Repeat** → Continuous deployment and improvement

## 🔧 Configuration

### Update API Endpoint

To use your own Cloudflare Worker:

1. Deploy the API from `web/api/`
2. Update `VITE_API_BASE_URL` in the build workflow
3. Update CORS origins in the Worker configuration
4. Redeploy the frontend

### GitHub Pages Setup

1. Enable GitHub Pages in repository settings
2. Set source to "GitHub Actions"  
3. The workflow will handle deployment automatically

## 🚨 Limitations

- **Rate Limiting**: Cloudflare Workers have execution time limits
- **Scraping**: Dependent on Letterboxd's current HTML structure
- **CORS**: Must be configured correctly for the frontend domain
- **Storage**: No persistent storage (uses localStorage only)

## 🎯 Future Improvements

- [ ] Add persistent storage with Cloudflare D1
- [ ] Implement caching with Cloudflare KV
- [ ] Add rate limiting and request queuing
- [ ] Improve error handling and retry logic
- [ ] Add comprehensive testing suite