# SPEC SKINS — BLOQUE BUSTER (Arkanoid): skins clasico / retro / neon

> **Estado:** Implementado
> **Depende de:** `specs/skins/00-contrato-skins.md`, `08-arkanoid-bloque-buster.md`
> **Fecha:** 2026-09-02
> **Objetivo:** Dar a `bloque-buster` los 3 skins obligatorios (`clasico` default, `retro`, `neon`) según el contrato de `specs/skins/00-contrato-skins.md`. Sacar todos los literales de color de `app/games/bloque-buster/engine.ts` a `app/games/bloque-buster/skins.ts`, implementar `setSkin` real (reemplaza el no-op `// TODO(skins/bloque-buster)` del spec 00), y cablear la prop `skin` en `app/components/games/BloqueBusterGame.vue`. Sin cambios de física, rebotes, niveles, scoring, vidas, snapshot ni catálogo.

## Alcance

### En alcance

- `app/games/bloque-buster/skins.ts` (nuevo): `export const SKINS: Record<SkinId, Palette>` con las 3 paletas + `export const BRICK_COLORS: Record<SkinId, Record<BrickKey, string>>` (color por clave de ladrillo).
- `app/games/bloque-buster/engine.ts`: sustituir cada literal de color por `this.palette.<rol>` / `this.brickColors[key]`; añadir `private palette`, `private brickColors`, constructor con `skin: SkinId = "clasico"`, `setSkin` real, lógica de glow para `retro`/`neon`. Las claves `"red" | "yellow" | "cyan" | "magenta" | "hotpink" | "green" | "gray"` de `LEVELS` pasan a ser **identificadores de rol de ladrillo**, no colores.
- `app/components/games/BloqueBusterGame.vue`: `defineProps<{ skin?: SkinId }>()`, pasar el skin al constructor y `watch` → `engine.setSkin`.

### Fuera de alcance

- `LEVELS` (layouts de bloques), `PADDLE_*`, `BALL_*`, rebotes, `EXPLOSION_DURATION`, partículas (cantidad / ángulos / velocidad), colisión AABB, vidas, cambio de nivel, `won`, `EngineSnapshot` — sin tocar. Solo cambia **cómo se resuelve el color** de cada clave de ladrillo.
- `app/games/registry.ts`, la fila `games` de `bloque-buster`, su `cover-*`, el seed de `scores` — sin cambios.
- Los otros engines reales (`rocas`, `caida`, `serpentina`) — cada uno en su propio `specs/skins/<id>.md`.

## Inventario de color actual (base del skin `clasico`)

Extraído de `app/games/bloque-buster/engine.ts`:

| Rol (`Palette`)                                      | Dónde en el engine                                                                                                                                 | Valor actual                                     |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| `bg`                                                 | `draw()` — `ctx.fillStyle` del `fillRect(0,0,W,H)`                                                                                                 | `#000`                                           |
| ladrillo `red`                                       | `draw()` (`ctx.fillStyle = block.color`) + partículas de `spawnExplosion`                                                                          | `"red"` ≡ `#ff0000`                              |
| ladrillo `yellow`                                    | idem                                                                                                                                               | `"yellow"` ≡ `#ffff00`                           |
| ladrillo `cyan`                                      | idem                                                                                                                                               | `"cyan"` ≡ `#00ffff`                             |
| ladrillo `magenta`                                   | idem                                                                                                                                               | `"magenta"` ≡ `#ff00ff`                          |
| ladrillo `hotpink`                                   | idem                                                                                                                                               | `"hotpink"` ≡ `#ff69b4`                          |
| ladrillo `green`                                     | idem                                                                                                                                               | `"green"` ≡ `#008000` (¡CSS `green`, no `#0f0`!) |
| ladrillo `gray`                                      | idem                                                                                                                                               | `"gray"` ≡ `#808080`                             |
| `fg`                                                 | `draw()` — flash blanco de explosión (`fillStyle = "#fff"`, alpha `1-t`), paleta (`fillStyle = "#fff"`), bola (hereda el `fillStyle` de la paleta) | `#fff`                                           |
| `fgDim` / `accent` / `accentAlt` / `danger` / `grid` | — (no se usan hoy)                                                                                                                                 | reservados                                       |
| `glowBlur`                                           | — (no existe hoy)                                                                                                                                  | `0`                                              |

