// AI Generated: GitHub Copilot - 2025-08-12
// Copies a 128x128 PNG variant of BBud.png as the app favicon.
// Requires: @tauri-apps/cli installed (icons already generated) and sharp (optional).

/* eslint-env node */
import fs from 'fs';
import path from 'path';

const projectRoot = process.cwd();
const sourcePng = path.join(projectRoot, 'BBud.png');
const targetFavicon = path.join(projectRoot, 'public', 'favicon.png');

// Minimal: just copy if exists; Vite can use PNG favicons via link rel icon.
(async () => {
  try {
    if (!fs.existsSync(sourcePng)) {
      console.log('icons:favicon: source BBud.png not found, skipping');
      process.exit(0);
    }
    fs.mkdirSync(path.dirname(targetFavicon), { recursive: true });
    fs.copyFileSync(sourcePng, targetFavicon);
    console.log('icons:favicon: favicon.png updated');
  } catch (err) {
    console.error('icons:favicon failed:', err);
    process.exit(1);
  }
})();
