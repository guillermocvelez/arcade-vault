# SPEC game-jam — CARRIL CERO: motor de cruce infinito

> **Estado:** Borrador
> **Depende de:** `05-asteroids-rocas.md`, `06-juegos-y-leaderboard.md`
> **Fecha:** 2026-08-31
> **Objetivo:** Construir desde cero el motor de CARRIL CERO en `app/games/carril-cero/engine.ts` —un juego de cruce de carriles infinito con una purga que asciende desde el borde inferior—, integrado por el patrón de juego real ya establecido por ROCAS, CAÍDA y BLOQUE BUSTER (motor + wrapper Vue + una línea en el registry).

## Alcance

### En alcance

- El motor `app/games/carril-cero/engine.ts` (nuevo, desde cero — no hay fuente que portar), implementando `GameEngine` de `app/games/types.ts` (`start/stop/pause/resume/restart/getSnapshot/onSnapshot`).
- El componente `app/components/games/CarrilCeroGame.vue`, canvas único 800×600 dentro de `.game-stage`.
- La entrada `"carril-cero"` en `app/games/registry.ts` (una sola línea — el registry ya existe desde spec 07).
- Input de teclado (flechas + WASD) para el salto discreto en 4 direcciones, con `preventDefault` en flechas y espacio.
- El dibujo íntegramente vectorial (`fillRect` / `arc` / `stroke` / `shadowBlur` / partículas), sin sprites ni audio.

### Fuera de alcance

- La migración de la fila `games` para `carril-cero`, la clase `.cover-carriles` y el seed de `scores` — los cubre `02-plataforma.md`.
- Los demás juegos, reales o mock (`rocas`, `caida`, `bloque-buster`, `serpentina`, `gloton`, `invasores`, `ranaria`, `duelo-pixel`) — sin cambios.
- El registry como refactor — ya existe desde spec 07; este spec solo agrega una línea.
- Sonido, controles táctiles / móvil, multijugador.
- Power-ups adicionales, editor de niveles, modos alternativos, guardado de récord local.
- Cualquier UI de administración del catálogo (sigue fuera de alcance desde spec 06).
- Autenticación real / vincular scores a un usuario (sigue fuera de alcance desde spec 06).

## Modelo de datos

### `app/games/carril-cero/engine.ts` (nuevo)

```ts
export class CarrilCeroEngine implements GameEngine {
  constructor(canvas: HTMLCanvasElement); // getContext("2d"); lanza (no devuelve null) si falla

  // start/stop/pause/resume/restart/getSnapshot/onSnapshot — ver engine-contract.md §1

  getSnapshot(): EngineSnapshot {
    return {
      score: Math.floor(this.score),
      lives: this.lives, // inicia en 3
      level: Math.floor(this.maxRow / ZONE_ROWS) + 1, // "ZONA": 1, 2, 3...
      phase: this.phase, // "playing" | "dead" | "gameover"
      extras: [
        { label: "FILA", value: String(this.maxRow) },
        { label: "NUCLEOS", value: String(this.cores) },
      ],
    };
  }
}
```

Todo el estado interno está inventado en este spec (no hay script de referencia). Detalle equivalente al que spec 08 da para `paddle` / `ball` / `blocks` / `LEVELS`:

**Rejilla y cámara**

- `TILE = 40`, `COLS = 20`, `VIS_ROWS = 15` — el canvas es 800×600 exacto (4:3), rejilla de 20×15 tiles, sin letterbox.
- El mundo se mide en **filas enteras** que crecen hacia el norte (arriba). `player.row` (int), `player.col` (int 0..19); `player.x` / `player.y` en px de mundo para interpolar el salto.
- `cameraTop: number` — fila de mundo dibujada en la parte superior de la pantalla. **Solo aumenta.** Cada frame se acerca (lerp, `CAM_LERP = 8` /s) a `target = max(cameraTop, player.row - PLAYER_SCREEN_ROW)` con `PLAYER_SCREEN_ROW = 10` (el jugador se mantiene ~5 filas por encima del borde inferior mientras avanza). `screenY(row) = (row - cameraTop) * TILE`.
- `maxRow: number` — fila de mundo más al norte alcanzada; solo crece; es la base de la puntuación y de la ZONA.

