# SPEC MÓVIL — Player (`/juego/[id]/jugar`)

> **Estado:** Borrador
> **Depende de:** SPEC MÓVIL 00 (`00-baseline-movil.md`) · SPEC 10 (capa táctil, implementada)
> **Fecha:** 2026-09-03
> **Objetivo:** Hacer que la ruta del player (`app/pages/juego/[id]/jugar.vue`) — marco CRT, canvas de los 4 engines reales, HUD de stats/acciones y carcasa táctil `.tc-shell` — se vea y se juegue bien en el navegador de un teléfono, en vertical (caso primario) y en horizontal (sin romper), aplicando los seis ejes de auditoría. Incluye la decisión transversal de **escalado de canvas: solo CSS, sin `devicePixelRatio` en el contrato `GameEngine`**.

## Por qué existe esta spec

El player se diseñó para escritorio + CRT grande. `spec 10` añadió la carcasa táctil (`.tc-shell` Game Boy) para los 4 engines reales, pero:

- El `.crt-screen` está bloqueado a `aspect-ratio: 4/3`; en un teléfono de 320–430 px eso deja el canvas de `caida` (buffer 300×600, 1:2) en una franja de ~100–140 px de ancho.
- El bloque compacto `@media (pointer: coarse), (max-width: 720px)` (`main.css:1809`) reduce los `.btn` del HUD por debajo de 44 px y los brazos de la cruceta (`.tc-key`) a 34–36 px.
- No hay una sola regla de orientación: en horizontal, la `.tc-shell` (que fluye **debajo** del `.crt` en el documento) queda entera fuera de pantalla y el juego es injugable con el canvas visible.
- El player no usa ninguna unidad de altura relativa al viewport, así que nada limita el `.crt` al alto visible del navegador.
- `TouchControls.vue` tiene `aria-hidden="true"` en la raíz interactiva y sus botones no tienen `aria-label`.
- Nada respeta `prefers-reduced-motion`.

Esta spec cierra todo eso apoyándose en la baseline (`00`). **La verdad es el código**, no el texto de `spec 10`: el código trae `.tc-shell` / `.tc-dpad` / `.tc-key` / `.tc-round` (carcasa Game Boy), no la `.tc-bar` con clusters `left`/`right` que describe `spec 10`. No se edita `specs/10-*`.

## Alcance

### En alcance

- **Marco CRT y canvas** (`main.css`): límite de altura del `.crt-screen` en móvil vía `var(--app-svh)`; marco vertical para Tetris vía `.crt:has(.caida-preview)`; reubicación de `.caida-preview`; `overscroll-behavior: contain` en `.game-stage`.
- **HUD del player** (`main.css`, opcionalmente markup de `jugar.vue`): tira de stats a una fila estable; `.btn` del HUD y del modal a ≥ 44 px con `touch-action: manipulation`; modal de fin de juego usable a 320 px; `.toast-saved` sin desbordar.
- **Carcasa táctil** (`main.css` + `app/components/games/TouchControls.vue`): brazos de la cruceta a ≥ 44 px; `env(safe-area-inset-*)` lateral para el montaje en horizontal; `:focus-visible`; `aria-label` por botón y `role="group"` en la raíz (quitando `aria-hidden`).
- **Orientación** (`main.css`): bloque `@media (orientation: landscape) and (pointer: coarse)` que reordena `.av-player` en rejilla `HUD arriba / CRT + carcasa a los lados`, manteniendo dpad y A/B en pantalla y el HUD sin cortar.
- **Entrada / accesibilidad**: lista de animaciones decorativas del player que el `@media (prefers-reduced-motion: reduce)` global (de la baseline) debe cubrir, con la excepción explícita del canvas / loop rAF.
- **Decisión de escalado de canvas**: solo CSS. Se documenta aquí (sección Decisiones) y **no** se toca `app/games/types.ts` ni los 4 engines ni `engine-contract.md`.

### Fuera de alcance

