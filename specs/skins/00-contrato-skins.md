# SPEC SKINS 00 — Contrato de skins para engines reales

> **Estado:** Implementada
> **Depende de:** `05-asteroids-rocas.md`, `.agents/skills/add-game/engine-contract.md`
> **Fecha:** 2026-08-31
> **Objetivo:** Introducir un sistema de skins (temas de color) para los engines reales de Arcade Vault. Todo engine real debe ofrecer al menos 3 skins — `clasico` (default), `retro` y `neon` — y los tres deben verse bien sobre el fondo oscuro de la pantalla CRT. Este spec define el contrato compartido (tipos, ampliación de `GameEngine`, selector, persistencia, checklist de modo oscuro) y el refactor Paso 0. Cada juego concreto se cablea en su propio spec (`specs/skins/<game-id>.md`), empezando por `specs/skins/rocas.md`.

## Contexto

Hoy cada engine (`app/games/<id>/engine.ts`) fija sus colores con literales hardcodeados en `ctx.fillStyle` / `ctx.strokeStyle`. No hay ningún concepto de tema. El sitio es **dark-only** (`--bg: #0a0a0f` en `app/assets/css/main.css`, sin bloque `prefers-color-scheme`), y el engine dibuja sobre un `fillRect` casi negro dentro de `.crt-screen`. Por eso "lucir bien en modo oscuro" se traduce en: **contraste suficiente contra un fondo casi negro**, sin blancos puros a pantalla completa ni destellos.

## Los tres skins obligatorios

| id (código) | Nombre visible | Carácter                                                                                                   |
| ----------- | -------------- | ---------------------------------------------------------------------------------------------------------- |
| `clasico`   | CLÁSICO        | **Default.** Reproduce el look actual del juego, tal cual está hoy. Se usa si no hay preferencia guardada. |
| `retro`     | RETRO          | Fósforo CRT monocromo: 2–4 tonos de una misma familia (verde) + fondo.                                     |
| `neon`      | NEON           | Alto contraste saturado, synthwave; el "brillo" se logra con `shadowBlur`, nunca subiendo a blanco.        |

Un engine puede tener más de tres skins, nunca menos. `clasico` siempre existe y siempre es el default.

## Alcance

### En alcance

- `app/games/types.ts`: nuevo tipo `SkinId`, nueva interfaz `Palette`, y ampliación de `GameEngine` con `setSkin(id: SkinId): void`.
- `app/games/skins.ts` (nuevo): constante `SKIN_STORAGE_KEY`, lista `SKIN_IDS` con metadatos de UI (id + etiqueta visible), y helper `resolveSkin(raw: string | null): SkinId` (valida y cae a `clasico`).
- `app/pages/juego/[id]/jugar.vue`: estado `skin`, lectura/escritura en `localStorage`, control segmentado de 3 botones en `.hud-actions` (solo visible cuando `isRealGame`), y prop `:skin` pasada a `<component :is="realGame">`.
- `app/assets/css/main.css`: estilos del control segmentado de skin (`.skin-seg`).
- La **checklist de aceptación de modo oscuro** (abajo), reutilizable por cada `specs/skins/<game-id>.md`.

### Fuera de alcance

- Adaptar cualquier engine concreto — eso es cada `specs/skins/<game-id>.md`. Este spec deja `jugar.vue` pasando `:skin` a wrappers que **todavía lo ignoran** (ver Riesgos); no rompe nada.
- El Reproductor mock (`gloton`, `invasores`, `ranaria`, `duelo-pixel`): el control de skin no se muestra para juegos sin engine real.
- Tema de la UI del sitio (nav, cards, páginas): los skins solo afectan el dibujo del canvas.
- Persistir el skin en Supabase o por usuario: es preferencia local del navegador.
- Skins que dependan de un modo claro: el sitio no tiene modo claro.

## Modelo de datos

### `app/games/types.ts` (ampliación)