Notas:

- La **bola** no fija `fillStyle` propio: hereda el `"#fff"` que dejó la paleta justo antes. En el refactor se fija `ctx.fillStyle = this.palette.fg` explícitamente antes del `arc` de la bola.
- Las claves de `LEVELS` (`rowColors1`, `rowColors2`, `rowColors4`, y los literales `"yellow"` / `"magenta"` / `"hotpink"` / `"cyan"` en `l3` y `l5`) son 7 nombres CSS. Pasan a ser claves de `BRICK_COLORS`; el layout de cada nivel no cambia.
- El flash blanco de explosión (`#fff` con `globalAlpha = 1 - t`) conserva su desvanecido por TTL; solo cambia el color base a `palette.fg`.

### Decisión de mapeo de los 7 colores de ladrillo

Los 7 nombres CSS de ladrillo **no** se reducen a los acentos genéricos de `Palette` sin perder identidad en `clasico`. Se añade `BRICK_COLORS: Record<SkinId, Record<BrickKey, string>>` en `bloque-buster/skins.ts`, **fuera** del tipo `Palette` compartido, con `type BrickKey = "red" | "yellow" | "cyan" | "magenta" | "hotpink" | "green" | "gray"`. `Palette` cubre en `bloque-buster` solo `bg`, `fg` (paleta + bola + flash) + `glowBlur`; el resto de roles quedan reservados con valores coherentes por skin.

## Paletas (`app/games/bloque-buster/skins.ts`)

Contraste estimado con la fórmula WCAG contra el `bg` de cada skin. En `bloque-buster` no hay texto in-canvas: todos los pares se evalúan como **figura** (ladrillo / paleta / bola / partícula), umbral ≥ 3:1.

### `clasico` — reproduce el look actual

| Rol         | Hex / valor              | Contraste vs `bg` | Nota                                   |
| ----------- | ------------------------ | ----------------- | -------------------------------------- |
| `bg`        | `#000000`                | —                 | `fillRect(0,0,W,H)`, idéntico a `#000` |
| `fg`        | `#ffffff`                | 21:1              | paleta, bola, flash de explosión       |
| `fgDim`     | `rgba(255,255,255,0.65)` | ~8.6:1            | reservado                              |
| `accent`    | `#00ffff`                | 16.7:1            | reservado                              |
| `accentAlt` | `#ff69b4`                | ~7.9:1            | reservado                              |
| `danger`    | `#ff0000`                | ~5.3:1            | reservado                              |
| `grid`      | `#1e2130`                | ~1.3:1            | reservado (no se dibuja)               |
| `glowBlur`  | `0`                      | —                 | sin glow                               |

`BRICK_COLORS.clasico` (clave → hex = nombre CSS exacto, contraste vs `#000`):

| Clave     | Hex       | Contraste vs `bg` |
| --------- | --------- | ----------------- |
| `red`     | `#ff0000` | ~5.3:1            |
| `yellow`  | `#ffff00` | ~19.6:1           |
| `cyan`    | `#00ffff` | ~16.7:1           |
| `magenta` | `#ff00ff` | ~6.7:1            |
| `hotpink` | `#ff69b4` | ~7.9:1            |
| `green`   | `#008000` | ~4.1:1            |
| `gray`    | `#808080` | ~5.3:1            |

Todos ≥ 3:1 (figura). `green` es CSS `#008000` (~4.1:1) — se conserva tal cual porque `clasico` = look actual.

### `retro` — fósforo verde CRT (≤ 4 tonos + fondo)