- `devicePixelRatio` / `ResizeObserver` en el contrato `GameEngine` — se decide en contra (ver Decisiones).
- Arrastrar el dedo sobre el canvas (pala de `bloque-buster`, swipe de `serpentina`/`caida`) — sigue fuera de alcance desde `spec 10`.
- Cambiar `mousemove` → `pointermove` en `bloque-buster/engine.ts` — diferido (necesita el modelo de drag que `spec 10` dejó fuera).
- Botones táctiles para los juegos mock (`gloton`, `invasores`, `ranaria`, `duelo-pixel`) — solo heredan el layout responsive.
- Mostrar el selector de skin en móvil — `spec 10` decidió ocultarlo; no se reabre.
- Supabase, scoring, snapshot, rutas, registry.
- PWA / manifest / service worker / fullscreen / orientación bloqueada.

## Auditoría — hallazgos por eje (ruta `/juego/[id]/jugar`)

| Eje                         | Hallazgo                                                                                                                                                                                                                                                                              | Severidad                                       |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| **Layout y tipografía**     | `.crt-screen` fijo a `aspect-ratio: 4/3`: en 320–430 px la pantalla mide ~250–330 px de ancho; el canvas de `caida` (1:2) se letterboxea a ~100–140 px → celdas de ~10–14 px.                                                                                                         | `rompe` (en `caida` a 320) / `incómodo` (resto) |
| Layout                      | `.player-hud`: 5 tiles + 3 botones + selector de skin; con el `@media` compacto aún hace wrap a 3–4 filas en 320–360 px. Wrapper con `style="display:flex;gap:24px"` inline pisado por `!important` en CSS.                                                                           | `incómodo`                                      |
| Layout                      | Modal fin de juego: `.input-row` (input + botón "GUARDAR PUNTUACIÓN" en flex) apretado < 360 px; `.toast-saved` con `width: 22ch` + `white-space: nowrap` desborda `.modal` a 320 px.                                                                                                 | `incómodo`                                      |
| Layout / chrome             | El player no usa `vh`/`dvh`/`svh` en ningún sitio: altura puramente intrínseca (la manda `aspect-ratio`), nada limita el `.crt` al viewport visible; el stack nav + HUD + CRT + carcasa + footer se desborda en pantallas cortas.                                                     | `incómodo`                                      |
| Layout                      | `.caida-preview` (`18%`/`max 120px`, absoluto arriba-derecha): ~45–55 px en móvil, legible pero mínimo.                                                                                                                                                                               | `cosmético`                                     |
| **Ergonomía táctil**        | `.hud-actions .btn` compacto (`padding: 9px 11px; font-size: 10px`) ≈ 30–32 px de alto (< 44). PAUSA / FIN / SALIR.                                                                                                                                                                   | `rompe`                                         |
| Táctil                      | `.tc-key` (brazos de la cruceta) `clamp(34px, 10vw, 46px)` → 34–36 px en 320–360 px (< 44).                                                                                                                                                                                           | `incómodo`                                      |
| Táctil                      | `.btn` del modal (JUGAR DE NUEVO / VOLVER / GUARDAR / REINTENTAR) sin `min-height` ≈ 34 px.                                                                                                                                                                                           | `incómodo`                                      |
| Táctil / entrada            | `:hover` en `.btn` y `.skin-seg-btn` se queda pegado tras un tap; sin `touch-action: manipulation` en `.btn` → retardo 300 ms + doble-tap-zoom sobre PAUSA/FIN/SALIR.                                                                                                                 | `incómodo`                                      |
| Táctil                      | El selector de skin (`.skin-seg`) está oculto en `coarse`: no se puede cambiar de skin en móvil (limitación conocida de `spec 10`, no se reabre).                                                                                                                                     | `cosmético`                                     |
| **Canvas y escena**         | Buffers: `rocas` 800×600, `bloque-buster` 800×600, `serpentina` 640×480 (4:3); `caida` 300×600 (1:2) + preview 120×120. Regla letterbox (`.game-canvas { max-width/max-height:100%; width/height:auto }`) presente y correcta — sin distorsión.                                       | ok                                              |
| Canvas                      | Sin `devicePixelRatio`: en viewports de teléfono los buffers fijos son ≥ que el tamaño CSS mostrado a dpr 2–3 (downscaling) → nitidez aceptable; el upscaling borroso solo pasa en pantallas grandes de escritorio (fuera de alcance móvil).                                          | `cosmético`                                     |
| Canvas                      | Con `.tc-shell` en flujo normal bajo el `.crt`, en vertical el stack completo excede el viewport → canvas y carcasa no se ven a la vez sin scroll (`spec 10` aceptó "scroll mínimo").                                                                                                 | `incómodo`                                      |
| Canvas                      | `caida`: franja de ~100–140 px (ver Layout).                                                                                                                                                                                                                                          | `rompe` @320                                    |
| Canvas                      | `bloque-buster/engine.ts` `onMouseMove` usa `getBoundingClientRect()` + `scaleX` (correcto para el escalado CSS) pero es `mousemove`, no `pointermove`: no dispara en táctil (se cubre con los botones izq/der).                                                                      | `cosmético`                                     |
| **Chrome del navegador**    | `.tc-shell` ya trae `env(safe-area-inset-bottom)` en su `padding` pero está **inerte** — falta `viewport-fit=cover` (lo activa la baseline).                                                                                                                                          | `incómodo`                                      |
| Chrome                      | `.modal-bd` (`position: fixed; inset: 0; padding: 20px`): el contenido puede chocar con el notch / indicador de inicio; sin insets de safe-area.                                                                                                                                      | `incómodo`                                      |
| Chrome                      | Sin `overscroll-behavior` local: pull-to-refresh puede dispararse desde el HUD/márgenes sobre el `.crt` (`.game-stage` sí tiene `touch-action: none`). La baseline añade `overscroll-behavior-y: none` global; el player refuerza con `contain` en `.game-stage`.                     | `incómodo` (lo mitiga la baseline)              |
| Chrome                      | Sin `theme-color` — lo añade la baseline.                                                                                                                                                                                                                                             | (baseline)                                      |
| **Orientación**             | Cero reglas `landscape`/`portrait` en `main.css`. En horizontal (p. ej. 740×360) el `.crt` a ancho completo hace `.crt-screen` más alto que el viewport y la `.tc-shell` (flujo debajo del `.crt`) queda **entera fuera de pantalla** → injugable.                                    | `rompe`                                         |
| Orientación                 | HUD + CRT + carcasa apilados sin adaptación horizontal; el HUD se corta o empuja todo.                                                                                                                                                                                                | `rompe`                                         |
| **Entrada y accesibilidad** | `TouchControls.vue`: `aria-hidden="true"` en la raíz `.tc-shell` → toda la botonera interactiva fuera del árbol de accesibilidad.                                                                                                                                                     | `incómodo`                                      |
| Accesibilidad               | `<button>` de `.tc-key`/`.tc-round` con solo un glifo Unicode (`◀ ▲ ⟳ ●`) como nombre accesible; sin `aria-label`.                                                                                                                                                                    | `incómodo`                                      |
| Accesibilidad               | Sin `:focus-visible` en `.tc-key`/`.tc-round` (solo `:active`) — foco de teclado/switch invisible.                                                                                                                                                                                    | `cosmético`                                     |
| Entrada                     | `prefers-reduced-motion` no se respeta. En el player: `.fade-in` de `.av-player`, animaciones del `.game-arena` mock (`gridscroll`/`bob`/`drift`), `typewriter`/`caret` de `.toast-saved`, `spinpix` del `.spinner`. **El loop rAF del engine es juego, no decoración — no se toca.** | `incómodo`                                      |
| Entrada                     | `touch-action: none` correcto en `.tc-shell` / `.tc-key` / `.tc-round` / `.game-stage`; `preventDefault` + `setPointerCapture` en `onDown`. Sin hallazgo.                                                                                                                             | ok                                              |