```ts
export type Phase = "playing" | "dead" | "gameover";

export type SkinId = "clasico" | "retro" | "neon";

/** Paleta por roles semánticos. Cada engine mapea sus entidades a estos roles;
 *  ningún engine vuelve a escribir un literal de color. */
export interface Palette {
  bg: string; // relleno del canvas (casi negro en los 3 skins)
  fg: string; // trazo/relleno primario: siluetas de juego + texto HUD
  fgDim: string; // texto secundario (subtítulos de overlay), elementos tenues
  accent: string; // acento principal (power-ups, lecturas destacadas del HUD)
  accentAlt: string; // acento secundario (propulsores, estados puntuales)
  danger: string; // colisión / game over — reservado; lo usan otros juegos
  grid: string; // rejilla / fondo estructurado — reservado; lo usan otros juegos
  glowBlur: number; // 0 = sin glow. >0 => ctx.shadowBlur=glowBlur con
  //        ctx.shadowColor = color del propio elemento (nunca blanco)
}

export interface EngineSnapshot {
  score: number;
  lives: number;
  level: number;
  phase: Phase;
  extras?: Array<{ label: string; value: string }>;
  // Los skins NO viajan en el snapshot.
}

export interface GameEngine {
  start(): void;
  stop(): void;
  pause(): void;
  resume(): void;
  restart(): void;
  setSkin(id: SkinId): void; // ← NUEVO
  getSnapshot(): EngineSnapshot;
  onSnapshot(cb: (s: EngineSnapshot) => void): void;
}
```

### `app/games/skins.ts` (nuevo)

```ts
import type { SkinId } from "~/games/types";

export const SKIN_STORAGE_KEY = "av:skin";

export const SKIN_IDS: ReadonlyArray<{ id: SkinId; label: string }> = [
  { id: "clasico", label: "CLÁSICO" },
  { id: "retro", label: "RETRO" },
  { id: "neon", label: "NEON" },
];

const VALID = new Set<SkinId>(["clasico", "retro", "neon"]);

/** Normaliza cualquier valor (p. ej. de localStorage) a un SkinId válido. */
export function resolveSkin(raw: string | null): SkinId {
  return raw && VALID.has(raw as SkinId) ? (raw as SkinId) : "clasico";
}
```

### Contrato de skin en el engine (lo implementa cada `specs/skins/<game-id>.md`)

- El constructor acepta un `SkinId` opcional: `new SomeEngine(canvas: HTMLCanvasElement, skin: SkinId = "clasico")`.
- El engine guarda `private palette: Palette = SKINS[skin]`, importado de `app/games/<id>/skins.ts` (`export const SKINS: Record<SkinId, Palette>`).
- **Ningún literal de color** queda en `engine.ts`: todo `fillStyle`/`strokeStyle`/`shadowColor` sale de `this.palette.<rol>`. Las opacidades calculadas en tiempo real (p. ej. partículas que se desvanecen) se aplican sobre un color de la paleta, no sobre un `#fff` fijo.
- `setSkin(id)` reasigna `this.palette = SKINS[id]` y llama a `this.draw()` una vez, para que el cambio se vea de inmediato incluso con el juego en pausa o detenido. No reinicia la partida ni toca el estado de juego.
- **Glow (`neon`)**: cuando `palette.glowBlur > 0`, antes de dibujar un grupo de elementos se hace `ctx.shadowBlur = palette.glowBlur; ctx.shadowColor = <mismo color que el trazo/relleno>` y **se resetea `ctx.shadowBlur = 0` al terminar el grupo** para no arrastrar el coste ni difuminar el HUD/overlay. Con `glowBlur === 0` no se tocan las propiedades de sombra.
- `getSnapshot()` no cambia de forma.

### `app/pages/juego/[id]/jugar.vue` (cambios)

```ts
import { SKIN_IDS, SKIN_STORAGE_KEY, resolveSkin } from "~/games/skins";
import type { SkinId } from "~/games/types";

const skin = ref<SkinId>("clasico");

onMounted(() => {
  if (import.meta.client) skin.value = resolveSkin(localStorage.getItem(SKIN_STORAGE_KEY));
});

const setSkin = (id: SkinId) => {
  skin.value = id;
  if (import.meta.client) localStorage.setItem(SKIN_STORAGE_KEY, id);
};
```

- El `<component :is="realGame">` recibe `:skin="skin"`.
- Control segmentado en `.hud-actions`, **antes** del botón PAUSA, `v-if="isRealGame"`:

```vue
<div v-if="isRealGame" class="skin-seg" role="group" aria-label="Skin">
  <button
    v-for="s in SKIN_IDS"
    :key="s.id"
    class="skin-seg-btn"
    :class="{ active: skin === s.id }"
    @click="setSkin(s.id)"
  >
    {{ s.label }}
  </button>
</div>
```

