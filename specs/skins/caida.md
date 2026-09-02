# SPEC SKINS — CAÍDA (Tetris): skins clasico / retro / neon

> **Estado:** Implementado
> **Depende de:** `specs/skins/00-contrato-skins.md`, `07-tetris-caida.md`
> **Fecha:** 2026-09-02
> **Objetivo:** Dar a `caida` los 3 skins obligatorios (`clasico` default, `retro`, `neon`) según el contrato de `specs/skins/00-contrato-skins.md`. Sacar todos los literales de color de `app/games/caida/engine.ts` a `app/games/caida/skins.ts`, implementar `setSkin` real (reemplaza el no-op `// TODO(skins/caida)` del spec 00), y cablear la prop `skin` en `app/components/games/CaidaGame.vue`. Sin cambios de jugabilidad, gravedad, line-clear, scoring, snapshot ni catálogo.

## Alcance

### En alcance

- `app/games/caida/skins.ts` (nuevo): `export const SKINS: Record<SkinId, Palette>` con las 3 paletas + `export const PIECE_COLORS: Record<SkinId, readonly (string | null)[]>` (color por índice de tetrominó, 0 = hueco).
- `app/games/caida/engine.ts`: sustituir cada literal de color por `this.palette.<rol>` / `this.pieceColors[i]`; borrar los `const GRID_LINE` y `const COLORS`; añadir `private palette`, `private pieceColors`, constructor con `skin: SkinId = "clasico"`, `setSkin` real, lógica de glow para `retro`/`neon`.
- `app/components/games/CaidaGame.vue`: `defineProps<{ skin?: SkinId }>()`, pasar el skin al constructor y `watch` → `engine.setSkin`.

### Fuera de alcance

- `PIECES` (matrices de forma), rotación, kicks, `dropInterval`, `LINE_SCORES`, `clearLines`, `ghostY`, spawn / game over, `EngineSnapshot` — sin tocar.
- El canvas de preview `nextCanvas` sigue con `clearRect` (fondo lo pone su CSS `.caida-preview`, `rgba(0,0,0,0.4)` + borde); solo cambian los colores de las piezas que dibuja.
- `app/games/registry.ts`, la fila `games` de `caida`, su `cover-*`, el seed de `scores` — sin cambios.
- Los otros engines reales (`rocas`, `bloque-buster`, `serpentina`) — cada uno en su propio `specs/skins/<id>.md`.

## Inventario de color actual (base del skin `clasico`)

Extraído de `app/games/caida/engine.ts`:

| Rol (`Palette`)                   | Dónde en el engine                                                                                                 | Valor actual                |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------ | --------------------------- |
| `bg`                              | `draw()` — hoy es `ctx.clearRect(0,0,W,H)` (canvas transparente sobre `.game-stage` / `.crt-screen`, ambos `#000`) | transparente ≡ `#000`       |
| `grid`                            | `drawGrid()` — `ctx.strokeStyle` de las líneas de rejilla (`GRID_LINE`)                                            | `rgba(255, 255, 255, 0.08)` |
| `fgDim`                           | `drawBlock()` — franja de bisel superior de cada bloque (`fillRect` de 4px)                                        | `rgba(255,255,255,0.12)`    |
| `fg`                              | — (no se usa hoy en `caida`; reservado para el glow y coherencia de contrato)                                      | —                           |
| pieza `1` (I)                     | `drawBlock()` — `COLORS[1]`                                                                                        | `#4dd0e1`                   |
| pieza `2` (O)                     | `COLORS[2]`                                                                                                        | `#ffd54f`                   |
| pieza `3` (T)                     | `COLORS[3]`                                                                                                        | `#ba68c8`                   |
| pieza `4` (S)                     | `COLORS[4]`                                                                                                        | `#81c784`                   |
| pieza `5` (Z)                     | `COLORS[5]`                                                                                                        | `#e57373`                   |
| pieza `6` (J)                     | `COLORS[6]`                                                                                                        | `#90caf9`                   |
| pieza `7` (L)                     | `COLORS[7]`                                                                                                        | `#ffb74d`                   |
| pieza `8` (N, tuerca)             | `COLORS[8]`                                                                                                        | `#9e9e9e`                   |
| `accent` / `accentAlt` / `danger` | — (no se usan hoy)                                                                                                 | reservados                  |
| `glowBlur`                        | — (no existe hoy)                                                                                                  | `0`                         |