## Cambios fichero por fichero

### `nuxt.config.ts`

Sin cambios propios — el player depende del `app.head.meta` (`viewport-fit=cover` + `theme-color`) que introduce `00-baseline-movil.md` Paso 0.

### `app/assets/css/main.css`

**A. Marco CRT y canvas — dentro del bloque `@media (pointer: coarse), (max-width: 640px)`** (el actual `main.css:1809`, ya renombrado por la baseline):

```css
/* límite de alto: CRT + carcasa deben caber sin scroll con el chrome desplegado */
.crt-screen {
  max-height: min(56svh, calc(var(--app-svh) - 320px));
}
/* Tetris: marco vertical. .caida-preview solo existe en CaidaGame.vue, así que
   este :has() no afecta a rocas / bloque-buster / serpentina. */
.crt:has(.caida-preview) .crt-screen {
  aspect-ratio: 3 / 4;
  max-height: min(64svh, calc(var(--app-svh) - 280px));
}
/* con el marco 3/4 el tablero queda limitado por alto (~66% del ancho del marco):
   quedan gutters laterales donde el preview no pisa el pozo */
.caida-preview {
  width: 34%;
  max-width: 60px;
  top: 6px;
  right: 6px;
}
.game-stage {
  overscroll-behavior: contain;
}
```

