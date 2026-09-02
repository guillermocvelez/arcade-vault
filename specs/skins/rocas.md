# SPEC SKINS — ROCAS (Asteroids): skins clasico / retro / neon

> **Estado:** Borrador
> **Depende de:** `specs/skins/00-contrato-skins.md`, `05-asteroids-rocas.md`
> **Fecha:** 2026-08-31
> **Objetivo:** Dar a `rocas` los 3 skins obligatorios (`clasico` default, `retro`, `neon`) según el contrato de `specs/skins/00-contrato-skins.md`. Sacar todos los literales de color de `app/games/asteroids/engine.ts` a `app/games/asteroids/skins.ts`, implementar `setSkin`, y cablear la prop `skin` en `app/components/games/AsteroidsGame.vue`. Sin cambios de jugabilidad, scoring, snapshot ni catálogo.

## Alcance

### En alcance

- `app/games/asteroids/skins.ts` (nuevo): `export const SKINS: Record<SkinId, Palette>` con las 3 paletas.
- `app/games/asteroids/engine.ts`: sustituir cada literal de color por `this.palette.<rol>`; añadir `private palette`, constructor con `skin: SkinId = "clasico"`, implementación real de `setSkin` (reemplaza el no-op `// TODO(skins/rocas)` del spec 00); lógica de glow para `neon`.
- `app/components/games/AsteroidsGame.vue`: `defineProps<{ skin?: SkinId }>()`, pasar el skin al constructor y `watch` → `engine.setSkin`.

### Fuera de alcance

- La física, colisiones, niveles, power-up 3x, puntaje, vidas, `EngineSnapshot`, `phase` — sin tocar.
- `app/games/registry.ts` — sin cambios (el wrapper sigue sin args de constructor obligatorios).
- La fila `games` de `rocas`, su `cover-*`, el seed de `scores` — sin cambios.
- Los otros engines reales (`caida`, `bloque-buster`, `serpentina`) — cada uno en su propio `specs/skins/<id>.md`.

## Inventario de color actual (base del skin `clasico`)

Extraído de `app/games/asteroids/engine.ts`:

| Rol (`Palette`) | Dónde en el engine                                                                                                                       | Valor actual               |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| `bg`            | `draw()` — `fillStyle` del `fillRect(0,0,W,H)`                                                                                           | `#000`                     |
| `fg`            | `Bullet.draw` (fill), `Asteroid.draw` (stroke), `Ship.draw` (stroke), `drawLifeIcon` (stroke), `drawHUD` (texto), `drawOverlay` (título) | `#fff`                     |
| `fgDim`         | `drawOverlay` — subtítulo `PUNTAJE: …`                                                                                                   | `rgba(255,255,255,0.65)`   |
| `fg` + alpha    | `Particle.draw` — `rgba(255,255,255,<alpha ttl/life>)`                                                                                   | blanco con alpha calculada |
| `accent`        | `PowerUp.draw` (stroke del rombo + texto "3x"), `drawHUD` (lectura `3x  Ns`)                                                             | `#0ff`                     |
| `accentAlt`     | `Ship.draw` — llama del propulsor (stroke)                                                                                               | `rgba(255,130,0,0.85)`     |
| `danger`        | — (no se usa hoy en `rocas`)                                                                                                             | reservado                  |
| `grid`          | — (no se usa hoy en `rocas`)                                                                                                             | reservado                  |
| `glowBlur`      | — (no existe hoy)                                                                                                                        | `0`                        |

`Particle.draw` seguirá calculando su alpha por TTL, pero sobre `this.palette.fg` (helper: convertir el hex de `fg` a `rgba(r,g,b,alpha)`), no sobre `#fff` fijo. El parpadeo de invencibilidad de la nave y el parpadeo de fin de vida del power-up se conservan intactos (son lógica, no color).

## Paletas (`app/games/asteroids/skins.ts`)

Contraste estimado con la fórmula WCAG contra el `bg` de cada skin (`ratio = (Lclaro+0.05)/(Loscuro+0.05)`).

