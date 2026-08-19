# SPEC 09 — Snake real para el juego SERPENTINA

> **Estado:** Implementado
> **Depende de:** `05-asteroids-rocas.md`, `06-juegos-y-leaderboard.md`
> **Fecha:** 2026-08-19
> **Objetivo:** Construir un motor de Snake desde cero (sin referencia en `references/started-games/`) en `app/games/serpentina/engine.ts`, usando los sprites de fruta de `references/source-assets/snake-assets/` para dibujar la comida, integrado en el catálogo existente (`serpentina`) mediante el patrón de juego real ya establecido por ROCAS, CAÍDA y BLOQUE BUSTER.

## Alcance

### En alcance

- El motor `app/games/serpentina/engine.ts`, escrito desde cero (no hay `game.js` de referencia): grilla 20×15 celdas de 32px (canvas 640×480, 4:3 exacto, sin letterbox), movimiento por pasos discretos sobre la grilla, colisión contra pared y contra el propio cuerpo, crecimiento al comer fruta, velocidad progresiva por nivel.
- El componente `app/components/games/SerpentinaGame.vue`, canvas único dentro de `.game-stage`.
- La entrada `serpentina` en `app/games/registry.ts`.
- Los sprites de fruta portados a `public/games/serpentina/fruits.png`, con el atlas de coordenadas (adaptado de `references/source-assets/snake-assets/sprites.js`) embebido como constante tipada en `engine.ts`.
- Input de teclado: flechas y WASD, con bloqueo de giro de 180° y `preventDefault` en las teclas de flecha.
- El seed de puntuaciones de ejemplo para `serpentina` (actualmente 0 filas en `scores`).

### Fuera de alcance

- Los demás juegos que sigan con el Reproductor mock (`gloton`, `invasores`, `ranaria`, `duelo-pixel`) — sin cambios.
- La fila en `games` para `serpentina` y su clase `cover-*` — ya existen (`cover-snake`, green, `sort_order` 3), no se tocan.
- Audio — no hay assets de sonido provistos para este juego.
- Controles táctiles/móvil.
- Modo wrap-around (teletransporte por los bordes) — se descarta a favor de muerte al chocar pared.
- Sistema de vidas múltiples/respawn — se descarta a favor de 1 vida clásica.
- Puntaje variable por tamaño/rareza de fruta — todas las frutas valen lo mismo.
- Cualquier UI de administración del catálogo (sigue fuera de alcance desde spec 06).
- Autenticación real / vincular scores a un usuario (sigue fuera de alcance desde spec 06).

## Modelo de datos

### `app/games/serpentina/engine.ts` (nuevo)

Grilla fija: `COLS = 20`, `ROWS = 15`, `CELL = 32` (canvas 640×480, 4:3 exacto).

```ts
type Direction = "up" | "down" | "left" | "right";
interface Vec2 {
  x: number;
  y: number;
} // coordenadas de grilla, no píxeles

interface FruitSprite {
  x: number;
  y: number;
  w: number;
  h: number;
}
// Atlas embebido, adaptado de references/source-assets/snake-assets/sprites.js
// (21 entradas: apple, banana, orange, grape, ... — recorte dentro de fruits.png)
const FRUIT_ATLAS: Record<string, FruitSprite> = {/* ... */};

export class SerpentinaEngine implements GameEngine {
  constructor(canvas: HTMLCanvasElement);
  // start/stop/pause/resume/restart/getSnapshot/onSnapshot — ver engine-contract.md §1

  getSnapshot(): EngineSnapshot {
    return {
      score: this.score, // +10 por fruta
      lives: this.lives, // 1 vida clásica: 1 → 0 al chocar
      level: this.level, // sube cada 5 frutas comidas
      phase: this.phase, // "playing" | "gameover" (sin "dead" transitorio, ver Decisiones)
      extras: [{ label: "LARGO", value: String(this.snake.length) }],
    };
  }
}
```

Reglas internas clave:

- **Movimiento por pasos discretos**: un acumulador de tiempo (`moveTimer`) dispara un paso de grilla cada `moveInterval` segundos (no cada frame de `dt`); `moveInterval` arranca en `0.15s` y baja `0.012s` por nivel hasta un piso de `0.06s`.
- **Buffer de dirección**: la tecla presionada se guarda en `pendingDirection` y sólo se aplica en el próximo paso de grilla, con el giro de 180° bloqueado en el momento de aplicarla (no al presionar) — evita el bug clásico de invertirse sobre el segundo segmento si se presionan dos teclas en el mismo frame.
- **Comida**: `food: { pos: Vec2; sprite: keyof typeof FRUIT_ATLAS }`, reubicada en una celda libre (fuera del cuerpo de la serpiente) al comer, con sprite elegido al azar del atlas completo.
- **Imagen de sprites cargada de forma asíncrona** (`new Image(); .src = "/games/serpentina/fruits.png"`) — el motor debe poder dibujar (fallback a un rectángulo de color) si el frame ocurre antes de que `img.complete` sea `true`.

## Plan de implementación

1. Copiar `references/source-assets/snake-assets/fruits.png` a `public/games/serpentina/fruits.png`, y adaptar el atlas de coordenadas de `sprites.js` (21 frutas) a una constante TypeScript tipada `FRUIT_ATLAS` dentro de `engine.ts`. Prueba: `npm run build` no rompe por assets faltantes.
2. Implementar `app/games/serpentina/engine.ts` desde cero, siguiendo `engine-contract.md` §1-2: grilla 20×15/celda 32px, movimiento por pasos discretos con buffer de dirección y bloqueo de giro 180°, colisión contra pared y contra el propio cuerpo, spawn de fruta en celda libre, crecimiento y puntaje (+10), progresión de velocidad/nivel cada 5 frutas (con piso), fase `"playing"` → `"gameover"` directo al chocar (1 vida, sin fase `"dead"` transitoria). Prueba: `npm run build` compila sin errores de tipos ni `any` implícitos.
3. Agregar el mecanismo de snapshot (`onSnapshot`, invocado 1× por frame dentro del loop, incluso en pausa), con `extras: [{label:"LARGO", value:...}]`. Prueba: sigue compilando.
4. Crear `app/components/games/SerpentinaGame.vue` (canvas 640×480, montaje/desmontaje del motor, `defineExpose({ pause, resume, restart })`, emits `snapshot`/`gameover`). Prueba manual directa en el paso 5.
5. Registrar el juego: una línea en `app/games/registry.ts` (`serpentina: defineAsyncComponent(() => import("~/components/games/SerpentinaGame.vue"))`). Prueba: `npm run dev`, navegar a `/juego/serpentina/jugar`, confirmar que aparece el canvas real (no el mock).
6. Seed de puntuaciones de ejemplo para `serpentina` (0 filas actuales) vía `mcp__supabase__apply_migration`, reusando el pool de alias ya usado en otros juegos, con timestamps ISO explícitos. Prueba: `/juego/serpentina` muestra el leaderboard con filas.
7. Prueba de integración final: jugar una partida completa hasta chocar contra la pared o contra el propio cuerpo, confirmar que el stat-strip Vue (score/lives/level/LARGO) coincide en todo momento con el estado interno, que las frutas se dibujan correctamente con el sprite correspondiente, que el giro de 180° está bloqueado, que PAUSA/REANUDAR detienen y retoman el movimiento real, que el modal de fin de partida aparece exactamente una vez y guarda el puntaje, que JUGAR DE NUEVO inicia una partida real (serpiente reiniciada en el centro), que salir de la página detiene el loop sin dejar listeners activos, y que los demás juegos (mock u otros motores reales) no cambiaron.

## Criterios de aceptación

- [x] `npm run dev` y `npm run build` funcionan sin errores, con `app/games/serpentina/engine.ts` tipado sin `any` implícitos.
- [x] Navegar a `/juego/serpentina/jugar` muestra el canvas del juego real (640×480) dentro del marco CRT, sin distorsión ni letterbox, en cualquier ancho de viewport (incluido mobile).
- [x] Los controles (flechas y WASD) mueven la serpiente sin scrollear la página; un giro de 180° sobre sí misma es ignorado.
- [x] La fruta se dibuja con un sprite aleatorio del atlas de `fruits.png`, visualmente nítido dentro de su celda de 32px.
- [x] El puntaje/vidas/nivel/largo mostrados en el stat-strip Vue coinciden en todo momento con el estado interno del motor.
- [x] La velocidad de movimiento aumenta cada 5 frutas comidas, hasta el piso definido, y el campo `level` del snapshot refleja ese avance.
- [x] PAUSA detiene el movimiento real (no un contador falso) y REANUDAR continúa sin salto ni movimiento acumulado de más de un paso.
- [x] Al chocar contra una pared o contra el propio cuerpo aparece el modal Vue de fin de partida exactamente una vez, con el puntaje real.
- [x] Guardar la puntuación persiste una fila real en Supabase y se refleja en `/juego/serpentina` y en `/salon-de-la-fama` tras recargar.
- [x] JUGAR DE NUEVO inicia una partida real nueva (serpiente de largo inicial, centrada, fruta nueva).
- [x] Salir de `/juego/serpentina/jugar` detiene el loop y remueve los listeners (sin errores de consola ni el loop corriendo en segundo plano).
- [x] Navegar a `/juego/[id]/jugar` de cualquier otro juego sigue mostrando exactamente lo mismo que antes (mock u otro motor real).

