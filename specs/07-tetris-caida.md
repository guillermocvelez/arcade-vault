# SPEC 07 — Tetris real para el juego CAÍDA

> **Estado:** Implementado
> **Depende de:** `05-asteroids-rocas.md`, `06-juegos-y-leaderboard.md`
> **Fecha:** 2026-08-19
> **Objetivo:** Portar el Tetris de referencia a un motor real en `app/games/caida/engine.ts`, integrado en el catálogo existente (`caida`) mediante el patrón de juego real ya establecido por ROCAS, e introducir el registry (`app/games/registry.ts`) como refactor único que generaliza el snapshot para futuros juegos.

## Alcance

### En alcance

- El refactor único (Paso 0): `app/games/types.ts` (`Phase`, `EngineSnapshot` generalizado con `extras`, interfaz `GameEngine`), migración de `AsteroidsEngine` para implementarla (moviendo `tripleShot` a `extras`), creación de `app/games/registry.ts`, y actualización de `app/pages/juego/[id]/jugar.vue` para resolver el componente vía `GAME_ENGINES[id]` en vez de `isRealGame`/`<AsteroidsGame>` hardcodeado.
- El motor portado a `app/games/caida/engine.ts`, fiel al `game.js` de referencia (`references/started-games/03-tetris/`) salvo por lo listado en Decisiones (sin tema claro/oscuro, sin pausa/reinicio nativos, `lives` fijo en 1, líneas eliminadas expuestas como `extras`).
- El componente `app/components/games/CaidaGame.vue`, con doble canvas (tablero 300×600 + preview de siguiente pieza 120×120) dentro de `.game-stage`.
- La regla CSS de letterbox (`max-width/max-height` + `auto`) para el `.game-stage`/`.game-canvas`, aplicada como parte del refactor único, verificando que ROCAS (800×600, ya 4:3) se siga viendo idéntico.
- La entrada `caida` en `app/games/registry.ts`.
- El seed de puntuaciones de ejemplo para `caida` (actualmente 0 filas en `scores`).

### Fuera de alcance

- Los demás juegos que sigan con el Reproductor mock (`serpentina`, `gloton`, `invasores`, `ranaria`, `duelo-pixel`) — sin cambios.
- La fila en `games` para `caida` y su clase `cover-*` — ya existen (`cover-tetro`, magenta, `sort_order` 2), no se tocan.
- Sonido, controles táctiles y multijugador — el original no tenía sonido; no se pidió portar nada de esto.
- El tema claro/oscuro del original y su persistencia en `localStorage` — se elimina, no se porta.
- Cualquier UI de administración del catálogo (sigue fuera de alcance desde spec 06).
- Autenticación real / vincular scores a un usuario (sigue fuera de alcance desde spec 06).

## Modelo de datos

### `app/games/types.ts` (nuevo — parte del refactor único)

```ts
export type Phase = "playing" | "dead" | "gameover";

export interface EngineSnapshot {
  score: number;
  lives: number;
  level: number;
  phase: Phase;
  extras?: Array<{ label: string; value: string }>;
}

export interface GameEngine {
  start(): void;
  stop(): void;
  pause(): void;
  resume(): void;
  restart(): void;
  getSnapshot(): EngineSnapshot;
  onSnapshot(cb: (s: EngineSnapshot) => void): void;
}
```

`AsteroidsEngine` pasa a implementar `GameEngine`; su campo `tripleShot: number` se elimina de `EngineSnapshot` y se expone como `extras: [{ label: "3x", value: \`${tripleShot.toFixed(1)}s\` }]`sólo cuando`tripleShot > 0`(si no,`extras`vacío/undefined).`jugar.vue`cambia su tile hardcodeado por un`v-for="e in extras"` genérico.

### `app/games/caida/engine.ts` (nuevo)

