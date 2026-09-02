# SPEC SKINS — SERPENTINA (Snake): skins clasico / retro / neon

> **Estado:** Implementado
> **Depende de:** `specs/skins/00-contrato-skins.md`, `09-snake-serpentina.md`
> **Fecha:** 2026-09-02
> **Objetivo:** Dar a `serpentina` los 3 skins obligatorios (`clasico` default, `retro`, `neon`) según el contrato de `specs/skins/00-contrato-skins.md`. Sacar todos los literales de color de `app/games/serpentina/engine.ts` a `app/games/serpentina/skins.ts`, implementar `setSkin` real (reemplaza el no-op `// TODO(skins/serpentina)` del spec 00), y cablear la prop `skin` en `app/components/games/SerpentinaGame.vue`. Sin cambios de movimiento por grilla, crecimiento, velocidad por nivel, colisiones, scoring, snapshot ni catálogo.

## Alcance

### En alcance

- `app/games/serpentina/skins.ts` (nuevo): `export const SKINS: Record<SkinId, Palette>` con las 3 paletas.
- `app/games/serpentina/engine.ts`: sustituir cada literal de color por `this.palette.<rol>`; añadir `private palette`, constructor con `skin: SkinId = "clasico"`, `setSkin` real, glow para `retro`/`neon` (segmentos + halo de la fruta).
- `app/components/games/SerpentinaGame.vue`: `defineProps<{ skin?: SkinId }>()`, pasar el skin al constructor y `watch` → `engine.setSkin`.

### Fuera de alcance

- `FRUIT_ATLAS`, `FRUIT_KEYS`, la carga de `fruits.png`, `drawImage` del sprite (el bitmap **no** se recolorea), grilla lógica (`COLS` / `ROWS` / `CELL`), `MOVE_INTERVAL_*`, `step`, colisiones, `spawnFood`, `EngineSnapshot` — sin tocar.
- Añadir una rejilla dibujada: hoy `serpentina` no dibuja líneas de grilla y este spec **no** las introduce (`grid` queda reservado).
- `app/games/registry.ts`, la fila `games` de `serpentina`, su `cover-*`, el seed de `scores`, el asset `public/games/serpentina/fruits.png` — sin cambios.
- Los otros engines reales (`rocas`, `caida`, `bloque-buster`) — cada uno en su propio `specs/skins/<id>.md`.

## Inventario de color actual (base del skin `clasico`)

Extraído de `app/games/serpentina/engine.ts` (`draw()`):

| Rol (`Palette`)                 | Dónde en el engine                                                                       | Valor actual                                   |
| ------------------------------- | ---------------------------------------------------------------------------------------- | ---------------------------------------------- |
| `bg`                            | `ctx.fillStyle = "#000"` del `fillRect(0,0,W,H)`                                         | `#000`                                         |
| `fg`                            | cabeza de la serpiente — `ctx.fillStyle = i === 0 ? "#4ade80" : …`                       | `#4ade80`                                      |
| `fgDim`                         | cuerpo de la serpiente — `… : "#16a34a"`                                                 | `#16a34a`                                      |
| `accent`                        | cuadro de reserva de la fruta cuando `fruits.png` aún no cargó (`fillStyle = "#ef4444"`) | `#ef4444`                                      |
| `accentAlt` / `danger` / `grid` | — (no se usan hoy)                                                                       | reservados                                     |
| `glowBlur`                      | — (no existe hoy)                                                                        | `0`                                            |
| —                               | fruta cargada — `ctx.drawImage(this.fruitImage, …)`                                      | sprite RGBA (sin literal de color; no se toca) |

La fruta, cuando el sprite está cargado, se dibuja con `drawImage`: **no hay literal de color** y el bitmap no se altera en ningún skin. En `retro` / `neon` se le añade un **halo** (`shadowColor` = `palette.accent`, `shadowBlur` = `palette.glowBlur`) sin recolorear el sprite. El cuadro `#ef4444` es solo el _fallback_ previo a la carga.

### Decisión de mapeo

`serpentina` es el engine más simple: 3 colores reales (`#000` fondo, `#4ade80` cabeza, `#16a34a` cuerpo) + 1 _fallback_ (`#ef4444`). Mapeo directo sin estructuras game-local: `bg` → fondo, `fg` → cabeza, `fgDim` → cuerpo, `accent` → _fallback_ de fruta + halo. `fgDim` aquí se usa como **figura** (segmento de cuerpo), no como texto, así que aplica el umbral ≥ 3:1.

## Paletas (`app/games/serpentina/skins.ts`)

Contraste estimado con la fórmula WCAG contra el `bg` de cada skin. No hay texto in-canvas: todos los pares son **figura** (segmento / cuadro de fruta), umbral ≥ 3:1.

