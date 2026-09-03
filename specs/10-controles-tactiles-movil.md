# SPEC 10 — Juegos jugables en pantalla táctil (móvil)

> **Estado:** Aprobada
> **Depende de:** SPEC 05, SPEC 07, SPEC 08, SPEC 09
> **Fecha:** 2026-09-02
> **Objetivo:** Hacer jugables en pantalla táctil los cuatro engines reales de Arcade Vault (`rocas`, `caida`, `bloque-buster`, `serpentina`) mediante una extensión del contrato `GameEngine` (`touchControls` + `pressControl`/`releaseControl`), un componente compartido `TouchControls.vue` que dibuja una barra de botones **debajo del CRT** (no superpuesta al canvas), y un layout de player compacto que se activa solo en dispositivos de puntero grueso.

## Por qué existe esta spec

Los cuatro engines reales sólo escuchan teclado en `window` (y `bloque-buster` además `mousemove`). En un teléfono no hay forma de jugarlos: no hay teclas y el HUD vertical del player deja el canvas sin espacio útil. Esta spec añade una capa de input táctil genérica —descrita por cada engine, renderizada una sola vez— en lugar de parchear cada juego por separado, siguiendo el mismo precedente de refactor único del contrato que estableció `skins/00`.

## Alcance

### En alcance

- **Extensión del contrato `GameEngine`** (`app/games/types.ts`): nuevo tipo `TouchControl` y tres miembros nuevos en la interfaz — `readonly touchControls: TouchControl[]`, `pressControl(id: string): void`, `releaseControl(id: string): void`.
- **Los cuatro engines reales implementan los tres miembros nuevos**, enrutando a su estado de input ya existente (mapa `keys[]`, `justPressed[]`, `pendingDirection`, etc.) sin duplicar la lógica de juego:
  - `rocas`: `girar-izq` (hold), `girar-der` (hold), `propulsar` (hold), `disparar` (tap).
  - `caida`: `izq` (tap), `der` (tap), `rotar` (tap), `bajar` (hold, soft-drop), `soltar` (tap, hard-drop).
  - `bloque-buster`: `izq` (hold), `der` (hold).
  - `serpentina`: `arriba`, `abajo`, `izq`, `der` (tap, D-pad).
- **Componente compartido `app/components/games/TouchControls.vue`**: recibe el array `touchControls` y emite `press`/`release` con el `id`; dibuja los botones con `pointerdown`/`pointerup`/`pointercancel`, agrupados en dos cúmulos (`side: "left"` y `side: "right"`) dentro de una barra `.tc-bar` que se monta **debajo del `.crt`** (hay espacio vertical libre en móvil; así no tapa zonas jugables del canvas ni pelea con el `aspect-ratio: 4/3`).
- **Los cuatro wrappers Vue** (`AsteroidsGame.vue`, `CaidaGame.vue`, `BloqueBusterGame.vue`, `SerpentinaGame.vue`) exponen la capa táctil vía `defineExpose` (`touchControls()`, `pressControl(id)`, `releaseControl(id)`, además de `pause`/`resume`/`restart`). `jugar.vue` renderiza un único `<TouchControls>` bajo el `.crt`, cableado al `gameRef` expuesto.
- **Detección automática**: un composable `app/composables/useCoarsePointer.ts` (`matchMedia("(pointer: coarse)")`) decide si `TouchControls` se monta. Sin toggle manual.
- **Layout de player compacto en móvil** (`jugar.vue` + `main.css`): con puntero grueso o viewport angosto, el HUD de stats (JUGADOR / PUNTUACIÓN / VIDAS / NIVEL / SKIN) colapsa a una sola línea mínima y los botones PAUSA / FIN / SALIR se compactan, para liberar altura vertical al canvas y a la barra táctil que va debajo.
- **`preventDefault` / `touch-action: none`** en los botones táctiles (`.tc-btn`) y en el `.game-stage` para que el gesto sobre el área de juego no scrollee ni haga zoom la página. La `.tc-bar` va debajo del CRT y **no** lleva `touch-action: none` (el `preventDefault` en `pointerdown` de cada botón alcanza).
- **Actualizar `engine-contract.md`** (y su symlink en `.agents/skills/`) documentando los tres miembros nuevos del contrato.

