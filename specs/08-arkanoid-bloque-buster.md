# SPEC 08 — Arkanoid real para el juego BLOQUE BUSTER

> **Estado:** Implementado
> **Depende de:** `05-asteroids-rocas.md`, `06-juegos-y-leaderboard.md`
> **Fecha:** 2026-08-19
> **Objetivo:** Portar el Arkanoid de referencia (`references/started-games/04-arkanoid/`) a un motor real en `app/games/bloque-buster/engine.ts`, dibujado en vectores (sin sprites ni audio), integrado en el catálogo existente (`bloque-buster`) mediante el patrón de juego real ya establecido por ROCAS y CAÍDA.

## Alcance

### En alcance

- El motor portado a `app/games/bloque-buster/engine.ts`, fiel a la lógica de `game.js`/`levels.js` de referencia (colisiones, 5 niveles, velocidad progresiva de la bola, puntaje) salvo por lo listado en Decisiones (dibujo vectorial en vez de spritesheet, sin audio, sin fase `dead`, HUD movido al stat-strip, pausa/selector nativo eliminados).
- El componente `app/components/games/BloqueBusterGame.vue`, canvas único 800×600 dentro de `.game-stage` (ya 4:3, sin letterbox adicional).
- La entrada `bloque-buster` en `app/games/registry.ts`.
- Input de teclado (← →) y mouse (con corrección de escala CSS `getBoundingClientRect()`/`scaleX`) para mover la paleta.
- El seed de puntuaciones de ejemplo para `bloque-buster` (actualmente 0 filas en `scores`).

### Fuera de alcance

- Los demás juegos que sigan con el Reproductor mock (`serpentina`, `gloton`, `invasores`, `ranaria`, `duelo-pixel`) — sin cambios.
- La fila en `games` para `bloque-buster` y su clase `cover-*` — ya existen (`cover-bricks`, cyan, `sort_order` 1), no se tocan.
- Sprites (`spritesheet-breakout.png`) y audio (`ball-bounce.mp3`, `break-sound.mp3`) del original — no se portan; todo se dibuja en vectores, sin sonido.
- Más de 5 niveles o generación infinita de niveles.
- Controles táctiles/móvil.
- Power-ups o variantes de bola.
- Cualquier UI de administración del catálogo (sigue fuera de alcance desde spec 06).
- Autenticación real / vincular scores a un usuario (sigue fuera de alcance desde spec 06).

## Modelo de datos

### `app/games/bloque-buster/engine.ts` (nuevo)

```ts
export class BloqueBusterEngine implements GameEngine {
  constructor(canvas: HTMLCanvasElement);
  // start/stop/pause/resume/restart/getSnapshot/onSnapshot — ver engine-contract.md §1

  getSnapshot(): EngineSnapshot {
    return {
      score: this.score,
      lives: this.lives, // inicia en 3, igual que el original
      level: this.currentLevel, // 1..5
      phase: this.phase, // "playing" | "gameover" (sin "dead": reposición inmediata de la bola)
      extras: this.won ? [{ label: "ESTADO", value: "¡COMPLETADO!" }] : undefined,
    };
  }
}
```

Estado interno portado literal del original (`references/started-games/04-arkanoid/game.js` + `levels.js`):

- `paddle` (`x, y, w=81, h=14`), `ball` (`x, y, w=16, h=16, vx, vy`).
- `blocks[]` por nivel (`BLOCK_COLS=10 × BLOCK_ROWS=6`, `BLOCK_W=64, BLOCK_H=24`), generados desde `LEVELS[n-1].blocks` (5 patrones: parrilla completa, pirámide, tablero de ajedrez, filas con huecos, marco+cruz).
- `explosions[]` — animación de bloque destruido, redibujada como partículas/flash vectorial en vez de frames de spritesheet (ver Decisiones).
- Velocidad de bola por nivel: `BASE_BALL_VX=200, BASE_BALL_VY=-300`, multiplicadas por `LEVELS[n-1].speed` (×1.00 a ×1.46).
- Colisiones AABB bola↔bloque, bola↔paredes, bola↔paddle — lógica idéntica al original.
- `won: boolean` — se activa al limpiar el nivel 5 (equivalente al `gameState === 'win'` original), se expone vía `extras` según la decisión de la pregunta "Victoria".

**Nota sobre `phase`:** igual que CAÍDA, no se usa el estado intermedio `"dead"` — al perder una vida con `lives > 0` la bola se reposiciona de inmediato sobre la paleta (fiel al original), sin pausa ni animación de respawn. `phase` transiciona `"playing" → "gameover"` tanto al quedarse sin vidas como al completar el nivel 5.

### Catálogo (`games`)

Sin cambios — la fila `bloque-buster` ya existe:

```
id: bloque-buster | title: BLOQUE BUSTER | cat: ARCADE | cover: cover-bricks | color: cyan | sort_order: 1
```

### Seed de `scores`

12 filas para `game_id = 'bloque-buster'`, mismo formato que los seeds existentes (alias variados, timestamps ISO explícitos, puntajes variados) — actualmente 0 filas.

