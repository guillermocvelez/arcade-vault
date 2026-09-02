# Registro de sugerencias de juegos — Arcade Vault

Memoria persistente del agente `game-planner`. Cada evaluación deja una fila.
Estados: `propuesto` · `aceptado` · `rechazado` · `implementado`.
Solo el campo Estado de una entrada existente puede modificarse; las filas nunca se borran.

| Fecha      | Juego                           | Slot / id          | Veredicto   | Estado       | Motivo                                                                                                                |
| ---------- | ------------------------------- | ------------------ | ----------- | ------------ | --------------------------------------------------------------------------------------------------------------------- |
| 2026-08-21 | Asteroids                       | `rocas`            | Recomendado | implementado | spec 05, motor real                                                                                                   |
| 2026-08-21 | Tetris                          | `caida`            | Recomendado | implementado | spec 07, motor real                                                                                                   |
| 2026-08-21 | Arkanoid                        | `bloque-buster`    | Recomendado | implementado | spec 08, motor real                                                                                                   |
| 2026-08-21 | Snake                           | `serpentina`       | Recomendado | implementado | spec 09, motor real                                                                                                   |
| 2026-08-31 | Space Invaders                  | `invasores`        | Recomendado | propuesto    | slot ya en catálogo, marcador numérico limpio, sin IA, refuerza la categoría SHOOTER; from-scratch coste M            |
| 2026-08-31 | Frogger                         | `ranaria`          | Alternativa | propuesto    | mecánica de salto distinta y sin IA, pero ARCADE ya está bien cubierto y el ride sobre troncos añade casos límite     |
| 2026-08-31 | Pac-Man                         | `gloton`           | Alternativa | propuesto    | máximo tirón nostálgico pero máximo riesgo (4 IAs de fantasma + tablas de timing) y ARCADE sobrerrepresentado         |
| 2026-08-31 | Pong                            | `duelo-pixel`      | Descartado  | propuesto    | marcador de victorias/derrotas y 2 jugadores local no encajan en el leaderboard de puntuación individual sin rediseño |
| 2026-08-31 | 2048                            | nuevo (PUZZLE)     | Recomendado | propuesto    | motor mínimo, 4:3 trivial, marcador numérico perfecto para el leaderboard; refuerza PUZZLE (hoy solo `caida`)         |
| 2026-08-31 | Missile Command                 | nuevo (SHOOTER)    | Recomendado | propuesto    | defensa por interceptación, mecánica distinta a `rocas`/`invasores`, marcador de puntos; mira por teclado, coste M    |
| 2026-08-31 | Lunar Lander                    | nuevo (ARCADE)     | Recomendado | propuesto    | física de empuje acotada, estética vectorial CRT, marcador por aterrizaje; sin IA, coste M                            |
| 2026-08-31 | Centipede                       | nuevo (SHOOTER)    | Alternativa | propuesto    | enemigo segmentado + campo de setas, muy icónico, marcador de puntos; coste medio-alto                                |
| 2026-08-31 | Q*bert                          | nuevo (ARCADE)     | Alternativa | propuesto    | saltos discretos isométricos, IA de enemigos ligera, marcador numérico; letterbox por rejilla en diamante             |
| 2026-08-31 | Dig Dug                         | nuevo (ARCADE)     | Alternativa | propuesto    | excavar túneles + inflar enemigos, IA de persecución simple, marcador de puntos; ARCADE ya 2×                         |
| 2026-08-31 | Bomberman                       | nuevo (ARCADE)     | Alternativa | propuesto    | rejilla + bombas + IA de enemigos, marcador de puntos; coste medio-alto, ARCADE ya 2×                                 |
| 2026-08-31 | Galaga                          | nuevo (SHOOTER)    | Alternativa | propuesto    | formaciones con enemigos en picado; riesgo: se solapa con `invasores` si va después                                   |
| 2026-08-31 | Tron (motos de luz)             | nuevo (ARCADE)     | Alternativa | propuesto    | estela tipo Snake contra CPU; marcador = tiempo de supervivencia o territorio, hay que fijar el modelo                |
| 2026-08-31 | Flappy (un botón)               | nuevo (ARCADE)     | Alternativa | propuesto    | motor diminuto, un solo control, marcador por distancia; retro-moderno, coste bajo                                    |
| 2026-08-31 | Trepador vertical (Doodle Jump) | nuevo (ARCADE)     | Alternativa | propuesto    | scroll vertical, marcador por altura; coste bajo-medio, sin IA                                                        |
| 2026-08-31 | Match-3 (Bejeweled)             | nuevo (PUZZLE)     | Alternativa | propuesto    | intercambio en rejilla + cascadas, marcador numérico; suma a la escasa categoría PUZZLE                               |
| 2026-08-31 | Donkey Kong                     | nuevo (PLATFORMER) | Descartado  | propuesto    | física de plataformas + escaleras + barriles y categoría nueva; coste alto para este ciclo                            |
| 2026-08-31 | Robotron 2084                   | nuevo (SHOOTER)    | Descartado  | propuesto    | control twin-stick (mover + apuntar por separado) no encaja con el modelo de teclado actual                           |
| 2026-08-31 | Simon (secuencia)               | nuevo (PUZZLE)     | Descartado  | propuesto    | marcador = rondas superadas, señal débil para el leaderboard; jugabilidad demasiado fina                              |
| 2026-08-31 | Pinball                         | nuevo (ARCADE)     | Descartado  | propuesto    | requiere motor de física con flippers y mesa; coste muy alto, fuera de alcance por ahora                              |