La pieza fantasma (`ghost`) se dibuja con `drawBlock(..., alpha 0.2)` sobre el mismo color de pieza: es lógica, no color, y se conserva. El bisel se multiplica hoy por el `globalAlpha` activo (0.12 en bloque normal, 0.024 en fantasma); ese comportamiento se mantiene usando `fgDim` como cadena `rgba(...)` con el alpha 0.12 ya incluido.

### Decisión de mapeo de los 8 colores de tetrominó

Los 8 colores de pieza **no** se reducen a los roles genéricos de `Palette` sin perder identidad en `clasico` (8 tonos distintos ≠ 4 acentos). Se añade una estructura game-local `PIECE_COLORS: Record<SkinId, readonly (string | null)[]>` en `caida/skins.ts`, **fuera** del tipo `Palette` compartido — igual criterio que "cada juego mapea sus entidades": Tetris necesita un mapa por pieza más rico que los 8 roles genéricos. `Palette` cubre en `caida` solo `bg`, `grid`, `fgDim` (bisel), `fg` + `glowBlur`; `accent` / `accentAlt` / `danger` quedan reservados con valores coherentes por skin.

## Paletas (`app/games/caida/skins.ts`)

Contraste estimado con la fórmula WCAG contra el `bg` de cada skin (`ratio = (Lclaro+0.05)/(Loscuro+0.05)`). En `caida` ningún elemento es texto in-canvas: todos los pares se evalúan como **figura** (silueta de bloque / línea de rejilla), umbral ≥ 3:1.

### `clasico` — reproduce el look actual

| Rol         | Hex / valor              | Contraste vs `bg` | Nota                                                                              |
| ----------- | ------------------------ | ----------------- | --------------------------------------------------------------------------------- |
| `bg`        | `#000000`                | —                 | `fillRect` que sustituye al `clearRect` (fondo idéntico: `.game-stage` es `#000`) |
| `fg`        | `#ffffff`                | 21:1              | reservado (glow / futuro)                                                         |
| `fgDim`     | `rgba(255,255,255,0.12)` | —                 | franja de bisel, alpha 0.12 igual que hoy                                         |
| `accent`    | `#00ffff`                | 16.7:1            | reservado                                                                         |
| `accentAlt` | `#ff8200`                | 8.4:1             | reservado                                                                         |
| `danger`    | `#ff4d4d`                | ~5:1              | reservado                                                                         |
| `grid`      | `rgba(255,255,255,0.08)` | —                 | líneas de rejilla, idéntico a `GRID_LINE`                                         |
| `glowBlur`  | `0`                      | —                 | sin glow                                                                          |

`PIECE_COLORS.clasico` (índice → hex, contraste vs `#000`):

| Índice | Pieza      | Hex       | Contraste vs `bg` |
| ------ | ---------- | --------- | ----------------- |
| 1      | I          | `#4dd0e1` | ~11.4:1           |
| 2      | O          | `#ffd54f` | ~14.9:1           |
| 3      | T          | `#ba68c8` | ~5.9:1            |
| 4      | S          | `#81c784` | ~10.5:1           |
| 5      | Z          | `#e57373` | ~7.0:1            |
| 6      | J          | `#90caf9` | ~12:1             |
| 7      | L          | `#ffb74d` | ~12:1             |
| 8      | N (tuerca) | `#9e9e9e` | ~7.8:1            |

Todos ≥ 3:1 (figura). Reproduce `COLORS[1..8]` al hex exacto.

### `retro` — fósforo verde CRT (≤ 4 tonos + fondo)

| Rol         | Hex / valor              | Contraste vs `bg` | Nota                                     |
| ----------- | ------------------------ | ----------------- | ---------------------------------------- |
| `bg`        | `#04120b`                | —                 | negro con tinte verde (L ≈ 0.0048)       |
| `fg`        | `#c8ffe0`                | ~17:1             | reservado (tono más claro de la familia) |
| `fgDim`     | `rgba(200,255,224,0.12)` | —                 | bisel verde muy tenue, alpha 0.12        |
| `accent`    | `#c8ffe0`                | ~17:1             | reservado                                |
| `accentAlt` | `#4dff9b`                | ~14.7:1           | reservado                                |
| `danger`    | `#2bd47a`                | ~9.9:1            | reservado (misma familia verde)          |
| `grid`      | `rgba(77,255,155,0.10)`  | —                 | rejilla verde tenue                      |
| `glowBlur`  | `4`                      | —                 | bloom leve de fósforo                    |

