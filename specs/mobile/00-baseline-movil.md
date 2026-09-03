# SPEC MÓVIL 00 — Baseline de navegador móvil

> **Estado:** Borrador
> **Depende de:** SPEC 10 (capa táctil, ya implementada — se da por hecha)
> **Fecha:** 2026-09-03
> **Objetivo:** Establecer, de una sola vez, la infraestructura CSS/meta que todo el resto de specs móviles da por hecha: una escala de breakpoints única (2 puntos + `pointer: coarse`) que reemplaza los 8 actuales, custom properties de altura (`dvh`/`svh` con fallback `vh`) y de safe-area, el meta viewport con `viewport-fit=cover` + `theme-color`, el tamaño mínimo de objetivo táctil, la política de `prefers-reduced-motion` y de `overscroll-behavior`, y la checklist de aceptación móvil reutilizable que cada spec posterior rellena para su área.

## Por qué existe esta spec

Todo el CSS del sitio vive en un único `app/assets/css/main.css` (~3000 líneas) con **16 `@media`** y **8 breakpoints inconsistentes** (`520, 600, 720, 820, 840, 900, 980, 1100`), ningún `.vue` con `<style>` propio, un solo `100vh` (`main.css:1925`), ninguna regla de orientación, y `env(safe-area-inset-*)` ya presente en `.tc-shell` pero **inerte** porque `app.head` en `nuxt.config.ts` no define `meta` (Nuxt aplica su viewport por defecto, sin `viewport-fit`). Esta spec es el refactor único: los specs `player.md`, `nav.md`, `catalogo.md`, etc. asumen que la escala, las custom properties y el meta ya existen y solo referencian sus nombres.

## Alcance

### En alcance

- **Escala de breakpoints única** (`main.css`): 2 puntos de ancho — `640px` (`sm`) y `900px` (`md`) — más la feature query `(pointer: coarse)`. Reescritura de los 16 `@media` existentes al nuevo valor según la tabla de mapeo. Sin cambios en los cuerpos de regla salvo donde dos breakpoints viejos se fusionan (se verifica que no haya regresión ≥ 900 px).
- **Custom properties de altura** (`:root` en `main.css`): `--app-vh` (`100vh` → `100dvh` vía `@supports`) y `--app-svh` (`100vh` → `100svh` vía `@supports`). Sustitución del único `100vh` del repo (`main.css:1925`, `.home-hero`) por `var(--app-svh)`.
- **Custom properties de safe-area** (`:root`): `--safe-t/-r/-b/-l` = `env(safe-area-inset-*, 0px)`. Regla blanket horizontal en `#root` (`padding-left/right: var(--safe-l/-r)`) para que el notch no tape contenido en horizontal en todas las rutas de golpe.
- **Meta viewport + theme-color** (`nuxt.config.ts`): añadir `app.head.meta` con `viewport = "width=device-width, initial-scale=1, viewport-fit=cover"` y `theme-color = "#0a0a0f"`. `app.head.title` y `htmlAttrs` no se tocan.
- **`overscroll-behavior-y: none`** en `html, body` (`main.css`): corta el pull-to-refresh y el scroll-chaining del navegador.
- **Tamaño mínimo de objetivo táctil**: custom property `--tap-min: 44px` y su aplicación (vía `min-height`/`min-width` en el área de hit, sin tocar el aspecto visual CRT) a la nav, los `.chip` del salón de la fama, `.btn`, `.lb-link`, inputs y botón del formulario de contacto, y los enlaces de `GameCard`/`MiniCard`. `touch-action: manipulation` en todos los `<button>`/enlaces de acción.
- **`:hover` no-pegado**: envolver todas las reglas `:hover` de `main.css` en `@media (hover: hover)` para que no queden activas tras un tap en táctil.
- **`@media (prefers-reduced-motion: reduce)` global** (`main.css`): neutraliza las animaciones decorativas (`fade-in`, `slide-in`, `spinpix`, `typewriter`/`caret`, `flicker`, `gridscroll`, `bob`, `drift`, `float`, `bounce`, `pulse`, `blink`, `shake`, `pxblink`, `tickin`, `rise`). **No** toca ningún `<canvas>` ni el loop `requestAnimationFrame` de los engines (eso es juego, no decoración).
- **Checklist de aceptación móvil reutilizable** (este documento, sección "Checklist de aceptación móvil"): condiciones verificables por ruta a 320 / 360 / 390 / 430 px en vertical y horizontal, como lista marcable que cada spec de área copia y rellena.