```ts
export class CaidaEngine implements GameEngine {
  constructor(canvas: HTMLCanvasElement, nextCanvas: HTMLCanvasElement);
  // start/stop/pause/resume/restart/getSnapshot/onSnapshot — ver engine-contract.md §1

  getSnapshot(): EngineSnapshot {
    return {
      score: this.score,
      lives: 1, // Tetris no tiene vidas: game over directo al chocar el spawn
      level: this.level, // floor(lines / 10) + 1, igual que el original
      phase: this.phase, // "playing" | "gameover" (Tetris no usa "dead")
      extras: [{ label: "LINEAS", value: String(this.lines) }],
    };
  }
}
```

Estado interno portado literal del original: tablero `ROWS×COLS` (20×10), pieza actual/siguiente (`shape`, `x`, `y`), `dropInterval`/`dropAccum` para la caída automática, `ghostY()` para la pieza fantasma, `rotateCW()` + wall kicks `[0,±1,±2]` para la rotación, `LINE_SCORES = [0,100,300,500,800] × level` para el puntaje.

**Nota sobre `phase`:** el original no tiene un estado intermedio como el `"dead"` de ROCAS (respawn tras perder una vida) — al chocar la pieza recién generada pasa directo a `"gameover"`. `phase` sólo transiciona `"playing" → "gameover"`.

### Catálogo (`games`)

Sin cambios — la fila `caida` ya existe:

```
id: caida | title: CAÍDA | cat: PUZZLE | cover: cover-tetro | color: magenta | sort_order: 2
```

### Seed de `scores`

12 filas para `game_id = 'caida'`, mismo formato que los seeds existentes (alias variados, timestamps ISO explícitos, puntajes variados) — actualmente 0 filas.

## Plan de implementación

0. Refactor único: crear `app/games/types.ts` (`Phase`, `EngineSnapshot` generalizado con
   `extras`, interfaz `GameEngine`), migrar `AsteroidsEngine` para implementarla (moviendo
   `tripleShot` a `extras`), crear `app/games/registry.ts`, actualizar
   `app/pages/juego/[id]/jugar.vue` para resolver el componente vía `GAME_ENGINES[id]` en vez
   de `isRealGame`/`<AsteroidsGame>` hardcodeado, y aplicar la regla CSS de letterbox
   (`max-width/max-height` + `auto`) a `.game-stage`/`.game-canvas` en `main.css`. Prueba:
   `/juego/rocas/jugar` se sigue viendo y comportando idéntico (800×600 ya es 4:3, no debe
   notarse el cambio).
1. Portar el motor a `app/games/caida/engine.ts`, clase por clase / función por función desde
   `references/started-games/03-tetris/game.js`, siguiendo `engine-contract.md` §2: sin
   globals de `document`/`window` en scope de módulo (canvas del tablero y canvas de preview
   recibidos por constructor), listeners de teclado agregados/quitados en `start()`/`stop()`,
   `dt` no aplica igual que en ROCAS porque el drop original usa acumulación de ms directa
   (`dropAccum += dt`) — se mantiene esa lógica pero con `dt` en segundos y clamp a 0.05s como
   el resto del contrato. Rotación (`rotateCW` + wall kicks), colisión, `hardDrop`/`softDrop`,
   `clearLines`, `ghostY`, dibujo de bloques con highlight, todo portado literal. Prueba:
   `npm run build` compila sin errores de tipos, sin `any`.
2. Agregar el mecanismo de snapshot (`onSnapshot`, invocado 1× por frame dentro del loop,
   incluso en pausa), con `lives` fijo en 1 y `extras: [{label:"LINEAS", value: lines}]`.
   Prueba: sigue compilando.
3. Crear `app/components/games/CaidaGame.vue`: doble `<canvas>` (tablero 300×600 + preview
   120×120) dentro de `.game-stage`, montaje/desmontaje del motor, `defineExpose({ pause,
resume, restart })`, emits `snapshot`/`gameover`. Sin props. Prueba manual directa en el
   paso 4.