### `app/assets/css/main.css` (nuevo bloque, junto a `.hud-actions`)

`.skin-seg` como grupo de 3 botones tipo segmented control, estética retro coherente con `.btn`: borde `--ink-faint`, botón activo con fondo `--bg-3` y texto `--ink`, inactivos `--ink-dim`; fuente mono, `letter-spacing`, `text-transform: uppercase`, tamaño ~10px. No debe romper el layout de `.hud-actions` en mobile (que envuelva).

## Checklist de aceptación de modo oscuro (reutilizable por cada `specs/skins/<game-id>.md`)

Fórmula de contraste WCAG: `ratio = (Lclaro + 0.05) / (Loscuro + 0.05)`, con `L` la luminancia relativa sRGB.

- [ ] `bg` de cada skin tiene luminancia relativa < 0.03 (casi negro). Ningún skin usa fondo claro.
- [ ] `fg` vs `bg` ≥ **4.5:1** — cubre siluetas de juego (líneas finas) y texto del HUD in-canvas.
- [ ] `fgDim` vs `bg` ≥ **4.5:1** cuando se usa para texto (subtítulo del overlay). Si un skin no llega, se sube la opacidad a ≥ 0.75 sobre `fg` en vez de bajar el color.
- [ ] `accent` y `accentAlt` vs `bg` ≥ **3:1** cuando son figuras/siluetas; ≥ **4.5:1** cuando se dibujan como **texto** (p. ej. una etiqueta numérica sobre el canvas).
- [ ] Sin `#ffffff` a pantalla completa ni destellos que molesten en una sala a oscuras. Los parpadeos ya existentes en el engine (invencibilidad, TTL de power-up) se conservan tal cual, pero con color de la paleta.
- [ ] `retro`: como máximo 4 tonos de una misma familia + `bg`.
- [ ] `neon`: el brillo es `shadowBlur` + `shadowColor = color del elemento`, reseteado tras cada grupo. Nunca se sube el color a blanco para "hacer glow".
- [ ] Tabla `rol → hex` de los 3 skins incluida en el spec del juego, con el ratio de contraste estimado de cada par relevante contra su `bg`.

## Plan de implementación

1. **Tipos + helper compartido.** Ampliar `app/games/types.ts` (`SkinId`, `Palette`, `setSkin` en `GameEngine`). Crear `app/games/skins.ts` (`SKIN_STORAGE_KEY`, `SKIN_IDS`, `resolveSkin`). Prueba: `npm run build` compila — nota que `AsteroidsEngine` ahora **no** satisface `GameEngine` hasta que se implemente `setSkin`; ese cambio lo hace `specs/skins/rocas.md`. Para no dejar el build roto entre specs, este paso añade a `AsteroidsEngine` un `setSkin` mínimo _no-op_ temporal (`setSkin(_id: SkinId): void {}`) que `specs/skins/rocas.md` reemplaza por la implementación real. Documentar el no-op con un `// TODO(skins/rocas)` para que sea rastreable.
2. **`jugar.vue`.** Estado `skin`, carga desde `localStorage` en `onMounted` (SSR-safe), `setSkin` que persiste, control segmentado en `.hud-actions` (`v-if="isRealGame"`), `:skin="skin"` en el `<component>`. Prueba: `npm run dev`, ir a `/juego/rocas/jugar`, ver los 3 botones; hacer clic cambia el botón activo y la clave `av:skin` en `localStorage`; recargar conserva la selección. El canvas todavía no cambia de color (el wrapper aún ignora la prop) — es esperado.
3. **CSS.** Bloque `.skin-seg` en `main.css`. Prueba: el control se ve como segmented control retro, coherente con `.btn`, y en viewport mobile envuelve sin romper `.hud-actions`.
4. **Verificación de no-regresión.** ROCAS, CAÍDA, BLOQUE BUSTER y SERPENTINA siguen jugándose exactamente igual (el `setSkin` no-op no altera nada); los juegos mock no muestran el control de skin.

## Criterios de aceptación