Racional del `320`/`280` restado: nav sticky (~52) + HUD compacto (~72) + carcasa (~185 con la cruceta a 44–52) + márgenes/`.av-player` (~28) ≈ 337; se deja holgura. El `min()` con `svh` evita que en pantallas altas el CRT crezca sin techo.

**B. HUD del player — mismo bloque `@media (pointer: coarse), (max-width: 640px)`:**

```css
.player-hud {
  flex-wrap: wrap;
}
.player-hud > div:first-child {
  gap: 12px !important; /* se mantiene el !important solo mientras el markup lleve el style inline; ver nota C */
  flex-wrap: nowrap;
  overflow-x: auto;
  scrollbar-width: none;
}
.hud-actions .btn {
  min-height: var(--tap-min);
  padding: 0 12px;
  font-size: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
```

**C. `.btn` global y modal — fuera de media query (aplica también a desktop, sin efecto visible):**

```css
.btn {
  min-height: var(--tap-min);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  touch-action: manipulation;
}
/* las reglas .btn:hover / .btn.magenta:hover / .btn.yellow:hover / .btn.ghost:hover /
   .skin-seg-btn:hover pasan a vivir dentro de @media (hover: hover) — lo hace la baseline
   de forma global; este spec lo verifica para el player */
```

**D. Modal de fin de juego — dentro del bloque `@media (pointer: coarse), (max-width: 640px)`:**

```css
.modal-bd {
  padding: max(20px, var(--safe-t)) max(20px, var(--safe-r)) max(20px, var(--safe-b))
    max(20px, var(--safe-l));
  align-items: flex-start;
}
.modal {
  padding: 24px 20px;
  margin-top: 8svh;
}
.modal .input-row {
  flex-direction: column;
}
.modal .toast-saved {
  max-width: 100%;
  white-space: normal;
}
```

Además, en el `@media (prefers-reduced-motion: reduce)` **global** (baseline) hay que fijar el estado final que hoy depende del keyframe `typewriter`:

```css
@media (prefers-reduced-motion: reduce) {
  .toast-saved {
    width: auto;
    border-right: 0;
  }
}
```

**E. Carcasa táctil — reglas base (fuera de media query salvo indicación):**

```css
.tc-dpad {
  --tc-key: clamp(44px, 12vw, 52px); /* era clamp(34px, 10vw, 46px) */
}
.tc-shell {
  padding-left: max(20px, var(--safe-l));
  padding-right: max(20px, var(--safe-r));
  /* el padding-bottom con env(safe-area-inset-bottom) ya existe; ahora sí resuelve */
}
.tc-key:focus-visible,
.tc-round:focus-visible {
  outline: 2px solid var(--cyan);
  outline-offset: 2px;
}
```

**F. Orientación — bloque nuevo `@media (orientation: landscape) and (pointer: coarse)`:**

```css
@media (orientation: landscape) and (pointer: coarse) {
  .av-player {
    display: grid;
    grid-template-columns: 1fr auto;
    grid-template-areas:
      "hud hud"
      "crt deck";
    align-items: center;
    column-gap: 12px;
    margin: 8px auto;
  }
  .player-hud {
    grid-area: hud;
    margin-bottom: 8px;
  }
  .crt {
    grid-area: crt;
    padding: 8px;
  }
  .tc-shell {
    grid-area: deck;
    flex-direction: column;
    width: auto;
    max-width: none;
    margin: 0;
    gap: 12px;
    padding-right: max(16px, var(--safe-r));
  }
  /* en horizontal la restricción es el alto: marco ancho para todos, incluido Tetris */
  .crt-screen,
  .crt:has(.caida-preview) .crt-screen {
    aspect-ratio: 4 / 3;
    max-height: calc(var(--app-svh) - 96px);
  }
  .crt-bottom {
    display: none;
  }
  .modal {
    margin-top: 0;
  }
  .modal-bd {
    align-items: center;
  }
}
```