### `clasico` — reproduce el look actual

| Rol         | Hex / valor              | Contraste vs `bg` | Nota                                          |
| ----------- | ------------------------ | ----------------- | --------------------------------------------- |
| `bg`        | `#000000`                | —                 | `fillRect(0,0,W,H)`, idéntico a `#000`        |
| `fg`        | `#4ade80`                | ~12:1             | cabeza de la serpiente                        |
| `fgDim`     | `#16a34a`                | ~6.3:1            | cuerpo de la serpiente (figura, ≥ 3:1)        |
| `accent`    | `#ef4444`                | ~5.6:1            | _fallback_ de fruta antes de cargar el sprite |
| `accentAlt` | `#facc15`                | ~11:1             | reservado                                     |
| `danger`    | `#ef4444`                | ~5.6:1            | reservado (= `accent`)                        |
| `grid`      | `rgba(255,255,255,0.06)` | —                 | reservado (no se dibuja)                      |
| `glowBlur`  | `0`                      | —                 | sin glow                                      |

Reproduce `#4ade80` / `#16a34a` / `#ef4444` al hex exacto. Fondo `#000` idéntico.

### `retro` — fósforo verde CRT (≤ 4 tonos + fondo)

| Rol         | Hex / valor              | Contraste vs `bg` | Nota                                  |
| ----------- | ------------------------ | ----------------- | ------------------------------------- |
| `bg`        | `#04120b`                | —                 | negro con tinte verde (L ≈ 0.0048)    |
| `fg`        | `#9bffc0`                | ~15.9:1           | cabeza (tono más claro)               |
| `fgDim`     | `#3fdd85`                | ~10.8:1           | cuerpo                                |
| `accent`    | `#c8ffe0`                | ~17:1             | _fallback_ de fruta + halo del sprite |
| `accentAlt` | `#3fdd85`                | ~10.8:1           | reservado                             |
| `danger`    | `#c8ffe0`                | ~17:1             | reservado                             |
| `grid`      | `rgba(155,255,192,0.08)` | —                 | reservado                             |
| `glowBlur`  | `4`                      | —                 | bloom leve de fósforo                 |

Tonos de figura: `#9bffc0`, `#3fdd85`, `#c8ffe0` = **3 tonos de una misma familia + `bg`**. Cumple el límite (≤ 4). Snake monocromo verde: el arquetipo del género.

### `neon` — synthwave, glow por `shadowBlur`

| Rol         | Hex / valor | Contraste vs `bg` | Nota                                            |
| ----------- | ----------- | ----------------- | ----------------------------------------------- |
| `bg`        | `#05010d`   | —                 | negro con tinte violeta (L ≈ 0.0006)            |
| `fg`        | `#aaff00`   | ~15:1             | cabeza — lima eléctrico, glow lima              |
| `fgDim`     | `#00e0ff`   | ~11.7:1           | cuerpo — cian, glow cian                        |
| `accent`    | `#ff2bd6`   | ~6.5:1            | _fallback_ de fruta + halo del sprite (magenta) |
| `accentAlt` | `#b6ff3b`   | ~17:1             | reservado                                       |
| `danger`    | `#ff3b6b`   | ~5:1              | reservado                                       |
| `grid`      | `#20124a`   | ~1.6:1            | reservado                                       |
| `glowBlur`  | `8`         | —                 | glow con `shadowColor` = color del segmento     |

Serpiente de dos tonos (cabeza lima, cuerpo cian) con glow por segmento; el `bg` violeta muy oscuro da el aire synthwave. `glowBlur: 8` (no 12 como `rocas`): la serpiente larga son muchos rects de 32px contiguos.

## Cambios fichero por fichero

### `app/games/serpentina/skins.ts` (nuevo)

```ts
import type { Palette, SkinId } from "~/games/types";

export const SKINS: Record<SkinId, Palette> = {
  clasico: {
    bg: "#000000",
    fg: "#4ade80",
    fgDim: "#16a34a",
    accent: "#ef4444",
    accentAlt: "#facc15",
    danger: "#ef4444",
    grid: "rgba(255,255,255,0.06)",
    glowBlur: 0,
  },
  retro: {
    bg: "#04120b",
    fg: "#9bffc0",
    fgDim: "#3fdd85",
    accent: "#c8ffe0",
    accentAlt: "#3fdd85",
    danger: "#c8ffe0",
    grid: "rgba(155,255,192,0.08)",
    glowBlur: 4,
  },
  neon: {
    bg: "#05010d",
    fg: "#aaff00",
    fgDim: "#00e0ff",
    accent: "#ff2bd6",
    accentAlt: "#b6ff3b",
    danger: "#ff3b6b",
    grid: "#20124a",
    glowBlur: 8,
  },
};
```