`PIECE_COLORS.retro` — 4 tonos: **A** `#c8ffe0`, **B** `#4dff9b`, **C** `#2bd47a`, **D** `#1c9e57`:

| Índice | Pieza | Tono | Hex       | Contraste vs `bg` |
| ------ | ----- | ---- | --------- | ----------------- |
| 1      | I     | A    | `#c8ffe0` | ~17:1             |
| 2      | O     | B    | `#4dff9b` | ~14.7:1           |
| 3      | T     | C    | `#2bd47a` | ~9.9:1            |
| 4      | S     | B    | `#4dff9b` | ~14.7:1           |
| 5      | Z     | D    | `#1c9e57` | ~5.5:1            |
| 6      | J     | C    | `#2bd47a` | ~9.9:1            |
| 7      | L     | D    | `#1c9e57` | ~5.5:1            |
| 8      | N     | A    | `#c8ffe0` | ~17:1             |

Tonos de figura usados: A, B, C, D = **4 tonos de una misma familia + `bg`**. Cumple el límite del contrato. Piezas del mismo tono se vuelven indistinguibles al apilarse (I≡N, T≡J, Z≡L): es el look monocromo auténtico de Tetris de consola portátil y el bisel (`fgDim`) sigue marcando la retícula de celdas.

### `neon` — synthwave, glow por `shadowBlur`

| Rol         | Hex / valor              | Contraste vs `bg` | Nota                                      |
| ----------- | ------------------------ | ----------------- | ----------------------------------------- |
| `bg`        | `#05010d`                | —                 | negro con tinte violeta (L ≈ 0.0006)      |
| `fg`        | `#d9f7ff`                | ~19:1             | reservado (pálido, **no** blanco puro)    |
| `fgDim`     | `rgba(217,247,255,0.12)` | —                 | bisel, alpha 0.12                         |
| `accent`    | `#ff2bd6`                | ~6.5:1            | reservado                                 |
| `accentAlt` | `#b6ff3b`                | ~17:1             | reservado                                 |
| `danger`    | `#ff3b6b`                | ~5:1              | reservado                                 |
| `grid`      | `rgba(123,97,255,0.18)`  | —                 | rejilla violeta                           |
| `glowBlur`  | `8`                      | —                 | glow con `shadowColor` = color del bloque |

`PIECE_COLORS.neon` (índice → hex, contraste vs `#05010d`):

| Índice | Pieza | Hex       | Contraste vs `bg` |
| ------ | ----- | --------- | ----------------- |
| 1      | I     | `#00f0ff` | ~14.7:1           |
| 2      | O     | `#faff00` | ~18:1             |
| 3      | T     | `#ff2bd6` | ~6.5:1            |
| 4      | S     | `#39ff14` | ~14:1             |
| 5      | Z     | `#ff3b6b` | ~5:1              |
| 6      | J     | `#4d8bff` | ~5.3:1            |
| 7      | L     | `#ff9e00` | ~8.7:1            |
| 8      | N     | `#b06bff` | ~5.2:1            |

Todos ≥ 3:1 (figura). `glowBlur: 8` (no 12 como `rocas`): el tablero de `caida` llena de rects contiguos toda la columna de juego y un blur mayor emborrona la lectura de la pila.

## Cambios fichero por fichero

### `app/games/caida/skins.ts` (nuevo)