| Rol         | Hex / valor | Contraste vs `bg` | Nota                                 |
| ----------- | ----------- | ----------------- | ------------------------------------ |
| `bg`        | `#04120b`   | —                 | negro con tinte verde (L ≈ 0.0048)   |
| `fg`        | `#c8ffe0`   | ~17:1             | paleta, bola, flash (tono más claro) |
| `fgDim`     | `#4dff9b`   | ~14.7:1           | reservado                            |
| `accent`    | `#c8ffe0`   | ~17:1             | reservado                            |
| `accentAlt` | `#2bd47a`   | ~9.9:1            | reservado                            |
| `danger`    | `#1c9e57`   | ~5.5:1            | reservado                            |
| `grid`      | `#0c3a24`   | ~1.7:1            | reservado                            |
| `glowBlur`  | `4`         | —                 | bloom leve de fósforo                |

`BRICK_COLORS.retro` — 4 tonos: **A** `#c8ffe0`, **B** `#4dff9b`, **C** `#2bd47a`, **D** `#1c9e57` (`fg` = A, total figura = 4 tonos + `bg`):

| Clave     | Tono | Hex       | Contraste vs `bg` |
| --------- | ---- | --------- | ----------------- |
| `red`     | D    | `#1c9e57` | ~5.5:1            |
| `yellow`  | A    | `#c8ffe0` | ~17:1             |
| `cyan`    | B    | `#4dff9b` | ~14.7:1           |
| `magenta` | C    | `#2bd47a` | ~9.9:1            |
| `hotpink` | C    | `#2bd47a` | ~9.9:1            |
| `green`   | B    | `#4dff9b` | ~14.7:1           |
| `gray`    | D    | `#1c9e57` | ~5.5:1            |

Tonos de figura usados: A, B, C, D = **4 tonos de una misma familia + `bg`**. Cumple el límite. Las filas de ladrillos se leen como bandas de brillo (claro arriba / oscuro abajo según nivel), estética de monitor monocromo.

### `neon` — synthwave, glow por `shadowBlur`

| Rol         | Hex / valor | Contraste vs `bg` | Nota                                        |
| ----------- | ----------- | ----------------- | ------------------------------------------- |
| `bg`        | `#05010d`   | —                 | negro con tinte violeta (L ≈ 0.0006)        |
| `fg`        | `#00f0ff`   | ~14.7:1           | paleta, bola, flash — cian, **no** blanco   |
| `fgDim`     | `#9a86ff`   | ~7.1:1            | reservado                                   |
| `accent`    | `#ff2bd6`   | ~6.5:1            | reservado                                   |
| `accentAlt` | `#b6ff3b`   | ~17:1             | reservado                                   |
| `danger`    | `#ff3b6b`   | ~5:1              | reservado                                   |
| `grid`      | `#20124a`   | ~1.6:1            | reservado                                   |
| `glowBlur`  | `8`         | —                 | glow con `shadowColor` = color del elemento |

`BRICK_COLORS.neon` (clave → hex, contraste vs `#05010d`):

| Clave     | Hex       | Contraste vs `bg` |
| --------- | --------- | ----------------- |
| `red`     | `#ff3b6b` | ~5:1              |
| `yellow`  | `#faff00` | ~18:1             |
| `cyan`    | `#00f0ff` | ~14.7:1           |
| `magenta` | `#ff2bd6` | ~6.5:1            |
| `hotpink` | `#ff6ad5` | ~7:1              |
| `green`   | `#39ff14` | ~14:1             |
| `gray`    | `#9a86ff` | ~7.1:1            |

Todos ≥ 3:1 (figura). `glowBlur: 8` (no 12 como `rocas`): hasta 60 ladrillos rectangulares contiguos + flash + partículas; 12 satura la mitad superior de la pantalla.

## Cambios fichero por fichero

### `app/games/bloque-buster/skins.ts` (nuevo)

