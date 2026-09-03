# Bitácora móvil — Arcade Vault

Memoria persistente del agente `mobile-porter`. Estado del soporte de navegador móvil por área.
Estados: `pendiente` · `spec-escrito` · `implementado`.
Alcance: solo navegador móvil (sin PWA ni app nativa).
Ejes: layout · táctil · canvas · chrome del navegador · orientación · entrada/accesibilidad.

| Área / ruta                                                                                      | Ejes con hallazgo                                                               | Ejes con spec                                    | Estado       | Notas                                                                                                                                                                                                                                                                                        |
| ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------- | ------------------------------------------------ | ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Baseline transversal (breakpoints, altura, safe-area, meta viewport, tap-target, reduced-motion) | layout · táctil · chrome · entrada/accesibilidad                                | layout · táctil · chrome · entrada/accesibilidad | spec-escrito | `specs/mobile/00-baseline-movil.md`. Refactor Paso 0: 8 breakpoints → 2 (`640` / `900`) + `(pointer: coarse)`; `--app-vh`/`--app-svh`; `viewport-fit=cover` + `theme-color` en `nuxt.config.ts`; `--tap-min: 44px`; `@media (prefers-reduced-motion)` global; `overscroll-behavior-y: none`. |
| Player — `/juego/[id]/jugar` (marco CRT + canvas + HUD + carcasa táctil + a11y)                  | layout · táctil · canvas · chrome · orientación · entrada/accesibilidad (los 6) | los 6                                            | spec-escrito | `specs/mobile/player.md`. Depende de `00-baseline-movil.md`. HUD y carcasa táctil van en el mismo spec: comparten el presupuesto vertical y la rejilla de horizontal.                                                                                                                        |

## Detalle

### 2026-09-03 — Auditoría del player (`/juego/[id]/jugar`) + baseline transversal

Corrida enfocada en el player: `app/pages/juego/[id]/jugar.vue`, los 4 engines reales
(`app/games/{asteroids,caida,bloque-buster,serpentina}/engine.ts`) y sus wrappers, la carcasa
táctil (`app/components/games/TouchControls.vue` + `.tc-shell`/`.tc-dpad`/`.tc-key`/`.tc-round`
en `main.css`), y el CSS del player (`.crt`, `.crt-screen`, `.game-stage`, `.game-canvas`,
`.hud-*`, el `@media (pointer: coarse), (max-width: 720px)` de `main.css:1809` y el único
`100vh` del repo en `main.css:1925`).

**Desincronización `spec 10` vs código (riesgo registrado, no se edita `specs/10-*`):**

- `spec 10` describe una `.tc-bar` (fila flex con clusters `left`/`right`). El código ya
  no tiene eso: un commit posterior (`29fe888` "Controles táctiles estilo Game Boy") lo
  reemplazó por `.tc-shell` (carcasa) con cruceta `.tc-dpad` (`grid-template-areas`) +
  `.tc-hub` inerte y botones de acción `.tc-round` en diagonal A/B (`.tc-pos-0`/`.tc-pos-1`).
- El tipo `TouchControl` en `app/games/types.ts` ganó `shape: "dpad" | "round"` y
  `dir?: "up"|"down"|"left"|"right"` respecto al de `spec 10`. `engine-contract.md` §9 ya
  refleja el estado nuevo; `spec 10` no.
- Toda la auditoría y los specs se apoyan en el **código**, no en el texto de `spec 10`.

**Hallazgos por severidad:**

`rompe`

- Orientación: cero reglas `landscape`/`portrait` en todo `main.css`. En horizontal de
  teléfono (p. ej. 740×360) el `.crt` a ancho completo hace que `.crt-screen` (4/3) sea más
  alto que el viewport y la `.tc-shell` (que fluye **debajo** del `.crt`) queda entera fuera
  de pantalla → el juego es injugable con el canvas visible.
- Táctil: `.hud-actions .btn` en el bloque compacto (`padding: 9px 11px; font-size: 10px`)
  mide ~30–32 px de alto (< 44). PAUSA / FIN / SALIR quedan por debajo del mínimo.
- Canvas: `caida` (buffer 300×600, 1:2) dentro del marco fijo `aspect-ratio: 4/3` se
  letterboxea a una franja de ~100–140 px de ancho en viewports de 320–430 px → celdas de
  ~10–14 px. En 320 px es casi injugable.

`incómodo`

- Layout: `.player-hud` (5 tiles + 3 botones + selector de skin) sigue haciendo wrap a
  3–4 filas en 320–360 px pese al `@media` compacto. El wrapper usa `style="display:flex;
gap:24px"` inline y el CSS lo pisa con `!important` (frágil).
- Layout/chrome: el player no usa `vh`/`dvh` en ningún sitio; la altura es puramente
  intrínseca (la manda `aspect-ratio`), así que nada limita el `.crt` al viewport visible y
  el stack nav+HUD+CRT+carcasa+footer se desborda en pantallas cortas.