```ts
import type { Palette, SkinId } from "~/games/types";

export const SKINS: Record<SkinId, Palette> = {
  clasico: {
    bg: "#000000",
    fg: "#ffffff",
    fgDim: "rgba(255,255,255,0.12)",
    accent: "#00ffff",
    accentAlt: "#ff8200",
    danger: "#ff4d4d",
    grid: "rgba(255,255,255,0.08)",
    glowBlur: 0,
  },
  retro: {
    bg: "#04120b",
    fg: "#c8ffe0",
    fgDim: "rgba(200,255,224,0.12)",
    accent: "#c8ffe0",
    accentAlt: "#4dff9b",
    danger: "#2bd47a",
    grid: "rgba(77,255,155,0.10)",
    glowBlur: 4,
  },
  neon: {
    bg: "#05010d",
    fg: "#d9f7ff",
    fgDim: "rgba(217,247,255,0.12)",
    accent: "#ff2bd6",
    accentAlt: "#b6ff3b",
    danger: "#ff3b6b",
    grid: "rgba(123,97,255,0.18)",
    glowBlur: 8,
  },
};

// Índice de tetrominó -> color. Índice 0 = celda vacía (drawBlock hace early-return).
export const PIECE_COLORS: Record<SkinId, readonly (string | null)[]> = {
  clasico: [
    null,
    "#4dd0e1",
    "#ffd54f",
    "#ba68c8",
    "#81c784",
    "#e57373",
    "#90caf9",
    "#ffb74d",
    "#9e9e9e",
  ],
  retro: [
    null,
    "#c8ffe0",
    "#4dff9b",
    "#2bd47a",
    "#4dff9b",
    "#1c9e57",
    "#2bd47a",
    "#1c9e57",
    "#c8ffe0",
  ],
  neon: [
    null,
    "#00f0ff",
    "#faff00",
    "#ff2bd6",
    "#39ff14",
    "#ff3b6b",
    "#4d8bff",
    "#ff9e00",
    "#b06bff",
  ],
};
```

### `app/games/caida/engine.ts`

- Import: `import { SKINS, PIECE_COLORS } from "~/games/caida/skins";` y `Palette`, `SkinId` desde `~/games/types`.
- Borrar `const GRID_LINE` y `const COLORS` (ahora en `skins.ts`). `const PIECES` (formas) se queda.
- Campos nuevos: `private palette: Palette;` y `private pieceColors: readonly (string | null)[];`.
- Constructor: `constructor(canvas: HTMLCanvasElement, nextCanvas: HTMLCanvasElement, skin: SkinId = "clasico")` → tras obtener los contextos: `this.palette = SKINS[skin]; this.pieceColors = PIECE_COLORS[skin];`.
- `setSkin(id: SkinId): void { this.palette = SKINS[id]; this.pieceColors = PIECE_COLORS[id]; if (this.current) this.draw(); }` — reemplaza el no-op `// TODO(skins/caida)`. La guarda `if (this.current)` evita dibujar antes del primer `spawn()`.
- `drawBlock(context, x, y, colorIndex, size, alpha?, glow = true)` — nuevo último parámetro:
  - `const color = this.pieceColors[colorIndex]; if (!color) return;`
  - `context.globalAlpha = alpha ?? 1;`
  - `context.fillStyle = color;`
  - Glow: `if (glow && this.palette.glowBlur > 0) { context.shadowColor = color; context.shadowBlur = this.palette.glowBlur; }`
  - `context.fillRect(x*size+1, y*size+1, size-2, size-2);`
  - `context.shadowBlur = 0;` (el bisel no lleva glow)
  - `context.fillStyle = this.palette.fgDim;`
  - `context.fillRect(x*size+1, y*size+1, size-2, 4);`
  - `context.globalAlpha = 1;`
- `drawGrid()`: `ctx.shadowBlur = 0;` al entrar; `ctx.strokeStyle = this.palette.grid;` (resto igual).
- `drawNext()`: sin cambios salvo que `drawBlock` ya usa `this.pieceColors`. Mantiene `this.nextCtx.clearRect(...)` (fondo por CSS).
- `draw()`: sustituir `ctx.clearRect(0, 0, COLS*BLOCK, ROWS*BLOCK)` por:
  ```ts
  ctx.shadowBlur = 0;
  ctx.fillStyle = this.palette.bg;
  ctx.fillRect(0, 0, COLS * BLOCK, ROWS * BLOCK);
  ```
  El bucle de la pieza fantasma llama a `drawBlock(..., 0.2, false)` (sin glow). El bucle de la pieza activa y el de la pila usan el default `glow = true`.
- Tras estos cambios `engine.ts` no contiene ningún literal de color.

### `app/components/games/CaidaGame.vue`