### Fuera de alcance

- Cualquier cambio de layout/markup específico de una ruta — eso vive en los specs de área (`player.md`, `nav.md`, …).
- PWA, `manifest.webmanifest`, service worker, Workbox, Capacitor, Cordova, empaquetado nativo — **nada de esto**. El alcance es exclusivamente el navegador móvil.
- Migrar CSS a `<style>` por componente — sigue todo en `main.css`.
- Tocar Supabase, el scoring, el snapshot, las rutas o los engines.
- `devicePixelRatio` / resize en el contrato `GameEngine` — se decide (en contra) en `player.md`.
- Aviso "girá el dispositivo" / bloqueo de orientación.

## Modelo de datos

Esta spec **no** introduce datos persistentes. Solo custom properties CSS, una entrada `meta` en la config y reescritura de media queries.

### `nuxt.config.ts` — `app.head.meta`

```ts
app: {
  head: {
    title: "Arcade Vault",
    htmlAttrs: { lang: "es" },
    meta: [
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "theme-color", content: "#0a0a0f" },
    ],
  },
},
```

Sin `meta`, Nuxt inyecta `width=device-width, initial-scale=1` (sin `viewport-fit`), por lo que todo `env(safe-area-inset-*)` resuelve a `0px`. Declarar el `meta` explícito activa las safe-areas y la barra de navegador oscura.

### `app/assets/css/main.css` — cabecera nueva (antes de la primera regla)

```css
/* ============================================================================
   ESCALA DE BREAKPOINTS MÓVIL (SPEC MÓVIL 00) — ÚNICA FUENTE DE VERDAD
   Solo se permiten estos puntos. No añadir breakpoints nuevos.

     sm  = 640px   →  @media (max-width: 640px)   layout de una columna,
                       tablas densas, player compacto
     md  = 900px   →  @media (max-width: 900px)   colapsos estructurales
                       2col→1col, nav → hamburguesa
     coarse         →  @media (pointer: coarse)    dispositivo táctil
                       (aditivo, se combina con sm)

   Altura: usar var(--app-svh) / var(--app-vh), nunca 100vh crudo.
   Safe-area: usar var(--safe-t/-r/-b/-l).
   Objetivo táctil: min 44px (var(--tap-min)).
   ============================================================================ */

:root {
  --app-vh: 100vh;
  --app-svh: 100vh;
  --safe-t: env(safe-area-inset-top, 0px);
  --safe-r: env(safe-area-inset-right, 0px);
  --safe-b: env(safe-area-inset-bottom, 0px);
  --safe-l: env(safe-area-inset-left, 0px);
  --tap-min: 44px;
}

@supports (height: 100dvh) {
  :root {
    --app-vh: 100dvh;
  }
}
@supports (height: 100svh) {
  :root {
    --app-svh: 100svh;
  }
}

html,
body {
  overscroll-behavior-y: none;
}

#root {
  padding-left: var(--safe-l);
  padding-right: var(--safe-r);
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.001ms !important;
    scroll-behavior: auto !important;
  }
  /* Excepción explícita: nada aquí toca <canvas>; el loop rAF de los engines
     no es una animación CSS y sigue corriendo. Los estados finales que
     dependían de un keyframe (p. ej. .toast-saved: width 0 → 22ch) los fija
     el spec de su área. */
}
```

> **Nota:** las custom properties CSS **no** se pueden usar dentro de la condición de un `@media`, así que la escala se documenta como **convención** (el comentario de cabecera) y se aplica reescribiendo cada `@media` a mano. `--app-vh`, `--safe-*` y `--tap-min` sí son custom properties reales porque se usan en valores de propiedad, no en condiciones.