### `clasico` — reproduce el look actual

| Rol         | Hex / valor              | Contraste vs `bg` | Nota                                  |
| ----------- | ------------------------ | ----------------- | ------------------------------------- |
| `bg`        | `#000000`                | —                 | L ≈ 0                                 |
| `fg`        | `#ffffff`                | 21:1              | siluetas + texto HUD                  |
| `fgDim`     | `rgba(255,255,255,0.65)` | ~8.6:1            | subtítulo del overlay (igual que hoy) |
| `accent`    | `#00ffff`                | 16.7:1            | power-up + lectura 3x (texto) ✓ ≥4.5  |
| `accentAlt` | `#ff8200`                | 8.4:1             | llama del propulsor (figura) ✓ ≥3     |
| `danger`    | `#ff4d4d`                | ~5:1              | reservado                             |
| `grid`      | `#1e2130`                | ~1.3:1            | reservado (no se dibuja en `rocas`)   |
| `glowBlur`  | `0`                      | —                 | sin glow                              |

> `accentAlt` pierde el `0.85` de alpha del original; para conservar la sensación, `Ship.draw` aplica `globalAlpha = 0.85` al dibujar la llama (o dibuja `accentAlt` ya premultiplicado). Decisión: mantener el `rgba(...,0.85)` vía `globalAlpha`, así el hex de la paleta queda limpio.

### `retro` — fósforo verde CRT (≤ 4 tonos + fondo)

| Rol         | Hex       | L aprox | Contraste vs `bg` | Nota                                     |
| ----------- | --------- | ------- | ----------------- | ---------------------------------------- |
| `bg`        | `#04120b` | 0.0048  | —                 | negro con tinte verde                    |
| `fg`        | `#4dff9b` | 0.755   | ~14.7:1           | siluetas + texto HUD ✓                   |
| `fgDim`     | `#33b978` | 0.368   | ~7.6:1            | subtítulo overlay ✓ ≥4.5                 |
| `accent`    | `#c8ffe0` | 0.892   | ~17:1             | power-up + 3x (texto) ✓ ≥4.5             |
| `accentAlt` | `#2bd47a` | 0.490   | ~9.9:1            | propulsor (figura) ✓                     |
| `danger`    | `#7dffb5` | —       | —                 | reservado (se mantiene en familia verde) |
| `grid`      | `#0c3a24` | —       | —                 | reservado                                |
| `glowBlur`  | `4`       | —       | —                 | leve bloom de fósforo                    |

4 tonos de verde (`fg`, `fgDim`, `accent`, `accentAlt`) + `bg`. Cumple el límite del contrato.

### `neon` — synthwave, glow por `shadowBlur`

| Rol         | Hex       | L aprox | Contraste vs `bg` | Nota                                        |
| ----------- | --------- | ------- | ----------------- | ------------------------------------------- |
| `bg`        | `#05010d` | 0.0008  | —                 | negro con tinte violeta                     |
| `fg`        | `#00f0ff` | 0.695   | ~14.7:1           | nave/asteroides/balas + HUD ✓               |
| `fgDim`     | `#9a86ff` | 0.311   | ~7.1:1            | subtítulo overlay ✓ ≥4.5                    |
| `accent`    | `#ff2bd6` | 0.278   | ~6.5:1            | power-up + 3x (texto) ✓ ≥4.5                |
| `accentAlt` | `#b6ff3b` | 0.818   | ~17:1             | propulsor (figura) ✓                        |
| `danger`    | `#ff3b6b` | —       | —                 | reservado                                   |
| `grid`      | `#20124a` | —       | —                 | reservado                                   |
| `glowBlur`  | `12`      | —       | —                 | glow con `shadowColor` = color del elemento |

## Cambios fichero por fichero

### `app/games/asteroids/skins.ts` (nuevo)