```ts
import { CaidaEngine, type EngineSnapshot } from "~/games/caida/engine";
import type { SkinId } from "~/games/types";

const props = defineProps<{ skin?: SkinId }>();
// …
onMounted(() => {
  if (!canvasEl.value || !nextCanvasEl.value) return;
  engine = new CaidaEngine(canvasEl.value, nextCanvasEl.value, props.skin ?? "clasico");
  // …resto igual…
});

watch(
  () => props.skin,
  (s) => {
    if (s) engine?.setSkin(s);
  },
);
```

`defineExpose` sin cambios (`pause` / `resume` / `restart`).

## Plan de implementación

1. Crear `app/games/caida/skins.ts` con las 3 paletas y `PIECE_COLORS` exactos de arriba. Prueba: `npm run build` compila.
2. Refactor de `app/games/caida/engine.ts`: borrar `GRID_LINE` / `COLORS`, campos `palette` + `pieceColors`, constructor con `skin`, `setSkin` real, `drawBlock` con parámetro `glow` y `fgDim` en el bisel, `drawGrid` con `palette.grid`, `draw()` con `fillRect(palette.bg)`. **Sin** lógica de glow todavía (`glow` siempre efectivo pero con `glowBlur: 0` en las 3 paletas de este paso — o simplemente no tocar `shadowBlur`). Prueba: `npm run dev` → `/juego/caida/jugar` con skin `clasico` se ve **idéntico** al actual (rejilla, pila, pieza activa, fantasma con su 0.2, bisel superior, preview de siguiente pieza).
3. Activar el glow real (`glowBlur` `4` en `retro`, `8` en `neon`; `drawBlock` aplica `shadowColor`/`shadowBlur` y resetea antes del bisel; `drawGrid` fuerza `shadowBlur = 0`). Prueba: skin `neon` muestra el brillo en piezas y pila; la rejilla y el bisel se ven nítidos; la pieza fantasma no "arrastra" halo; ~60 FPS con el tablero casi lleno.
4. Cablear `CaidaGame.vue`: prop `skin`, constructor con el tercer argumento, `watch` → `setSkin`. Prueba: los 3 botones del HUD cambian el color del tablero y de la preview **en caliente**, sin reiniciar la partida (score / líneas / pila intactos); funciona también en PAUSA (redibuja al instante).
5. Verificación de la checklist de modo oscuro (sección del spec 00) para los 3 skins contra las tablas de este spec: `bg` L < 0.03 en los tres; toda pieza / rejilla ≥ 3:1; `retro` usa ≤ 4 tonos de figura + `bg`; `neon` no sube ningún color a blanco (bisel `#d9f7ff` a 0.12 alpha no cuenta como blanco a pantalla completa).
6. No-regresión: `rocas`, `bloque-buster`, `serpentina` y los juegos mock siguen igual. Recargar `/juego/caida/jugar` respeta el skin de `localStorage["av:skin"]`.

## Criterios de aceptación

- [x] `npm run build` / `npm run dev` sin errores ni `any`; `CaidaEngine` implementa `GameEngine` completo (incluido `setSkin` real).
- [x] `app/games/caida/engine.ts` no contiene ningún literal de color (`#…`, `rgb(…)`, `rgba(…)`); todo sale de `this.palette` / `this.pieceColors` (se permite `globalAlpha` numérico para pila fantasma y bisel).
- [ ] Skin `clasico` produce un render **pixel-equivalente** al de hoy: rejilla `rgba(255,255,255,0.08)`, 8 colores de pieza al hex exacto, bisel superior `rgba(255,255,255,0.12)` (0.024 en la fantasma), preview de siguiente pieza.
- [ ] Skin `retro`: verde fósforo, ≤ 4 tonos de figura + `bg`; pila y pieza activa legibles (≥ 3:1); rejilla visible pero no dominante.
- [ ] Skin `neon`: glow visible en piezas y pila vía `shadowBlur`, rejilla y bisel sin glow y nítidos, ningún color forzado a blanco, ~60 FPS con el tablero lleno.
- [ ] Los 3 botones del HUD cambian el skin **en caliente** (sin reiniciar) y también en PAUSA; la selección persiste en `localStorage["av:skin"]` y sobrevive a recargar y a cambiar de juego real.
- [ ] `rocas`, `bloque-buster`, `serpentina` y los juegos mock: sin cambios visibles ni de comportamiento.
- [ ] Todas las casillas de la checklist de modo oscuro del spec 00 marcadas, con las tablas `rol → hex → contraste` de este spec como evidencia.

