# SPEC game-jam — CARRIL CERO: alta en catálogo y leaderboard

> **Estado:** Borrador
> **Depende de:** `05-asteroids-rocas.md`, `06-juegos-y-leaderboard.md`, `01-motor.md`
> **Fecha:** 2026-08-31
> **Objetivo:** Dar de alta CARRIL CERO en el catálogo real (`games`) y su leaderboard (`scores`), con su clase de cover propia.

## Alcance

### En alcance

- La fila **nueva** en `public.games` para `carril-cero` (migración `INSERT` vía `apply_migration`).
- La clase `.cover-carriles` en `app/assets/css/main.css`, siguiendo el patrón de las covers existentes (base `.cover-bg` + `::before` / `::after` de gradientes CSS, sin imágenes).
- El seed de **12 filas** en `public.scores` para `game_id = 'carril-cero'` (alias variados, un alias por fila, timestamps ISO explícitos, puntajes variados) vía `apply_migration`.
- La verificación del leaderboard poblado en `/juego/carril-cero` y en `/salon-de-la-fama` (filtrable por el juego nuevo).

### Fuera de alcance

- El motor `app/games/carril-cero/engine.ts`, el componente `CarrilCeroGame.vue` y la línea del registry — los cubre `01-motor.md`.
- Los demás juegos, reales o mock — sin cambios en su fila `games`, su cover ni sus scores.
- Cualquier UI de administración del catálogo (sigue fuera de alcance desde spec 06).
- Autenticación real / vincular scores a un usuario (sigue fuera de alcance desde spec 06).

## Modelo de datos

### Fila en `public.games`

```
id:         carril-cero
title:      CARRIL CERO
short:      Salta carriles sin fin mientras la purga te muerde los talones.
long:       Una autopista de neón que no termina nunca desciende hacia ti: carriles de tráfico, ríos de datos y estrechas franjas seguras. Salta al norte sin descanso, encadena cruces de río y atrapa núcleos para frenar la purga que sube desde el borde inferior. Cuanto más lejos llegas, más rápido se vuelve todo y menos suelo firme queda.
cat:        ARCADE
cover:      cover-carriles
color:      green
sort_order: max(sort_order) + 1
```

**Nota sobre `sort_order`:** no es legible desde el repo (vive en Supabase). Hoy hay 8 filas en `games`, así que el valor esperado es **9**; se calcula al aplicar la migración con `(select coalesce(max(sort_order), 0) + 1 from public.games)` para garantizar unicidad aunque el catálogo haya cambiado.

### Clase `.cover-carriles` (en `app/assets/css/main.css`)

Misma forma que `.cover-bricks` / `.cover-tetro`: sobre la base `.cover-bg` (que la card ya aplica), un `::before` con `repeating-linear-gradient` horizontal que simula franjas de carril (verdes y cian alternadas sobre fondo casi negro) y un `::after` con un `linear-gradient` diagonal brillante (verde neón translúcido) que cruza la cover como un "salto", más un leve glow interior (`box-shadow`/`filter`). Sin `background-image` de archivo — solo gradientes, como el resto de covers.

### Seed de `public.scores`

12 filas para `game_id = 'carril-cero'`, un alias distinto por fila, `created_at` ISO explícito (orden estable), puntajes variados y plausibles para la fórmula de `01-motor.md` (fila×10 + cruces de río + núcleos + near-miss), del orden de ~250 a ~3500:

```sql
insert into public.scores (game_id, name, score, created_at) values
('carril-cero', 'VECTORX',     3480, '2026-08-12T19:22:41Z'),
('carril-cero', 'NEONFOX',     3110, '2026-08-15T21:04:12Z'),
('carril-cero', 'TURBOLIEBRE', 2760, '2026-08-09T14:37:55Z'),
('carril-cero', 'PIXELPACO',   2405, '2026-08-20T18:11:03Z'),
('carril-cero', 'RANATRON',    2090, '2026-08-18T22:49:30Z'),
('carril-cero', 'KILOWATT',    1815, '2026-08-22T16:05:47Z'),
('carril-cero', 'GLITCHMB',    1520, '2026-08-11T20:33:18Z'),
('carril-cero', 'ZARZA',       1265, '2026-08-24T13:58:02Z'),
('carril-cero', 'VOLTIA',       995, '2026-08-17T19:47:26Z'),
('carril-cero', 'CROMA',        760, '2026-08-26T21:12:39Z'),
('carril-cero', 'DINAMO',       515, '2026-08-13T17:26:54Z'),
('carril-cero', 'MX7',          285, '2026-08-27T20:41:10Z');
```

## Plan de implementación