4. Registrar el juego: una línea en `app/games/registry.ts` (`caida:
defineAsyncComponent(() => import("~/components/games/CaidaGame.vue"))`). Prueba:
   `npm run dev`, navegar a `/juego/caida/jugar`, confirmar que aparece el canvas real (no el
   mock), tablero letterboxed dentro del marco CRT sin distorsión.
5. Seed de puntuaciones de ejemplo para `caida` (12 filas, alias variados, timestamps ISO,
   vía `apply_migration`). Prueba: `/juego/caida` muestra el leaderboard con filas.
6. Prueba de integración final: jugar una partida completa de Tetris hasta el game over
   (dejar que una pieza colisione al spawnear), confirmar que el stat-strip Vue
   (score/lives=1/level/LINEAS) coincide en todo momento con lo dibujado en el canvas, que
   mover/rotar/soft-drop/hard-drop funcionan sin scrollear la página, que la pieza fantasma y
   el preview de la siguiente pieza se ven correctamente, que PAUSA/REANUDAR detienen y
   retoman la caída automática real (sin salto de `dt`), que el modal de fin de partida
   aparece exactamente una vez y guarda el puntaje, que JUGAR DE NUEVO inicia una partida real
   nueva, que salir de la página detiene el loop sin dejar listeners activos, y que ROCAS y
   los demás juegos mock no cambiaron.

## Criterios de aceptación

- [x] `npm run dev` y `npm run build` funcionan sin errores, con `app/games/caida/engine.ts` y
      `app/games/types.ts` tipados sin `any` implícitos.
- [x] Navegar a `/juego/caida/jugar` muestra el canvas real del Tetris dentro del marco CRT,
      con letterbox (sin distorsión) en cualquier ancho de viewport, incluido mobile.
- [x] `/juego/rocas/jugar` se ve y comporta exactamente igual que antes del refactor único
      (el letterbox no introduce cambio visible en un canvas ya 4:3).
- [x] Los controles (←/→ mover, ↑/X rotar con wall kicks, ↓ soft drop, Espacio hard drop)
      funcionan sin scrollear la página.
- [x] El score/lives(=1)/level/LINEAS mostrados en el stat-strip Vue coinciden en todo momento
      con lo dibujado en el canvas.
- [x] El preview de la siguiente pieza (segundo canvas) se actualiza correctamente al fijar
      cada pieza.
- [x] La pieza fantasma se dibuja en la posición correcta de aterrizaje.
- [x] PAUSA detiene la caída automática real (no un contador falso) y REANUDAR continúa sin
      salto de física ni de `dropAccum`.
- [x] Al colisionar una pieza recién generada aparece el modal Vue de fin de partida
      exactamente una vez, con el puntaje real; la pausa nativa (tecla P), el reinicio nativo
      (botón + `init()`) y el toggle de tema claro/oscuro del original quedan eliminados.
- [x] Guardar la puntuación persiste una fila real en Supabase y se refleja en `/juego/caida`
      y en `/salon-de-la-fama` tras recargar.
- [x] JUGAR DE NUEVO inicia una partida real nueva y jugable (tablero, piezas y contadores
      reiniciados).
- [x] Salir de `/juego/caida/jugar` detiene el loop y remueve los listeners (sin errores de
      consola ni el loop corriendo en segundo plano).
- [x] Navegar a `/juego/[id]/jugar` de cualquier otro juego (ROCAS u otros mock) sigue
      mostrando exactamente lo mismo que antes.

## Decisiones

