# Spec template for `/add-game`

Companion to `SKILL.md`. This is the skeleton `/add-game` fills in section by section in Phase 5. It follows the same shape as `.agents/skills/spec/template.md`, adapted with the invariant parts of the real-game pattern already written in — the skill adapts them to the specific game instead of inventing them from scratch each time. Specs in this project (02 through 06) are written in Spanish; the section names below are given in Spanish to match, with the English meaning noted in parentheses the first time.

---

## Header

```markdown
# SPEC NN — <Título corto, ej. "Tetris real para el juego CAÍDA">

> **Estado:** Borrador
> **Depende de:** `05-asteroids-rocas.md`, `06-juegos-y-leaderboard.md`
> **Fecha:** <YYYY-MM-DD>
> **Objetivo:** Una sola frase.
```

## Scope (Alcance)

Always split **In** / **Out of scope**, same as every other spec in this repo.

**In** always includes, adapted to the specific game:

- El motor portado a `app/games/<id>/engine.ts`, fiel al `game.js` de referencia (si aplica) salvo por lo listado en Decisions.
- El componente `app/components/games/<Juego>Game.vue`.
- La entrada en `app/games/registry.ts` (o su creación, si es el primer juego real después de ROCAS).
- Los ajustes de `jugar.vue` estrictamente necesarios (normalmente ninguno más allá de que el registry ya lo resuelva).
- Si el juego no está aún en el catálogo: la fila en `games` + su clase `cover-*`.
- El seed de puntuaciones de ejemplo si el leaderboard de ese juego está vacío.

**Out of scope** always includes, unless the user explicitly asked for it:

- Los demás juegos que sigan con el Reproductor mock — sin cambios.
- Sonido/controles táctiles/multijugador, salvo que el juego de referencia los tenga y el usuario haya pedido explícitamente portarlos.
- Cualquier UI de administración del catálogo (sigue fuera de alcance desde spec 06).
- Autenticación real / vincular scores a un usuario (sigue fuera de alcance desde spec 06).

## Data model (Modelo de datos)

Always include the engine's public surface (adapt from `engine-contract.md` §1 and, if this is the first game after ROCAS, §3's generalized `EngineSnapshot`/`GameEngine`):

```ts
// app/games/<id>/engine.ts
export interface EngineSnapshot { score: number; lives: number; level: number; phase: Phase; extras?: Array<{label:string;value:string}> }
export class <Nombre>Engine implements GameEngine { /* ver engine-contract.md */ }
```

If the game is new to the catalog, include the exact `games` row shape (columns, not just prose) — see `engine-contract.md` §7.

If this spec is the one introducing the registry refactor, include the `app/games/types.ts` shapes from `engine-contract.md` §3 here too.

## Implementation plan (Plan de implementación)

Pre-written skeleton — the skill adapts step contents to the specific game, adds/removes steps per the Phase 4 answers, but keeps this ordering and the "leaves the system functional" rule from `spec/template.md`:

```markdown
## Implementation plan

0. _(Sólo si `app/games/registry.ts` no existe todavía)_ Refactor único: crear `app/games/types.ts`
   (`Phase`, `EngineSnapshot` generalizado con `extras`, interfaz `GameEngine`), migrar
   `AsteroidsEngine` para implementarla (moviendo `tripleShot` a `extras`), crear
   `app/games/registry.ts`, y actualizar `app/pages/juego/[id]/jugar.vue` para resolver el
   componente vía `GAME_ENGINES[id]` en vez de `isRealGame`/`<AsteroidsGame>` hardcodeado.
   Prueba: `/juego/rocas/jugar` se sigue viendo y comportando idéntico.
1. Portar el motor a `app/games/<id>/engine.ts` (clase por clase si hay una referencia en
   `references/started-games/`, siguiendo las reglas de `engine-contract.md` §2). Prueba:
   `npm run build` compila sin errores de tipos.
2. Agregar el mecanismo de snapshot (`onSnapshot`, invocado 1× por frame dentro del loop,
   incluso en pausa). Prueba: sigue compilando.
3. Crear `app/components/games/<Juego>Game.vue` (canvas, montaje/desmontaje del motor,
   `defineExpose({ pause, resume, restart })`, emits `snapshot`/`gameover`). Prueba manual
   directa en el paso 4.
4. Registrar el juego: una línea en `app/games/registry.ts`. Prueba: `npm run dev`, navegar
   a `/juego/<id>/jugar`, confirmar que aparece el canvas real (no el mock).
5. _(Sólo si el juego no estaba en el catálogo)_ Migración Supabase: `insert` en `games`
   (con `sort_order` único) + clase `.cover-<slug>` en `main.css`. Prueba: `GET /api/games`
   incluye la fila nueva.
6. Seed de puntuaciones de ejemplo para `<id>` si el leaderboard está vacío. Prueba:
   `/juego/<id>` muestra el leaderboard con filas.
7. Prueba de integración final: jugar una partida completa hasta el estado terminal,
   confirmar que el stat-strip Vue y el HUD del canvas coinciden en todo momento, que
   PAUSA/REANUDAR detienen y retoman la física real, que el modal de fin de partida
   aparece exactamente una vez y guarda el puntaje, que JUGAR DE NUEVO inicia una partida
   real, que salir de la página detiene el loop sin dejar listeners activos, y que los
   demás juegos (mock u otros motores reales) no cambiaron.
```

## Acceptance criteria (Criterios de aceptación)

Pre-written checklist, adapted from `specs/05-asteroids-rocas.md` and `engine-contract.md` §8 — trim what doesn't apply (e.g. no secondary canvas → drop that line), keep the rest boolean and verifiable:

```markdown
## Acceptance criteria

- [ ] `npm run dev` y `npm run build` funcionan sin errores, con `app/games/<id>/engine.ts`
      tipado sin `any` implícitos.
- [ ] Navegar a `/juego/<id>/jugar` muestra el canvas del juego real dentro del marco CRT,
      escalado sin distorsión en cualquier ancho de viewport (incluido mobile).
- [ ] Los controles del juego funcionan sin scrollear la página.
- [ ] El puntaje/vidas/nivel (y cualquier stat extra) mostrados en el stat-strip Vue
      coinciden en todo momento con los del HUD dentro del canvas.
- [ ] PAUSA detiene la física/input real (no un contador falso) y REANUDAR continúa sin
      salto de física.
- [ ] Al llegar al estado terminal aparece el modal Vue de fin de partida exactamente una
      vez, con el puntaje real; el reinicio nativo del original (si lo tenía) queda
      desactivado.
- [ ] Guardar la puntuación persiste una fila real en Supabase y se refleja en
      `/juego/<id>` y en `/salon-de-la-fama` tras recargar.
- [ ] JUGAR DE NUEVO inicia una partida real nueva y jugable.
- [ ] Salir de `/juego/<id>/jugar` detiene el loop y remueve los listeners (sin errores de
      consola ni el loop corriendo en segundo plano).
- [ ] Navegar a `/juego/[id]/jugar` de cualquier otro juego sigue mostrando exactamente lo
      mismo que antes (mock u otro motor real).
```

## Decisions (Decisiones)

One entry per Phase-4 answer, **Sí**/**No** format with a one-line reason, same as every other spec. Always include:

- Whether the registry refactor was needed (and why, if this is/isn't the first real game after ROCAS).
- The letterbox-vs-stretch call for non-4:3 boards, if relevant.
- Whether external assets (sprites/audio) were ported or dropped, and why.
- Whether the catalog row was reused or newly created.

## Risks (Riesgos)

Only if non-obvious ones apply to this game — omit the section otherwise, same rule as `spec/template.md`. Worth checking:

- Does the letterbox CSS change (if this is the registry-refactor spec) risk changing ROCAS's appearance?
- Any porting risk from translating a globals-heavy reference script (no classes, DOM-based HUD) into the class-based engine contract.
- Anything about the seeded example scores that could read as real data later (same risk spec 06 already flagged, worth re-stating if this spec adds more seed rows).
