# SPEC 05 — Asteroids real para el juego ROCAS

> **Estado:** Implementado
> **Depende de:** `01-mvp-visual-nuxt.md`
> **Fecha:** 2026-08-18
> **Objetivo:** Portar el juego de Asteroids de referencia (`references/started-games/02-asteroids/game.js`) a un motor TypeScript real (`app/games/asteroids/engine.ts`) envuelto en un componente Vue (`AsteroidsGame.vue`), reemplazando el Reproductor mock por el juego jugable real únicamente para el id `rocas`, integrado con el HUD, la pausa y el modal de guardado de puntuación ya existentes.

## Scope

**In:**

- Motor de juego portado a TypeScript en `app/games/asteroids/engine.ts`: clases `Bullet`, `Asteroid`, `Ship`, `Particle`, `PowerUp`, constantes (`RADII`, `SPEEDS`, `POINTS`, etc.), funciones de estado (`initGame`, `nextLevel`, `update(dt)`, `draw(ctx)`), fiel al `game.js` de referencia — incluyendo el power-up de disparo triple.
- Componente `app/components/games/AsteroidsGame.vue`: monta el `<canvas>` (800×600 lógico, escalado responsivo por CSS manteniendo 4:3), corre el loop vía `requestAnimationFrame`, maneja input de teclado (flechas + espacio, con `preventDefault` para no scrollear la página), y expone/emite en cada frame el estado real (`score`, `lives`, `level`, `tripleShot`, `phase: 'playing' | 'dead' | 'gameover'`) para que `jugar.vue` sincronice su stat-strip existente.
- Métodos expuestos (`defineExpose`) desde `AsteroidsGame.vue`: `pause()`, `resume()`, `restart()` — conectados a los botones PAUSA/REANUDAR y JUGAR DE NUEVO ya existentes en `jugar.vue`.
- `app/pages/juego/[id]/jugar.vue`: cuando `id === 'rocas'`, renderiza `<AsteroidsGame>` dentro del `crt-screen` en vez del arena decorativa (`grid-floor`/`enemy`/`player-ship`); el stat-strip superior (Jugador/Puntuación/Vidas/Nivel) y los botones PAUSA/FIN/SALIR se mantienen, ahora sincronizados con el estado real en vez del `setInterval` falso. Al llegar a `phase === 'gameover'`, se dispara el modal existente de fin de partida (mismo `handleSave` vía `useScores`); el overlay 'GAME OVER' + puntaje sigue dibujándose dentro del canvas (sin el texto de reinicio nativo), y el reinicio con Espacio del juego original queda desactivado.
- Estilos nuevos/ajustados en `app/assets/css/main.css` para el contenedor del canvas real (escalado responsivo dentro de `crt-screen`).

**Out of scope (para specs futuros):**

- Los otros 7 juegos (Bloque Buster, Caída, Serpentina, Glotón, Invasores, Ranaria, Duelo Pixel) siguen usando el Reproductor mock actual sin ningún cambio.
- Sonido, controles táctiles/móviles, multijugador — el juego original no los tiene y no se agregan aquí.
- Conectar el puntaje real a Supabase/backend — se sigue usando `useScores`/`localStorage` tal como ya funciona para los demás juegos (infra de Supabase existe desde spec 04 pero sin tablas).
- Actualizar el valor `best` hardcodeado de `rocas` en `app/data/games.ts` o el leaderboard de Salón de la Fama/Detalle (`seededScores`) para reflejar puntajes reales — quedan igual que hoy (datos simulados), desconectados del guardado real.
- Cualquier reestructuración del patrón `app/games/*` más allá de lo necesario para Asteroids (no se crean stubs para los otros 7 juegos en este spec).

## Data model