```ts
import type { Palette, SkinId } from "~/games/types";

export const SKINS: Record<SkinId, Palette> = {
  clasico: {
    bg: "#000000",
    fg: "#ffffff",
    fgDim: "rgba(255,255,255,0.65)",
    accent: "#00ffff",
    accentAlt: "#ff8200",
    danger: "#ff4d4d",
    grid: "#1e2130",
    glowBlur: 0,
  },
  retro: {
    bg: "#04120b",
    fg: "#4dff9b",
    fgDim: "#33b978",
    accent: "#c8ffe0",
    accentAlt: "#2bd47a",
    danger: "#7dffb5",
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
    glowBlur: 12,
  },
};
```

### `app/games/asteroids/engine.ts`

- Import: `import { SKINS } from "~/games/asteroids/skins";` y `SkinId` desde `~/games/types`.
- Campo nuevo: `private palette: Palette`. Constructor: `constructor(canvas: HTMLCanvasElement, skin: SkinId = "clasico")` → `this.palette = SKINS[skin]`.
- `setSkin(id: SkinId): void { this.palette = SKINS[id]; this.draw(); }` — reemplaza el no-op `// TODO(skins/rocas)` del spec 00.
- **Firma de `draw` en las entidades**: `Bullet`, `Asteroid`, `PowerUp`, `Ship`, `Particle` reciben la paleta. Opción elegida: pasar `palette` como segundo argumento de `draw(ctx, palette)` (las entidades no guardan estado de color). El engine pasa `this.palette` en cada llamada dentro de `this.draw()`.
- Sustituciones:
  - `Bullet.draw`: `ctx.fillStyle = palette.fg`.
  - `Asteroid.draw`: `ctx.strokeStyle = palette.fg`.
  - `Ship.draw`: silueta `ctx.strokeStyle = palette.fg`; llama `ctx.strokeStyle = palette.accentAlt` con `ctx.save(); ctx.globalAlpha = 0.85; … ctx.restore()`.
  - `Particle.draw`: `ctx.strokeStyle = rgbaFrom(palette.fg, alpha)` — helper local `rgbaFrom(hex, a)` que acepta `#rgb`/`#rrggbb` (y devuelve el propio string si ya es `rgba(...)`, usando `a` vía `globalAlpha` en ese caso). `clasico.fg` es `#ffffff`, así que el resultado es idéntico al actual.
  - `PowerUp.draw`: `ctx.strokeStyle = palette.accent` (rombo) y `ctx.fillStyle = palette.accent` (texto "3x").
  - `drawLifeIcon`: `ctx.strokeStyle = palette.fg`.
  - `drawHUD`: `ctx.fillStyle = palette.fg` para SCORE/NIVEL/vidas; `ctx.fillStyle = palette.accent` para la lectura `3x  Ns`.
  - `drawOverlay`: título `ctx.fillStyle = palette.fg`; subtítulo `ctx.fillStyle = palette.fgDim`.
  - `draw()` (fondo): `ctx.fillStyle = palette.bg` en el `fillRect(0,0,W,H)`.
- **Glow (`neon`)** en `this.draw()`:
  - Grupo "mundo" (partículas, asteroides, power-ups, balas, nave): si `this.palette.glowBlur > 0`, envolver el bloque con `ctx.save()`, y dentro de cada `draw` de entidad, tras fijar `strokeStyle`/`fillStyle`, hacer `ctx.shadowColor = ctx.strokeStyle || ctx.fillStyle; ctx.shadowBlur = palette.glowBlur;`. Al cerrar el grupo: `ctx.restore()` (que limpia `shadowBlur`).
  - Grupo "HUD + overlay": **siempre** `ctx.shadowBlur = 0` — el texto no lleva glow, para mantener legibilidad.
  - Con `glowBlur === 0` (clasico, retro… ojo: retro usa 4) no se toca `shadowColor`. Para `retro` (`glowBlur: 4`) el bloom es leve y sí aplica al grupo mundo, no al HUD.
  - Implementación recomendada: un helper `private applyGlow(color: string)` que hace `this.ctx.shadowColor = color; this.ctx.shadowBlur = this.palette.glowBlur;` y se llama solo si `glowBlur > 0`, justo después de cada `set` de color en el grupo mundo. Reset con `this.ctx.shadowBlur = 0` antes de `drawHUD()`.