## Plan de implementación

1. Portar el motor a `app/games/bloque-buster/engine.ts`, clase por clase / función por función
   desde `references/started-games/04-arkanoid/game.js` + `levels.js`, siguiendo
   `engine-contract.md` §2: sin globals de `document`/`window` en scope de módulo (canvas
   recibido por constructor), listeners de teclado y mouse agregados/quitados en
   `start()`/`stop()` (arrow functions `readonly` para poder hacer `removeEventListener` con la
   misma referencia), `dt` clamped a 0.05s. Colisiones AABB, movimiento de paddle/bola, carga de
   niveles (`LEVELS`), incremento de velocidad por nivel, todo portado literal. El dibujo de
   bloques/paddle/bola/explosiones se hace con `fillRect`/`arc`/`fill` en vez de `drawImage`
   contra el spritesheet (ver Decisiones). Prueba: `npm run build` compila sin errores de
   tipos, sin `any`.
2. Agregar el mecanismo de snapshot (`onSnapshot`, invocado 1× por frame dentro del loop,
   incluso en pausa), con `score`/`lives`/`level` reales y `extras` con el tile de victoria
   cuando corresponda. Prueba: sigue compilando.
3. Crear `app/components/games/BloqueBusterGame.vue`: canvas único 800×600 dentro de
   `.game-stage`, montaje/desmontaje del motor, `defineExpose({ pause, resume, restart })`,
   emits `snapshot`/`gameover`. Sin props. Prueba manual directa en el paso 4.
4. Registrar el juego: una línea en `app/games/registry.ts` (`"bloque-buster":
defineAsyncComponent(() => import("~/components/games/BloqueBusterGame.vue"))`). Prueba:
   `npm run dev`, navegar a `/juego/bloque-buster/jugar`, confirmar que aparece el canvas real
   (no el mock), sin distorsión dentro del marco CRT (800×600 ya es 4:3).
5. Seed de puntuaciones de ejemplo para `bloque-buster` (12 filas, alias variados, timestamps
   ISO, vía `apply_migration`). Prueba: `/juego/bloque-buster` muestra el leaderboard con filas.
6. Prueba de integración final: jugar una partida completa hasta perder las 3 vidas (o
   completar los 5 niveles), confirmar que el stat-strip Vue (score/lives/level/extras)
   coincide en todo momento con la física real, que mover la paleta con teclado y mouse
   funciona sin scrollear la página, que el rebote bola↔bloques/paredes/paddle es correcto en
   los 5 patrones de nivel, que PAUSA/REANUDAR detienen y retoman la física real sin salto de
   `dt`, que el modal de fin de partida aparece exactamente una vez (tanto al perder como al
   completar el nivel 5) y guarda el puntaje, que JUGAR DE NUEVO inicia una partida real nueva
   desde el nivel 1, que salir de la página detiene el loop sin dejar listeners activos, y que
   ROCAS/CAÍDA y los demás juegos mock no cambiaron. **Tras verificar el guardado de puntaje
   (POST `/api/scores` → visible en `/juego/bloque-buster` y `/salon-de-la-fama`), borrar por
   SQL la(s) fila(s) de `scores` insertadas durante esta prueba manual**, dejando la tabla solo
   con las 12 filas de seed del Paso 5.

## Criterios de aceptación

- [x] `npm run dev` y `npm run build` funcionan sin errores, con
      `app/games/bloque-buster/engine.ts` tipado sin `any` implícitos.
- [x] Navegar a `/juego/bloque-buster/jugar` muestra el canvas real del Arkanoid dentro del
      marco CRT, sin distorsión en cualquier ancho de viewport (incluido mobile).
- [x] Los controles (← → teclado, mouse) mueven la paleta correctamente y sin scrollear la
      página; el mouse corrige la escala CSS del canvas.
- [x] El score/lives/level (y el tile de victoria cuando aplica) mostrados en el stat-strip
      Vue coinciden en todo momento con la física real del canvas.
- [x] Los 5 niveles cargan con sus patrones de bloques correctos y la velocidad de la bola
      aumenta progresivamente (×1.00 a ×1.46) al avanzar de nivel.
- [x] PAUSA detiene la física real (bola, paddle, colisiones) y REANUDAR continúa sin salto
      de física.
- [x] Al llegar al estado terminal (0 vidas o nivel 5 completado) aparece el modal Vue de fin
      de partida exactamente una vez, con el puntaje real; la pausa nativa (P/Escape), el
      selector de nivel por click y el reinicio nativo del original quedan eliminados.
- [x] Guardar la puntuación persiste una fila real en Supabase y se refleja en
      `/juego/bloque-buster` y en `/salon-de-la-fama` tras recargar.
- [x] JUGAR DE NUEVO inicia una partida real nueva desde el nivel 1 (bloques, vidas y score
      reiniciados).
- [x] Salir de `/juego/bloque-buster/jugar` detiene el loop y remueve los listeners de
      teclado y mouse (sin errores de consola ni el loop corriendo en segundo plano).
