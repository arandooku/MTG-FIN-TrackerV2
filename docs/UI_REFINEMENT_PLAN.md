# UI Refinement — Mythic Obsidian, Responsive Editorial

Source of truth for current refinement pass. Agents read this before editing.

## 1. Direction — Keep + Sharpen

Direction already chosen: **editorial luxury / mythic obsidian** (aurora dark, gold + crystal accents, Cinzel display, Inter body, glass-raised surfaces, ornate dividers, gold floating search dock).

Do **not** restyle. Refine for:

- **Mobile (360–480)** — no spillover, tap targets ≥44px, content clears 96px nav safe-area, no cramped lines.
- **Tablet (640–1023)** — comfortable 2-column split where it helps.
- **Desktop (1024+)** — asymmetric editorial grid. Hero left, stats+lists right. Wider binder grid. Max content width 1200.

Guard rails:

- Cinzel uppercase labels with `letter-spacing: 0.25em`+ must truncate or wrap gracefully.
- Numeric hero text must fluid-scale so `$1,234,567.89` never overflows a 320w tile.
- No hard-coded `maxWidth: 480` on desktop chrome.

## 2. Foundation — CSS tokens + utilities

**Add to `src/styles/globals.css` (not skin.css)**:

```css
:root{
  /* Fluid type scale */
  --fs-hero-xxl: clamp(2.25rem, 6.5vw, 4rem);  /* 36–64 */
  --fs-hero-xl:  clamp(1.75rem, 5vw, 2.75rem); /* 28–44 */
  --fs-hero-lg:  clamp(1.25rem, 3.5vw, 1.75rem);/* 20–28 */
  --fs-body-lg:  clamp(0.95rem, 1.6vw, 1.05rem);
  --fs-body:     clamp(0.85rem, 1.2vw, 0.95rem);
  --fs-label:    clamp(0.625rem, 0.9vw, 0.75rem);

  /* Spacing rhythm */
  --gap-1: 6px; --gap-2: 10px; --gap-3: 16px; --gap-4: 24px; --gap-5: 36px;

  /* Layout */
  --content-max: 1200px;
  --nav-clearance: calc(96px + env(safe-area-inset-bottom, 0));
}
```

- New `.app-content` rule: `padding-bottom: var(--nav-clearance); max-width: var(--content-max); margin-inline: auto; display:flex; flex-direction:column; gap: var(--gap-3); min-width:0;`
- `.mo-numeric-hero` → `font-size: var(--fs-hero-xxl); line-height: 1; font-variant-numeric: tabular-nums;`
- `.mo-numeric-lg`    → `font-size: var(--fs-hero-xl);`
- `.mo-numeric-md`    → `font-size: var(--fs-hero-lg);`
- `.mo-section-label` → `font-size: var(--fs-label); letter-spacing: 0.22em; text-transform: uppercase;` (drop 0.3em — less spill).
- `.text-truncate` new util + apply `min-width:0` on flex children that hold truncate text.

**Breakpoint utilities (name-spaced, avoid Tailwind conflict)**:

```css
.stack-md { display: grid; grid-template-columns: 1fr; gap: var(--gap-3); }
@media (min-width: 768px){
  .stack-md.cols-2 { grid-template-columns: 1fr 1fr; }
  .stack-md.hero-right { grid-template-columns: minmax(0, 1.1fr) minmax(0, 0.9fr); }
}
@media (min-width: 1024px){
  .desktop-wide { grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr); gap: var(--gap-4); }
}
```

**BottomNav tweak** (in `BottomNav.tsx` inline style):

- Mobile: keep pill, width `min(calc(100% - 32px), 520px)`.
- Desktop (≥1024): `maxWidth: 640`, padding `10px 8px`, bigger icons (24), 11/10 label.
- Do NOT add side rail (already explicitly disabled — keep center dock).

## 3. Mockups

### 3.1 Dashboard

**Mobile 360w**

```
┌──────────────────────────────┐
│ ⚙                         ☰ │  ← FAB top-right (settings)
│                              │
│ FIN COMPLETION       [FIN]   │  label .22em
│   42%           128 / 305    │  hero clamp()
│ ████████░░░░░░░░░░░░░░        │
│ ⚪ W 40%  U 38%  B 22%  R 55% │  mana pips wrap row
│                              │
│ ── gold hairline ──          │
│ ┌──────────┐ ┌──────────┐    │  stat tiles 2-col
│ │Unique 128│ │Copies 260│    │
│ └──────────┘ └──────────┘    │
│ ┌──────────┐ ┌──────────┐    │
│ │Packs  12 │ │Apex $42  │    │
│ └──────────┘ └──────────┘    │
│                              │
│ Portfolio · USD       +2.1%  │
│   $1,284.90             7D   │
│                              │
│ [Binder][Collector][Scan]    │
│                              │
│ ▾ Show Details               │
│                              │
│        ( bottom nav fixed )  │
└──────────────────────────────┘
```

**Desktop 1440w**

