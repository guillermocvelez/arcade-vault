# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Arcade Vault is a platform for playing games online and competing for the highest score ("Es una plataforma para jugar online y competir por la mayor cantidad de puntos"), built on **Nuxt 4**. The catalog, leaderboard ("Salón de la Fama"), contact form, and auth are real and backed by Supabase; a subset of the catalog's games have real, playable engines, and the rest are still a mock player UI (see "Real-game engines" below).

Key app structure:

- `app/pages/` — see "Routes" below.
- `app/components/` — `AppNav.vue`, `GameCard.vue`, `MiniCard.vue`, icon components, and `app/components/games/*Game.vue` (one Vue wrapper per real engine; auto-imported via `nuxt.config.ts`'s `pathPrefix: false`).
- `app/games/` — the real-engine layer: `types.ts` (the shared `GameEngine`/`EngineSnapshot` contract), `registry.ts` (id → async component map), and one `app/games/<id>/engine.ts` per real game.
- `app/composables/` — `useAuth.ts`, `useGames.ts`, `useScores.ts`, `useReveal.ts` (scroll-reveal animation helper).
- `server/api/` — `games.get.ts`, `scores.get.ts`, `scores.post.ts` (writes with the Supabase service-role key, bypassing RLS), `contact.post.ts` (sends via Resend).
- `server/plugins/supabase-check.ts` — startup sanity check for Supabase env vars.

Required env vars (see `.env.example`): `RESEND_API_KEY`, `RESEND_TO_EMAIL`, `SUPABASE_URL`, `SUPABASE_KEY` (public anon key), `SUPABASE_SERVICE_ROLE_KEY` (server-only, used by `scores.post.ts`).

## Routes

Pages (file-based routing under `app/pages/`):

| Route               | File                   | Purpose                                                                |
| ------------------- | ---------------------- | ---------------------------------------------------------------------- |
| `/`                 | `index.vue`            | Home                                                                   |
| `/games`            | `games.vue`            | Catalog / "Biblioteca" see references/implemented_games.md when needed |
| `/juego/[id]`       | `juego/[id]/index.vue` | Game detail + per-game leaderboard                                     |
| `/juego/[id]/jugar` | `juego/[id]/jugar.vue` | The player — real engine (via `app/games/registry.ts`) or mock arena   |
| `/salon-de-la-fama` | `salon-de-la-fama.vue` | Global leaderboard, filterable per game                                |
| `/auth`             | `auth.vue`             | Login (Supabase auth)                                                  |
| `/acerca-de`        | `acerca-de.vue`        | About page                                                             |

API (Nitro server routes under `server/api/`):

| Route               | File              | Purpose                                                                |
| ------------------- | ----------------- | ---------------------------------------------------------------------- |
| `GET /api/games`    | `games.get.ts`    | Catalog data from Supabase `games` table                               |
| `GET /api/scores`   | `scores.get.ts`   | Leaderboard rows from Supabase `scores` table                          |
| `POST /api/scores`  | `scores.post.ts`  | Save a score, writes with the Supabase service-role key (bypasses RLS) |
| `POST /api/contact` | `contact.post.ts` | Sends the contact form via Resend                                      |

## Real-game engines

A handful of catalog entries have a real, from-scratch or ported game engine instead of the mock player arena. The contract every engine follows is documented in `.agents/skills/add-game/engine-contract.md` (symlinked at `.claude/skills/add-game/engine-contract.md`) — read it before touching any engine or adding a new one. Shape, in short: `app/games/<id>/engine.ts` implements `GameEngine` from `app/games/types.ts` (`start/stop/pause/resume/restart/getSnapshot/onSnapshot`, canvas passed via constructor, no module-scope globals, listeners bound in `start()`/removed in `stop()`), wrapped by a ~40-line `app/components/games/<Name>Game.vue`, registered as one line in `app/games/registry.ts`. `app/pages/juego/[id]/jugar.vue` looks the route's `id` up in that registry and falls back to the mock arena if it's not there.

Currently real: `rocas` (Asteroids, spec 05), `caida` (Tetris, spec 07), `bloque-buster` (Arkanoid, spec 08), `serpentina` (Snake, spec 09). Still mock: `gloton`, `invasores`, `ranaria`, `duelo-pixel`.

## Commands

Package manager is npm (`package-lock.json` is present).

- `npm run dev` — start the Nuxt dev server
- `npm run build` — production build
- `npm run generate` — static site generation
- `npm run preview` — preview a production build locally
- `npm run lint` / `npm run lint:fix` — ESLint
- `npm run format` — Prettier
- `postinstall` runs `nuxt prepare` automatically after `npm install`

There is no test tooling configured in this repo yet (no Vitest config present). Don't assume `npm run test` exists unless you add it.

## skills

Always use /frontend-design for user interface related workloads.

Use `/add-game` (`.claude/skills/add-game`) before writing code for a new playable game — it designs the spec that wires a ported or from-scratch game into the `app/games/<id>/engine.ts` + `app/components/games/<Name>Game.vue` pattern (see "Real-game engines" above, established by spec 05) and the real Supabase catalog/leaderboard (spec 06), then hands off to `/spec-impl`.

## agents

The `game-planner` subagent (`.claude/agents/game-planner.md`) decides _which_ game comes next: it weighs 3–5 candidates against a fit rubric (catalog slot, portable source, `GameEngine` contract fit, leaderboard-compatible scoring, category diversity, retro/CRT aesthetic, cost/risk) and records every verdict in `references/game-suggestions.md` so it never re-proposes something already built or rejected. It writes no code and no specs. Full chain: `game-planner` (what) → `/add-game` (spec) → `/spec-impl` (implementation).

The `game-jam` subagent (`.claude/agents/game-jam.md`) is the unsupervised alternative to `/add-game`: give it a **theme** and it invents one original from-scratch game and writes its two full specs — `specs/game-jam/<game-id>/01-motor.md` (engine + Vue component + registry) and `02-plataforma.md` (`games` row + `cover-*` class + `scores` seed + leaderboard) — in the exact format of `specs/07-tetris-caida.md` / `specs/08-arkanoid-bloque-buster.md`. Unlike `/add-game` it never asks questions (every choice lands in each spec's Decisiones section) and it invents the catalog metadata itself. Its specs live isolated under `specs/game-jam/` and do **not** consume the global `NN-` sequence. It implements nothing; next step is `/spec-impl` on each file.

## Playwright MCP

The local `playwright` MCP server is configured with `--output-dir .playwright-screenshots`, so all screenshots, snapshots, and console/network dumps it produces land in `.playwright-screenshots/` at the repo root (gitignored). If that server is ever re-added, keep the `--output-dir` flag pointing there.

## Spec-driven development workflow

This project follows a Spec Driven Design workflow using the `/spec` and `/spec-impl` slash commands, based on practices from https://github.com/Klerith/fernando-skills. Those skills are installed via:

```bash
npx skills@latest add Klerith/fernando-skills
```

When implementing non-trivial features, prefer working through `/spec` (to define the spec) and `/spec-impl` (to implement it) rather than jumping straight to ad-hoc implementation.