```ts
// app/games/asteroids/engine.ts
export type Phase = "playing" | "dead" | "gameover";

export interface EngineSnapshot {
  score: number;
  lives: number;
  level: number;
  tripleShot: number; // segundos restantes, 0 si inactivo
  phase: Phase;
}

export class AsteroidsEngine {
  constructor(canvas: HTMLCanvasElement);
  start(): void; // arranca initGame() + rAF loop
  stop(): void; // cancela rAF, remueve listeners de teclado
  pause(): void;
  resume(): void;
  restart(): void; // vuelve a llamar initGame()
  getSnapshot(): EngineSnapshot;
  onSnapshot(cb: (s: EngineSnapshot) => void): void; // se invoca 1x por frame
}
// Clases internas (no exportadas): Bullet, Asteroid, Ship, Particle, PowerUp
// Constantes internas: RADII, SPEEDS, POINTS, W=800, H=600, POWERUP_*
```

```ts
// app/components/games/AsteroidsGame.vue
defineEmits<{
  snapshot: [s: EngineSnapshot]; // reenvía cada frame para sincronizar el stat-strip
  gameover: [score: number]; // se emite una sola vez al entrar en phase 'gameover'
}>();
defineExpose<{ pause(): void; resume(): void; restart(): void }>();
```

```ts
// app/pages/juego/[id]/jugar.vue (estado local ampliado, solo para id === 'rocas')
// score/lives/level/paused/over ya existen como refs; se dejan de escribir
// por el setInterval falso y en su lugar se actualizan desde el evento `snapshot`
// cuando isRealGame === true.
```

## Implementation plan

1. Crear `app/games/asteroids/engine.ts` portando literal (JS→TS, tipado) las clases `Bullet`, `Asteroid`, `Ship`, `Particle`, `PowerUp`, las constantes y las funciones `initGame`/`nextLevel`/`spawnAsteroids`/`explode`/`killShip`/`update`/`draw`/`drawHUD`/`drawOverlay` del `game.js` de referencia, envueltas en la clase `AsteroidsEngine` (sin `window`/`document` globales del original: recibe el `canvas` por constructor, listeners de teclado se agregan/quitan en `start()`/`stop()`). Se quita el reinicio con Espacio en `gameover` y el subtítulo 'ESPACIO PARA REINICIAR'. Prueba: `npm run build` compila sin errores de tipos (el motor aún no se usa en ninguna página).
2. Agregar a `AsteroidsEngine` el mecanismo de snapshot: tras cada `update(dt)` en el loop, arma un `EngineSnapshot` y lo pasa al callback registrado con `onSnapshot`. Prueba: sigue compilando.
3. Crear `app/components/games/AsteroidsGame.vue`: `<canvas ref="canvasEl" width="800" height="600">` con CSS para escalar responsivo (`max-width: 100%; aspect-ratio: 4/3`) dentro de su contenedor; en `onMounted` instancia `AsteroidsEngine`, llama `start()`, y en `onSnapshot` emite `snapshot` en cada frame y `gameover` una vez al detectar la transición a `phase === 'gameover'`; en `onUnmounted` llama `stop()`. Expone `pause`/`resume`/`restart` vía `defineExpose`. Prueba manual: crear una página de prueba temporal o probar directo en el paso 4.
4. Modificar `app/pages/juego/[id]/jugar.vue`: agregar `const isRealGame = computed(() => id === 'rocas')`; cuando es `true`, renderizar `<AsteroidsGame ref="gameRef" @snapshot="onSnapshot" @gameover="onGameOver" />` en vez del arena decorativa; los refs `score`/`lives`/`level` se actualizan desde `onSnapshot`; `paused` llama a `gameRef.pause()/resume()` en vez de solo cambiar el flag; `onGameOver` fija `over.value = true` (dispara el modal existente, reutilizando `handleSave`); el botón 'JUGAR DE NUEVO' del modal llama `gameRef.restart()` además de resetear los refs locales, cuando `isRealGame`. Prueba: `npm run dev`, navegar a `/juego/rocas/jugar`, jugar con teclado (mover, disparar, ver asteroides partirse).
5. Agregar los estilos necesarios en `app/assets/css/main.css` para el contenedor del canvas dentro de `crt-screen` (escalado responsivo, sin romper el marco CRT existente). Prueba: revisar visualmente en desktop y en un viewport angosto (DevTools mobile).
6. Prueba de integración final: jugar una partida completa en `/juego/rocas/jugar` hasta perder las 3 vidas, confirmar que el HUD superior de Vue y el HUD dibujado en el canvas muestran los mismos valores en todo momento, que PAUSA/REANUDAR detienen y retoman el juego real, que al perder la última vida aparece el canvas con 'GAME OVER' + el modal de guardado (sin reinicio nativo con Espacio), que guardar el puntaje lo persiste en `localStorage['av_scores']`, que 'JUGAR DE NUEVO' reinicia una partida real jugable, y que navegar a `/juego/bloque-buster/jugar` (u otro de los 7) sigue mostrando el Reproductor mock sin cambios.