**Jugador**

- `player = { row, col, x, y, dir: "up" | "down" | "left" | "right", hopT: number, hopFromX, hopFromY, hopToX, hopToY, alive: boolean }`.
- Movimiento **discreto**: cada pulsación válida inicia un salto de 1 tile; `hopT` va de 0 a `HOP_DURATION = 0.12` s interpolando `x, y` con `easeOutQuad` y una squash-stretch visual. Durante el salto se ignora input nuevo salvo el último, que se guarda en `bufferedInput` y se consume al aterrizar.
- Límite sur: no se permite un salto que deje al jugador por debajo de `cameraTop + VIS_ROWS - 1` (no aporta nada y la cámara nunca retrocede). Norte / este / oeste libres; `col` se clampa a 0..19 (chocar con el borde lateral consume el salto sin avanzar y **no** es muerte).
- Al aterrizar en una fila más al norte que `maxRow`: `score += SCORE_PER_ROW` por cada fila nueva de avance neto y `maxRow = player.row`.
- Caja de colisión: cuadrado de `PLAYER_HITBOX = 26` px centrado en el tile.

**Carriles** (`lanes: Map<number, Lane>` indexado por fila de mundo)

- `Lane = { row, type, accent, dir: 1 | -1, speed, entities: Entity[], gap, offX, core: Core | null }`.
- `type ∈ { "safe", "road", "river" }` (unión de literales, no string suelto).
- Se generan bajo demanda todas las filas en `[cameraTop - 2, cameraTop + VIS_ROWS + 2]` que aún no existan; se podan las filas con `row > cameraTop + VIS_ROWS + 4` (quedaron muy al sur).
- Filas de mundo `0..3`: siempre `safe` (arranque). El jugador empieza en `row = 0, col = 10`.
- Garantía de transitabilidad: nunca más de `MAX_HAZARD_RUN = 4` filas de peligro consecutivas sin una `safe`; los tramos de `river` se generan en grupos de 2–3 filas consecutivas (obliga a encadenar saltos sobre plataformas).
- `accent` se toma de `["cyan", "magenta", "green", "yellow"]` por carril, solo para el trazo de neón.
- `lane.speed` se sortea uniforme dentro de la banda de la ZONA (ver curva) al generar el carril; `dir` aleatorio.

**Vehículos** (carril `road`)

- `Vehicle = { x: number, w: number }`; `w ∈ {60, 80, 100}` px (1.5–2.5 tiles). Se mueven a `lane.speed * lane.dir` px/s; al salir por un lado reaparecen por el opuesto respetando `lane.gap` (separación mínima entre vehículos).
- `lane.gap` decrece con la profundidad (más tráfico): `gap = clamp(GAP_MAX - maxRow * 1.1, GAP_MIN, GAP_MAX)` con `GAP_MAX = 260`, `GAP_MIN = 96`.
- Colisión: AABB entre la caja del jugador (26 px) y el rect del vehículo (inset `4` px para ser justos). Solape ⇒ muerte.

**Río: troncos y placas** (carril `river`)

- Estar en reposo sobre agua desnuda de un carril `river` ⇒ muerte (ahogado). Se comprueba solo cuando el jugador está quieto (sin `hopT` activo) en ese carril.
- `Log = { x: number, w: number }`, `w ∈ {120, 160, 200}` px.
- `Plate = { x: number, w: 96, subCycle: number, subPhase: number }`: cada `subCycle ∈ [2.2, 3.6]` s la placa se sumerge `SUB_DOWN = 0.9` s (bajan alpha y escala; deja de sostener durante ese tramo).
- Mientras el jugador está en reposo sobre un carril `river`: si su centro solapa un `Log` o una `Plate` no sumergida, queda **embarcado** — `player.x += lane.speed * lane.dir * dt` (arrastre); al reanudar el salto, `col` se recalcula redondeando desde `player.x`. Si al terminar el arrastre el centro del jugador sale de `[0, 800]` px ⇒ muerte. Si no solapa ninguna plataforma activa ⇒ muerte.
- Bonus de cruce: al aterrizar en un carril `safe` o `road` viniendo de un carril `river`, `score += SCORE_RIVER_CROSS`.