### Fuera de alcance (para futuras specs)

- Los juegos mock (`gloton`, `invasores`, `ranaria`, `duelo-pixel`): sólo heredan el layout responsive, **no** reciben botones táctiles.
- Arrastrar el dedo sobre el canvas para mover la pala de `bloque-buster` (se resuelve con botones izq/der; el drag queda para otra spec si se pide).
- Gestos swipe sobre el canvas para `serpentina` / `caida` (se usan botones).
- Vibración / haptic feedback.
- Gamepad API / mandos físicos.
- Remapeo o personalización de la disposición de los controles.
- PWA / instalación / pantalla completa (`requestFullscreen`).
- Gestos multitouch avanzados (pinch, rotación de dos dedos).
- Persistencia de cualquier preferencia táctil en `localStorage`.
- Aviso "girá el dispositivo" en vertical — el layout compacto soporta vertical, no se fuerza horizontal.

## Modelo de datos

Esta feature **no** introduce datos persistentes: no toca Supabase, no usa `localStorage`, no añade filas ni columnas. Sólo añade tipos en tiempo de compilación y estado efímero en memoria.

### `app/games/types.ts` (extensión del contrato)

```ts
/** Un botón táctil que el engine expone para que la capa Vue lo dibuje. */
export interface TouchControl {
  id: string; // identificador estable, p. ej. "girar-izq"
  label: string; // glifo/carácter a pintar en el botón, p. ej. "◀" "▲" "⟳" "●"
  kind: "hold" | "tap"; // hold = press+release mantenido; tap = pulso único
  side: "left" | "right"; // en qué cúmulo (esquina) del stage se agrupa
}

export interface GameEngine {
  start(): void;
  stop(): void;
  pause(): void;
  resume(): void;
  restart(): void;
  setSkin(id: SkinId): void;
  getSnapshot(): EngineSnapshot;
  onSnapshot(cb: (s: EngineSnapshot) => void): void;

  // NUEVO — capa táctil
  readonly touchControls: TouchControl[]; // estático por engine; [] si no aplica
  pressControl(id: string): void; // id desconocido = no-op silencioso
  releaseControl(id: string): void; // id desconocido = no-op silencioso
}
```

### Semántica de `pressControl` / `releaseControl` por tipo

- `kind: "hold"` → `pressControl(id)` marca el input como activo (equivale a `keydown` mantenido), `releaseControl(id)` lo desmarca (equivale a `keyup`). El engine ya consume ese estado en su `update()`.
- `kind: "tap"` → `pressControl(id)` dispara la acción una vez (equivale al `keydown` discreto que ya maneja el engine); `releaseControl(id)` es no-op.
- Reglas del contrato de engine que siguen aplicando: `pressControl` respeta `paused` / `phase` igual que el `onKeyDown` actual; ningún listener nuevo se registra en `window` (los eventos de puntero viven en `TouchControls.vue`, no en el engine).

### Descriptores concretos por engine

```ts
// rocas
[
  { id: "girar-izq", label: "◀", kind: "hold", side: "left" },
  { id: "girar-der", label: "▶", kind: "hold", side: "left" },
  { id: "propulsar", label: "▲", kind: "hold", side: "right" },
  { id: "disparar", label: "●", kind: "tap", side: "right" },
];

// caida
[
  { id: "izq", label: "◀", kind: "tap", side: "left" },
  { id: "der", label: "▶", kind: "tap", side: "left" },
  { id: "bajar", label: "▼", kind: "hold", side: "left" },
  { id: "rotar", label: "⟳", kind: "tap", side: "right" },
  { id: "soltar", label: "⤓", kind: "tap", side: "right" },
];

// bloque-buster
[
  { id: "izq", label: "◀", kind: "hold", side: "left" },
  { id: "der", label: "▶", kind: "hold", side: "right" },
];

// serpentina
[
  { id: "arriba", label: "▲", kind: "tap", side: "right" },
  { id: "abajo", label: "▼", kind: "tap", side: "right" },
  { id: "izq", label: "◀", kind: "tap", side: "left" },
  { id: "der", label: "▶", kind: "tap", side: "left" },
];
```

