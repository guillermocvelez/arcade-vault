# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Arcade Vault is a platform for playing games online and competing for the highest score ("Es una plataforma para jugar online y competir por la mayor cantidad de puntos"). It is currently a freshly-scaffolded **Nuxt 4** application — the only app code so far is the default `app/app.vue` entry point, so there is no established feature architecture yet to preserve. When adding features, follow standard Nuxt 4 directory conventions (`app/pages`, `app/components`, `app/composables`, `app/layouts`, `server/` for Nitro API routes, etc.) since none of these directories exist yet.

## Commands

Package manager is npm (`package-lock.json` is present).

- `npm run dev` — start the Nuxt dev server
- `npm run build` — production build
- `npm run generate` — static site generation
- `npm run preview` — preview a production build locally
- `postinstall` runs `nuxt prepare` automatically after `npm install`

There is no lint or test tooling configured in this repo yet (no ESLint/Vitest config present). Don't assume `npm run lint` or `npm run test` exist unless you add them.

## skills
Always use /frontend-design for user interface related workloads

## Playwright MCP

The local `playwright` MCP server is configured with `--output-dir .playwright-screenshots`, so all screenshots, snapshots, and console/network dumps it produces land in `.playwright-screenshots/` at the repo root (gitignored). If that server is ever re-added, keep the `--output-dir` flag pointing there.

## Spec-driven development workflow

This project follows a Spec Driven Design workflow using the `/spec` and `/spec-impl` slash commands, based on practices from https://github.com/Klerith/fernando-skills. Those skills are installed via:

```bash
npx skills@latest add Klerith/fernando-skills
```

When implementing non-trivial features, prefer working through `/spec` (to define the spec) and `/spec-impl` (to implement it) rather than jumping straight to ad-hoc implementation.