- [ ] `npm run build` y `npm run dev` sin errores ni `any` implícitos; `app/games/types.ts` exporta `SkinId`, `Palette` y `GameEngine.setSkin`.
- [ ] `app/games/skins.ts` exporta `SKIN_STORAGE_KEY`, `SKIN_IDS` y `resolveSkin`, con `resolveSkin(null) === "clasico"` y `resolveSkin("basura") === "clasico"`.
- [ ] En `/juego/<id>/jugar` de un juego real aparece un control con CLÁSICO / RETRO / NEON; en un juego mock **no** aparece.
- [ ] Elegir un skin persiste en `localStorage["av:skin"]` y sobrevive a recargar la página y a navegar entre juegos reales.
- [ ] El control segmentado es coherente con `.btn` y no rompe `.hud-actions` en mobile.
- [ ] Los cuatro engines reales se juegan igual que antes de este spec (el `setSkin` no-op temporal no cambia nada visible).

## Decisiones

- **`setSkin` en el contrato `GameEngine`, no solo por constructor. Sí.** El skin se cambia en caliente desde el HUD sin reiniciar la partida; el constructor acepta el skin inicial para el primer frame. `getSnapshot()` no lo transporta: el skin es presentación, no estado de juego.
- **Paleta por roles semánticos, no por entidad. Sí.** `fg`/`accent`/`danger`/… se comparten entre juegos; cada engine mapea sus entidades (nave, roca, bloque, serpiente) a esos roles. Evita una `Palette` distinta por juego en el tipo compartido.
- **`SKINS: Record<SkinId, Palette>` en `app/games/<id>/skins.ts`, no en `engine.ts`. Sí.** Mantiene `engine.ts` sin literales de color y sin inflarse; el engine solo importa.
- **`glowBlur: number` en la paleta, `shadowColor` = color del elemento. Sí.** Un único número basta para el efecto neón; usar el color propio de cada elemento como `shadowColor` da un glow coherente sin un campo de color extra. Reset a 0 tras cada grupo para no difuminar HUD/overlay ni acumular coste.
- **Persistencia: `localStorage`, clave global `av:skin`. Sí.** Los skins se llaman igual en todos los juegos; una sola preferencia "toda la sala en NEON" es lo esperable y es 1 clave, no N. Sin backend, sin vínculo a usuario.
- **Default `clasico` = look actual. Sí.** Un jugador que nunca toca el control ve exactamente el juego de hoy; `resolveSkin` cae a `clasico` ante ausencia o valor inválido.
- **Control segmentado de 3 botones, no un `<select>`. Sí.** Son 3 opciones fijas, encaja con la estética arcade y reutiliza el lenguaje visual de `.btn`. Un `<select>` sería la alternativa de menor esfuerzo si el layout de `.hud-actions` diera problemas.
- **`setSkin` no-op temporal en `AsteroidsEngine` durante el Paso 1. Sí.** Evita dejar el build roto en el hueco entre este spec y `specs/skins/rocas.md`; queda marcado con `// TODO(skins/rocas)`.
- **El control solo se muestra para juegos reales. Sí.** El Reproductor mock no dibuja con paleta; mostrar el control ahí no haría nada.
- **Sin modo claro. Correcto.** El sitio es dark-only; los 3 skins se diseñan y validan solo contra fondo casi negro.

## Riesgos

- **Prop `skin` en wrappers que aún no la declaran.** Entre este spec y cada `specs/skins/<game-id>.md`, `jugar.vue` pasa `:skin` a un componente cuyo `defineProps` no la incluye; Vue la deja caer como atributo en el `<canvas>` (`<canvas skin="neon">`), inofensivo. Se resuelve cuando el spec del juego añade la prop al wrapper.
- **Hueco de compilación entre specs.** Ampliar `GameEngine` con `setSkin` rompe el tipado de los 4 engines a la vez. Mitigado con el `setSkin` no-op temporal en el Paso 1 para `rocas`; los otros 3 engines necesitarán el mismo no-op (o su spec real) en la misma pasada de `/spec-impl` o el `build` quedará rojo. Anotarlo al implementar.
- **`localStorage` en SSR.** La lectura debe ir en `onMounted` tras `import.meta.client`; leerla en `setup()` a secas rompería el render en servidor.
- **Coste del glow en `neon`.** `shadowBlur` alto sobre muchos elementos (asteroides + partículas + balas) puede bajar FPS en equipos lentos. Cada spec de juego fija un `glowBlur` moderado y valida los FPS en la prueba de integración.