## Acceptance criteria

- [x] `npm run dev` y `npm run build` funcionan sin errores, con `app/games/asteroids/engine.ts` tipado sin `any` implícitos.
- [x] Navegar a `/juego/rocas/jugar` muestra el canvas del juego real (no la arena decorativa) dentro del marco CRT.
- [x] Las flechas rotan/propulsan la nave y Espacio dispara, sin scrollear la página.
- [x] Los asteroides grandes se parten en medianos y estos en pequeños al ser destruidos; los pequeños no se parten.
- [x] El puntaje, las vidas y el nivel mostrados en el stat-strip superior (Vue) coinciden en todo momento con los dibujados dentro del canvas.
- [x] El botón PAUSA detiene el movimiento/disparo/física real (no solo un contador falso) y muestra el overlay 'EN PAUSA'; REANUDAR continúa exactamente donde quedó.
- [x] Al perder la última de las 3 vidas, el canvas muestra 'GAME OVER' + puntaje final (sin 'ESPACIO PARA REINICIAR') y aparece el modal Vue de fin de partida con la puntuación real.
- [x] Presionar Espacio estando en `gameover` NO reinicia la partida por sí solo (el reinicio nativo quedó desactivado).
- [x] Guardar la puntuación desde el modal persiste una entrada real en `localStorage['av_scores']` con `game: 'rocas'` y el puntaje obtenido jugando.
- [x] 'JUGAR DE NUEVO' inicia una partida real nueva y jugable (no solo resetea contadores visuales).
- [x] El power-up de disparo triple aparece tras suficientes destrucciones, se puede recoger, y activa disparo triple por su duración, reflejado en ambos HUD.
- [x] El canvas se escala manteniendo proporción 4:3 en un viewport angosto (mobile) sin desbordar horizontalmente el marco CRT.
- [x] Navegar a `/juego/[id]/jugar` para cualquiera de los otros 7 juegos sigue mostrando el Reproductor mock exactamente como antes (arena decorativa, `setInterval`, sin cambios de comportamiento).
- [x] Salir de `/juego/rocas/jugar` (botón SALIR o navegación) detiene el loop del juego y remueve los listeners de teclado (sin errores en consola ni el loop corriendo en segundo plano).

## Decisions

