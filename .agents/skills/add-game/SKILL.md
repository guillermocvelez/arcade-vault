---
name: add-game
description: Designs the spec to add a real, playable game to Arcade Vault, wired to its leaderboard. Detects whether the game comes from references/started-games/ or is written from scratch, maps it against the Supabase games catalog, and produces a spec ready for /spec-impl. Use it before writing any code for a new game.
disable-model-invocation: true
argument-hint: "reference folder (e.g. 03-tetris) or game name"
allowed-tools: Bash(ls:*), Bash(cat:*), Bash(test:*), Bash(git branch:*)
---

# /add-game — Real-game spec designer

Arcade Vault already has two pieces of infrastructure that any new playable game must plug into:

- The **real-game pattern** (`specs/05-asteroids-rocas.md`): a TypeScript engine in `app/games/<id>/engine.ts` wrapped by a thin Vue component in `app/components/games/<Name>Game.vue`, driven by `app/pages/juego/[id]/jugar.vue`.
- The **catalog + leaderboard** (`specs/06-juegos-y-leaderboard.md`): Supabase tables `games`/`scores`, the `game_stats` view, and Nitro endpoints already generic — `server/api/games.get.ts`, `scores.get.ts`, `scores.post.ts`, plus `useGames`/`useScores`.

**You don't write code here.** Your job is to figure out what a _specific_ new game needs on top of that pattern, ask the questions that only a human can answer, and produce `specs/NN-<slug>.md` ready for `/spec-impl`. Read `engine-contract.md` (in this same directory) before Phase 2 — it has the full technical contract with real code quoted from the reference implementation. Read the `/spec` skill (`.agents/skills/spec/SKILL.md`) before Phase 4 — this skill borrows its question-asking discipline (blocks of 3–5, concrete options with a recommendation) and its section-by-section, confirm-before-continuing discipline for writing the spec; Phases 4 and 5 below follow that same method applied to a game spec. Read `spec-template.md` (in this same directory) before Phase 5 — it is the spec skeleton, already adapted to this project's game-spec shape, that you fill in section by section.

Your replies must be in the same language as the initial prompt. This project's specs (02 through 06) are written in Spanish — if the user writes in Spanish, the generated spec must be in Spanish too, following that convention (`**Estado:**`, `**Depende de:**`, `**Fecha:**`, `**Objetivo:**`).

## Session context

References available:
!`ls references/started-games/ 2>/dev/null || echo "no reference folders found"`

Specs already written:
!`ls specs/ 2>/dev/null`

Existing game engines:
!`ls app/games/ 2>/dev/null || echo "app/games/ does not exist yet"`

Existing game components:
!`ls app/components/games/ 2>/dev/null || echo "app/components/games/ does not exist yet"`

Registry status:
!`test -f app/games/registry.ts && echo "registry: YES" || echo "registry: NO — the one-time refactor (Phase 2 of engine-contract.md) must be Step 0 of the generated plan"`

---

## Instructions

Follow these six phases in strict order. **Do not advance to the next phase if the previous one did not complete correctly.**

### Phase 1 — Resolve the source

The received argument is: `$ARGUMENTS`

- If it matches a folder under `references/started-games/` (full name, number, or slug — same fuzzy matching `/spec-impl` uses for spec files), that is the source. Read its `game.js`, `index.html`, `style.css` (if present), `README.md`, and `CLAUDE.md` in full.
- If it names a game that is not a reference folder, treat it as a **from-scratch** game: there is no source code to port, only a description the user will give you in Phase 4.
- If `$ARGUMENTS` is empty, show the available reference folders (from the session context above) and ask: is this a port of one of these, or a game built from scratch? Stop and wait for the answer.

Once resolved, state explicitly which mode you're in (port vs. from-scratch) before continuing — the rest of the flow depends on it.

### Phase 2 — Load the platform contract

Read `engine-contract.md` end to end. It documents, with real code:

- The exact `AsteroidsEngine` public API and lifecycle rules any new engine must follow.
- JS→TS porting rules (no `document`/`window` globals baked into module scope, listeners bound in `start()`/`stop()`, `dt` clamped to 0.05, no native restart-on-key).
- The Vue wrapper shape (~40 lines, zero props, two emits, `defineExpose`).
- The registry pattern and how `jugar.vue` consumes it.
- The CSS contract for the canvas stage inside `.crt-screen`, including the 4:3 letterbox issue.
- The migration shape for a `games` row and a `scores` seed batch.

If you are in **port** mode, compare the reference `game.js` against this contract and note every friction point: global HUD in the DOM, a second canvas, non-4:3 resolution, mouse input, external assets (sprites/audio), any in-canvas pause/restart/menu that collides with the Vue modal. These become Phase 4 questions — do not silently decide them yourself.

### Phase 3 — Check the catalog

Query the Supabase `games` table (via the `mcp__supabase__execute_sql` tool if available — `select id, title, cat, cover, color, sort_order from games order by sort_order;` — otherwise fall back to `GET /api/games` or ask the user to confirm the current 8 rows) to see whether this game already has a catalog entry.

**Known mapping today:** `caida` (PUZZLE, `cover-tetro`) is the slot for a Tetris-style game; `bloque-buster` (ARCADE, `cover-bricks`) is the slot for a Breakout/Arkanoid-style game. Both already exist in the catalog with a valid `sort_order`.