`.player-hud`, `.crt` y la raíz `.tc-shell` de `<TouchControls>` ya son hijos directos de `.av-player` (confirmado en el `<template>` de `jugar.vue`), así que la rejilla con `grid-template-areas` funciona **sin tocar el markup**. `.modal-bd` es hijo directo también pero al ser `position: fixed` no entra en la rejilla.

**G. `prefers-reduced-motion` — selectores del player que el bloque global (baseline) cubre:**

`.av-player.fade-in` (`fadeIn`), `.game-arena .grid-floor` (`gridscroll`), `.game-arena .player-ship` (`bob`), `.game-arena .enemy` (`drift`), `.spinner` (`spinpix`), `.toast-saved` (`typewriter` + `caret`, con el estado final fijado en D). **Ninguna regla toca `.game-canvas`, `.game-stage > canvas` ni nada dentro del engine.**

### `app/components/games/TouchControls.vue` (solo markup — permitido)

- Raíz: sustituir `aria-hidden="true"` por `role="group"` + `aria-label="Controles táctiles del juego"`.
- Cada `<button>` (`.tc-key` y `.tc-round`): añadir `:aria-label="ariaFor(c)"` donde `ariaFor` es un `Record<string, string>` **local al componente**, indexado por `control.id`, con fallback a `control.label`:

  ```ts
  const ARIA: Record<string, string> = {
    "girar-izq": "Girar a la izquierda",
    "girar-der": "Girar a la derecha",
    propulsar: "Propulsar",
    disparar: "Disparar",
    arriba: "Arriba",
    abajo: "Abajo",
    izq: "Izquierda",
    der: "Derecha",
    bajar: "Bajar",
    rotar: "Rotar pieza",
    soltar: "Soltar pieza",
  };
  const ariaFor = (c: TouchControl) => ARIA[c.id] ?? c.label;
  ```

  (En el `v-for` del dpad, `dpadByDir[d]` es el `TouchControl`; pasar ese objeto a `ariaFor`.)

- Opcional (no bloqueante): `:aria-pressed` en los botones `kind === "hold"` reflejando el `Set` `held`.
- **No** se toca `app/games/types.ts` ni ningún `*_TOUCH_CONTROLS`: el `aria-label` es presentación y vive en el componente.

### `app/pages/juego/[id]/jugar.vue` (opcional, no requerido)

- La rejilla de horizontal funciona sin cambios de markup (los hijos ya están donde toca).
- Limpieza opcional: mover el `style="display: flex; gap: 24px; flex-wrap: wrap"` inline del wrapper de tiles del HUD a una clase (`.hud-stats`) para poder quitar el `!important` de la regla B. Si no se hace, la regla B mantiene el `!important` — funcional pero frágil.

### Engines (`app/games/*/engine.ts`) y `engine-contract.md`

**Sin cambios.** La decisión de escalado de canvas es "solo CSS" (ver Decisiones). `bloque-buster` conserva su `onMouseMove` (camino solo-desktop). El cambio a `pointermove` queda diferido.

## Checklist de aceptación móvil — player

> Plantilla de `00-baseline-movil.md`, rellenada para `/juego/[id]/jugar`. Evaluar en `rocas`, `caida`, `bloque-buster`, `serpentina` a **320 / 360 / 390 / 430 px**, **vertical y horizontal**.