**Núcleos** (`Core`)

- Solo aparecen en carriles `safe` recién generados, con probabilidad `CORE_CHANCE = 0.35`, en una `col` aleatoria. `Core = { col: number, taken: boolean }`.
- Recogerlo (aterrizar en su tile): `score += SCORE_CORE`, `cores += 1`, y empuja la purga hacia atrás `WALL_CORE_PUSHBACK = 0.5` filas.

**Purga ascendente** (`wall`)

- `wallRow: number` — fila de mundo de la cresta de la purga; crece con el tiempo. Muerte si `wallRow >= player.row` (el jugador rezagado es alcanzado).
- Velocidad en filas/s: `wallSpeed = min(WALL_BASE + Math.floor(maxRow / 10) * WALL_STEP, WALL_MAX) / TILE` con `WALL_BASE = 26` px/s, `WALL_STEP = 3` px/s por cada 10 filas, `WALL_MAX = 92` px/s.
- `wallRow` arranca en `-6` (6 filas al sur del inicio). Recoger núcleo: `wallRow -= WALL_CORE_PUSHBACK`. Respawn tras perder vida: `wallRow -= WALL_RESPAWN_PUSHBACK` (`= 3` filas), sin pasar de `player.row + 2`.
- Se dibuja como banda emisiva dentada con partículas de brasa en `screenY(wallRow)`; viñeta roja creciente cuando `player.row - wallRow < 3`.

**Muerte y respawn**

- `RESPAWN_TIME = 1.2` s. Al morir con `lives > 1`: `lives -= 1`, `phase = "dead"`, ráfaga de partículas; el jugador se reubica en la fila `safe` más cercana en `[player.row - 3, player.row]` (si no hay ninguna, se fuerza `safe` en `player.row`), `col` sin cambio (clamp 0..19), la purga retrocede `WALL_RESPAWN_PUSHBACK`. Tras `RESPAWN_TIME` ⇒ `phase = "playing"`. `maxRow`, `score` y `cores` se conservan.
- Al morir con `lives === 1`: `lives = 0`, `phase = "gameover"`. El loop sigue vivo dibujando el frame final; el wrapper Vue detecta el flanco y abre el modal una sola vez.

**Fórmula de puntuación** (monótona creciente; nunca decrece)

- `SCORE_PER_ROW = 10` por cada fila nueva de avance neto (solo cuenta rebasar `maxRow`; ir y volver no suma).
- `SCORE_RIVER_CROSS = 50` al salir de un tramo de río a tierra firme.
- `SCORE_CORE = 25` por núcleo recogido.
- `SCORE_NEAR_MISS = 5` cuando, en el frame en que el jugador aterriza, un vehículo pasa a menos de `NEAR_MISS_PX = 10` px de su caja sin tocarlo (máx. una vez por salto).
- No hay bonus por tiempo ni penalizaciones: encaja con `scores.score` (orden DESC) del leaderboard.

**Curva de dificultad** — por ZONA `= floor(maxRow / ZONE_ROWS) + 1`, `ZONE_ROWS = 25`:

| ZONA | Filas | `safe` | `road` | `river` | Banda de velocidad (px/s) |
| ---- | ----- | ------ | ------ | ------- | ------------------------- |
| 1    | 0–24  | 45%    | 45%    | 10%     | 40–70                     |
| 2    | 25–49 | 32%    | 48%    | 20%     | 55–95                     |
| 3    | 50–74 | 24%    | 50%    | 26%     | 70–115                    |
| 4+   | 75+   | 18%    | 50%    | 32%     | 85–135 (tope)             |

Además: `lane.gap` de tráfico decrece con `maxRow` (más densidad), la purga acelera `WALL_STEP` cada 10 filas hasta `WALL_MAX`, y cada ZONA desplaza la paleta de fondo (tinte progresivamente más frío / alarmante).

**Colisiones (resumen)**

- jugador ↔ vehículo: AABB ⇒ muerte.
- jugador en reposo sobre `river` sin plataforma activa (o placa sumergida): muerte (ahogado).
- jugador arrastrado con centro fuera de `[0, 800]` px: muerte.
- `wallRow >= player.row`: muerte.
- jugador ↔ núcleo: recogida (mismo tile al aterrizar).
- jugador ↔ borde lateral (`col` fuera de 0..19): el salto se consume sin avanzar (no es muerte).

