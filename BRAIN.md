# BRAIN.md

## What this app does
build me a pacman game but make the pacman a booty cheek

## Current state
Build verified — `npm run build` exits 0 cleanly. The `prebuild` script that ran `rm -rf .next` was removed because it caused Next.js 14.2.5 to fail with `PageNotFoundError: Cannot find module for page: /_document` during the "Collecting page data" phase. The `.next` directory needs to exist during the build for Next's internal page resolution.

## Tech stack and why
- Next.js 14.2.5 (App Router) — modern React framework
- TypeScript — type safety
- Tailwind CSS — styling
- Canvas API — game rendering

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
- [✓] Build passes: `npm run build` exits 0 cleanly
- [✓] No prebuild script deleting .next

## What's still pending
- Deploy to Vercel (requires valid Vercel token)

## User preferences detected
- Keep changes focused, modern, and production-ready.
- Minimal surgical edits only — never rewrite working code.

## Run notes
- Last updated: 2026-07-05T01:00:00.000Z
- Autonomous iteration: 0
