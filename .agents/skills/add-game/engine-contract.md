# Real-game platform contract

Reference implementation for everything below: `app/games/asteroids/engine.ts`, `app/components/games/AsteroidsGame.vue`, and `app/pages/juego/[id]/jugar.vue`, built by `specs/05-asteroids-rocas.md`. Read those three files before writing a new spec — this document explains the contract they establish, not a copy to paste blindly.

## 1. The engine's public API

```ts
export type Phase = "playing" | "dead" | "gameover";

export interface EngineSnapshot {
  score: number;
  lives: number;
  level: number;
  tripleShot: number; // asteroids-specific — see "Generalizing the snapshot" below
  phase: Phase;
}

export class AsteroidsEngine {
  constructor(canvas: HTMLCanvasElement); // getContext("2d"); throws if null
  start(): void; // idempotent; binds window keydown/keyup; calls initGame(); starts rAF
  stop(): void; // cancels rAF; unbinds listeners
  pause(): void; // sets a flag; loop keeps running (draw + snapshot still fire every frame)
  resume(): void; // clears the flag; resets lastTime so dt doesn't jump
  restart(): void; // re-runs the init routine, keeps running
  getSnapshot(): EngineSnapshot;
  onSnapshot(cb: (s: EngineSnapshot) => void): void; // single callback, invoked once per frame

  // touch layer — see §9. Added by specs/10-controles-tactiles-movil.md
  readonly touchControls: TouchControl[]; // static per engine; [] if the game has no touch UI
  pressControl(id: string): void; // unknown id = silent no-op
  releaseControl(id: string): void; // unknown id = silent no-op
}
```

| Method               | Contract                                                                                                                                                                                                                                                                                              | What breaks if you skip it                                                                                                                                                                                    |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `constructor`        | Only stores the 2D context. Does not start the loop. Throws (not returns null) if `getContext("2d")` fails.                                                                                                                                                                                           | Silent black canvas with no error, hard to debug.                                                                                                                                                             |
| `start()`            | Guards re-entry (`if (this.running) return`). Adds listeners, calls the init routine, kicks off `requestAnimationFrame`.                                                                                                                                                                              | Calling it twice (e.g. HMR, double-mount) double-registers listeners.                                                                                                                                         |
| `stop()`             | Cancels the rAF handle and removes the _same_ listener references added in `start()`.                                                                                                                                                                                                                 | Listeners leak across route navigation — keyboard input from a game keeps firing on other pages. This is the #1 risk called out in spec 05.                                                                   |
| `pause()`            | Only sets a flag. The rAF loop keeps calling `draw()` and the snapshot callback every frame — it just skips `update()`.                                                                                                                                                                               | If you cancel rAF on pause instead, the pause overlay drawn by the _page_ still shows, but the in-canvas frame freezes mid-motion instead of a clean stop; more importantly `resume()` has nothing to resume. |
| `resume()`           | Must null out the timestamp used to compute `dt` (`lastTime = null`) before the next frame.                                                                                                                                                                                                           | Skipping this produces one giant `dt` on resume — the physics jumps (asteroid teleports, ball skips through a wall).                                                                                          |
| `restart()`          | Clears the terminal phase and re-runs full init — not a partial reset.                                                                                                                                                                                                                                | Leftover entities (bullets, particles, blocks) from the previous run bleed into the new one.                                                                                                                  |
| `onSnapshot(cb)`     | Stores one callback, invoked at the end of every frame inside the loop, **including while paused**.                                                                                                                                                                                                   | If snapshot only fires on state changes, the pause overlay's stat-strip (score/lives/level) goes stale while paused.                                                                                          |
| `touchControls`      | Static readonly array of `TouchControl` descriptors (`{ id, label, kind, side }`). `[]` if the game exposes no touch UI. See §9.                                                                                                                                                                      | The shared `TouchControls.vue` renders nothing / the wrong buttons on touch devices.                                                                                                                          |
| `pressControl(id)`   | Routes to the engine's **existing** input state (the same `keys[]` / `justPressed[]` / `pendingDirection` the keyboard writes). `kind:"tap"` fires the discrete action once; `kind:"hold"` marks the input active. Unknown `id` = silent no-op. Respects `paused` / `phase` exactly like `onKeyDown`. | A second, parallel input path that desyncs from the keyboard; or touch input that ignores pause.                                                                                                              |
| `releaseControl(id)` | Clears the held input for `kind:"hold"` (equivalent to `keyup`); no-op for `kind:"tap"`. Unknown `id` = silent no-op. Must clear even while paused so a control can't get stuck.                                                                                                                      | A `hold` control stays active after the finger lifts — ship/paddle drifts forever.                                                                                                                            |