**Constantes restantes:** `HOP_DURATION = 0.12`, `CAM_LERP = 8`, `PLAYER_SCREEN_ROW = 10`, `PLAYER_HITBOX = 26`, `MAX_HAZARD_RUN = 4`, `CORE_CHANCE = 0.35`, `RESPAWN_TIME = 1.2`, `NEAR_MISS_PX = 10`, `SUB_DOWN = 0.9`, y el clamp `MAX_DT = 0.05` para `dt`.

### Catálogo (`games`)

Fila **nueva** — no existe en el catálogo. La define `02-plataforma.md`:

```
id: carril-cero | title: CARRIL CERO | cat: ARCADE | cover: cover-carriles | color: green | sort_order: max(sort_order)+1 (esperado 9)
```

### Seed de `scores`

12 filas para `game_id = 'carril-cero'` (alias variados, timestamps ISO explícitos, puntajes variados) — las define `02-plataforma.md`.

## Plan de implementación

1. Crear `app/games/carril-cero/engine.ts` con la clase `CarrilCeroEngine implements GameEngine`, siguiendo `engine-contract.md` §2: sin globals de `document` / `window` en scope de módulo (canvas por constructor, `getContext("2d")` o lanzar), listeners de teclado como arrow-functions `readonly` (misma referencia para `addEventListener` / `removeEventListener`) agregados en `start()` y quitados en `stop()`, `dt = Math.min((ts - lastTime) / 1000, 0.05)`. Implementar el modelo de datos completo: rejilla / cámara, salto discreto interpolado con buffer de input, generación de carriles bajo demanda + poda, vehículos / troncos / placas con arrastre, núcleos, purga ascendente, colisiones, `score` / `maxRow` / `cores` / `lives` / `phase`, y `restart()` = init completo (no reset parcial). Sin `any` implícito ni explícito; entidades tipadas con interfaces, `type` de carril como unión literal. Prueba: `npm run build` compila sin errores de tipos.

2. Añadir el mecanismo de snapshot: `onSnapshot(cb)` guarda un único callback invocado al final de cada frame del loop, **incluido en pausa**; `getSnapshot()` devuelve `score` (entero), `lives`, `level` (ZONA), `phase` y `extras` `[{ FILA }, { NUCLEOS }]`. `pause()` solo levanta una bandera (el loop sigue dibujando y emitiendo snapshot, salta `update()`); `resume()` pone `lastTime = null` para que `dt` no salte. Prueba: sigue compilando.

3. Crear `app/components/games/CarrilCeroGame.vue` (~40 líneas, patrón de `engine-contract.md` §4): canvas único `:width="800" :height="600"` con clase `game-canvas` dentro de `.game-stage`; `onMounted` instancia el motor + `engine.onSnapshot(...)` (emite `snapshot`; emite `gameover` una sola vez con flanco `prevPhase !== "gameover"`) + `engine.start()`; `onUnmounted` hace `engine.stop()`. `defineExpose({ pause, resume, restart })`. Sin props. `engine` / `prevPhase` como `let` planos, nunca `ref`. Prueba manual directa en el paso 4.

4. Registrar el juego: una línea en `app/games/registry.ts` — `"carril-cero": defineAsyncComponent(() => import("~/components/games/CarrilCeroGame.vue"))`. Prueba: `npm run dev`, navegar a `/juego/carril-cero/jugar`, confirmar que aparece el canvas real (no el arena mock), 800×600 dentro del marco CRT sin distorsión (ya es 4:3), y que flechas / WASD mueven al jugador sin scrollear la página.