## Decisiones

- **`PIECE_COLORS` game-local en `caida/skins.ts`, fuera del tipo `Palette`. Sí.** 8 colores de pieza no caben en 4 acentos genéricos sin destruir la identidad de `clasico`; un `Record<SkinId, readonly (string|null)[]>` de 9 posiciones (0 = hueco) espeja el `COLORS` original y mantiene `engine.ts` sin literales. `Palette` sigue siendo el contrato compartido intacto.
- **`retro` colapsa las 7 piezas + tuerca a 4 tonos de verde. Sí.** El contrato limita `retro` a ≤ 4 tonos + `bg`; el Tetris monocromo de consola portátil es exactamente esto. Se aceptan colisiones visuales (I≡N, T≡J, Z≡L); el bisel `fgDim` conserva la retícula de celdas.
- **El bisel superior se mapea a `fgDim` como cadena `rgba(...)` con alpha 0.12 incluido, no vía helper. Sí.** Evita duplicar el `rgbaFrom` de `asteroids`; el `globalAlpha` activo sigue multiplicando (0.12 normal, 0.024 fantasma) sin cambios de lógica.
- **`draw()` sustituye `clearRect` por `fillRect(palette.bg)`. Sí.** `clasico.bg = #000000` es idéntico al `#000` de `.game-stage` que hoy se ve por transparencia; `retro` / `neon` ganan su tinte de fondo. El canvas de preview mantiene `clearRect` porque su fondo lo pone el CSS (`.caida-preview`).
- **`drawBlock` recibe `glow = true` por defecto; la fantasma pasa `false`. Sí.** La pieza fantasma a 0.2 de alpha con halo se ve sucia; excluirla es un `boolean` barato.
- **`glowBlur: 8` en `neon` (no 12 como `rocas`). Sí.** El tablero llena de rects contiguos toda la columna; 12 emborrona la lectura de la pila. 8 se ve y mantiene FPS.
- **`setSkin` llama a `this.draw()` solo si `this.current` existe. Sí.** `draw()` dereferencia `this.current.shape`; la guarda cubre la ventana entre `new` y el primer `spawn()`. Durante el juego el loop ya redibuja cada frame.
- **`fg` / `accent` / `accentAlt` / `danger` en la paleta aunque `caida` casi no los use. Sí.** Son parte del contrato compartido; se rellenan con valores coherentes por skin (familia verde en `retro`, synthwave en `neon`) para no dejar la `Palette` incompleta.
- **Sin cambios en `registry.ts`, catálogo ni `scores`. Correcto.** Los skins son 100% presentación del canvas.

## Riesgos

- **Regresión sutil en `clasico`.** El orden `fillStyle` bloque → `shadowBlur = 0` → `fillStyle` bisel → `fillRect` debe respetar el `globalAlpha` activo igual que hoy. Mitigación: el Paso 2 implementa `clasico` **sin** glow y se compara lado a lado con la build actual antes de seguir.
- **`shadowBlur` no reseteado antes de la rejilla o el bisel.** Dejaría la rejilla y el bisel difuminados en `retro` / `neon`. Cubierto por el reset explícito en `drawBlock` (antes del bisel) y al entrar en `drawGrid`, más un criterio de aceptación.
- **Colisiones de tono en `retro`.** I≡N, T≡J, Z≡L comparten color: al apilarse cuesta distinguir piezas ya bloqueadas. Es intencional (límite de 4 tonos) pero conviene validar que el bisel de celda da suficiente separación; si no, subir la franja de bisel a 6px **solo si** la prueba lo exige (no en este spec).
- **Coste del glow en `neon`.** Tablero casi lleno (~200 celdas) + preview con `shadowBlur: 8` puede bajar FPS en equipos lentos. Si en el Paso 3 baja de ~55 FPS, reducir `neon.glowBlur` a 6 y/o no aplicar glow a los bloques ya bloqueados de la pila (solo a la pieza activa).
- **Persistencia compartida entre juegos.** `av:skin` es global (decisión del spec 00): elegir `neon` en `caida` lo aplica también a `rocas` / `bloque-buster` / `serpentina` cuando tengan su spec. Recordarlo al validar.