### Estado efímero nuevo (no serializado)

- En cada engine, reutiliza el mapa de input ya existente. Ejemplo `rocas`: `pressControl("propulsar")` hace `this.keys["ArrowUp"] = true` (y `justPressed` cuando corresponde); no se añade un segundo mapa paralelo.
- En `TouchControls.vue`: un `Set<string>` local de punteros activos por botón, para soltar (`releaseControl`) si el `pointerup`/`pointercancel` llega fuera del botón.

Convenciones:

- Los `id` son `kebab-case` en español, estables (se testean).
- `label` es un único carácter Unicode ya presente en fuentes de sistema — sin assets de iconos.

## Plan de implementación

1. **Extender el contrato en `app/games/types.ts`.** Añadir la interfaz `TouchControl` y los tres miembros nuevos (`touchControls`, `pressControl`, `releaseControl`) a `GameEngine`. Prueba: `npm run build` ahora **falla** en los cuatro engines por miembros faltantes — eso confirma que el contrato se aplica.

2. **`rocas` implementa la capa táctil.** En `app/games/asteroids/engine.ts`: `readonly touchControls` con los 4 descriptores; `pressControl`/`releaseControl` que escriben en `this.keys[...]` / `this.justPressed[...]` mapeando `girar-izq→ArrowLeft`, `girar-der→ArrowRight`, `propulsar→ArrowUp`, `disparar→Space`. Sin listeners nuevos. Prueba: `npm run build` compila `rocas`; `pressControl("disparar")` en consola dispara una bala.

3. **`caida` implementa la capa táctil.** En `app/games/caida/engine.ts`: 5 descriptores; `pressControl` llama a `tryMove(-1)`, `tryMove(1)`, `tryRotate()`, `hardDrop()` para los `tap`, y `softDrop()` para `bajar` (`hold`) — reusando el guard `!this.running || this.paused || this.phase !== "playing"`. Prueba: `npm run build` compila `caida`; cada `id` mueve/rota/dropea la pieza.

4. **`bloque-buster` implementa la capa táctil.** En `app/games/bloque-buster/engine.ts`: 2 descriptores `hold`; `pressControl("izq")` → `this.keys["ArrowLeft"] = true`, `releaseControl` lo pone en `false`; ídem `der`. `mousemove` intacto. Prueba: `npm run build` compila; mantener `izq` mueve la pala a la izquierda.

5. **`serpentina` implementa la capa táctil.** En `app/games/serpentina/engine.ts`: 4 descriptores `tap`; `pressControl(id)` hace `this.pendingDirection = <dir>` reusando el bloqueo de giro de 180° que ya vive en el paso de grilla. Prueba: `npm run build` compila los cuatro engines sin errores ni `any` implícito.

6. **Actualizar `engine-contract.md`.** Documentar en `.claude/skills/add-game/engine-contract.md` (§1 tabla de la API + una subsección nueva "Capa táctil") los tres miembros, la semántica `hold`/`tap`, y la regla de "enrutar al estado de input existente, sin listeners nuevos en el engine". Verificar que el symlink `.agents/skills/skills/add-game/engine-contract.md` refleja el cambio. Prueba: `git diff` muestra el doc actualizado; el symlink apunta al mismo contenido.

7. **Composable `app/composables/useCoarsePointer.ts`.** Devuelve un `ref<boolean>` que arranca en `false` (SSR-safe) y en `onMounted` evalúa `matchMedia("(pointer: coarse)")`, suscribiéndose a `change`. Prueba: en escritorio devuelve `false`, en emulador móvil de DevTools devuelve `true`.

8. **Componente `app/components/games/TouchControls.vue`.** Props: `controls: TouchControl[]`. Emits: `press: [id]`, `release: [id]`. Root `<div class="tc-bar" role="group">` con dos `<div class="tc-cluster left">` / `<div class="tc-cluster right">` y un `<button class="tc-btn">` por control; `@pointerdown` → `press` (+ `setPointerCapture` para `kind:"hold"`), `@pointerup`/`@pointercancel`/`@pointerleave` → `release` para `kind:"hold"`; para `kind:"tap"` sólo `press` en `pointerdown`. `touch-action: none` en los botones. Prueba: montado suelto en una página de prueba, los eventos se emiten con el `id` correcto.