### `app/components/games/AsteroidsGame.vue`

```ts
import { AsteroidsEngine, type EngineSnapshot } from "~/games/asteroids/engine";
import type { SkinId } from "~/games/types";

const props = defineProps<{ skin?: SkinId }>();
// …
onMounted(() => {
  if (!canvasEl.value) return;
  engine = new AsteroidsEngine(canvasEl.value, props.skin ?? "clasico");
  // …resto igual…
});

watch(
  () => props.skin,
  (s) => {
    if (s) engine?.setSkin(s);
  },
);
```

`defineExpose` sin cambios (`pause`/`resume`/`restart`).

## Plan de implementación

1. Crear `app/games/asteroids/skins.ts` con las 3 paletas exactas de arriba. Prueba: `npm run build` compila.
2. Refactor de `app/games/asteroids/engine.ts`: campo `palette`, constructor con `skin`, `setSkin` real, `draw(ctx, palette)` en las 5 entidades, helper `rgbaFrom`, todas las sustituciones de la tabla. **Sin** lógica de glow todavía (para aislar la regresión visual del skin `clasico`). Prueba: `npm run dev` → `/juego/rocas/jugar` con skin `clasico` se ve **idéntico** al actual (nave, asteroides, balas, HUD, overlay, llama del propulsor con su transparencia).
3. Añadir la lógica de glow (`applyGlow`, reset antes del HUD). Prueba: skin `neon` muestra el brillo en nave/asteroides/balas/power-up; el HUD y el overlay GAME OVER se ven nítidos (sin glow); los FPS se mantienen (~60) con pantalla llena de asteroides + partículas.
4. Cablear `AsteroidsGame.vue`: prop `skin`, constructor, `watch` → `setSkin`. Prueba: los 3 botones del HUD cambian el color del canvas **en caliente**, sin reiniciar la partida ni perder el estado (score/vidas/asteroides intactos); funciona también con el juego en PAUSA (el canvas se redibuja al instante).
5. Verificación de la checklist de modo oscuro (sección del spec 00) para los 3 skins: recorrer cada casilla contra las paletas de este spec. Confirmar que `retro` usa ≤4 tonos + bg y que `neon` no sube ningún color a blanco.
6. No-regresión: `caida`, `bloque-buster`, `serpentina` se ven y juegan igual (siguen con su `setSkin` no-op del spec 00 hasta su propio spec); los juegos mock no muestran el control de skin. Recargar `/juego/rocas/jugar` respeta el skin guardado en `localStorage`.

## Criterios de aceptación

- [ ] `npm run build` / `npm run dev` sin errores ni `any`; `AsteroidsEngine` implementa `GameEngine` completo (incluido `setSkin`).
- [ ] `app/games/asteroids/engine.ts` no contiene ningún literal de color (`#…`, `rgb(…)`, `rgba(…)` con canal de color fijo); todo sale de `this.palette` (se permite `globalAlpha` numérico para la llama y las partículas).
- [ ] Skin `clasico` produce un render **pixel-equivalente** al de hoy (comparación visual lado a lado de nave, asteroides, balas, partículas, power-up, HUD y overlay GAME OVER).
- [ ] Skin `retro`: paleta verde fósforo, ≤ 4 tonos + `bg`; nave/asteroides/HUD legibles; subtítulo del overlay legible (≥ 4.5:1).
- [ ] Skin `neon`: glow visible en los elementos del mundo vía `shadowBlur`, HUD y overlay sin glow y nítidos, ningún color forzado a blanco, ~60 FPS con la pantalla saturada.
- [ ] Los 3 botones del HUD cambian el skin **en caliente** (sin reiniciar la partida) y también con el juego en PAUSA; la selección persiste en `localStorage["av:skin"]` y sobrevive a recargar y a cambiar de juego real.
- [ ] `caida`, `bloque-buster`, `serpentina` y los juegos mock: sin cambios visibles ni de comportamiento.
- [ ] Todas las casillas de la checklist de modo oscuro del spec 00 marcadas, con la tabla `rol → hex → contraste` de este spec como evidencia.