- **Sí:** portar el motor a `app/games/asteroids/engine.ts` + componente `AsteroidsGame.vue`, en vez de inline en `jugar.vue`. Establece el patrón para futuros juegos reales (`app/games/<juego>/`, `app/components/games/<Juego>Game.vue`). Decisión explícita del usuario.
- **Sí:** mantener ambos HUD (stat-strip Vue arriba + HUD dibujado dentro del canvas), en vez de eliminar uno de los dos. Evita modificar el `draw()` del juego original y reutiliza el stat-strip ya existente en el Reproductor mock para los otros 7 juegos, a costa de mostrar la info duplicada. Decisión explícita del usuario.
- **Sí:** agregar pausa real (detener el loop) aunque el juego original no la tenga. Consistencia con el botón PAUSA que ya existe en el Reproductor para los otros 7 juegos.
- **Sí:** el modal Vue de fin de partida reemplaza el reinicio nativo con Espacio. Evita perder el puntaje por reiniciar sin guardar y reutiliza el flujo de `useScores` ya validado en el resto de la plataforma.
- **Sí:** portar el power-up de disparo triple tal cual, aunque no esté documentado en el README. Es parte del código fuente de referencia y agrega variedad al gameplay.
- **Sí:** mantener el overlay 'GAME OVER' + puntaje dibujado en el canvas (sin el subtítulo de reinicio). Da continuidad visual arcade mientras el modal Vue maneja el flujo de guardado.
- **Sí:** canvas con resolución lógica fija 800×600 pero escalado responsivo por CSS. Igual que el resto de la plataforma, que ya es responsive; evita desbordes en mobile sin reescribir las coordenadas del juego original.
- **No:** actualizar `best` en `app/data/games.ts` ni conectar `seededScores` (Salón de la Fama/Detalle) al puntaje real. Esos datos son explícitamente simulados desde spec 01/02; conectarlos a puntajes reales es un cambio más amplio (probablemente ligado a Supabase) que queda para un spec futuro.
- **No:** tocar los otros 7 juegos ni crear stubs de motor para ellos en este spec. Mantiene el spec acotado a un solo juego real, evitando trabajo especulativo.
- **No:** sonido, controles táctiles ni multijugador. El juego original no los tiene; agregarlos es exploratorio y queda fuera de alcance.

## Risks

| Riesgo                                                                                                                                                                                                                    | Mitigación                                                                                                                                                                                                                                |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Los listeners de teclado (`keydown`/`keyup` en `window`) del motor original quedan activos aunque el usuario navegue fuera de `/juego/rocas/jugar`, capturando input en el resto de la app.                               | `AsteroidsEngine.stop()` remueve explícitamente los listeners; se llama desde `onUnmounted` de `AsteroidsGame.vue`, igual que el patrón ya usado para el `setInterval` del Reproductor mock (spec 01).                                    |
| Mostrar ambos HUD (Vue + canvas) puede desincronizarse por un frame si el evento `snapshot` llega con latencia distinta al propio `requestAnimationFrame` del canvas.                                                     | Ambos se derivan del mismo `EngineSnapshot` calculado una vez por frame dentro del mismo loop; el desfase máximo posible es de un frame (~16ms), imperceptible.                                                                           |
| El canvas fijo en 800×600 lógico, escalado por CSS en pantallas muy angostas, puede volver los textos del HUD interno (fuente `monospace` fija en px) difíciles de leer al escalarse hacia abajo.                         | Se prueba visualmente en un viewport móvil (paso 5 del plan); si la legibilidad es mala, es un ajuste de CSS/tamaño de fuente para un spec de pulido posterior, no bloquea esta v1.                                                       |
| Al desactivar el reinicio nativo con Espacio en `gameover`, si el usuario mantiene presionada la tecla Espacio justo al morir, podría interferir con el foco de los botones del modal Vue que aparece encima.             | El modal Vue captura el foco de su input de nombre al aparecer (mismo patrón que los otros 7 juegos); se verifica en el paso 6 (prueba de integración) que no haya disparos fantasma tras gameover.                                       |
| El motor porta lógica de física/colisiones no trivial (400+ líneas); errores sutiles de tipado o de portado JS→TS podrían alterar el comportamiento respecto al original (velocidades, splits de asteroides, colisiones). | Se porta clase por clase comparando contra `game.js` línea a línea (paso 1); la prueba de integración final (paso 6) valida explícitamente el comportamiento jugable (splits, colisiones, poder triple) contra la descripción del README. |