## 2. JS → TS porting rules

The reference games in `references/started-games/` are plain browser scripts: globals, `document.getElementById`, module-level `window.addEventListener`. None of that survives the port as-is.

- **No globals baked into module scope.** The canvas arrives through the constructor, not `document.getElementById(...)` at the top of the file. If the original reads `document.getElementById('next-canvas')` for a second canvas, that element reference must also come from the constructor or a setter — never queried from module scope.
- **Listeners live inside `start()`/`stop()`**, never at module load. Bind them as `readonly` arrow-function class properties (`private readonly onKeyDown = (e: KeyboardEvent) => {...}`) so the _same_ function reference can be passed to both `addEventListener` and `removeEventListener`.
- **No `'use strict'` pragma** — TS modules are strict by default.
- **`dt` is computed once, in the loop, and clamped**: `Math.min((ts - lastTime) / 1000, 0.05)`. This caps the worst-case simulation step (e.g. after a tab was backgrounded) so entities can't tunnel through walls or skip multiple collisions in one frame.
- **No `any`, implicit or explicit.** Type every entity class's fields; use a discriminated union or numeric enum for anything the original expressed as a loose string/number.
- **Disable any native "press X to restart" on game over.** The Vue modal (`jugar.vue`'s `over` state + `handleSave`) owns the save/restart flow. Leaving the native restart active lets the player skip past the score-save modal entirely. Also drop any subtitle text like "ESPACIO PARA REINICIAR" that referenced it.
- **Disable any native in-canvas pause menu** the original might have (arkanoid draws pause/level-select buttons inside the canvas and hit-tests clicks against them) — the platform's PAUSA/REANUDAR button and `pause()`/`resume()` replace it.
- **Mouse input**, if the original game uses it (arkanoid's paddle), must correct for CSS scaling: the canvas backing resolution (e.g. 800×600) is not the same as its rendered CSS size once `.game-canvas` scales to fit `.crt-screen`. Use `canvas.getBoundingClientRect()` and scale the pointer coordinates by `canvas.width / rect.width` (and same for height), exactly like the original arkanoid reference does with `scaleX`.
- **Touch input** is never a listener inside the engine — the engine only exposes `touchControls` + `pressControl`/`releaseControl` and the shared `TouchControls.vue` owns every `pointer*` event. See §9.

## 3. Generalizing the snapshot (the one-time refactor)

`EngineSnapshot.tripleShot` is asteroids-specific, and `jugar.vue` renders it with a hardcoded `v-if="isRealGame && tripleShot > 0"` tile. That doesn't generalize to a second game with a different extra stat (lines cleared, combo multiplier, current piece). **The first spec generated by this skill must include, as Step 0, a one-time refactor** (skip it if `app/games/registry.ts` already exists — a later game reuses the refactored shape):

```ts
// app/games/types.ts
export type Phase = "playing" | "dead" | "gameover";

export interface EngineSnapshot {
  score: number;
  lives: number;
  level: number;
  phase: Phase;
  extras?: Array<{ label: string; value: string }>; // e.g. [{label:"3x", value:"4.2s"}]
}

export interface GameEngine {
  start(): void;
  stop(): void;
  pause(): void;
  resume(): void;
  restart(): void;
  getSnapshot(): EngineSnapshot;
  onSnapshot(cb: (s: EngineSnapshot) => void): void;
}
```

- `AsteroidsEngine` moves its `tripleShot` field into `extras: [{ label: "3x", value: \`${tripleShot.toFixed(1)}s\` }]`(only when`> 0`, otherwise `undefined`/empty).
- `jugar.vue`'s hardcoded triple-shot tile becomes a `v-for="e in extras"` block rendering generic `hud-stat` tiles.
- Every new engine implements `GameEngine` from `app/games/types.ts` instead of hand-rolling its own snapshot shape.

## 4. The Vue wrapper (~40 lines)

```vue
<script setup lang="ts">
import { SomeEngine, type EngineSnapshot } from "~/games/<id>/engine";

const emit = defineEmits<{
  snapshot: [s: EngineSnapshot];
  gameover: [score: number];
}>();

const canvasEl = ref<HTMLCanvasElement | null>(null);
let engine: SomeEngine | null = null;
let prevPhase: EngineSnapshot["phase"] | null = null;

onMounted(() => {
  if (!canvasEl.value) return;
  engine = new SomeEngine(canvasEl.value);
  engine.onSnapshot((s) => {
    emit("snapshot", s);
    if (s.phase === "gameover" && prevPhase !== "gameover") emit("gameover", s.score);
    prevPhase = s.phase;
  });
  engine.start();
});

onUnmounted(() => {
  engine?.stop();
  engine = null;
});

const pause = () => engine?.pause();
const resume = () => engine?.resume();
const restart = () => engine?.restart();

defineExpose({ pause, resume, restart });
</script>

<template>
  <div class="game-stage">
    <canvas ref="canvasEl" :width="W" :height="H" class="game-canvas"></canvas>
  </div>
</template>
```

Rules that matter:

- **Zero props.** All state flows out via the two emits.
- **`engine` is a plain `let`, never a `ref`.** Wrapping a live game engine in Vue reactivity deep-proxies every entity on every frame — a serious performance foot-gun. Same for `prevPhase`.
- **`gameover` is edge-detected**, not fired every frame the phase happens to be `"gameover"` — the `prevPhase !== "gameover"` guard fires it exactly once per run, which is what lets `jugar.vue` flip `over.value = true` without re-triggering.
- Component lives in `app/components/games/`, which `nuxt.config.ts` already auto-imports with `pathPrefix: false` — no explicit import needed in `jugar.vue`, just reference `<NameGame>` (or, after the registry refactor, look it up through the registry).
- If the game needs a second canvas (e.g. a "next piece" preview), it lives inside the same `.game-stage` div as a second `<canvas>`, sized and positioned with its own small CSS block — it is not a separate component.

## 5. The registry

Once `app/games/registry.ts` exists (created once, by whichever spec is first to need a second real game):

```ts
// app/games/registry.ts
import { defineAsyncComponent, type Component } from "vue";

export const GAME_ENGINES: Record<string, Component> = {
  rocas: defineAsyncComponent(() => import("~/components/games/AsteroidsGame.vue")),
  // add one line per new game:
  // caida: defineAsyncComponent(() => import("~/components/games/TetrisGame.vue")),
};
```

`jugar.vue` looks the current route's `id` up in this map instead of hardcoding `id === "rocas"`:

```ts
const realGame = computed(() => GAME_ENGINES[id] ?? null);
```

```vue
<component
  :is="realGame"
  v-if="realGame"
  ref="gameRef"
  @snapshot="onSnapshot"
  @gameover="onGameOver"
/>
<div v-else class="game-arena"><!-- mock arena, unchanged --></div>
```

Adding a game after the refactor exists is **one line** in this file — nothing else in `jugar.vue` changes.

## 6. CSS contract

```css
/* app/assets/css/main.css — inside .crt-screen */
.game-stage {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #000;
}
.game-canvas {
  display: block;
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
}
```

**Why `max-width/max-height` + `auto`, not `width:100%; height:100%`:** `.crt-screen` is locked to `aspect-ratio: 4/3`. Asteroids' canvas is 800×600 — exactly 4:3 — so stretching to 100%/100% happened to look correct. A vertical board (e.g. a Tetris-style 300×600 board, aspect 1:2) would visibly stretch if scaled the same way. The letterbox rule above scales any resolution to fit inside the 4:3 frame without distortion, centered by the flexbox on `.game-stage`. **When this rule is introduced (as part of the one-time refactor), re-check ROCAS visually — it must look identical, since 800×600 already fits the frame exactly.**

If the game is **new to the catalog** (Phase 3 of the skill found no existing row), it also needs a `.cover-<slug>` class following the existing pattern (`main.css`, look at `.cover-rocas` or `.cover-bricks` for the shape: a `.cover-bg` base the row already applies, then `::after`/`::before` pseudo-elements built from CSS gradients — no image assets). If the game reuses an existing catalog row, its `cover` class already exists — do not add a new one.

## 7. Supabase migration shape

Only needed if Phase 3 of the skill found no existing catalog row for this game.

```sql
-- New games row. sort_order must be unique and is (current max + 1).
insert into public.games (id, title, short, long, cat, cover, color, sort_order) values
('<id>', '<TITLE>', '<one-line short description>', '<longer description>', '<ARCADE|PUZZLE|SHOOTER|VERSUS>', 'cover-<slug>', '<cyan|magenta|green|yellow>', <next_sort_order>);
```

Seed scores so the leaderboard doesn't launch empty — reuse the alias pool and shape already used for the other games (12 rows, explicit ISO timestamps so ordering by `created_at` is stable, no two aliases in the same game colliding):

```sql
insert into public.scores (game_id, name, score, created_at) values
('<id>', 'VECTORX', <score>, '<iso-timestamp>'),
('<id>', 'NEONFOX', <score>, '<iso-timestamp>'),
-- ... 10 more rows, descending or varied scores, one per distinct alias
;
```

Apply via the Supabase MCP `apply_migration` tool — there is no local `supabase/migrations/` folder in this repo; every prior migration (`create_games_and_scores`, `fix_game_stats_view_security_invoker`, `add_games_sort_order`) was applied directly to the remote project this way.

**Sanity check before writing the migration step into the spec:** query `select game_id, count(*) from scores group by game_id;` — as of this writing the table has essentially no seeded rows left (only 1 row total, for `rocas`) even though earlier migrations inserted them. If the target game already has a catalog row but no scores, the plan still needs a seed step even though it skips the `games` insert.

## 8. Verification checklist for the generated spec's acceptance criteria

Adapt from `specs/05-asteroids-rocas.md`'s criteria, which already cover the invariants this contract exists to protect:

- `npm run build` and `npm run dev` succeed, engine has no implicit `any`.
- The canvas renders inside the CRT frame, correctly proportioned (not stretched) at any viewport width including mobile.
- Every input the game needs works, with `preventDefault` only on the game's own keys (page doesn't scroll).
- The Vue stat-strip (score/lives/level/extras) numerically matches whatever the canvas itself draws, at all times.
- PAUSA actually halts the simulation (not just a cosmetic overlay) and REANUDAR continues without a `dt` jump.
- Reaching the terminal state triggers the existing Vue game-over modal exactly once; native restart-on-key is disabled.
- Saving a score round-trips through `POST /api/scores` → visible on `/juego/<id>` and `/salon-de-la-fama` after reload.
- "JUGAR DE NUEVO" starts a real new run, not just a visual counter reset.
- Leaving the page (SALIR or navigation) stops the loop and removes all listeners — no console errors, no background loop.
- Every other existing game (mock arena or other real engines) is visually and behaviorally unchanged.

## 9. Touch layer (`touchControls` / `pressControl` / `releaseControl`)

Added by `specs/10-controles-tactiles-movil.md`. Makes the real engines playable on a touch screen without a keyboard, via a **generic Vue layer** — one shared `app/components/games/TouchControls.vue`, not per-game hit-testing inside the canvas.

```ts
// app/games/types.ts
export interface TouchControl {
  id: string; // stable kebab-case id, e.g. "girar-izq" — tested, don't rename casually
  label: string; // one system-font Unicode glyph to paint on the button: ◀ ▶ ▲ ▼ ⟳ ⤓ ●
  kind: "hold" | "tap"; // hold = press+release maintained; tap = single discrete pulse
  side: "left" | "right"; // which end of the `.tc-bar` (left / right thumb) it groups into
}
```

Rules an engine must follow:

- **`touchControls` is a static `readonly` array.** One descriptor per button the game needs. Empty array if the game has no touch UI (the mock games don't implement this — only the real engines do).
- **Route to the input state that already exists.** `pressControl` writes the _same_ `keys[]` / `justPressed[]` / `pendingDirection` / flag that `onKeyDown` writes — never a second parallel map that could desync from the keyboard. Keyboard stays 100% functional in parallel; touch is additive.
- **No new listeners in the engine.** Every `pointerdown` / `pointerup` / `pointercancel` lives in `TouchControls.vue`. The engine exposes methods, not event handlers.
- **`kind: "tap"`** → `pressControl(id)` performs the discrete action once (same as the engine's existing keydown branch — `tryMove`, `tryRotate`, `hardDrop`, set `pendingDirection`, set `justPressed`). `releaseControl(id)` is a no-op.
- **`kind: "hold"`** → `pressControl(id)` marks the input active (`keys[code] = true`, mirroring `onKeyDown` including the `justPressed` edge if the engine uses one); `releaseControl(id)` clears it (`keys[code] = false`). The engine already consumes that state in `update()`. If the engine has no held-input concept for that action (Tetris soft-drop relied on OS key-repeat), add a minimal boolean flag consumed in `update()` and reset it in the init routine and `stop()`.
- **`pressControl` respects `paused` / `phase`** exactly like `onKeyDown` (reuse the same guard). `releaseControl` must run even while paused / after game over, so a `hold` can't get stuck.
- **Unknown `id` = silent no-op** in both methods.

Concrete descriptors as implemented:

| Engine          | Controls (`id` · `kind` · `side`)                                                       |
| --------------- | --------------------------------------------------------------------------------------- |
| `rocas`         | `girar-izq` ◀ hold L · `girar-der` ▶ hold L · `propulsar` ▲ hold R · `disparar` ● tap R |
| `caida`         | `izq` ◀ tap L · `der` ▶ tap L · `bajar` ▼ hold L · `rotar` ⟳ tap R · `soltar` ⤓ tap R   |
| `bloque-buster` | `izq` ◀ hold L · `der` ▶ hold R                                                         |
| `serpentina`    | `arriba` ▲ tap R · `abajo` ▼ tap R · `izq` ◀ tap L · `der` ▶ tap L                      |

Vue side: the wrapper does **not** render `<TouchControls>` itself — it widens its `defineExpose` with `touchControls()`, `pressControl(id)`, `releaseControl(id)` (thin pass-throughs to the `engine`). `jugar.vue` renders one `<TouchControls v-if="coarse && isRealGame && gameRef" :controls="gameRef.touchControls()" @press="gameRef?.pressControl($event)" @release="gameRef?.releaseControl($event)" />` in a `.tc-bar` **below the `.crt`** (not overlaying the canvas — it fights the 4:3 lock and covers playfield corners), where `coarse` comes from `useCoarsePointer()` (`matchMedia("(pointer: coarse)")`). Desktop (fine pointer) mounts nothing, and `@media (pointer: fine) and (hover: hover)` also hides `.tc-bar`. `.game-stage` and `.tc-btn` carry `touch-action: none`; `.crt` / `.av-player` / `.tc-bar` do not, so the page still scrolls normally.