## Decisiones

- **`draw(ctx, palette)` en las entidades, no un campo de color por entidad. Sí.** Las entidades de `rocas` (`Bullet`/`Asteroid`/`Ship`/`Particle`/`PowerUp`) son "tontas" respecto al color; pasar la paleta por parámetro evita duplicar estado y re-sincronizarlo en `setSkin`.
- **`setSkin` llama a `this.draw()` una vez. Sí.** Así el cambio se ve al instante aunque el juego esté en pausa o detenido; durante el juego normal el loop ya redibuja cada frame, así que es idempotente.
- **La llama del propulsor conserva su `0.85` de opacidad vía `globalAlpha`. Sí.** Mantiene el hex de `accentAlt` limpio en la paleta y preserva la sensación visual actual en `clasico`.
- **`Particle` sigue calculando su alpha por TTL, sobre `palette.fg`. Sí.** Es la única forma de conservar el desvanecido actual; con `clasico.fg = #ffffff` el resultado es idéntico al de hoy.
- **`retro` con `glowBlur: 4`, `neon` con `12`, `clasico` con `0`. Sí.** El fósforo CRT real tiene un bloom leve; `4` lo insinúa sin coste. `neon` necesita un blur claramente visible; `12` sobre 800×600 se ve y mantiene FPS. El HUD nunca lleva glow en ningún skin.
- **`danger` y `grid` en la paleta aunque `rocas` no los use hoy. Sí.** Son parte del contrato compartido (`caida`, `bloque-buster`, `serpentina` sí los usarán); se definen con valores coherentes por skin para no dejar la `Palette` incompleta.
- **Glow con `shadowColor` = color del propio elemento, no un `glow` fijo en la paleta. Sí.** Un asteroide `fg` brilla en `fg`, el power-up `accent` brilla en `accent`; da un neón coherente sin un campo extra. Coincide con la decisión del spec 00.
- **`AsteroidsGame.vue` con `skin` opcional y default `"clasico"`. Sí.** El wrapper sigue montándose sin props (compatibilidad con `registry.ts` y con cualquier uso directo); `jugar.vue` es quien siempre la pasa.
- **Sin cambios en `registry.ts`, catálogo ni `scores`. Correcto.** Los skins son 100% presentación del canvas.

## Riesgos

- **Regresión sutil en `clasico`.** Cualquier orden de `save/restore` mal trasladado al pasar `palette` a las entidades puede cambiar el render. Mitigación: el Paso 2 implementa `clasico` **sin** glow y se compara lado a lado contra la build actual antes de seguir.
- **`shadowBlur` no reseteado.** Si el grupo mundo no limpia `shadowBlur` antes de `drawHUD`, el HUD y el overlay saldrían difuminados en `retro` y `neon`. Cubierto por un criterio de aceptación explícito y por el reset antes de `drawHUD()`.
- **Coste del glow en `neon`.** Pantalla llena de asteroides pequeños + partículas con `shadowBlur: 12` puede bajar FPS en equipos lentos. Si en la prueba del Paso 3 baja de ~55 FPS, reducir `neon.glowBlur` a 8 y/o no aplicar glow a `Particle` (solo a nave/asteroides/balas/power-up).
- **`rgbaFrom` con formatos mixtos.** `clasico.fgDim` ya es un `rgba(...)`; el helper debe devolverlo tal cual (o ignorar el alpha extra) sin romper. Test unitario rápido con `#fff`, `#ffffff` y `rgba(255,255,255,0.65)`.
- **Persistencia compartida entre juegos.** `av:skin` es global: elegir `neon` en `rocas` también lo aplica a los demás juegos reales cuando tengan su spec. Es la decisión del spec 00, pero conviene recordarlo al validar.