### Tabla de mapeo — los 16 `@media` de `main.css`

Referencia por línea actual (se desplazan al editar) + selector ancla:

| #   | Línea actual | Condición actual                        | Selector ancla                   | Breakpoint nuevo                                                         |
| --- | ------------ | --------------------------------------- | -------------------------------- | ------------------------------------------------------------------------ |
| 1   | `308`        | `max-width: 840px`                      | `.av-nav .links` → hamburguesa   | `md` (`max-width: 900px`)                                                |
| 2   | `835`        | `max-width: 900px`                      | `.av-detail` 2col→1col           | `md` (`max-width: 900px`)                                                |
| 3   | `1640`       | `max-width: 720px`                      | `.podium` 3col→1col              | `sm` (`max-width: 640px`)                                                |
| 4   | `1780`       | `max-width: 720px`                      | `.hall-table` + paddings `.av-*` | `sm` (`max-width: 640px`)                                                |
| 5   | `1809`       | `(pointer: coarse), (max-width: 720px)` | player compacto                  | `(pointer: coarse), (max-width: 640px)` — se mantiene la doble condición |
| 6   | `2120`       | `max-width: 980px`                      | `.feature-*` (home)              | `md` (`max-width: 900px`)                                                |
| 7   | `2125`       | `max-width: 520px`                      | `.feature-card` grid             | `sm` (`max-width: 640px`)                                                |
| 8   | `2186`       | `max-width: 1100px`                     | `.feature-grid`                  | `md` (`max-width: 900px`)                                                |
| 9   | `2191`       | `max-width: 600px`                      | `.mini-card` grid                | `sm` (`max-width: 640px`)                                                |
| 10  | `2252`       | `max-width: 720px`                      | `.stats-inner` 3col→1col         | `sm` (`max-width: 640px`)                                                |
| 11  | `2265`       | `max-width: 720px`                      | `.stat-block` bordes             | `sm` (`max-width: 640px`)                                                |
| 12  | `2392`       | `max-width: 820px`                      | `.highlight` 2col→1col           | `md` (`max-width: 900px`)                                                |
| 13  | `2488`       | `max-width: 900px`                      | terminal / auth                  | `md` (`max-width: 900px`)                                                |
| 14  | `2698`       | `max-width: 900px`                      | `.lb-*` (leaderboard embed)      | `md` (`max-width: 900px`)                                                |
| 15  | `2791`       | `max-width: 520px`                      | `.lb-link` / detalle             | `sm` (`max-width: 640px`)                                                |
| 16  | `2886`       | `max-width: 900px`                      | `.about-*`                       | `md` (`max-width: 900px`)                                                |

Fusiones a verificar sin regresión:

- `#1` sube de `840` → `900`: la nav pasa a hamburguesa antes (tablets 840–900 px). Verificar que el logo + hamburguesa + `.auth-btn` caben en una línea a 900 px.
- `#6` baja de `980` → `900` y `#8` baja de `1100` → `900`: revisar `.feature-grid`/`.feature-card` entre 900 y 1100 px — que no aparezca overflow ni columnas huérfanas.
- `#7` sube de `520` → `640` y `#12` sube de `820` → `900`: revisar que el paso a una columna no se sienta prematuro en tablet-portrait.

### Objetivo táctil — dónde se aplica `--tap-min`

