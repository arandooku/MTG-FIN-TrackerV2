# MTG FIN Tracker V2

Modular TypeScript rewrite of the MTG Final Fantasy (FIN) binder tracker PWA.

## Stack

- Vite 6 + React 19 + TypeScript 5.7 (strict)
- Tailwind CSS v4 (CSS-first config)
- Zustand 5 (persist)
- TanStack Query 5
- Zod 4
- Tesseract.js + OCR.space (dual-engine scan)
- vite-plugin-pwa (workbox runtime caching)
- Radix UI primitives + shadcn conventions
- Vitest + Playwright

## Development

```bash
npm install
npm run dev          # http://localhost:5173
npm run typecheck
npm run build
npm run preview
```

## PWA Assets

Regenerate from `public/logo.svg`:

```bash
npm run pwa-assets
```

## Deploy (Cloudflare Pages)

In the Cloudflare dashboard → Pages → Connect to Git → select `MTG-FIN-TrackerV2`:

- Framework preset: **Vite**
- Build command: `npm run build`
- Output directory: `dist`
- Node version: `20` or `22`

`public/_headers` sets security + cache headers. `public/_redirects` routes all paths to `index.html` for SPA.

## Gist Sync

In Settings → Gist Sync, paste a GitHub Personal Access Token with `gist` scope. Click **Discover / Create Gist** to link an existing file named `fin-binder-data.json` or create a new private gist. Pull/Push manually, or enable **Auto-push on changes** for a 3s debounced write after each mutation.

## Structure

```
src/
  lib/          pure helpers (scryfall, foil, binder, fx, gist, ocr, celebration, sound)
  store/        zustand stores (collection, config, theme, sync, toast)
  hooks/        tanstack query hooks (useCards, useFx, useAutoSync)
  components/
    ui/         radix + cva primitives
    tabs/       six tab views
    modals/     CardModal, PackModal, SearchModal
  styles/       globals.css (tailwind v4 + shadcn tokens)
```

## Storage Keys

Uses `fin2-*` prefix to avoid collision with v1 (`fin-*`). No automatic migration from v1 — users start fresh. Manual export from v1 → gist → pull into v2 works.