```ts
import type { Palette, SkinId } from "~/games/types";

export type BrickKey = "red" | "yellow" | "cyan" | "magenta" | "hotpink" | "green" | "gray";

export const SKINS: Record<SkinId, Palette> = {
  clasico: {
    bg: "#000000",
    fg: "#ffffff",
    fgDim: "rgba(255,255,255,0.65)",
    accent: "#00ffff",
    accentAlt: "#ff69b4",
    danger: "#ff0000",
    grid: "#1e2130",
    glowBlur: 0,
  },
  retro: {
    bg: "#04120b",
    fg: "#c8ffe0",
    fgDim: "#4dff9b",
    accent: "#c8ffe0",
    accentAlt: "#2bd47a",
    danger: "#1c9e57",
    grid: "#0c3a24",
    glowBlur: 4,
  },
  neon: {
    bg: "#05010d",
    fg: "#00f0ff",
    fgDim: "#9a86ff",
    accent: "#ff2bd6",
    accentAlt: "#b6ff3b",
    danger: "#ff3b6b",
    grid: "#20124a",
    glowBlur: 8,
  },
};

export const BRICK_COLORS: Record<SkinId, Record<BrickKey, string>> = {
  clasico: {
    red: "#ff0000",
    yellow: "#ffff00",
    cyan: "#00ffff",
    magenta: "#ff00ff",
    hotpink: "#ff69b4",
    green: "#008000",
    gray: "#808080",
  },
  retro: {
    red: "#1c9e57",
    yellow: "#c8ffe0",
    cyan: "#4dff9b",
    magenta: "#2bd47a",
    hotpink: "#2bd47a",
    green: "#4dff9b",
    gray: "#1c9e57",
  },
  neon: {
    red: "#ff3b6b",
    yellow: "#faff00",
    cyan: "#00f0ff",
    magenta: "#ff2bd6",
    hotpink: "#ff6ad5",
    green: "#39ff14",
    gray: "#9a86ff",
  },
};
```

### `app/games/bloque-buster/engine.ts`

- Import: `import { SKINS, BRICK_COLORS, type BrickKey } from "~/games/bloque-buster/skins";` y `Palette`, `SkinId` desde `~/games/types`.
- `LevelDef["blocks"]` y `Block` / `Explosion`: el campo `color` pasa a `color: BrickKey` (era `string`). Los arrays `rowColors1/2/4` y los literales de `l3` / `l5` ya son valores válidos de `BrickKey`; sin cambios de contenido.
- Campos nuevos: `private palette: Palette;` y `private brickColors: Record<BrickKey, string>;`.
- Constructor: `constructor(canvas: HTMLCanvasElement, skin: SkinId = "clasico")` → tras obtener el contexto: `this.palette = SKINS[skin]; this.brickColors = BRICK_COLORS[skin];`.
- `setSkin(id: SkinId): void { this.palette = SKINS[id]; this.brickColors = BRICK_COLORS[id]; this.draw(); }` — reemplaza el no-op `// TODO(skins/bloque-buster)`. `draw()` es seguro en cualquier momento (los campos `paddle` / `ball` están inicializados, `blocks` puede estar vacío).
- Helper privado: `private applyGlow(color: string): void { if (this.palette.glowBlur > 0) { this.ctx.shadowColor = color; this.ctx.shadowBlur = this.palette.glowBlur; } }`.
- `draw()`:
  - Fondo: `ctx.shadowBlur = 0; ctx.fillStyle = this.palette.bg; ctx.fillRect(0, 0, W, H);`
  - Ladrillos: por cada `block` vivo → `const hex = this.brickColors[block.color]; ctx.fillStyle = hex; this.applyGlow(hex); ctx.fillRect(...)`. Tras el bucle: `ctx.shadowBlur = 0;`.
  - Explosiones — flash: `ctx.fillStyle = this.palette.fg; this.applyGlow(this.palette.fg);` (el `globalAlpha = 1 - t` se mantiene). Partículas: `const hex = this.brickColors[exp.color]; ctx.fillStyle = hex; this.applyGlow(hex);` (resto igual). Tras el bucle de explosiones: `ctx.shadowBlur = 0;`.
  - Paleta: `ctx.fillStyle = this.palette.fg; this.applyGlow(this.palette.fg); ctx.fillRect(this.paddle...)`.
  - Bola: `ctx.fillStyle = this.palette.fg; this.applyGlow(this.palette.fg);` **explícito** antes del `arc` + `fill`. Al final de `draw()`: `ctx.shadowBlur = 0;`.
- Tras estos cambios `engine.ts` no contiene ningún literal de color (las claves `BrickKey` no son colores).