## Detalle

_Un bloque por sugerencia relevante: candidatos evaluados, rúbrica, ganador y por qué._

### 2026-08-21 — Estado inicial (sembrado)

Las cuatro filas de arriba reflejan el catálogo tal como estaba al consultar Supabase
el 2026-08-21 (ver `references/implemented_games.md`): cuatro juegos con motor real
(`rocas`, `caida`, `bloque-buster`, `serpentina`) y cuatro todavía con arena mock
(`gloton`, `invasores`, `ranaria`, `duelo-pixel`), candidatos naturales para el próximo
`/add-game`.

### 2026-08-31 — Próximo juego: SHOOTER para `invasores`

**Estado del repo:** 4 motores reales (`rocas`, `caida`, `bloque-buster`, `serpentina`),
categorías reales 2× ARCADE + 1× PUZZLE + 1× SHOOTER. Las 3 carpetas de
`references/started-games/` (`02-asteroids`, `03-tetris`, `04-arkanoid`) ya están
portadas: todo candidato nuevo es **from-scratch**. Siguiente spec libre: **10**.

**Candidatos evaluados** (los 4 slots mock, todos con fila en `games` y clase `cover-*`):

| Candidato      | Slot                   | Contrato GameEngine                       | Marcador → leaderboard                               | Diversidad                         | Coste | Riesgos                                                                                               |
| -------------- | ---------------------- | ----------------------------------------- | ---------------------------------------------------- | ---------------------------------- | ----- | ----------------------------------------------------------------------------------------------------- |
| Space Invaders | `invasores` (SHOOTER)  | 1 canvas 4:3, teclado ←→ + disparo        | puntos numéricos crecientes ✔                        | sube el SHOOTER (hoy solo `rocas`) | M     | bajos: movimiento de formación + descenso, colisiones simples, sin pathfinding                        |
| Frogger        | `ranaria` (ARCADE)     | 1 canvas ~4:3, saltos discretos           | puntos por carril / rana en casa / bonus de tiempo ✔ | ARCADE ya 2×                       | M     | medios: timing de spawns, rana montada en tronco, ahogo, 5 casas                                      |
| Pac-Man        | `gloton` (ARCADE)      | laberinto ~0.9 ratio (letterbox), teclado | puntos numéricos crecientes ✔                        | ARCADE ya 2×                       | L     | altos: 4 IAs de fantasma distintas (Blinky/Pinky/Inky/Clyde), scatter/chase, túnel, pastillas + fruta |
| Pong           | `duelo-pixel` (VERSUS) | 1 canvas 4:3 nativo, 2 palas              | victorias/derrotas, 2 jugadores local ✖              | única categoría VERSUS             | S     | el marcador no mapea al leaderboard individual sin rediseñar el modelo de puntuación                  |

**Ganador: `invasores` (Space Invaders).** Mejor equilibrio: riesgo bajo (sin IA ni
física compleja), marcador de puntos que encaja directo en el leaderboard, aporta
profundidad a la categoría SHOOTER que hoy solo sostiene `rocas`, y es canvas +
teclado puro con estética retro CRT perfecta. No necesita migración de catálogo (el
slot ya existe con su `cover-*`).

**Alternativas:** `ranaria` si se quiere una mecánica más distinta (salto discreto,
sin IA); `gloton` cuando haya apetito por un motor más grande (es el de más tirón
pero el de más riesgo). **Descartado** `duelo-pixel` hasta decidir cómo convertir un
juego de victorias 1v1 en una puntuación individual (p. ej. rallies aguantados o
tiempo de supervivencia contra la CPU).

