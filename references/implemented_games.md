# Juegos implementados en Arcade Vault

Catálogo actual tal como está cargado en Supabase (tabla `games`), consultado el 2026-08-21. 8 juegos en total: 4 con motor real jugable y 4 que todavía usan el arena mock del reproductor.

## Con motor real (jugables de verdad)

| ID              | Título        | Categoría | Motor / Spec                                             | Partidas | Mejor puntuación |
| --------------- | ------------- | --------- | -------------------------------------------------------- | -------- | ---------------- |
| `rocas`         | ROCAS         | SHOOTER   | Asteroids — `app/games/asteroids/engine.ts` (spec 05)    | 1        | 2100             |
| `caida`         | CAÍDA         | PUZZLE    | Tetris — `app/games/caida/engine.ts` (spec 07)           | 1        | 171              |
| `bloque-buster` | BLOQUE BUSTER | ARCADE    | Arkanoid — `app/games/bloque-buster/engine.ts` (spec 08) | 2        | 1120             |
| `serpentina`    | SERPENTINA    | ARCADE    | Snake — `app/games/serpentina/engine.ts` (spec 09)       | 12       | 480              |

Cada uno implementa el contrato `GameEngine` (`app/games/types.ts`), está registrado en `app/games/registry.ts` y se monta desde un componente `app/components/games/<Name>Game.vue`. Detalle del contrato: `.agents/skills/add-game/engine-contract.md`.

## Todavía con arena mock (sin motor real)

| ID            | Título      | Categoría | Descripción corta                          |
| ------------- | ----------- | --------- | ------------------------------------------ |
| `gloton`      | GLOTÓN      | ARCADE    | Devora puntos y escapa de los fantasmas.   |
| `invasores`   | INVASORES   | SHOOTER   | Defiende el planeta de filas alienígenas.  |
| `ranaria`     | RANARIA     | ARCADE    | Cruza la autopista de pixeles.             |
| `duelo-pixel` | DUELO PIXEL | VERSUS    | Dos paletas. Una pelota. Reflejos máximos. |

Estos ya tienen fila en el catálogo (`games`) y su clase `cover-*`, pero `/juego/<id>/jugar` todavía muestra el reproductor simulado en vez de un motor real. Candidatos naturales para el próximo `/add-game`.

## Descripciones completas (catálogo)

**ROCAS** — Tu nave triangular flota en vacío absoluto. Dispara y rota para dividir rocas en fragmentos cada vez más pequeños. Cuidado con los OVNIs en el horizonte.

**CAÍDA** — Piezas geométricas descienden desde la oscuridad. Rótalas, encástralas y limpia líneas para sobrevivir. La velocidad aumenta sin piedad cada 10 líneas.

**BLOQUE BUSTER** — Pilota una nave-paleta y rebota un núcleo de plasma para pulverizar muros de bloques cromáticos. Cada nivel reorganiza la grilla en patrones imposibles. ¿Hasta dónde llegará tu racha?

**SERPENTINA** — Una serpiente de luz recorre la grilla buscando núcleos magenta. Cada bocado la alarga y la hace más veloz. Un movimiento en falso y se devora a sí misma.

**GLOTÓN** — Un círculo glotón patrulla un laberinto coleccionando puntos luminosos. Cuatro espectros lo persiguen, pero cada cierto tiempo aparece una píldora que invierte los papeles.

**INVASORES** — Olas de pixeles hostiles descienden formación tras formación. Mueve tu cañón en horizontal y abre fuego con precisión, antes de que toquen la superficie.

**RANARIA** — Salta entre carriles de coches a toda velocidad y troncos a la deriva en el río. Llega a los nenúfares antes de que se acabe el tiempo.

**DUELO PIXEL** — El duelo más puro: dos paletas verticales se enfrentan por rebotar una pelota luminosa. Modo solitario contra la CPU o partida local a dos jugadores.