- [ ] **Sin scroll horizontal** en los 4 anchos y ambas orientaciones (`scrollWidth === clientWidth`), incluido con el modal de fin de juego abierto.
- [ ] **Objetivos táctiles ≥ 44×44 px**: brazos de la cruceta (`.tc-key`), botones A/B (`.tc-round`), PAUSA / FIN / SALIR (`.hud-actions .btn`), botones del modal (JUGAR DE NUEVO / VOLVER / GUARDAR / REINTENTAR), input de iniciales; separación ≥ 8 px.
- [ ] **Tipografía**: stats del HUD (Puntuación / Vidas / Nivel / extras) legibles sin zoom; ningún valor recortado; el `.crt-bottom` oculto en compacto no deja hueco.
- [ ] **Canvas visible con la carcasa**: en vertical, el canvas del juego se ve **entero** (sin recorte) y la `.tc-shell` está en pantalla o a un scroll mínimo (≤ ~15% de la altura); en `caida` el tablero usa el marco 3/4 y las celdas miden ≥ 16 px de ancho a 360 px.
- [ ] **Caso `caida`**: `.caida-preview` no solapa el pozo de juego con el marco 3/4; la pieza siguiente se ve completa.
- [ ] **Nitidez**: ningún canvas se ve borroso por upscaling (los buffers fijos son ≥ el tamaño mostrado a dpr 2–3); ninguno se ve distorsionado (letterbox correcto).
- [ ] **Safe-area**: con notch / barra de gestos simulada, la carcasa táctil no queda bajo el indicador de inicio; el modal de fin de juego no se mete bajo el notch; `.tc-shell` resuelve `--safe-b`/`--safe-l`/`--safe-r` ≠ 0 donde aplica.
- [ ] **Altura / chrome**: con la barra de URL desplegada, en vertical se ven a la vez el HUD, el canvas entero y al menos la fila superior de la carcasa; sin salto de layout al colapsar la barra.
- [ ] **`:hover` no-pegado**: tras tocar PAUSA / FIN / SALIR o un botón del modal, no queda estilo hover; los `.tc-key`/`.tc-round` solo reaccionan con `:active`.
- [ ] **Doble-tap-zoom**: dos taps rápidos sobre PAUSA / FIN / SALIR no hacen zoom (por `touch-action: manipulation`).
- [ ] **`prefers-reduced-motion`**: con "Reduce motion" activo, `.fade-in`, el `.game-arena` mock, el `.spinner` y el `typewriter` de `.toast-saved` no animan; el `.toast-saved` muestra su texto completo; **el canvas del juego real sigue animando** (el loop no se detiene).
- [ ] **Orientación horizontal**: `.av-player` pasa a rejilla `HUD arriba / CRT + carcasa a los lados`; la cruceta y A/B quedan en pantalla y alcanzables con el pulgar; el HUD no se corta; el CRT usa marco 4/3 limitado por alto; sin scroll lateral; sin aviso de girar el dispositivo.
- [ ] **`theme-color`**: barra del navegador oscura en la ruta del player.
- [ ] **Accesibilidad de la carcasa**: con un lector de pantalla, la `.tc-shell` se anuncia como grupo "Controles táctiles del juego" y cada botón por su `aria-label` en español (no por el glifo); el foco de teclado es visible (`:focus-visible`).
- [ ] **Regresión desktop**: en puntero fino la `<TouchControls>` no se monta y el player se ve y se comporta igual que antes de esta spec (los `min-height`/`touch-action` de `.btn` no cambian nada visible).
- [ ] **Juegos mock** (`gloton`, `invasores`, `ranaria`, `duelo-pixel`): sin botones táctiles; heredan el HUD compacto y el límite de alto del `.crt-screen`; el `.game-arena` mock entra en el marco sin scroll lateral.
- [ ] **Flujo de partida intacto**: PAUSA detiene la simulación real y REANUDAR continúa sin salto de `dt`; el modal de fin de juego aparece una vez; GUARDAR PUNTUACIÓN persiste vía `POST /api/scores`; salir de la ruta desmonta `<TouchControls>` y detiene el engine sin listeners colgando ni errores de consola.

## Plan de implementación

