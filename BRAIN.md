# BRAIN.md

## What this app does
build me a pacman game but make the pacman a booty cheek

## Current state
## Verification Fix Pass 2/2 — Complete

**The fix** — The `_document` page not found error was caused by the `rm -rf .next &&` being inlined into the `build` script. Next.js 14.2.5 needs the `.next` directory to exist during the build for its internal page resolution. Reverting to a separate `prebuild` script (which runs before `build` in npm lifecycle) ensures the cache is cleaned before the build starts, but `.next` exists during the build itself.

**Files changed:**
- `package.json` — `build` script restored to just `next build`, with `prebuild` script `rm -rf .next` handling the cleanup separately
- `BRAIN.md` — Updated with this documentation

**Build status**: ✅ `npm run build` passes cleanly — compiled successfully, types valid, all static pages generated.

## Tech stack and why
- Next.js 14.2.5 (App Router) — modern React framework
- TypeScript — type safety
- Tailwind CSS — styling
- Canvas API — game rendering

## What has been built
- Full Booty Pacman game with maze, ghosts, power pellets
- Landing page with Play Now / Sound toggle
- Canvas-based rendering with booty-cheek player character
- Score, lives, level display
- Win/loss states with restart

## Latest verification
- ✅ `npm run build` — passes cleanly (Compiled successfully, all pages generated)
- ✅ TypeScript check — passes
- ✅ Canvas game renders correctly

## What's still pending
- Vercel deploy: Reconnect Vercel integration in Settings → Integrations → Vercel → Reconnect
- Sound effects when sound toggle is enabled
- High score persistence with localStorage
- Mobile touch controls

## User preferences detected
- Keep changes focused, modern, and production-ready.
- Minimal surgical edits only — never rewrite working code.

## Run notes
- Last updated: 2026-07-05T00:55:00.000Z
- Autonomous iteration: 0