5. Prueba de integración del motor: jugar una partida completa hasta el game over (dejarse alcanzar por la purga, o chocar con las 3 vidas). Verificar que:
   - el stat-strip Vue (`score` / `lives` / `ZONA` / `FILA` / `NUCLEOS`) coincide en todo momento con lo que dibuja el canvas;
   - los cuatro controles + WASD funcionan con `preventDefault` solo en flechas y espacio (la página no scrollea); el espacio no hace nada más;
   - el salto discreto con buffer se siente responsivo; los carriles se generan y podan sin parpadeos;
   - el arrastre de troncos / placas, el ahogo y salir arrastrado del canvas funcionan;
   - recoger un núcleo suma y frena la purga;
   - perder una vida entra en `"dead"` ~1.2 s con respawn en fila segura y purga retrasada, y a la tercera pasa a `"gameover"`;
   - PAUSA detiene la física real (purga, tráfico, arrastre) y REANUDAR sigue sin salto de `dt`;
   - el modal de fin aparece exactamente una vez con el puntaje real; no hay pausa / reinicio / menús nativos en el canvas;
   - JUGAR DE NUEVO reinicia de verdad (cámara, purga, carriles, contadores);
   - salir de la página corta el loop y quita los listeners (sin errores de consola ni loop en segundo plano);
   - ROCAS / CAÍDA / BLOQUE BUSTER / SERPENTINA y los juegos mock siguen idénticos.

## Criterios de aceptación

- [ ] `npm run build` y `npm run dev` funcionan sin errores; `app/games/carril-cero/engine.ts` tipado sin `any` implícitos ni explícitos.
- [ ] `/juego/carril-cero/jugar` muestra el canvas real dentro del marco CRT, proporcionado (sin estirar) a cualquier ancho de viewport, incluido mobile.
- [ ] Flechas y WASD mueven al jugador un tile por pulsación; `preventDefault` solo en las teclas del juego (flechas + espacio) — la página nunca scrollea.
- [ ] `score` / `lives` / `ZONA` / `FILA` / `NUCLEOS` del stat-strip Vue coinciden en todo momento con lo dibujado en el canvas.
- [ ] La puntuación solo crece: +10 por fila nueva de avance neto, +50 por cruce de río, +25 por núcleo, +5 por near-miss; nunca decrece.
- [ ] La purga sube y acelera con la profundidad; ser alcanzado por ella causa muerte; recoger un núcleo y respawnear la retrasan.
- [ ] Los carriles de río exigen ir sobre troncos / placas; el agua desnuda, la placa sumergida y salir arrastrado del canvas causan muerte.
- [ ] Perder una vida con `lives > 1` entra en `phase "dead"` con respawn en fila segura; con `lives === 1` pasa directo a `"gameover"`.
- [ ] PAUSA detiene la física real (no un overlay cosmético) y REANUDAR continúa sin salto de `dt`.
- [ ] Al llegar a `"gameover"` el modal Vue de fin de partida aparece exactamente una vez con el puntaje real; no hay pausa, reinicio ni menús nativos en el canvas.
- [ ] JUGAR DE NUEVO inicia una partida real nueva (cámara, purga, carriles y contadores reiniciados), no un reset visual.
- [ ] Salir de `/juego/carril-cero/jugar` corta el loop y remueve los listeners de teclado (sin errores de consola ni loop en segundo plano).
- [ ] Navegar a `/juego/[id]/jugar` de cualquier otro juego (reales o mock) sigue mostrando exactamente lo mismo que antes.

## Decisiones