### `app/components/games/BloqueBusterGame.vue`

```ts
import { BloqueBusterEngine, type EngineSnapshot } from "~/games/bloque-buster/engine";
import type { SkinId } from "~/games/types";

const props = defineProps<{ skin?: SkinId }>();
// …
onMounted(() => {
  if (!canvasEl.value) return;
  engine = new BloqueBusterEngine(canvasEl.value, props.skin ?? "clasico");
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

1. Crear `app/games/bloque-buster/skins.ts` con `BrickKey`, las 3 paletas y `BRICK_COLORS` exactos de arriba. Prueba: `npm run build` compila.
2. Refactor de `app/games/bloque-buster/engine.ts`: tipar `color` como `BrickKey`, campos `palette` + `brickColors`, constructor con `skin`, `setSkin` real, `draw()` con `palette.bg` / `brickColors[key]` / `palette.fg` y `fillStyle` explícito de la bola. **Sin** `applyGlow` todavía. Prueba: `npm run dev` → `/juego/bloque-buster/jugar` con skin `clasico` se ve **idéntico** al actual (6 filas de colores por nivel, flash blanco de explosión que se desvanece, partículas del color del ladrillo, paleta y bola blancas).
3. Añadir `applyGlow` y los resets de `shadowBlur` (tras ladrillos, tras explosiones, al final de `draw`). Prueba: skin `neon` muestra glow en ladrillos, paleta, bola y partículas; el fondo no arrastra sombra; ~60 FPS con el nivel 1 completo (60 ladrillos) + varias explosiones simultáneas.
4. Cablear `BloqueBusterGame.vue`: prop `skin`, constructor con el segundo argumento, `watch` → `setSkin`. Prueba: los 3 botones del HUD cambian el color **en caliente**, sin reiniciar la partida (score / vidas / nivel / ladrillos vivos intactos); funciona también en PAUSA.
5. Verificación de la checklist de modo oscuro (spec 00) para los 3 skins contra las tablas de este spec: `bg` L < 0.03 en los tres; todo ladrillo / paleta / bola ≥ 3:1; `retro` ≤ 4 tonos de figura + `bg`; `neon` sin ningún color a blanco (el flash de explosión es `#00f0ff` en `neon`, no `#fff`).
6. No-regresión: `rocas`, `caida`, `serpentina` y los juegos mock siguen igual. Recargar `/juego/bloque-buster/jugar` respeta el skin de `localStorage["av:skin"]`.

## Criterios de aceptación

- [x] `npm run build` / `npm run dev` sin errores ni `any`; `BloqueBusterEngine` implementa `GameEngine` completo (incluido `setSkin` real).
- [x] `app/games/bloque-buster/engine.ts` no contiene ningún literal de color; todo sale de `this.palette` / `this.brickColors` (se permite `globalAlpha` numérico para el flash de explosión).
- [ ] Skin `clasico` produce un render **pixel-equivalente** al de hoy: filas de ladrillos con los 7 nombres CSS exactos (incluido `green` = `#008000`), flash de explosión blanco con `alpha = 1 - t`, partículas del color del ladrillo, paleta y bola blancas.
- [ ] Skin `retro`: verde fósforo, ≤ 4 tonos de figura + `bg`; ladrillos, paleta y bola legibles (≥ 3:1).
- [ ] Skin `neon`: glow visible en ladrillos / paleta / bola / partículas vía `shadowBlur`, fondo sin sombra, ningún color forzado a blanco (flash de explosión en `palette.fg`), ~60 FPS con un nivel lleno y explosiones.
- [ ] Los 3 botones del HUD cambian el skin **en caliente** (sin reiniciar) y también en PAUSA; la selección persiste en `localStorage["av:skin"]` y sobrevive a recargar y a cambiar de juego real.
- [ ] `rocas`, `caida`, `serpentina` y los juegos mock: sin cambios visibles ni de comportamiento.
- [ ] Todas las casillas de la checklist de modo oscuro del spec 00 marcadas, con las tablas `rol → hex → contraste` de este spec como evidencia.