9. **Cablear `TouchControls` en `jugar.vue`.** Cada `*Game.vue` amplía su `defineExpose` con `touchControls()`, `pressControl(id)`, `releaseControl(id)` (ruteo directo al `engine`, que sigue siendo `let`, no `ref` — contrato §4). `jugar.vue` importa `useCoarsePointer` y, **debajo del `.crt`**, renderiza `<TouchControls v-if="coarse && isRealGame && gameRef" :controls="gameRef.touchControls()" @press="gameRef?.pressControl($event)" @release="gameRef?.releaseControl($event)" />`. Prueba: `npm run dev`, emulador móvil, navegar a `/juego/rocas/jugar` — aparecen los 4 botones bajo el CRT y la nave gira/dispara.

10. **CSS de los controles táctiles (`main.css`).** Bloque nuevo: `.tc-bar` como fila `flex` (`justify-content: space-between`) con `margin-top` bajo el `.crt`; `.tc-cluster.left` / `.right` agrupan sus botones a cada extremo; `.tc-btn` con tamaño mínimo 56×56px, semitransparente, sin subrayado ni selección, respetando la paleta CRT existente (borde neón, fondo `rgba(0,0,0,.45)`; cyan = `hold`, magenta = `tap`). `@media (pointer: fine) and (hover: hover)` oculta `.tc-bar` (además del `v-if`). Prueba: la barra se ve completa debajo del canvas, no lo tapa, y los botones no reaccionan a `:hover` de mouse.

11. **Layout de player compacto (`jugar.vue` + `main.css`).** Añadir clase/condición para puntero grueso: el `.player-hud` colapsa las tiles a una línea (`Puntuación` + `Vidas` + `Nivel` en formato corto; `Jugador` y el selector de `Skin` se ocultan) bajo `.av-player--compact` (de `useCoarsePointer`) **o** un `@media (max-width: 720px)`. PAUSA / FIN / SALIR se reducen a labels cortos. Se recorta el chrome del `.crt` para dejar altura al canvas y a la `.tc-bar`. Prueba: en emulador móvil vertical, el canvas entra sin scroll y la barra táctil queda accesible justo debajo.

12. **`touch-action` / no-scroll global del stage.** Confirmar `touch-action: none` en `.game-stage` y que los `preventDefault` de los engines siguen sólo sobre teclas propias (no interferir con el scroll fuera del juego). Prueba: arrastrar el dedo sobre el canvas no scrollea ni hace pull-to-refresh; fuera del `.crt` la página scrollea normal.

13. **Prueba de integración final.** Ver Criterios de aceptación — recorrer los 4 juegos en un dispositivo/emulador táctil y verificar que escritorio y los juegos mock no cambiaron.

## Criterios de aceptación