| Selector                                              | Cómo                                                                                                                         | Nota                                           |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| `.av-nav .links a`                                    | `min-height: var(--tap-min); display: inline-flex; align-items: center`                                                      | solo visible ≥ 900 px, pero coherente          |
| `.av-nav .hamburger`                                  | `min-width/min-height: var(--tap-min)`                                                                                       | ya es `inline-flex`                            |
| `.av-mobile-panel a`                                  | `min-height: var(--tap-min)`                                                                                                 | nav off-canvas                                 |
| `.chip`                                               | `min-height: var(--tap-min)`                                                                                                 | filtros del salón de la fama                   |
| `.btn` (todas las variantes)                          | `min-height: var(--tap-min); display: inline-flex; align-items: center; justify-content: center; touch-action: manipulation` | conserva `padding`/`clip-path` actuales        |
| `.skin-seg-btn`                                       | `min-height: var(--tap-min); touch-action: manipulation`                                                                     | oculto en móvil (player) pero se corrige igual |
| `.lb-link`                                            | `min-height: var(--tap-min)`                                                                                                 |                                                |
| formulario de contacto: `input`, `textarea`, `button` | `min-height: var(--tap-min)` (el `textarea` ya es mayor)                                                                     | ver `formularios.md`                           |
| `GameCard` / `MiniCard` `<a>`/`<NuxtLink>` raíz       | el área de la card ya supera 44 px; añadir `touch-action: manipulation`                                                      |                                                |
| `.tc-key` (cruceta)                                   | via `--tc-key: clamp(44px, 12vw, 52px)`                                                                                      | lo cierra `player.md`                          |
| `.tc-round` (A/B)                                     | ya `clamp(52px, 15vw, 64px)` ≥ 44                                                                                            | sin cambio                                     |

## Plan de implementación

0. **`nuxt.config.ts`.** Añadir `app.head.meta` con el viewport `viewport-fit=cover` y `theme-color`. Prueba: en DevTools móvil, `getComputedStyle(document.documentElement).getPropertyValue('--safe-b')` deja de ser `0px` en un dispositivo con notch/gesture-bar simulado; la barra del navegador se ve oscura.
1. **Cabecera de `main.css`.** Insertar el bloque de comentario de la escala + el `:root` con `--app-vh`, `--app-svh`, `--safe-*`, `--tap-min`, los dos `@supports`, `html, body { overscroll-behavior-y: none }`, `#root { padding-left/right: var(--safe-*) }`. Prueba: `npm run dev` sin errores; `--app-svh` resuelve a `100svh` en navegador moderno y a `100vh` en el fallback.
2. **Reescribir los 16 `@media`** según la tabla de mapeo. Un `@media` a la vez, sin tocar el cuerpo salvo las 3 fusiones marcadas. Prueba: capturas a 900 px y 1200 px antes/después idénticas en todas las rutas; a 640 px el layout de una columna entra sin overflow.
3. **`100vh` → `var(--app-svh)`** en `main.css:1925` (`.home-hero { min-height: calc(var(--app-svh) - 60px) }`). Prueba: en móvil, el hero de la home entra completo con la barra de URL desplegada, sin salto al hacer scroll.
4. **Objetivo táctil.** Aplicar `--tap-min` + `touch-action: manipulation` según la tabla. Prueba: auditar con DevTools que ningún objetivo interactivo mide < 44×44 CSS px en `/`, `/games`, `/salon-de-la-fama`, `/auth`, `/acerca-de` (el player lo cubre `player.md`).
5. **`:hover` → `@media (hover: hover)`.** Envolver cada regla `:hover` de `main.css`. Prueba: en emulador táctil, tras tocar un `.btn` / `.card` / `.chip` y mover el foco, no queda ningún estilo de hover aplicado.
6. **`@media (prefers-reduced-motion: reduce)` global.** Añadir el bloque. Prueba: con "Reduce motion" activo en el SO, ninguna animación decorativa corre; abrir `/juego/rocas/jugar` y confirmar que el juego (canvas) **sí** se mueve.
7. **Verificación de regresión desktop.** Recorrer las 7 rutas a 1280 px y 1440 px: sin diferencias respecto a antes del refactor.

## Checklist de aceptación móvil (plantilla reutilizable)

> Cada spec de área copia esta lista y la rellena para su ruta, evaluada a **320 / 360 / 390 / 430 px** de ancho, en **vertical y horizontal**.