### `app/games/serpentina/engine.ts`

- Import: `import { SKINS } from "~/games/serpentina/skins";` y `Palette`, `SkinId` desde `~/games/types`.
- Campo nuevo: `private palette: Palette;`.
- Constructor: `constructor(canvas: HTMLCanvasElement, skin: SkinId = "clasico")` → tras obtener el contexto y antes de `this.fruitImage.src = …`: `this.palette = SKINS[skin];`.
- `setSkin(id: SkinId): void { this.palette = SKINS[id]; this.draw(); }` — reemplaza el no-op `// TODO(skins/serpentina)`. `draw()` es seguro en cualquier momento (`this.snake` arranca `[]`, `this.food` está inicializado).
- `draw()`:
  - Fondo: `ctx.shadowBlur = 0; ctx.fillStyle = this.palette.bg; ctx.fillRect(0, 0, W, H);`
  - Bucle de segmentos: `const c = i === 0 ? this.palette.fg : this.palette.fgDim; ctx.fillStyle = c; if (this.palette.glowBlur > 0) { ctx.shadowColor = c; ctx.shadowBlur = this.palette.glowBlur; } ctx.fillRect(seg.x * CELL, seg.y * CELL, CELL, CELL);`. Tras el bucle: `ctx.shadowBlur = 0;`.
  - Fruta con sprite cargado: si `this.palette.glowBlur > 0` → `ctx.shadowColor = this.palette.accent; ctx.shadowBlur = this.palette.glowBlur;` antes del `drawImage`; después `ctx.shadowBlur = 0;`. El `drawImage` no cambia.
  - Fruta _fallback_ (sprite no cargado): `ctx.fillStyle = this.palette.accent;` (era `#ef4444`) + mismo glow opcional; `ctx.shadowBlur = 0;` al terminar.
- Tras estos cambios `engine.ts` no contiene ningún literal de color.

### `app/components/games/SerpentinaGame.vue`

```ts
import { SerpentinaEngine, type EngineSnapshot } from "~/games/serpentina/engine";
import type { SkinId } from "~/games/types";

const props = defineProps<{ skin?: SkinId }>();
// …
onMounted(() => {
  if (!canvasEl.value) return;
  engine = new SerpentinaEngine(canvasEl.value, props.skin ?? "clasico");
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

1. Crear `app/games/serpentina/skins.ts` con las 3 paletas exactas de arriba. Prueba: `npm run build` compila.
2. Refactor de `app/games/serpentina/engine.ts`: campo `palette`, constructor con `skin`, `setSkin` real, `draw()` con `palette.bg` / `palette.fg` / `palette.fgDim` / `palette.accent`. **Sin** glow todavía. Prueba: `npm run dev` → `/juego/serpentina/jugar` con skin `clasico` se ve **idéntico** al actual (cabeza `#4ade80`, cuerpo `#16a34a`, fondo negro, sprite de fruta sin halo; el cuadro `#ef4444` solo si se fuerza el fallback).
3. Añadir el glow (segmentos con `shadowColor` = color propio; halo de la fruta con `palette.accent`; reset de `shadowBlur` tras segmentos y tras la fruta). Prueba: skin `neon` — cabeza lima y cuerpo cian brillan; la fruta tiene halo magenta; el fondo no arrastra sombra; ~60 FPS con la serpiente muy larga (≥ 40 segmentos).
4. Cablear `SerpentinaGame.vue`: prop `skin`, constructor con el segundo argumento, `watch` → `setSkin`. Prueba: los 3 botones del HUD cambian el color **en caliente**, sin reiniciar la partida (score / largo / nivel intactos); funciona también en PAUSA.
5. Verificación de la checklist de modo oscuro (spec 00) para los 3 skins contra las tablas de este spec: `bg` L < 0.03 en los tres; cabeza / cuerpo / cuadro de fruta ≥ 3:1; `retro` usa 3 tonos de figura + `bg`; `neon` sin ningún color a blanco.
6. No-regresión: `rocas`, `caida`, `bloque-buster` y los juegos mock siguen igual. Recargar `/juego/serpentina/jugar` respeta el skin de `localStorage["av:skin"]`.

## Criterios de aceptación

