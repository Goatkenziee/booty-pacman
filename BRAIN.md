# BRAIN.md

## What this app does
A cheeky Pac-Man game where Pac-Man is a booty cheek — built with Next.js 14, TypeScript, and Canvas API

## Tech stack
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Canvas API for game rendering

## What has been built
- Landing page with game intro, play button, sound toggle
- Full Pac-Man game with:
  - Booty cheek character (two pink cheeks with crease)
  - 4 ghosts with chase AI and frightened mode
  - Dots, power pellets, score, lives, levels
  - Win/lose states with replay
- UI components: ShimmerButton, Button, Card, BentoGrid

## Latest verification
- [FIXED] tsconfig.json: Added `.next/types/**/*.ts` to exclude list to prevent stale .next type errors
- [FIXED] Stale `.next` build cache causing `/_document` not found error — cleared by rebuild

## What's still pending
- Deploy to Vercel

## User preferences
- Keep changes focused, modern, and cheeky