- [ ] **Sin scroll horizontal**: `document.scrollingElement.scrollWidth === clientWidth` en los 4 anchos, en ambas orientaciones.
- [ ] **Objetivos táctiles**: ningún elemento interactivo (enlace, botón, input, control táctil) mide < 44×44 CSS px; separación ≥ 8 px entre objetivos adyacentes.
- [ ] **Tipografía**: texto de cuerpo ≥ 12 px efectivos; ningún texto recortado ni solapado; tablas/HUD legibles sin zoom.
- [ ] **Safe-area**: con notch / barra de gestos simulada, ningún contenido ni control queda tapado; los contenedores relevantes del área resuelven `env(safe-area-inset-*)` ≠ 0.
- [ ] **Altura / chrome**: el contenido crítico "above the fold" del área es visible con la barra de URL del navegador desplegada (medir contra `svh`); sin salto de layout al colapsar/expandir la barra.
- [ ] **`:hover` no-pegado**: tras un tap sobre cualquier control, no queda ningún estilo `:hover` aplicado.
- [ ] **`prefers-reduced-motion`**: con "Reduce motion" activo, las animaciones decorativas del área no corren; el loop de juego (si aplica) sí sigue.
- [ ] **`theme-color`**: la barra del navegador se ve con el color oscuro declarado.
- [ ] **Orientación**: en horizontal el área no rompe (sin scroll lateral, sin controles fuera de pantalla, sin HUD cortado); no se fuerza girar el dispositivo ni se muestra aviso.

## Criterios de aceptación

- [ ] `npm run dev` y `npm run build` funcionan sin errores.
- [ ] `main.css` tiene exactamente **2 breakpoints de ancho** (`640px`, `900px`) más `(pointer: coarse)`; ninguna media query usa `520/600/720/820/840/980/1100`.
- [ ] `main.css` no contiene ningún `100vh` crudo; `.home-hero` usa `calc(var(--app-svh) - 60px)`.
- [ ] `:root` define `--app-vh`, `--app-svh`, `--safe-t/-r/-b/-l`, `--tap-min`; los `@supports` promueven `dvh`/`svh` donde el navegador los soporta.
- [ ] `nuxt.config.ts` `app.head.meta` incluye `viewport` con `viewport-fit=cover` y `theme-color`; en un dispositivo con inset, `--safe-b` resuelve ≠ `0px`.
- [ ] `html, body` tienen `overscroll-behavior-y: none`; el pull-to-refresh no dispara en ninguna ruta.
- [ ] Todas las reglas `:hover` de `main.css` están dentro de `@media (hover: hover)`; en emulador táctil no hay hover pegado.
- [ ] Existe `@media (prefers-reduced-motion: reduce)` global; con "Reduce motion" activo las animaciones decorativas se detienen y el canvas de un juego real sigue animando.
- [ ] Ningún objetivo táctil < 44×44 px en `/`, `/games`, `/salon-de-la-fama`, `/auth`, `/acerca-de`.
- [ ] A 1280 px y 1440 px las 7 rutas se ven idénticas a antes del refactor (sin regresión desktop).
- [ ] La checklist de aceptación móvil (plantilla) queda documentada en este archivo para que los specs de área la copien.

## Decisiones