## Decisiones

- **`BRICK_COLORS` game-local en `bloque-buster/skins.ts`, fuera del tipo `Palette`. Sí.** 7 nombres CSS de ladrillo no caben en 4 acentos genéricos sin destruir la identidad de `clasico`; un `Record<SkinId, Record<BrickKey, string>>` mantiene `engine.ts` sin literales y deja los layouts de `LEVELS` intactos (las claves pasan a ser identificadores de rol).
- **Las claves de `LEVELS` se re-tipan a `BrickKey`, no se renombran. Sí.** `"red"` / `"cyan"` / … ya son válidas; solo cambia el tipo (`string` → `BrickKey`) y quién las resuelve a hex (`this.brickColors[key]` en vez de `fillStyle = key`).
- **`clasico.green` se queda en `#008000` (CSS `green`), ~4.1:1. Sí.** `clasico` reproduce el look actual exacto; el navegador hoy pinta ese ladrillo así. Supera el umbral de figura (≥ 3:1).
- **`retro` colapsa los 7 ladrillos a 4 tonos de verde. Sí.** Límite del contrato (≤ 4 tonos + `bg`); las filas quedan como bandas de brillo, coherente con un monitor monocromo.
- **La bola fija `fillStyle = palette.fg` explícito. Sí.** Hoy hereda por accidente el `"#fff"` de la paleta; con la paleta en color propio del skin ese "truco" dejaría la bola de un color impredecible. Se hace explícito.
- **El flash de explosión usa `palette.fg` (cian en `neon`), no `#fff`. Sí.** El contrato prohíbe subir a blanco para destacar; `palette.fg` con el `alpha = 1 - t` existente da el mismo golpe de luz sin blanco puro.
- **`glowBlur: 8` en `neon` (no 12 como `rocas`). Sí.** Hasta 60 ladrillos contiguos en la mitad superior; 12 los funde en una mancha. 8 se ve y mantiene FPS.
- **`applyGlow` como helper privado + reset de `shadowBlur` tras cada grupo. Sí.** Mismo patrón que el spec 00 / `rocas`: glow por grupo (ladrillos, explosiones, paleta+bola), `shadowBlur = 0` tras cada uno para no arrastrar coste ni difuminar el fondo.
- **`fgDim` / `accent` / `accentAlt` / `danger` / `grid` en la paleta aunque `bloque-buster` no los use. Sí.** Contrato compartido; valores coherentes por skin para no dejar la `Palette` incompleta.
- **Sin cambios en `registry.ts`, catálogo ni `scores`. Correcto.** Los skins son 100% presentación del canvas.

## Riesgos

- **Regresión sutil en `clasico`.** Cambiar el orden de `fillStyle` / `arc` de la bola o el momento del `globalAlpha` del flash puede alterar el render. Mitigación: el Paso 2 implementa `clasico` **sin** glow y se compara lado a lado con la build actual.
- **`shadowBlur` no reseteado.** Si el grupo de ladrillos o el de explosiones no limpia `shadowBlur`, la paleta, la bola o el `fillRect` de fondo del siguiente frame saldrían difuminados. Cubierto por resets explícitos tras cada grupo + al final de `draw()` y por un criterio de aceptación.
- **Coste del glow en `neon`.** 60 ladrillos + flash + hasta 8 partículas por explosión con `shadowBlur: 8` puede bajar FPS en equipos lentos. Si en el Paso 3 baja de ~55 FPS, reducir `neon.glowBlur` a 6 y/o no aplicar glow a las partículas de explosión (solo a ladrillos / paleta / bola).
- **Contraste bajo del `green` clásico.** `#008000` da ~4.1:1; es figura (≥ 3:1) y es el look actual, así que se mantiene, pero si en revisión visual el ladrillo verde del nivel 1 "desaparece" sobre el negro, `retro` y `neon` ya lo suben (`#4dff9b` / `#39ff14`); `clasico` no se toca.
- **Persistencia compartida entre juegos.** `av:skin` es global (spec 00): elegir `neon` aquí lo aplica también a los demás engines reales cuando tengan su spec.