- Layout: modal de fin de juego — `.input-row` (input + botón "GUARDAR PUNTUACIÓN" en flex)
  queda apretado < 360 px; `.toast-saved` tiene `width: 22ch` fijo + `white-space: nowrap` y
  puede desbordar `.modal` horizontalmente en 320 px.
- Táctil: `.tc-key` (brazos de la cruceta) `clamp(34px, 10vw, 46px)` → 34–36 px en
  320–360 px (< 44).
- Táctil: botones `.btn` del modal (JUGAR DE NUEVO / VOLVER / GUARDAR / REINTENTAR) sin
  `min-height` → ~34 px.
- Táctil/entrada: `:hover` en `.btn` y `.skin-seg-btn` se queda "pegado" tras un tap;
  falta `touch-action: manipulation` en `.btn` → retardo de 300 ms y doble-tap-zoom sobre
  PAUSA/FIN/SALIR.
- Canvas: con `.tc-shell` en flujo normal debajo del `.crt`, en vertical el stack completo
  excede el viewport → canvas y carcasa no se ven a la vez sin scroll (spec 10 aceptó
  "scroll mínimo"; sigue siendo hallazgo).
- Chrome: `.tc-shell` ya trae `env(safe-area-inset-bottom)` en su `padding` pero está
  **inerte** porque falta `viewport-fit=cover` (`app.head` en `nuxt.config.ts` solo define
  `title` y `htmlAttrs`, Nuxt usa su viewport por defecto).
- Chrome: `.modal-bd` (`position: fixed; inset: 0; padding: 20px`) puede chocar con el notch
  / indicador de inicio; sin insets de safe-area.
- Chrome: sin `overscroll-behavior` → pull-to-refresh puede dispararse desde el HUD/márgenes
  por encima del `.crt` (`.game-stage` sí tiene `touch-action: none`, el resto no).
- Accesibilidad: `TouchControls.vue` tiene `aria-hidden="true"` en la raíz `.tc-shell` → toda
  la botonera interactiva queda fuera del árbol de accesibilidad.
- Accesibilidad: los `<button>` de `.tc-key`/`.tc-round` solo contienen un glifo Unicode
  (`◀ ▲ ⟳ ●`) como nombre accesible; sin `aria-label`.
- Entrada: `prefers-reduced-motion` no se respeta en ningún sitio. En el player: `.fade-in`
  de `.av-player`, animaciones del `.game-arena` mock (`gridscroll`/`bob`/`drift`),
  `typewriter`/`caret` de `.toast-saved`, `spinpix` del `.spinner`. El loop rAF del engine
  es **juego, no decoración** — no debe detenerse.

`cosmético`

- `.caida-preview` (`18%` / `max 120px`, absoluto arriba-derecha) mide ~45–55 px en móvil —
  legible pero mínimo; con el marco portrait propuesto para Tetris hay que reubicarlo al
  gutter lateral.
- `bloque-buster`: `onMouseMove` usa `getBoundingClientRect()` + `scaleX` (correcto para el
  escalado CSS) pero es `mousemove`, no `pointermove` → no dispara en táctil (se cubre con
  los botones izq/der; el drag quedó fuera de alcance en spec 10).
- Accesibilidad: sin `:focus-visible` en `.tc-key`/`.tc-round` (solo `:active`).
- Layout: `.crt-screen::after` (scanlines `repeating-linear-gradient` de período 2px) puede
  dar moiré en HiDPI; estático, sin animación.

**Decisión de escalado de canvas (eje canvas / Fase 2 punto 5): solo CSS, sin
`devicePixelRatio`.**

- En viewports de teléfono los buffers fijos (800×600, 640×480, 300×600) son ≥ que el tamaño
  CSS mostrado a dpr 2–3 → hay downscaling, no upscaling: la nitidez ya es aceptable. El
  caso que arregla `devicePixelRatio` (buffer < display) solo aparece en pantallas grandes de
  escritorio, fuera del alcance móvil.
- Riesgo si se hace más adelante: añadir `dpr` + `ResizeObserver` al contrato `GameEngine`
  toca `types.ts` + los 4 engines (todos dibujan con constantes de módulo `W`/`H`) + los 4
  wrappers + `engine-contract.md` §9 a la vez. Mitigación futura: `dpr` con default no-op para
  migrar engine por engine.

**Riesgo — selector `:has()`:** `player.md` propone `.crt:has(.caida-preview) .crt-screen {
aspect-ratio: 3/4 }` para dar a Tetris un marco vertical sin meter un `id === "caida"` en
`jugar.vue` (que rompería el contrato "una línea por juego" del registry). `:has()` está en
todos los navegadores móviles actuales (Safari 15.4+, Chrome 105+); si faltara, Tetris cae al
letterbox 4/3 (degradado, no roto).
</content>
</invoke>