1. **Límite de alto del `.crt-screen`** (bloque A) en el `@media (pointer: coarse), (max-width: 640px)`. Prueba: en emulador a 360×780, el `.crt` no empuja la carcasa fuera de pantalla; capturas en `rocas`.
2. **Marco 3/4 para Tetris** (`.crt:has(.caida-preview)`) + reubicación de `.caida-preview` (bloque A). Prueba: `/juego/caida/jugar` a 360 px — tablero ~1.8× más alto que antes, celdas ≥ 16 px, preview sin pisar el pozo. Verificar que `rocas`/`bloque-buster`/`serpentina` NO cambian (no tienen `.caida-preview`).
3. **HUD compacto a una fila** (bloque B) + `.btn` global `min-height`/`touch-action` (bloque C). Prueba: HUD en una sola fila con scroll horizontal interno si hace falta; PAUSA/FIN/SALIR miden ≥ 44 px; desktop sin cambio visible.
4. **Modal de fin de juego** (bloque D) + estado final de `.toast-saved` en el bloque reduced-motion. Prueba: a 320 px el modal no desborda, `.input-row` en columna, "PUNTUACIÓN GUARDADA_" visible con y sin reduce-motion.
5. **Carcasa: cruceta ≥ 44 px, safe-area lateral, `:focus-visible`** (bloque E). Prueba: brazos de la cruceta ≥ 44 px a 320–360 px; el `padding-bottom` con `env(safe-area-inset-bottom)` ya resuelve (baseline aplicada); foco visible al tabular.
6. **`TouchControls.vue`: `role="group"` + `aria-label`, quitar `aria-hidden`.** Prueba: lector de pantalla anuncia el grupo y cada botón en español; `npm run build` sin errores de tipos.
7. **Bloque de orientación horizontal** (bloque F). Prueba: a 740×360 en `rocas` y `caida`, HUD arriba sin cortar, CRT centrado limitado por alto, cruceta y A/B en pantalla a los lados; sin scroll lateral.
8. **Verificar el `@media (prefers-reduced-motion)` global** cubre los selectores del player (bloque G) y que el canvas sigue animando.
9. **Regresión**: desktop (puntero fino) idéntico; los 4 juegos mock heredan el compacto sin romperse; recorrido completo de una partida en `rocas` y `caida` en emulador táctil (pausa, game over, guardar, salir).

## Decisiones

- **Escalado de canvas: solo CSS, sin `devicePixelRatio` ni resize en el contrato `GameEngine`.** En viewports de teléfono los buffers fijos (800×600, 640×480, 300×600) son ≥ que el tamaño CSS al que se muestran, incluso a `dpr` 2–3 → hay downscaling, no upscaling: la nitidez ya es aceptable y el caso que arreglaría `devicePixelRatio` (buffer menor que el display) solo ocurre en pantallas grandes de escritorio, fuera del alcance móvil. Añadir `dpr` + `ResizeObserver` al contrato tocaría `types.ts` + los 4 engines (todos dibujan con constantes de módulo `W`/`H`, habría que instanciar dimensiones y reescalar cada `draw`) + los 4 wrappers + `engine-contract.md` §9 a la vez, con superficie de regresión real, para un beneficio que no se manifiesta en los dispositivos objetivo. Se descarta.
- **La regla letterbox se mantiene tal cual.** `.game-canvas { max-width/max-height: 100%; width/height: auto }` ya escala cualquier buffer al marco sin distorsión (verificado para `rocas` en `spec 07`). No se toca.
- **`.crt-screen` conserva `4/3`, salvo Tetris en vertical.** Un cambio global del `aspect-ratio` a un marco más alto perjudicaría a los 3 juegos 4:3 (más bisel negro, mismo tamaño absoluto de canvas, y **más** alto de marco consumido). El único que gana con un marco vertical es `caida`. Se le da con `.crt:has(.caida-preview)`, que es CSS puro y no necesita meter un `id === "caida"` en `jugar.vue` (eso rompería el contrato "una línea por juego" del registry). En horizontal el marco vuelve a `4/3` para todos porque ahí la restricción es el alto.
- **HUD, carcasa táctil y marco CRT en un solo spec (`player.md`), no tres.** Comparten el presupuesto vertical del viewport y la rejilla de horizontal: decidir el alto del CRT sin decidir el de la carcasa, o el reflow horizontal por separado, crea dependencias circulares entre specs. Se mantienen como sub-secciones claramente delimitadas dentro de este archivo.
- **Horizontal = rejilla CSS `HUD / CRT + carcasa`, sin aviso de girar.** Respeta la regla global (vertical es primario, horizontal no se fuerza) y la decisión de `spec 10`. La rejilla usa `grid-template-areas` sobre los hijos que `jugar.vue` ya tiene, sin markup nuevo.
- **`aria-label` de los botones táctiles en `TouchControls.vue`, no en el tipo `TouchControl`.** Añadir un campo al tipo obligaría a editar `types.ts` + los 4 arrays `*_TOUCH_CONTROLS`, para una preocupación puramente presentacional. Un mapa local `id → etiqueta` en el componente lo resuelve sin tocar engines ni contrato.
- **Se quita `aria-hidden="true"` de `.tc-shell`.** Un contenedor de controles interactivos no debe estar fuera del árbol de accesibilidad; se sustituye por `role="group"` + `aria-label`.
- **Brazos de la cruceta a `clamp(44px, 12vw, 52px)`.** Es el único control táctil por debajo de 44 px; A/B (`.tc-round`) ya está en `clamp(52px, 15vw, 64px)`. El alto extra de la carcasa (3×52 vs 3×46 ≈ +18 px) entra en el presupuesto vertical calculado.
- **El selector de skin sigue oculto en móvil.** `spec 10` lo decidió (es configuración, no juego); no se reabre. Se documenta como limitación conocida.
- **`mousemove` → `pointermove` en `bloque-buster`: diferido.** El handler actual es un camino solo-desktop y es correcto (usa `getBoundingClientRect` + `scaleX`). Migrarlo a `pointermove` sin un modelo de drag definido (que `spec 10` dejó fuera de alcance) no aporta en táctil, donde los botones izq/der ya cubren el control.
- **`prefers-reduced-motion` nunca toca el `<canvas>` ni el loop rAF.** Reducir movimiento aplica a la decoración (CRT, reveal, spinner, typewriter), no a la jugabilidad. El bloque global de la baseline usa la barrida `*` pero el canvas no es una animación CSS, así que queda fuera por construcción; este spec lo verifica explícitamente.
- **`overscroll-behavior: contain` en `.game-stage`** además del `overscroll-behavior-y: none` global de la baseline — refuerzo local para que ningún gesto sobre el área de juego encadene scroll a la página.