- [x] Navegar a `/juego/[id]/jugar` de cualquier otro juego (ROCAS, CAÍDA u otros mock) sigue
      mostrando exactamente lo mismo que antes.
- [x] La tabla `scores` para `bloque-buster` contiene exactamente las 12 filas de seed tras
      completar la prueba de integración (sin filas residuales de la prueba manual de guardado).

## Decisiones

- **Registry: ya existe, no requiere refactor.** `app/games/registry.ts` fue creado por spec 07 — este spec solo agrega una línea (`bloque-buster: defineAsyncComponent(...)`).
- **Resolución: 800×600 sin cambios.** Ya es 4:3 exacto, encaja en `.crt-screen` sin necesidad de letterbox adicional (la regla ya existe desde spec 07).
- **HUD: movido al stat-strip de Vue. Sí.** El original dibuja score/nivel/vidas sobre el canvas; se elimina ese dibujo y se expone todo vía `EngineSnapshot`, igual que ROCAS/CAÍDA — evita duplicar información y sigue la convención de la plataforma.
- **Assets (sprites/audio): no se portan. No.** Ni ROCAS ni CAÍDA usan sprites ni audio — ambos dibujan formas vectoriales en canvas. Para mantener consistencia visual y evitar ser el primer juego con assets externos, bloques/paddle/bola/explosiones se redibujan como rectángulos/círculos/partículas de color. Sin efectos de sonido.
- **Input: teclado + mouse. Sí.** El mouse es el input más natural para una paleta y el original lo soporta; se implementa con `getBoundingClientRect()` + `scaleX` según `engine-contract.md` §2.
- **Pausa/selector de nivel nativo (P/Escape + click): eliminados. Sí.** El botón PAUSA/REANUDAR de la plataforma y `pause()`/`resume()` del motor son los únicos dueños del flujo de pausa — mantener el overlay nativo desincronizaría el estado del motor con el de Vue y permitiría saltar niveles fuera del flujo normal.
- **Vida perdida (lives > 0): reposición inmediata, sin fase `dead`. Sí.** Fiel al original (`initBall()` inmediata) — no se agrega una fase intermedia como la de ROCAS (2s de partículas), que el original no tiene.
- **Victoria (nivel 5 completado): `phase = "gameover"` + `extras` con tile "¡COMPLETADO!". Sí.** El tipo `Phase` de la plataforma no distingue victoria de derrota; se usa `extras` (mismo mecanismo que "LINEAS" en CAÍDA) para dar la señal visual sin ampliar el tipo compartido.
- **Catálogo: fila reutilizada, sin `INSERT`.** `bloque-buster` (ARCADE, `cover-bricks`, cyan, `sort_order` 1) ya existe — no se crea fila nueva ni clase `cover-*` nueva.
- **Seed de `scores`: 12 filas, siguiendo la convención de ROCAS/CAÍDA.** El leaderboard está vacío (0 filas); se siembra igual que los demás juegos para no lanzar vacío.
- **Limpieza de puntajes de prueba manual: sí, tras verificar el guardado.** Cualquier fila insertada durante la prueba manual del Paso 6 se borra por SQL después de confirmar que el flujo de guardado funciona, para no mezclar datos de prueba con el seed intencional.
- **Nombres de archivo: `app/games/bloque-buster/engine.ts` + `BloqueBusterGame.vue`.** Sigue la convención de ROCAS/CAÍDA (carpeta/componente nombrados según el `id` del catálogo, no "arkanoid").
- **Sin power-ups, sin táctil/móvil, sin niveles adicionales.** El original tampoco los tiene; no se pidió agregarlos.

## Riesgos

- **Fidelidad de colisiones sin sprites de referencia visual.** El original usa un spritesheet para paddle/bola/bloques con dimensiones exactas (`paddle 81×14`, `ball 16×16`, `block 64×24`); redibujar en vectores debe conservar esas mismas dimensiones de hitbox para no alterar la sensación de las colisiones AABB ya calibradas en el original.
- **Explosiones sin frames de spritesheet.** El original anima 4 frames por color (`EXPLOSION_DURATION = 150ms`) desde el spritesheet; la versión vectorial (partículas o flash de color) debe respetar la misma duración para no cambiar el feedback visual al romper bloques, aun sin ser pixel-idéntica.
- **Puntuaciones sembradas como si fueran reales.** Mismo riesgo ya señalado en spec 06 y reiterado en spec 07: los 12 alias/puntajes de seed para `bloque-buster` podrían leerse como datos reales de jugadores si no se documentan como ejemplo en algún lugar visible para el equipo.
- **Filas de prueba manual olvidadas en `scores`.** Si el Paso 6 no se completa hasta el final (p. ej. la sesión de `/spec-impl` se corta después de guardar un puntaje de prueba pero antes de borrarlo), la tabla queda con una fila de prueba mezclada con el seed — vale verificar el conteo de filas (`select count(*) from scores where game_id='bloque-buster'`) antes de dar el spec por completado.