## Decisiones

- **¿Refactor único del registry?** No — `app/games/registry.ts` y `app/games/types.ts` ya existen desde spec 07/08; esta spec sólo agrega una línea al registry.
- **Resolución del canvas:** 640×480 (20×15 celdas de 32px), 4:3 exacto — **Sí**, sin letterbox, consistente con ROCAS (800×600) y evita el caso de tablero no-4:3 descrito en `engine-contract.md`.
- **Comportamiento en bordes:** Muerte al chocar pared — **Sí**, clásico Nokia/arcade, más simple y consistente con la mecánica de "un choque = game over"; se descarta wrap-around por complejidad de colisión adicional sin aportar al objetivo del curso.
- **Sistema de vidas:** 1 vida clásica (`lives`: 1 → 0) — **Sí**, fiel al género; se descarta el sistema de 3 vidas con respawn para no diluir la tensión característica de Snake.
- **Fase `"dead"` transitoria:** **No** — con 1 sola vida no hay respawn que animar, así que el choque pasa directo de `"playing"` a `"gameover"`, igual decisión que tomó BLOQUE BUSTER (spec 08) por el mismo motivo.
- **Progresión de velocidad:** Aumenta cada 5 frutas con piso mínimo — **Sí**, le da uso real al campo `level` del contrato y evita que la partida se vuelva imposible de forma abrupta.
- **Controles:** Flechas + WASD, con giro de 180° bloqueado en el momento de aplicar la dirección — **Sí**, evita el bug clásico de auto-choque por input accidental en el mismo frame.
- **Elección de fruta:** Aleatoria entre las 21 del atlas, todas valen 10 pts — **Sí**, aprovecha visualmente el asset completo sin complicar el balance ni el HUD con valores variables.
- **Stat extra en el HUD:** Largo de la serpiente vía `extras` — **Sí**, es el stat clásico que se espera ver en Snake, y el campo `extras` del contrato ya está pensado para esto.
- **Sprites de fruta:** Se portan a `public/games/serpentina/fruits.png` — **Sí**, es un proyecto de curso/portfolio (no producto comercial), y el usuario los proveyó explícitamente para este propósito; se documenta la fuente (spriters-resource.com) en un comentario junto al atlas, igual que ya estaba documentado en `sprites.js`.
- **Catálogo:** Se reutiliza la fila existente `serpentina` (ARCADE, `cover-snake`, green, `sort_order` 3) — **Sí**, no se crea fila nueva ni clase `cover-*` nueva.
- **Audio/táctil:** Fuera de alcance — **No** se portan; no hay assets de audio provistos y no se pidió soporte táctil.

## Riesgos

- **Origen de los sprites:** `fruits.png` proviene de spriters-resource.com (extracción de fans de Google Snake), sin licencia comercial explícita. Aceptable para este proyecto educativo/portfolio, pero si el repo se hiciera público con fines comerciales convendría reemplazarlos por arte propio o con licencia clara.
- **Carga asíncrona de la imagen:** el motor arranca (`start()`) antes de que `fruits.png` termine de cargar; si el primer frame se dibuja antes de `img.complete`, debe haber un fallback (rectángulo de color) para no lanzar una excepción de canvas ni dejar la fruta invisible.
- **Balance de velocidad:** al ser un juego nuevo sin referencia, el piso de velocidad (0.06s) y el incremento por nivel (0.012s cada 5 frutas) son valores de diseño elegidos en esta spec, no portados de un original — puede requerir ajuste fino durante `/spec-impl` si se siente demasiado fácil o injugable.