- [ ] `npm run build` y `npm run dev` funcionan sin errores; `app/games/types.ts` define `TouchControl` y los tres miembros nuevos, y los cuatro engines los implementan sin `any` implícito.
- [ ] En un dispositivo (o emulador) de puntero grueso, `/juego/rocas/jugar` muestra 4 botones táctiles en una barra bajo el CRT; `/juego/caida/jugar` muestra 5; `/juego/bloque-buster/jugar` muestra 2; `/juego/serpentina/jugar` muestra un D-pad de 4.
- [ ] En escritorio (puntero fino) **no** se monta ningún botón táctil en ninguno de los 4 juegos, y el player se ve y se comporta exactamente igual que antes de esta spec.
- [ ] `rocas`: mantener `girar-izq` / `girar-der` / `propulsar` produce el mismo efecto continuo que mantener las flechas; `disparar` dispara una bala por pulsación (no autofire al mantener).
- [ ] `caida`: `izq` / `der` / `rotar` / `soltar` actúan una vez por pulsación; mantener `bajar` acelera la caída (soft-drop) y al soltar vuelve a la velocidad normal.
- [ ] `bloque-buster`: mantener `izq` / `der` mueve la pala de forma continua; soltar el botón la detiene; el control por `mousemove` sigue funcionando en escritorio.
- [ ] `serpentina`: cada botón del D-pad fija la dirección; un botón que implique giro de 180° sobre el cuerpo se ignora, igual que con teclado.
- [ ] Un `pointerup` o `pointercancel` que ocurre con el dedo ya fuera del botón `hold` igualmente dispara `releaseControl` (la nave/pala no queda "pegada" en movimiento).
- [ ] Arrastrar el dedo sobre el `.game-stage` no scrollea la página, no hace zoom ni pull-to-refresh; fuera del `.crt` la página scrollea con normalidad.
- [ ] En viewport de teléfono en vertical, el canvas entra en pantalla sin scroll y la `.tc-bar` queda justo debajo (accesible con un scroll mínimo si hiciera falta); el HUD de stats está colapsado a una línea y el selector de Skin oculto.
- [ ] PAUSA / FIN / SALIR siguen accesibles y operativos en el layout compacto; PAUSA detiene la simulación real y REANUDAR continúa sin salto de `dt`.
- [ ] Reaching game over dispara el modal Vue existente exactamente una vez y GUARDAR PUNTUACIÓN persiste la fila real vía `POST /api/scores`.
- [ ] Salir de `/juego/[id]/jugar` desmonta `TouchControls` y detiene el engine sin listeners de puntero colgando ni errores de consola.
- [ ] Los juegos mock (`gloton`, `invasores`, `ranaria`, `duelo-pixel`) no muestran botones táctiles y sólo heredan el layout responsive del player.
- [ ] `engine-contract.md` documenta los tres miembros nuevos y su semántica `hold`/`tap`, y el symlink en `.agents/skills/` refleja el mismo contenido.

## Decisiones

- **Sí:** extender el contrato `GameEngine` con `touchControls` + `pressControl`/`releaseControl`. Es el mismo precedente de refactor único que `skins/00`; mantiene la capa Vue genérica (un solo `TouchControls.vue` para los 4 juegos).
- **No:** sintetizar `KeyboardEvent` desde los botones y despacharlos a `window`. Funcionaría sin tocar el contrato, pero acopla cada engine a códigos de tecla concretos, es frágil ante `preventDefault`/foco, y no expresa qué controles necesita cada juego.
- **No:** que cada engine dibuje sus propias zonas táctiles dentro del canvas y maneje `pointer` él mismo. Rompe la regla del contrato de "sin listeners nuevos en el engine", duplica hit-testing 4 veces y complica el escalado CSS del canvas.
- **Sí:** descriptor estático `touchControls` con `kind: "hold" | "tap"`. Cubre los dos modelos de input que ya usan los engines (estado mantenido vs. evento discreto) sin un tercer caso.
- **Sí:** enrutar `pressControl` al mapa de input ya existente de cada engine (`keys[]`, `justPressed[]`, `pendingDirection`). Evita un segundo camino de estado que podría desincronizarse del teclado.
- **Sí:** detección automática con `matchMedia("(pointer: coarse)")`, sin toggle manual. Un teléfono siempre es puntero grueso; un toggle es superficie de UI y estado extra sin pedido real.
- **No:** persistir en `localStorage` una preferencia "ocultar controles". No se pidió; añade versionado de storage para un caso hipotético.
- **Sí:** `bloque-buster` con dos botones `hold` izq/der. Es jugable y consistente con el contrato genérico.
- **No:** arrastrar el dedo sobre el canvas para posicionar la pala de `bloque-buster`. Mejor UX pero requiere manejo de `pointer` en el canvas escalado y un modelo de input que los otros 3 juegos no comparten; queda para otra spec si se pide.
- **No:** gestos swipe para `serpentina` / `caida`. Los botones son más precisos y testeables (los `id` se verifican en los criterios); swipe introduce umbrales y ambigüedad diagonal.
- **Sí:** `caida` incluye botón de hard-drop (`soltar`). Es una acción central de Tetris; sin ella el juego táctil se siente incompleto.
- **Sí:** soportar vertical con layout compacto, sin aviso "girá el dispositivo". Menos fricción; el HUD colapsado libera la altura necesaria.
- **Sí:** ocultar el selector de Skin y el campo Jugador en el layout compacto. Son configuración, no juego; el HUD debe priorizar Puntuación/Vidas/Nivel y el canvas.
- **Sí:** `label` como un único glifo Unicode de fuente de sistema (`◀ ▶ ▲ ▼ ⟳ ⤓ ●`). Cero assets de iconos, coherente con el resto del proyecto (portadas por gradientes CSS, sin imágenes).
- **No:** vibración/haptics, Gamepad API, fullscreen, remapeo, PWA. Cada uno es su propia spec si alguna vez aterriza.
- **No:** dar botones táctiles a los juegos mock. Son placeholder; sólo heredan el layout responsive.
- **Sí (revisión durante `/spec-impl`):** la barra `.tc-bar` va **debajo del `.crt`**, no superpuesta al canvas. En móvil vertical sobra espacio bajo el CRT, la barra no tapa zonas jugables (esquinas de Asteroids, columnas de Tetris) ni pelea con el `aspect-ratio: 4/3`, y el `<TouchControls>` pasa a montarse una sola vez en `jugar.vue` (los wrappers exponen `touchControls()`/`pressControl`/`releaseControl` vía `defineExpose`) en lugar de dentro de cada `.game-stage`.