### 2026-08-31 — Lista larga: 20 juegos evaluados

Ampliación pedida por el usuario. Rúbrica: encaje con el contrato `GameEngine`
(1 canvas, 4:3, teclado, sin assets, sin menú propio) · marcador numérico creciente
compatible con el leaderboard · diversidad de categoría (hoy 2 ARCADE + 1 PUZZLE +
1 SHOOTER reales) · estética CRT/neón · coste (S/M/L) y riesgos. `nuevo` = necesita
fila de catálogo + clase `cover-*` nuevas (paso de `/add-game`).

| #   | Juego               | Slot          | Cat.       | Marcador→LB      | Coste | Riesgo principal                        | Veredicto   |
| --- | ------------------- | ------------- | ---------- | ---------------- | ----- | --------------------------------------- | ----------- |
| 1   | Space Invaders      | `invasores`   | SHOOTER    | ✔ puntos         | M     | ninguno relevante                       | Recomendado |
| 2   | 2048                | nuevo         | PUZZLE     | ✔ puntos         | S     | ninguno; engine mínimo                  | Recomendado |
| 3   | Missile Command     | nuevo         | SHOOTER    | ✔ puntos         | M     | mira por teclado en vez de ratón        | Recomendado |
| 4   | Lunar Lander        | nuevo         | ARCADE     | ✔ por aterrizaje | M     | tuning de la física de empuje           | Recomendado |
| 5   | Frogger             | `ranaria`     | ARCADE     | ✔ puntos         | M     | rana montada en tronco, ahogo           | Alternativa |
| 6   | Centipede           | nuevo         | SHOOTER    | ✔ puntos         | M-L   | enemigo segmentado + campo de setas     | Alternativa |
| 7   | Q\*bert             | nuevo         | ARCADE     | ✔ puntos         | M     | rejilla isométrica, IA ligera           | Alternativa |
| 8   | Galaga              | nuevo         | SHOOTER    | ✔ puntos         | M     | se solapa con `invasores`               | Alternativa |
| 9   | Dig Dug             | nuevo         | ARCADE     | ✔ puntos         | M-L   | túneles + IA de persecución             | Alternativa |
| 10  | Bomberman           | nuevo         | ARCADE     | ✔ puntos         | L     | IA de enemigos + propagación de bombas  | Alternativa |
| 11  | Tron (motos de luz) | nuevo         | ARCADE     | ~ (a fijar)      | M     | modelo de marcador (supervivencia/área) | Alternativa |
| 12  | Flappy (un botón)   | nuevo         | ARCADE     | ✔ distancia      | S     | ninguno; engine diminuto                | Alternativa |
| 13  | Trepador vertical   | nuevo         | ARCADE     | ✔ altura         | S-M   | generación procedural de plataformas    | Alternativa |
| 14  | Match-3 (Bejeweled) | nuevo         | PUZZLE     | ✔ puntos         | M     | detección de cascadas y combos          | Alternativa |
| 15  | Pac-Man             | `gloton`      | ARCADE     | ✔ puntos         | L     | 4 IAs de fantasma + timing              | Alternativa |
| 16  | Pong                | `duelo-pixel` | VERSUS     | ✖ victorias      | S     | marcador no individual, 2P local        | Descartado  |
| 17  | Donkey Kong         | nuevo         | PLATFORMER | ✔ puntos         | L     | física de plataformas + categoría nueva | Descartado  |
| 18  | Robotron 2084       | nuevo         | SHOOTER    | ✔ puntos         | L     | control twin-stick incompatible         | Descartado  |
| 19  | Simon (secuencia)   | nuevo         | PUZZLE     | ~ rondas         | S     | señal de marcador muy débil             | Descartado  |
| 20  | Pinball             | nuevo         | ARCADE     | ✔ puntos         | L     | motor de física con flippers/mesa       | Descartado  |

**Orden recomendado de ataque:** 1 (`invasores`) → 2 (2048) → 3 (Missile Command)
→ 4 (Lunar Lander) → 5 (`ranaria`). Los cuatro primeros no compiten por categoría
entre sí y ninguno arrastra IA compleja. `gloton` (Pac-Man) y `duelo-pixel` (Pong)
quedan al final: el primero por coste/riesgo, el segundo hasta redefinir su marcador.
