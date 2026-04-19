# Project Instructions — MTG FIN Tracker V2

PWA for tracking a Magic: The Gathering *Final Fantasy* (FIN) set binder. Local-first; optional GitHub Gist sync.

## Tech Stack

| Layer | Tech |
|---|---|
| Build | Vite 6 (ESM, `@` → `src`) |
| UI | React 19 + TypeScript 5.7 (strict, verbatimModuleSyntax) |
| Styling | Tailwind CSS v4 (CSS-first via `@tailwindcss/vite`) + shadcn tokens |
| Primitives | Radix UI + `class-variance-authority` + `tailwind-merge` |
| Motion | framer-motion |
| State | Zustand 5 (persist, `fin2-*` localStorage keys) |
| Server state | TanStack Query 5 |
| Validation | Zod 4 (`src/lib/schemas.ts` is source of truth) |
| OCR | tesseract.js + OCR.space |
| PWA | vite-plugin-pwa (autoUpdate, Workbox runtime caching) |
| Tests | Vitest + jsdom (unit), Playwright (E2E) |
| Icons | lucide-react |
| Deploy | Cloudflare Pages (`dist`, `public/_headers`) |

## Commands

- Dev: `npm run dev` (port 5173)
- Typecheck: `npm run typecheck`
- Build: `npm run build` (runs `tsc -b` then `vite build`)
- Preview: `npm run preview`
- Unit tests: `npm test` (Vitest)
- E2E: `npm run test:e2e` (Playwright)
- PWA icons: `npm run pwa-assets`

## Code Style

- TS `strict` + `noUnusedLocals` + `noUnusedParameters` — no dead imports/args.
- `verbatimModuleSyntax` on — `import type` for type-only imports.
- No `any`; use `unknown` + narrow. Zod schemas define runtime + inferred types.
- Immutable updates only in Zustand setters (spread, never mutate).
- Path alias: `@/...` → `src/...`.
- Components: function declarations, named exports (not default), PascalCase files in `components/`.
- Hooks prefixed `use*` in `src/hooks/`.
- Utility helpers live in `src/lib/` — pure, no React.
- Tailwind v4: class utilities only; tokens in `src/styles/globals.css`.
- `cn()` helper (`src/lib/utils.ts`) for class merging via `clsx` + `tailwind-merge`.
- No `console.log` in committed code.

## Project Structure

```
src/
  lib/          pure helpers — scryfall, foil, binder, fx, gist, ocr, schemas, utils
  store/        zustand stores — collection, config, theme, sync, toast
  hooks/        TanStack Query + side-effect hooks — useCards, useFx, useAutoSync
  components/
    ui/         Radix + cva primitives (shadcn style "new-york", base "zinc")
    tabs/       six tab views — Dashboard, Portfolio, Timeline, Binder, Collector, Settings
    modals/     CardModal, PackModal, SearchModal, InspectOverlay
  styles/       globals.css (Tailwind v4 + shadcn tokens)
  App.tsx       tab router + modal orchestration
  main.tsx      React root + QueryClientProvider
public/         static assets, PWA icons, `_headers`
tests/          unit (Vitest) + E2E (Playwright) — currently empty scaffold
```

## Data Model Notes

- Storage keys prefixed `fin2-*` (v1 used `fin-*`, no auto-migration).
- Collection is `owned: string[]` of collector numbers — duplicates = multiples owned.
- Timeline events: `add | remove | pack`.
- Foil variants stored separately as `Record<cn, string[]>`.
- Sync payload validated through `SyncPayload` Zod schema before push/pull.

## External APIs

- Scryfall API + images — SW caches (StaleWhileRevalidate / CacheFirst).
- `open.er-api.com` — FX rates (NetworkFirst, 12h).
- GitHub Gist — optional sync, PAT with `gist` scope, file name `fin-binder-data.json`.
- OCR.space — fallback OCR engine.

## Conventions

- Commits: Conventional (`feat:`, `fix:`, `chore:`, `refactor:`, `docs:`, `test:`, `perf:`, `ci:`). Subject allows em-dashes for detail. No attribution footer.
- Branch: work on `main` (small repo, solo-style history).
- Tests: AAA pattern, 80% target. Vitest `setupFiles` expects `./tests/unit/setup.ts` — create before adding jsdom tests.

## Where to Look

| Task | Location |
|---|---|
| Add/modify card fields | `src/lib/schemas.ts` → update consumers |
| Add UI primitive | `src/components/ui/` (shadcn pattern) |
| Add a tab | `src/components/tabs/`, wire in `App.tsx` + `TabNav` |
| Add a modal | `src/components/modals/`, wire in `App.tsx` |
| Change PWA caching | `vite.config.ts` → `VitePWA.workbox.runtimeCaching` |
| Change binder layout rules | `src/lib/binder.ts` + `BinderWizard.tsx` |
| Add store | `src/store/`, use `persist` with `fin2-<name>` key |
| Change deploy headers | `public/_headers` |