## Riesgos

| Riesgo                                                                                                                                                   | Mitigación                                                                                                                                                                                                                                                     |
| -------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `:has()` no soportado en un navegador objetivo muy viejo → Tetris no recibe el marco 3/4.                                                                | `:has()` está en Safari 15.4+ y Chrome 105+ (todos los navegadores móviles actuales). El fallback es el letterbox 4/3 de hoy: degradado, no roto. La alternativa (clase por `id` en `jugar.vue`) se descarta para no romper el contrato "una línea por juego". |
| La rejilla de horizontal asume que `.player-hud`, `.crt` y la raíz `.tc-shell` siguen siendo hijos directos de `.av-player`.                             | Confirmado contra el `<template>` actual de `jugar.vue`. Documentado aquí; si un spec futuro envuelve esos nodos, debe revisar `grid-template-areas`.                                                                                                          |
| Diferir `devicePixelRatio`: si más adelante se pide, es un refactor simultáneo de `types.ts` + 4 engines + 4 wrappers + `engine-contract.md` §9.         | Cuando aterrice, se añade `dpr` con default no-op para migrar engine por engine — igual patrón que el refactor único de `skins/00` y `spec 10`. Registrado en `references/mobile-audit.md`.                                                                    |
| Reducir el keyframe `typewriter` con la barrida `*` deja `.toast-saved` en `width: 0` (texto invisible).                                                 | El bloque `@media (prefers-reduced-motion)` fija `.toast-saved { width: auto; border-right: 0 }` — llamado explícitamente en el Plan Paso 4.                                                                                                                   |
| `spec 10` describe `.tc-bar` / clusters `left`/`right`; el código trae `.tc-shell` / `.tc-dpad` / `.tc-round`. Además `TouchControl` ganó `shape`/`dir`. | Este spec se construye sobre el **código** y sobre `engine-contract.md` §9 (que ya está sincronizado). `specs/10-*` no se edita. La desincronización está registrada en `references/mobile-audit.md`.                                                          |
| El footer global (`app.vue`, estilos inline) queda debajo del pliegue en horizontal, sin hook por ruta para ocultarlo.                                   | Aceptado: el footer no es un control; se alcanza con scroll y no bloquea el juego. Si molesta, un spec futuro puede añadir una clase de layout — no se reabre este.                                                                                            |
| El `overflow-x: auto` del HUD compacto podría mostrar una barra de scroll fea en algún navegador.                                                        | `scrollbar-width: none` + (si hace falta) `::-webkit-scrollbar { display: none }`; el contenido cabe sin scroll en la mayoría de anchos, el `auto` es solo la red de seguridad para 320 px.                                                                    |
| `min-height: 44px` en `.btn` global podría descuadrar botones en desktop (p. ej. dentro de `.input-row`).                                                | El `input` del modal ya mide `44px`; el resto de `.btn` en desktop ya supera 44 px de alto por su `padding`. Paso 9 verifica regresión desktop con capturas.                                                                                                   |

</content>