- If the game **already has a row**: reuse it as-is. **Do not** propose an `INSERT` into `games` and **do not** propose a new `cover-*` CSS class — the implementation plan skips straight to the engine/component/registry steps.
- If it does **not** have a row: you'll need to collect `id`, `title`, `short`, `long`, `cat` (one of `ARCADE`/`PUZZLE`/`SHOOTER`/`VERSUS`), `cover` (a new CSS class name), `color` (one of `cyan`/`magenta`/`green`/`yellow`), and the next `sort_order` (current max + 1) in Phase 4.

Also check current `scores` row counts for context (`select game_id, count(*) from scores group by game_id;`) — if the target game's leaderboard is empty or near-empty, the generated plan needs a seed step so the leaderboard doesn't launch blank.

### Phase 4 — Clarify through questions

Before asking anything, read `.agents/skills/spec/SKILL.md` (the `/spec` skill) if you haven't yet this session — its Phase 2 (question discipline) and Phase 3 (section-by-section spec writing) are what Phases 4 and 5 here are modeled on.

Ask in blocks of 3–5, concrete, with 2–4 options and a recommendation, same tone as `/spec`. Wait for an answer before continuing to the next block. Cover, as they apply:

1. **Catalog metadata** — only if Phase 3 found no existing row: `id`/`title`/`short`/`long`/`cat`/`cover`/`color`. Skip entirely if the row already exists.
2. **Logical resolution and CRT fit** — what is the original `W`×`H`? `.crt-screen` is locked to `aspect-ratio: 4/3`. If the game isn't 4:3 (e.g. a vertical board), the canvas must letterbox inside the stage rather than stretch — confirm this is acceptable, or whether the board should be redesigned to fill 4:3.
3. **Snapshot shape** — what does the engine expose beyond `score`? `lives`? `level`? Any extra stat (lines cleared, speed level, active power-up) that needs its own HUD tile?
4. **DOM-based HUD** — if the original renders score/lines/level as DOM text instead of drawing them on canvas, does that move into the snapshot (rendered by the Vue stat-strip, recommended) or get redrawn on canvas?
5. **Secondary canvas** — if the original has a second canvas (e.g. a "next piece" preview), where does it live: a second canvas inside `.game-stage`, drawn into a corner of the main canvas, or dropped?
6. **Input model** — keyboard (`e.code`), mouse relative to the canvas with CSS-scale correction, or both? Which keys need `preventDefault` so the page doesn't scroll?
7. **External assets** — sprites or audio files: port them into `public/games/<id>/` and wire them up, or drop sound/sprites for this pass (the asteroids port dropped nothing extra since it had no assets; arkanoid-style ports do)?
8. **What gets removed from the original** — any native pause menu, restart-on-key, in-canvas level-select buttons, or theme toggle. These collide with the existing Vue modal and PAUSA/FIN/SALIR buttons and must be explicitly disabled, same as asteroids dropped "ESPACIO PARA REINICIAR".
9. **Scope** — what's explicitly out for this spec (extra levels, multiplayer, touch controls, sound).

Stop asking once you can state: the engine's public surface (snapshot shape), every point of friction from Phase 2 and how each is resolved, the catalog metadata (or confirmation it's reused), and what's out of scope.

### Phase 5 — Build the spec section by section

Using `spec-template.md` as the skeleton, produce the spec **one section at a time**, showing each to the user and waiting for confirmation before the next, same discipline as `/spec`:

1. Header (state = Borrador/Draft, depends on 05 + 06, date, one-sentence objective).
2. Scope (In / Out of scope).
3. Data model (the `EngineSnapshot`/engine class shape for this game; the `games` row if new).
4. Implementation plan — start from the pre-written skeleton in `spec-template.md` (Step 0 refactor only if the registry doesn't exist yet, port engine, snapshot wiring, Vue wrapper, registry entry, catalog migration only if needed, scores seed, final integration test) and adapt it to this game's specifics from Phase 4.
5. Acceptance criteria — adapt the pre-written checklist from `spec-template.md` (derived from spec 05's acceptance criteria) to this game.
6. Decisions (every Phase 4 answer becomes one **Sí**/**No** entry with its reason).
7. Risks — only if non-obvious ones exist for this game (e.g. the letterbox change, an asset licensing question, a non-4:3 board).

### Phase 6 — Save

1. Next sequential number from `specs/` (see session context above).
2. Slug from the objective; confirm the filename with the user before writing.
3. Write `specs/NN-slug.md`, state `Borrador`/`Draft`.
4. Confirm to the user: path written, reminder that it's a draft, next step is `/spec-impl NN-slug` once approved.
5. **Stop here.** Do not propose implementing it yourself.

---

## Hard rules

- **Never write code during this skill.** Only the spec `.md` file at the end.
- **Never propose implementing the spec after saving it.** That's `/spec-impl`'s job.
- **Never invent catalog metadata.** Query `games` before proposing an `id`, `cover`, or `sort_order`.
- **Never duplicate a `games` row** that already covers the target game — check Phase 3 before asking metadata questions.
- **If `app/games/registry.ts` does not exist**, the generated implementation plan must include the one-time registry refactor (see `engine-contract.md`) as Step 0, before the game-specific steps.
- **Never assume a porting decision** (HUD placement, secondary canvas, input model, assets) the user didn't confirm — these are exactly the questions Phase 4 exists to ask.

## Tone when asking questions

Direct and specific, same as `/spec`. No "if you don't mind" hedging — the user invoked this skill because they want to be asked. Number the questions.

## Arguments

If invoked as `/add-game 03-tetris`, resolve `03-tetris` against `references/started-games/` in Phase 1. If invoked as `/add-game <some-name>` that isn't a reference folder, treat it as the working title of a from-scratch game and confirm in Phase 1. If invoked with no arguments, ask in Phase 1.