- **2 breakpoints, no 3–4.** Los 8 actuales colapsan limpiamente en dos clústeres de intención: "una columna / denso" (`≈ 520–720`) y "colapso estructural / nav" (`≈ 820–1100`). `640` y `900` cubren ambos con margen; un tercer punto solo añadiría ambigüedad sin caso real. `(pointer: coarse)` se mantiene como eje ortogonal (no es un ancho).
- **Convención documentada, no `@media (--custom)`.** Las custom media queries (`@custom-media`) requieren un plugin PostCSS que el repo no tiene y no se va a añadir por esta spec. El comentario de cabecera + la reescritura manual es suficiente y no añade toolchain.
- **`svh` para "debe caber sin scroll", `dvh` para "seguir al chrome".** `.home-hero` usa `svh` (debe entrar entero en la primera pintura). Se exponen ambas custom properties; cada spec de área elige. `vh` crudo queda prohibido.
- **Fallback `vh` vía `@supports`, no al revés.** `--app-svh: 100vh` por defecto y se promueve a `100svh` solo si el navegador lo soporta — así un navegador viejo nunca recibe un valor que no entiende.
- **`viewport-fit=cover` + `theme-color` en `nuxt.config.ts`, no en un `<meta>` suelto.** `app.head.meta` es el mecanismo de Nuxt 4; evita un plugin o un `useHead` por página. Se conserva `title`/`htmlAttrs` intactos.
- **`#root { padding-left/right: var(--safe-l/-r) }` como blanket horizontal.** Resuelve el notch en horizontal para las 7 rutas de una vez; los insets **verticales** (top/bottom) los añade cada área donde importan (nav sticky, footer del player, modales) porque un padding vertical global descuadraría el layout.
- **`overscroll-behavior-y: none` global.** El pull-to-refresh recargando una partida a medias o el scroll-chaining desde un modal son molestias reales; ninguna ruta necesita el gesto nativo.
- **`--tap-min` vía `min-height`/`min-width`, no agrandando `padding`.** Mantiene el aspecto CRT (bordes, `clip-path`, tipografía pixel) y solo expande el área de hit. `touch-action: manipulation` elimina el retardo de 300 ms y el doble-tap-zoom sin desactivar el scroll.
- **`:hover` bajo `@media (hover: hover)`, no `@media (any-hover)`.** En un híbrido (laptop táctil) `any-hover` dejaría el hover pegado igual; `hover: hover` lo restringe al puntero primario fino.
- **`prefers-reduced-motion` global con la barrida `*`, con excepción explícita para `<canvas>`.** Es la forma estándar (patrón de Andy Bell/Reset). El comentario deja claro que el loop rAF de los engines no es una animación CSS y no se ve afectado; los estados finales dependientes de keyframe los fija el spec del área (p. ej. `player.md` fija `width` en `.toast-saved`).
- **No se migra CSS a `<style>` por componente.** Fuera de alcance; el objetivo es que el sitio funcione en móvil, no reorganizar el CSS.

## Riesgos

| Riesgo                                                                                                                                        | Mitigación                                                                                                                                                                                                    |
| --------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Reescribir 16 media queries a mano puede introducir un shift silencioso en desktop (≥ 900 px).                                                | Paso 7: captura comparada de las 7 rutas a 1280/1440 px antes/después; las 3 fusiones que cambian de valor están marcadas para revisión puntual.                                                              |
| Subir la nav a hamburguesa a `900` (desde `840`) deja tablets 840–900 px con menú colapsado que antes tenían enlaces.                         | Es coherente con "1 escala"; a 900 px el header con logo + hamburguesa + `.auth-btn` cabe holgado. Si molesta, `nav.md` puede afinar solo ese caso — no se reabre esta spec.                                  |
| `dvh`/`svh` no soportados en un navegador viejo (WebView muy antiguo).                                                                        | El `@supports` mantiene `100vh` como fallback; el peor caso es el comportamiento actual, no una regresión.                                                                                                    |
| `viewport-fit=cover` puede meter contenido bajo el notch en horizontal si algún área no respeta `--safe-l/-r`.                                | El blanket en `#root` cubre el caso general; cada spec de área añade insets donde su contenido llega al borde.                                                                                                |
| La barrida `*` de `prefers-reduced-motion` puede romper una animación que **sí** es funcional (p. ej. un spinner de carga que deja de girar). | El spinner que deja de girar sigue siendo visible como icono estático (no bloquea nada); no hay ninguna animación CSS funcional-crítica en el repo. El canvas de juego está fuera por definición (no es CSS). |
| `spec 10` describe `.tc-bar` (obsoleta); el código trae `.tc-shell`/`.tc-dpad`/`.tc-round`.                                                   | Esta spec no toca la capa táctil; solo provee la infraestructura. La desincronización se documenta en `references/mobile-audit.md` y la explota `player.md`. No se edita `specs/10-*`.                        |

</content>