## Riesgos

| Riesgo                                                                                                                              | Mitigación                                                                                                                                                                                                             |
| ----------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pointerup` / `pointercancel` que llega fuera del botón deja un control `hold` activo (nave o pala moviéndose sola).                | `setPointerCapture` en `pointerdown` + `releaseControl` también en `pointercancel` y `pointerleave`; un criterio de aceptación lo verifica explícitamente.                                                             |
| `matchMedia("(pointer: coarse)")` da falso positivo/negativo en híbridos (laptop táctil, tablet con teclado).                       | El teclado sigue 100% operativo en paralelo — los controles táctiles son aditivos, nunca reemplazan input. Un falso positivo sólo añade botones que se pueden ignorar.                                                 |
| El `.crt` está bloqueado a `aspect-ratio: 4/3`; en un teléfono vertical el canvas + HUD + barra táctil pueden no entrar sin scroll. | Layout compacto (HUD a una línea, Skin oculto, chrome del CRT recortado) libera altura para el canvas; la `.tc-bar` va debajo del CRT y se alcanza con un scroll mínimo si hiciera falta.                              |
| La `.tc-bar` debajo del CRT queda lejos del pulgar o empuja el footer.                                                              | Va inmediatamente después del `.crt`, dentro del `.av-player`; en móvil vertical entra en pantalla o a un scroll corto. Botones de 56px mínimo, cyan (`hold`) vs magenta (`tap`) para distinguir su rol de un vistazo. |
| `touch-action: none` en `.game-stage` mata también gestos legítimos si el selector se filtra fuera del área de juego.               | Aplicarlo sólo a `.game-stage` y `.tc-btn`, nunca a `.crt` ni a `.av-player`; criterio de aceptación verifica que la página scrollea normal fuera del `.crt`.                                                          |
| Doble contrato extendido (`skins/00` ya añadió `setSkin`) sobre engines con TODO no-op de skin (`bloque-buster`).                   | Esta spec sólo añade miembros nuevos; no depende de que `setSkin` esté implementado. Los engines compilan igual con el `setSkin` no-op actual.                                                                         |

## Lo que **no** está en esta spec

- Botones táctiles para los juegos mock (`gloton`, `invasores`, `ranaria`, `duelo-pixel`).
- Arrastrar el dedo sobre el canvas para mover la pala de `bloque-buster`.
- Gestos swipe sobre el canvas (`serpentina`, `caida`).
- Vibración / haptic feedback.
- Gamepad API / mandos físicos.
- Remapeo o reordenamiento de los controles.
- PWA, instalación, `requestFullscreen`.
- Gestos multitouch (pinch, rotación de dos dedos).
- Persistencia de preferencias táctiles en `localStorage`.
- Aviso "girá el dispositivo" / bloqueo de orientación.

Cada uno, si aterriza, va en su propia spec.
