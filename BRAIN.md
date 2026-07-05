# BRAIN.md

## What this app does
build me a pacman game but make the pacman a booty cheek

## Current state
## Verification Fix Pass 2/2 — Complete

The `_document` module-not-found error was caused by the stale `.next` cache. The previous fix inlined `rm -rf .next` into the build script, but that runs AFTER npm starts `next build`. By using npm's native `prebuild` hook, the cache is cleaned BEFORE Next.js starts, eliminating the stale `_document` reference.

**Files changed:**
- `package.json` — Split `rm -rf .next` into a `prebuild` hook (runs automatically before `build`)
- `tsconfig.json` — Removed redundant `.next/types/**/*.ts` from exclude (already covered by `.next`)
- `BRAIN.md` — Updated with fix documentation

## Tech stack and why
- Next.js 14.2.5 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- Lucide React (icons)

## What has been built
- .gitignore
- PROJECT_STATE.json
- README.md
- app/globals.css
- app/layout.tsx
- app/page.tsx
- components/booty-pacman-game.tsx
- components/ui/bento-grid.tsx
- components/ui/button.tsx
- components/ui/card.tsx
- components/ui/shimmer-button.tsx
- lib/utils.ts
- next-env.d.ts
- next.config.mjs
- package.json
- postcss.config.mjs
- tailwind.config.ts
- tsconfig.json

## Latest verification
- [FIXED] Build error: `_document` module not found — resolved by using npm `prebuild` hook to clean `.next` cache before Next.js starts

## What's still pending
- Vercel deployment (platform configuration needed)
- Sound effects when sound toggle is enabled
- High score persistence with localStorage

## User preferences detected
- Keep changes focused, modern, and production-ready.
- Minimal surgical edits only — never rewrite working code.

## Run notes
- Last updated: 2026-07-05T00:54:40.683Z
- Autonomous iteration: 0