- **Refactor del registry: Sí.** Este es el primer juego real después de ROCAS — `app/games/registry.ts` no existía, así que el refactor único (generalización de `EngineSnapshot` con `extras`, `GameEngine`) es Paso 0 obligatorio.
- **Aspecto del tablero (1:2, no 4:3): letterbox, no rediseño.** Se aplica la regla `max-width/max-height` + `auto` en vez de estirar el canvas o cambiar `COLS`/`ROWS`/`BLOCK` — mantiene el tablero estándar de Tetris (10×20) sin distorsión.
- **`lives`: fijo en 1, nunca decrece.** Tetris no tiene el concepto de vidas del original; el game over es directo al chocar la pieza de spawn. Se usa `1` en vez de `0` para no implicar "sin vidas" mientras se juega activamente.
- **Líneas eliminadas: expuestas vía `extras`.** Igual que `tripleShot` en ROCAS, se muestra como tile genérico `hud-stat` (`v-for="e in extras"`) en vez de agregar un campo dedicado a `EngineSnapshot`.
- **Preview de siguiente pieza: se porta como segundo `<canvas>`.** Se mantiene la mecánica completa del original (120×120) dentro de `.game-stage`, en vez de dibujarla en una esquina del canvas principal o eliminarla.
- **Tecla KeyX como rotación alternativa: se mantiene.** Igual que el original, no genera conflicto con otros controles de la plataforma.
- **Highlight del bloque (efecto 3D básico): se porta idéntico.** `drawBlock()` conserva el relleno de color + highlight superior semitransparente del original.
- **Pausa nativa (tecla P): eliminada.** El botón PAUSA/REANUDAR de la plataforma y `pause()`/`resume()` del motor son los únicos dueños del flujo de pausa — mantener P activo desincronizaría el estado del motor con el de Vue.
- **Reinicio nativo (botón + `init()` on click): eliminado.** El modal Vue de fin de partida (`jugar.vue`) es el único punto de reinicio, igual que en ROCAS.
- **Tema claro/oscuro del original: eliminado.** No aplica al marco CRT fijo de Arcade Vault; se elimina junto con su persistencia en `localStorage`.
- **Catálogo: fila reutilizada, sin `INSERT`.** `caida` (PUZZLE, `cover-tetro`, magenta, `sort_order` 2) ya existe — no se crea fila nueva ni clase `cover-*` nueva.
- **Nombres de archivo: `app/games/caida/engine.ts` + `CaidaGame.vue`.** Sigue la convención de ROCAS (carpeta/componente nombrados según el `id` del catálogo, no el nombre genérico "tetris").
- **Sin sonido/táctil/multijugador.** El original no tenía sonido; no se pidió portar controles táctiles ni soporte multijugador.

## Riesgos

- **Letterbox introducido en el refactor único.** Cambia una regla CSS que hoy afecta a ROCAS (el único juego real existente). Aunque 800×600 ya es 4:3 y no debería notarse, es el tipo de cambio silencioso que puede pasar desapercibido en review — el Paso 0 exige verificación visual explícita de ROCAS, no sólo confiar en el cálculo de aspecto.
- **Timing de caída basado en acumulación de ms, no en `dt` puro como ROCAS.** El original acumula `dropAccum += dt` en milisegundos y compara contra `dropInterval` (que cambia con el nivel), en vez de aplicar velocidades en unidades/segundo como las entidades de ROCAS. Portarlo a `dt` clamped en segundos requiere cuidado para no alterar el timing clásico de Tetris (dificultad progresiva bien calibrada en el original) — vale una prueba manual de sensación de velocidad en niveles 1, 3 y 5+.
- **Script de referencia sin clases** (`game.js` usa funciones sueltas + variables de módulo `let board, current, next, ...`). El porte a una clase `CaidaEngine` con estado privado tiene más riesgo de introducir bugs sutiles de estado (p. ej. mutación accidental de `shape` compartida entre `current`/`next`) que un porte clase-por-clase como fue ROCAS — vale prestar atención especial a `randomPiece()`/`spawn()` y a que `rotateCW` no mute el arreglo original.
- **Puntuaciones sembradas como si fueran reales.** Mismo riesgo ya señalado en spec 06: los 12 alias/puntajes de seed para `caida` podrían leerse como datos reales de jugadores si no se documentan como ejemplo en algún lugar visible para el equipo.