- **Categoría: ARCADE. Sí.** Un juego de reflejos por cruce de carriles es ARCADE de manual; forzarlo a VERSUS (única categoría sin motor real) exigiría un rival CPU con marcador que el tema no pide y que ensuciaría la puntuación individual del leaderboard. La diversidad se aporta por mecánica —autoscroll infinito con amenaza ascendente, no un tablero estático— no por etiqueta.
- **Concepto: fila NUEVA (`carril-cero`), no se reutiliza el slot mock `ranaria`. Sí.** `ranaria` es un Frogger clásico (nenúfares + temporizador) todavía sin motor; CARRIL CERO es un corredor infinito con purga ascendente, vidas con respawn, núcleos y ZONAS. Se crea fila propia para no pisar ni duplicar el concepto de `ranaria` ni su futuro `/add-game`.
- **Sin fuente que portar: motor desde cero. Sí.** No hay script de referencia en `references/started-games/`; todo el diseño (constantes, curva, colisiones) queda fijado en este spec.
- **Movimiento discreto por saltos de 1 tile con buffer de input. Sí.** Es la seña de identidad del género (Frogger / Crossy Road); el buffer de la última pulsación durante el salto de 0.12 s mantiene la respuesta ágil sin permitir spam de teclas.
- **Controles: flechas + WASD, nada más. Sí.** Cuatro direcciones cubren todo el juego; WASD como alias por comodidad. `preventDefault` en flechas y espacio para que la página no scrollee; el espacio no tiene función (solo se neutraliza).
- **`lives = 3` reales con respawn ⇒ se usa `phase "dead"`. Sí.** Igual que ROCAS: al perder vida hay una ventana de ~1.2 s con partículas y reubicación en fila segura antes de volver a `"playing"`; solo la última muerte va a `"gameover"`.
- **`level` = ZONA real (`floor(maxRow / 25) + 1`). Sí.** Cada ZONA escalona composición de carriles, banda de velocidad y paleta; no es un contador decorativo.
- **Stat extra en `extras`: `FILA` y `NUCLEOS`. Sí.** La distancia (`maxRow`) es el alma del run y los núcleos afectan a la purga; ambos van como tiles genéricos `hud-stat` (`v-for="e in extras"`), no como campos nuevos de `EngineSnapshot`.
- **Fórmula de puntuación monótona (fila + cruce de río + núcleo + near-miss). Sí.** Sin bonus por tiempo ni penalizaciones: `scores.score` se ordena DESC y el marcador nunca debe bajar.
- **Purga ascendente como "temporizador" en lugar del reloj de Frogger. Sí.** Da presión constante hacia adelante, condición de fin garantizada y una curva de dificultad limpia (acelera cada 10 filas), sin marcador por tiempo.
- **Resolución 800×600, sin letterbox. Sí.** Ya es 4:3 exacto (rejilla 20×15 de tiles de 40 px); encaja en `.crt-screen` sin franjas (la regla de letterbox ya existe desde spec 07 y no hace falta activarla aquí).
- **Sin assets: todo vectorial. No (a sprites / audio).** Ningún motor real del proyecto usa assets externos; vehículos, troncos, placas, jugador, purga y partículas se dibujan con `fillRect` / `arc` / `stroke` / `shadowBlur`.
- **Pausa / reinicio / menús nativos: eliminados. Sí.** El modal Vue de `jugar.vue` y `pause()` / `resume()` del motor son los únicos dueños del flujo; no hay teclas P / Escape ni botones dibujados en el canvas.
- **Nombres de archivo por `id`: `app/games/carril-cero/engine.ts` + `CarrilCeroGame.vue`. Sí.** Convención de ROCAS / CAÍDA / BLOQUE BUSTER / SERPENTINA (carpeta y componente por el `id` del catálogo, no por el género "frogger").
- **Registry: ya existe (spec 07), este spec solo añade una línea.**

## Riesgos

- **Calibración de la curva de dificultad sin fuente de referencia.** Bandas de velocidad, `gap` de tráfico, `WALL_STEP` y pesos de carril están inventados; requieren una pasada de ajuste manual jugando ZONAS 1, 3 y 5+ para que el pico de dificultad no sea ni trivial ni imposible.
- **Salto discreto interpolado sobre plataformas móviles.** El arrastre de troncos / placas mientras el jugador está "en reposo" y la conversión `x → col` al reiniciar el salto son el punto más delicado: un redondeo mal hecho hace que el jugador se "pegue" al borde de un tronco o caiga al agua sin motivo aparente.
- **Timing de la purga y de las placas basado en acumulación en segundos.** `wallRow` y los ciclos de sumersión avanzan por `+= speed * dt`; con `dt` clamped a 0.05 s tras un tab en segundo plano hay que verificar que no se produzca un salto perceptible de la purga al reanudar (además del reset de `lastTime` en `resume()`).
- **Estado mutable compartido en la generación de carriles.** El `Map` de carriles se muta cada frame (alta / poda); un fallo en la poda deja carriles zombis al sur consumiendo CPU, o genera huecos si se podan filas todavía visibles.
- **Puntuaciones sembradas que podrían leerse como datos reales de jugadores** (mismo riesgo señalado en specs 06 / 07 / 08) — se documenta en `02-plataforma.md`.
