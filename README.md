# Azkar PWA — Deployment Guide

This folder is a complete, installable Progressive Web App. Unlike a single
HTML file, this works as a **real installable app** because it includes:

```
index.html              ← the app
manifest.json            ← real web app manifest (not a blob URL)
sw.js                     ← real service worker (not a blob URL)
icon-192.png              ← app icon (192×192)
icon-512.png              ← app icon (512×512)
icon-512-maskable.png     ← Android adaptive icon (full-bleed safe zone)
apple-touch-icon.png      ← iOS home screen icon (180×180)
favicon-32.png / favicon-16.png  ← browser tab icons
```

## Why this matters

Browsers will only offer "Install App" / show the install prompt when the
manifest and service worker are served as **real files over HTTPS** from the
same origin as the page — generated `Blob` URLs (the old approach) are
rejected by most browsers, and silently ignored by iOS Safari entirely.

## How to deploy (pick one — all free)

### Option A — GitHub Pages (easiest, free, your own URL)
1. Create a new GitHub repository.
2. Upload all the files in this folder to the repo root (keep filenames exactly as-is).
3. Go to **Settings → Pages**, set source to the `main` branch, root folder.
4. Wait ~1 minute. Your app will be live at `https://<username>.github.io/<repo>/`.

### Option B — Netlify (drag and drop, free)
1. Go to https://app.netlify.com/drop
2. Drag this entire folder onto the page.
3. It deploys instantly with a free `*.netlify.app` HTTPS URL.

### Option C — Vercel (free)
1. Go to https://vercel.com/new
2. Import this folder or connect a repo containing it.
3. Deploy with default settings (no build step needed — it's static).

### Option D — Any static host you already have
Just upload all 9 files to the same folder on your web server. No build
step, no server-side code, no database. It must be served over **HTTPS**
(all of the options above provide this automatically; plain `http://` will
not allow installation, except `localhost` during local testing).

## Testing locally before deploying

From inside this folder, run a simple local server (service workers require
`http://localhost` or HTTPS — they will not register over `file://`):

```bash
# Python 3
python3 -m http.server 8080

# or Node
npx serve .
```

Then open `http://localhost:8080` in Chrome and check:
- DevTools → Application → Manifest (should show no errors)
- DevTools → Application → Service Workers (should show "activated and running")
- The address bar should show an install icon (⊕ or similar) once the page
  has loaded fully.

## Installing on each platform

- **Android (Chrome/Edge/Samsung Internet):** an automatic "Install" banner
  or icon (⊕) will appear in the address bar after the page loads. Tap it,
  or use the browser's ⋮ menu → "Install app" / "Add to Home screen."
- **iOS / iPadOS (Safari):** iOS never shows an automatic install prompt —
  this is an Apple platform restriction, not a bug. Users must tap the
  **Share** button → **Add to Home Screen** manually. The app icon, name,
  and standalone (no browser chrome) mode will still work correctly once
  added.
- **Desktop (Chrome/Edge on Windows/Mac/Linux):** an install icon (⊕)
  appears in the right side of the address bar. Click it to install as a
  standalone desktop app with its own window and taskbar/dock icon.

## What's already wired up in the app itself

- `beforeinstallprompt` is captured in `index.html`; once fired, an
  **"Install Azkar App"** button appears inside the in-app Settings panel
  as a second, app-native way to trigger the same install flow (in addition
  to the browser's own UI).
- The service worker pre-caches the full app shell on first visit, so the
  app keeps working with no network connection afterward.
- An offline indicator badge appears automatically when the device loses
  connectivity.

## Updating the app later

Bump the `CACHE_NAME` value at the top of `sw.js` (e.g. `azkar-v1` →
`azkar-v2`) whenever you change `index.html` or any cached asset. This
forces the service worker to fetch fresh files and discard the old cache —
otherwise returning users may keep seeing a stale cached version.