1. Migración de catálogo vía `apply_migration` (nombre sugerido `add_carril_cero_game`): `INSERT INTO public.games (id, title, short, long, cat, cover, color, sort_order) VALUES ('carril-cero', 'CARRIL CERO', '<short>', '<long>', 'ARCADE', 'cover-carriles', 'green', (select coalesce(max(sort_order), 0) + 1 from public.games));`. En el mismo paso, añadir `.cover-carriles` a `app/assets/css/main.css` con la estética descrita (gradientes coherentes con las covers existentes). Prueba: `GET /api/games` incluye la fila `carril-cero` y `/games` muestra su card con la cover nueva sin romper el grid.

2. Seed de 12 filas en `public.scores` vía `apply_migration` (nombre sugerido `seed_carril_cero_scores`): el `INSERT` del bloque de arriba. Prueba: `/juego/carril-cero` muestra el leaderboard poblado con las 12 filas en orden descendente por puntaje.

3. Prueba de integración final: con el motor de `01-motor.md` ya registrado, jugar `/juego/carril-cero/jugar` hasta el game over, guardar el puntaje (POST `/api/scores`), recargar y verlo en `/juego/carril-cero` y en `/salon-de-la-fama` (filtrando por CARRIL CERO). **Después borrar por SQL la(s) fila(s) insertada(s) en esa prueba manual**, dejando solo las 12 de seed; confirmar con `select count(*) from public.scores where game_id = 'carril-cero';` que devuelve exactamente **12**.

## Criterios de aceptación

- [ ] La fila `carril-cero` existe en `public.games` con `sort_order` único (esperado 9), `cat = 'ARCADE'`, `cover = 'cover-carriles'`, `color = 'green'`.
- [ ] `/games` muestra la card de CARRIL CERO con su clase `cover-carriles` sin romper el grid ni el layout de las demás cards (incluido viewport estrecho).
- [ ] `GET /api/games` devuelve la fila nueva junto a las 8 existentes.
- [ ] El leaderboard de `/juego/carril-cero` sale poblado con las 12 filas de seed, ordenadas por puntaje descendente.
- [ ] Guardar un puntaje desde `/juego/carril-cero/jugar` persiste una fila real vía `POST /api/scores` y aparece en `/juego/carril-cero` y en `/salon-de-la-fama` tras recargar.
- [ ] `/salon-de-la-fama` puede filtrar por CARRIL CERO y muestra solo sus filas.
- [ ] Tras la prueba de integración, `public.scores` contiene exactamente 12 filas para `game_id = 'carril-cero'` (sin residuos de la prueba manual de guardado).

## Decisiones

- **`cat = ARCADE`.** Coherente con `01-motor.md`: juego de reflejos por cruce de carriles; VERSUS (categoría sin motor real) no encaja con la puntuación individual del leaderboard.
- **`cover = cover-carriles`, clase nueva.** El juego es nuevo en el catálogo; se crea su `.cover-*` como las demás (gradientes CSS, sin imágenes), no se reutiliza ninguna existente.
- **`color = green`.** Verde neón de "autopista libre" para contrastar con la purga roja del juego; `cyan` y `magenta` ya los llevan `bloque-buster` y `caida`.
- **`sort_order = max + 1` (esperado 9), calculado en la migración.** El valor real vive en Supabase; se resuelve con subconsulta para no colisionar aunque el catálogo haya crecido.
- **Fila NUEVA, no se reutiliza el slot mock `ranaria`.** `ranaria` sigue siendo un Frogger clásico pendiente de motor; CARRIL CERO es otro juego (corredor infinito con purga ascendente) y necesita su propia fila, título, cover y `sort_order`.
- **Seed de 12 filas siguiendo la convención de specs 07 / 08.** Alias variados, un alias por fila, `created_at` ISO explícito para orden estable; el leaderboard no se lanza vacío.
- **Limpieza de las filas de prueba manual tras verificar el guardado.** Cualquier fila creada al probar `POST /api/scores` en el Paso 3 se borra por SQL una vez confirmado el round-trip, para no mezclar datos de prueba con el seed intencional.

## Riesgos

- **Puntuaciones sembradas que podrían leerse como datos reales de jugadores** — mismo riesgo señalado en specs 06 / 07 / 08; conviene que el equipo sepa que las 12 filas de `carril-cero` son de ejemplo.
- **Filas de prueba manual olvidadas en `scores`.** Si el Paso 3 se corta después de guardar un puntaje de prueba pero antes de borrarlo, la tabla queda con una fila mezclada con el seed — verificar `select count(*) from public.scores where game_id = 'carril-cero'` (debe dar 12) antes de dar el spec por completado.
- **`.cover-carriles` desalineada con el resto del grid.** Una cover con pseudo-elementos mal dimensionados puede desbordar la card o tapar el título; revisar en `/games` junto a las 8 covers existentes en viewport estrecho.