```
┌───────────────────────────────────────────────────────────────┐
│                                        ⚙ (top-right fab)     │
│  ┌─────────────────────────────┬─────────────────────────┐    │
│  │ FIN COMPLETION              │ ┌───────┐ ┌───────┐     │    │
│  │   42%        128 / 305      │ │Unique │ │Copies │     │    │
│  │ ████████░░░░░░░              │ └───────┘ └───────┘     │    │
│  │ W U B R G pip row            │ ┌───────┐ ┌───────┐     │    │
│  │                             │ │Packs  │ │Apex   │     │    │
│  │ Portfolio · USD   +2.1% 7D  │ └───────┘ └───────┘     │    │
│  │  $1,284.90                  │                          │    │
│  │  [Binder][Collector][Scan]  │  Rarity Breakdown bars   │    │
│  └─────────────────────────────┴─────────────────────────┘    │
│                                                               │
│  ── gold hairline ──                                          │
│  ┌──── Top Valued ────┐ ┌──── Recently Added ────┐            │
│  │ 1 thumb  name  $   │ │  thumb thumb thumb thumb │            │
│  │ 2 thumb  name  $   │ └────────────────────────────┘         │
│  │ 3 thumb  name  $   │ ┌──── Activity Pulse ─────┐             │
│  │ 4 thumb  name  $   │ │ + Added Cloud Strife... │             │
│  │ 5 thumb  name  $   │ │ ✦ Pulled Sephiroth...   │             │
│  └────────────────────┘ └────────────────────────────┘         │
│                                                               │
│           (  center dock bottom nav 560w  )                   │
└───────────────────────────────────────────────────────────────┘
```

### 3.2 Binder

**Mobile**: unchanged 3×3 (binder.gridCols) with clamped binder-name + footer.
**Desktop**: binder panel `max-width: 960`, slot size grows; header+footer strip stretched; search+filters become a top-right row aligned beside title. Owned counter font clamp(12,1.1vw,16).

### 3.3 Market

**Mobile**

```
┌──────────────────────────────┐
│ PORTFOLIO          [USD ⇆]   │
│   $1,284.90        +2.1%     │
│   ◠◡◠◡◠◡ spark                │
│ ── gold hr ──                │
│ Owned 128  Foils 14  Foil $  │
│ [Movers][Top FIN][Watchlist] │
│ ┌──────────────────────────┐ │
│ │ thumb  Name        $10.5 │ │
│ │        FIN·#042·rare ↑✦$ │ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

**Desktop**: left col = Portfolio hero + sparkline + foil cells; right col = table scroll area w/ sticky tab chips. `minmax(0, 1fr)` columns — no fixed widths.

### 3.4 Collector / Scan / Timeline / Settings

- Collector: mirror Binder layout.
- Scan: camera viewport centered `max-width: 560` on desktop; controls row grows.
- Timeline: list rows full-width with left rail date column (≥768 only).
- Settings: at ≥768 switch to 2-col `stack-md cols-2` (Theme+Currency left; Binder+Sync right).

### 3.5 Modals

- **CardModal**: ≥1024 side-by-side — image left (clamp 320–480), meta right; chips wrap. Mobile stays vertical. All labels use `--fs-label`; name uses `--fs-hero-lg`.
- **SearchModal**: ≥768 expand sheet `max-width: 720`, results as 4-col grid; mobile stays full-width list.
- **InspectOverlay**: no change beyond clamp on caption text.

### 3.6 BottomNav

- Mobile: current pill. Keep layout `repeat(3,1fr) 64px repeat(3,1fr)`.
- ≥1024: same pill but `max-width: 600; padding: 10px 10px;` icon 24, label .18em 11px. Floating FAB raised -18px.

## 4. Work split — 4 parallel agents

| Agent | Scope | Files |
|---|---|---|
| **A — Foundation** | Add tokens + utility classes + clearance; refactor `.mo-*`, `.app-content`, `.app-bottomnav` dims | `src/styles/globals.css`, `src/styles/skin.css`, `src/components/shell/BottomNav.tsx` |
| **B — Dashboard + Market** | Responsive grids, hero clamp, desktop 2-col, fix wrapping/overflow | `src/components/tabs/Dashboard.tsx`, `src/components/tabs/Market.tsx` |
| **C — Binder + Collector + Scan** | Desktop widened panel, responsive search/filter row, clamp headers | `src/components/tabs/Binder.tsx`, `src/components/tabs/Collector.tsx`, `src/components/tabs/Scan.tsx` |
| **D — Modals + More + Timeline + Settings** | CardModal side-by-side desktop, SearchModal grid, Settings 2-col ≥768 | `src/components/modals/CardModal.tsx`, `src/components/modals/SearchModal.tsx`, `src/components/tabs/Settings.tsx`, `src/components/tabs/More.tsx`, `src/components/tabs/Timeline.tsx` |

## 5. Rules for all agents

1. **Do not** change the design direction, color palette, or typography stack. Refine only.
2. **Preserve** existing class names that skin.css targets — only add/tweak.
3. **Every overflow-prone text** gets `min-width:0` parent + `truncate` or `text-wrap: balance`.
4. **Fluid type** via `clamp()` for anything hero/numeric. No raw `fontSize: 14` for big display numbers.
5. **No new deps**.
6. **`tsc -b` must pass**. Strict mode. Immutable patterns only. No `any`.
7. **Keep motion** identical or tighten — do not add new framer motion.
8. Agent A finishes first in principle; B/C/D can read the new tokens regardless — they must use `clamp()`/`var(--fs-*)` even if tokens land later.

## 6. Verification

After all agents:

1. `npm run typecheck` green.
2. Playwright snapshot at 360, 768, 1440 — no text spill, nav clears, modals center.
3. Smoke-run dev at `/` and spot hover/focus states + theme toggle.