- [x] `npm run build` / `npm run dev` sin errores ni `any`; `SerpentinaEngine` implementa `GameEngine` completo (incluido `setSkin` real).
- [x] `app/games/serpentina/engine.ts` no contiene ningún literal de color; todo sale de `this.palette`.
- [ ] Skin `clasico` produce un render **pixel-equivalente** al de hoy: cabeza `#4ade80`, cuerpo `#16a34a`, fondo `#000`, sprite de fruta sin halo, _fallback_ `#ef4444`.
- [ ] Skin `retro`: verde fósforo, 3 tonos de figura + `bg`; cabeza y cuerpo distinguibles entre sí y legibles (≥ 3:1).
- [ ] Skin `neon`: glow visible en segmentos vía `shadowBlur` (cabeza y cuerpo con su color propio), halo en la fruta con `palette.accent`, fondo sin sombra, ningún color forzado a blanco, ~60 FPS con la serpiente muy larga.
- [ ] El sprite de la fruta (`fruits.png`) se dibuja sin recolorear en los 3 skins; solo cambia el halo (ninguno en `clasico`).
- [ ] Los 3 botones del HUD cambian el skin **en caliente** (sin reiniciar) y también en PAUSA; la selección persiste en `localStorage["av:skin"]` y sobrevive a recargar y a cambiar de juego real.
- [ ] `rocas`, `caida`, `bloque-buster` y los juegos mock: sin cambios visibles ni de comportamiento.
- [ ] Todas las casillas de la checklist de modo oscuro del spec 00 marcadas, con las tablas `rol → hex → contraste` de este spec como evidencia.

## Decisiones

- **Mapeo directo a `Palette`, sin estructura game-local. Sí.** `serpentina` solo tiene 3 colores reales + 1 _fallback_; `fg` = cabeza, `fgDim` = cuerpo, `accent` = _fallback_ + halo de fruta. No hace falta un `Record` extra como en `caida` / `bloque-buster`.
- **`fgDim` se usa para el cuerpo (figura), no para texto. Sí.** El contrato pide `fgDim` ≥ 4.5:1 _solo cuando es texto_; aquí es una silueta y basta ≥ 3:1. Las 3 paletas lo cumplen de sobra (≥ 6.3:1).
- **El sprite de la fruta NO se recolorea en ningún skin. Sí.** Recolorear un bitmap RGBA fotográfico requiere `ctx.filter` (frágil, coste por frame) y estropearía el arte. En `retro` / `neon` se le añade solo un halo (`shadowColor` = `palette.accent`) para integrarlo; en `clasico` no lleva halo. La fruta a color sobre fondo verde en `retro` es un contraste aceptable (un único tile de 32px).
- **`neon` da cabeza y cuerpo de hues distintos (lima / cian). Sí.** Un solo tono no leería la dirección de la serpiente; dos neones contiguos con glow propio es la firma synthwave y mantiene cabeza ≠ cuerpo.
- **`retro` con 3 tonos (no 4). Sí.** El género no necesita más; queda margen bajo el límite de 4 del contrato.
- **`glowBlur: 8` en `neon` (no 12 como `rocas`). Sí.** Serpiente larga = decenas de rects de 32px contiguos; 12 los funde. 8 se ve y mantiene FPS.
- **`setSkin` llama a `this.draw()` siempre. Sí.** `draw()` es seguro sin estado (`snake = []`, `food` inicializado); el cambio se ve al instante en pausa o detenido, y el loop lo redibuja en juego normal.
- **`accentAlt` / `danger` / `grid` en la paleta aunque no se usen. Sí.** Contrato compartido; valores coherentes por skin. `grid` reservado: este spec no añade rejilla dibujada.
- **Sin cambios en `registry.ts`, catálogo, `scores` ni el asset `fruits.png`. Correcto.** Los skins son 100% presentación del canvas.

## Riesgos

- **Regresión sutil en `clasico`.** El bucle de segmentos dibuja de la cola a la cabeza (`for i = length-1 … 0`); el refactor no debe alterar ese orden ni el `fillRect` por celda. Mitigación: Paso 2 implementa `clasico` **sin** glow y se compara lado a lado.
- **`shadowBlur` no reseteado.** Si el bucle de segmentos no limpia `shadowBlur`, el `drawImage` de la fruta y el `fillRect` de fondo del siguiente frame saldrían con halo. Cubierto por resets explícitos tras los segmentos y tras la fruta, más un criterio de aceptación.
- **Halo de la fruta sobre sprite fotográfico.** En `retro` el sprite a color rodeado de halo verde puede desentonar. Es un único tile pequeño y el resto de la pantalla es coherente; si en revisión molesta, bajar el halo de la fruta a `glowBlur / 2` **solo si** la prueba lo exige (no en este spec).
- **Coste del glow en `neon`.** Serpiente de 40+ segmentos con `shadowBlur: 8` por celda puede bajar FPS en equipos lentos. Si en el Paso 3 baja de ~55 FPS, reducir `neon.glowBlur` a 6 y/o aplicar glow solo a la cabeza y a los primeros N segmentos.
- **Persistencia compartida entre juegos.** `av:skin` es global (spec 00): elegir `neon` aquí lo aplica también a los demás engines reales cuando tengan su spec.
