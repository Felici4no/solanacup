# Terrace

**The official history records the match. We record what happened to the person.**

Terrace is a premium, editorial product for preserving personal memories tied to
official sports events. It is *not* a scores app, fantasy game, betting product,
social feed, or NFT marketplace — it's closer to Letterboxd, Apple Journal and
Kinfolk. A match is the shared cultural event; the memory is the relationship
between a person, a match, a place, other people, a moment in life, and a meaning.

> The match belongs to history. The memory belongs to you.

## Stack

- **Vite + React 18 + TypeScript** (no CSS framework — a bespoke editorial design system)
- **Vitest** for unit tests
- Fully self-contained visuals: match identity is generated from team colors,
  crests and national-flag geometry — no external/stock imagery.

## Getting started

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # unit tests (rating math)
npm run build      # type-check + production build
```

## What's inside

- **Match Cover system** — every match has a distinct, collectible visual identity
  (team colors, crests for clubs, flags for national teams, competition tags,
  stadium-night atmosphere) with graceful fallbacks and future photo/3D slots.
- **Home** — "Today's Chapter" hero with temporal states (pre-match → live →
  full-time → no-match), the one-tap "I'm Watching" memory ritual, Coming Up
  watchlist rail, On This Day, and a Community Moment.
- **Radar** — editorial discovery of stories, not rankings.
- **Search** — image-led recognition (covers, crests, players, stadiums).
- **Profile** — a visual autobiography: Hall of Memories poster grid, a printable
  featured-memory artifact, players, stadiums and a timeline.
- **Watchlist** — "upcoming chapters," a curated personal program.
- **Match Detail** — community-first (`STORY / MOMENTS / MATCH`): personal
  connection, ratings, community pulse, a moments timeline and anchored comments;
  official data is context, not the centre.
- **StarRange** — a draggable half-star rating (pointer + keyboard + screen
  reader) used for both match ratings and personal moment impact, with the
  community average hidden until you rate.
- **Inline complete-memory editor** — progressive disclosure on the Match Detail
  screen; no routes, no wizard. Saves into a preserved editorial artifact.

## Design principles

Dark-first but never pure black; warm neutral surfaces with contextual ambient
light; editorial serif titles over a modern grotesk; one warm brass accent for
interaction; strict 8pt grid; restrained Apple-like motion; accessible contrast,
44px targets, and `prefers-reduced-motion` support throughout.

## Public demo (Vercel)

The app deploys as a static SPA — `npm run build`, output `dist/`, framework
auto-detected (Vite). `vercel.json` rewrites every path to `index.html`, so deep
links reload correctly.

Public routes:

- `/welcome` — landing: explore the demo without sign-up (no login, no fake auth;
  a session is only a locally-persisted visitor id).
- `/u/demo` — the shareable public profile (public data only; simulated social
  content is identified once with a `Demo profile` / demo-data tag).
- `/chapters/:chapterId` — one preserved chapter, with the official broadcast
  moment at its timestamp. `/chapters/ch-eng-arg-85` is seeded and works in any
  browser; visitor-created chapters live in the browser that made them
  (localStorage only — no database by design).

Environment variables — all optional, none secret:

| Variable | Purpose |
|---|---|
| `VITE_LIVE_API` | Public URL of the GAM3BOOK backend (TxLINE live panel). Omit for the static demo. |

`VITE_*` values are baked into the client bundle and are always public —
never put keys, tokens or other secrets in them.

## Screenshots

High-resolution captures of every screen and state live in [`screenshots/`](screenshots).

> Note: `Terrace` is a placeholder wordmark (see `BRAND` in `src/data.ts`).
