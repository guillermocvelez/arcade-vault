# Bitácora de skins — Arcade Vault

Memoria persistente del agente `skin-designer`. Estado de skins por engine real.
Estados: `pendiente` · `spec-escrito` · `implementado`.
Skins obligatorios: `clasico` (default) · `retro` · `neon`.

| Juego / id               | Skins requeridos       | Skins con spec         | Estado         | Modo oscuro OK          | Notas                                                                                                |
| ------------------------ | ---------------------- | ---------------------- | -------------- | ----------------------- | ---------------------------------------------------------------------------------------------------- |
| rocas (Asteroids)        | clasico · retro · neon | clasico · retro · neon | `implementado` | Sí (estimado, ver spec) | `specs/skins/rocas.md`. Depende de `specs/skins/00-contrato-skins.md`.                               |
| caida (Tetris)           | clasico · retro · neon | clasico · retro · neon | `implementado` | Sí (estimado, ver spec) | `specs/skins/caida.md`. 8 colores de pieza → `PIECE_COLORS` game-local fuera de `Palette`.           |
| bloque-buster (Arkanoid) | clasico · retro · neon | clasico · retro · neon | `implementado` | Sí (estimado, ver spec) | `specs/skins/bloque-buster.md`. 7 claves de ladrillo → `BRICK_COLORS` game-local fuera de `Palette`. |
| serpentina (Snake)       | clasico · retro · neon | clasico · retro · neon | `implementado` | Sí (estimado, ver spec) | `specs/skins/serpentina.md`. Mapeo directo a `Palette`; sprite de fruta no se recolorea.             |

## Detalle

### 2026-08-31 — Contrato de skins + rocas

**Contrato (`specs/skins/00-contrato-skins.md`, borrador).** Define:

- `SkinId = "clasico" | "retro" | "neon"` y `Palette` (roles semánticos: `bg`, `fg`, `fgDim`, `accent`, `accentAlt`, `danger`, `grid`, `glowBlur`) en `app/games/types.ts`.
- `GameEngine.setSkin(id)` — cambio en caliente, no viaja en el snapshot.
- `app/games/skins.ts`: `SKIN_STORAGE_KEY = "av:skin"` (clave global, una preferencia para todos los juegos), `SKIN_IDS`, `resolveSkin` (cae a `clasico`).
- Selector: control segmentado de 3 botones en `.hud-actions` de `jugar.vue`, solo para juegos reales; persiste en `localStorage`.
- Checklist de aceptación de modo oscuro (sitio dark-only: contraste WCAG contra fondo casi negro; `fg` ≥ 4.5:1, acentos ≥ 3:1 figura / ≥ 4.5:1 texto; `neon` con `shadowBlur` no blanco; `retro` ≤ 4 tonos + bg).
- Paso 0: ampliar tipos + `jugar.vue` + CSS + `setSkin` no-op temporal en `AsteroidsEngine` (`// TODO(skins/rocas)`) para no romper el build entre specs.

**rocas (`specs/skins/rocas.md`, borrador).** Paletas elegidas (rol → hex):

- `clasico`: bg `#000000`, fg `#ffffff`, fgDim `rgba(255,255,255,0.65)`, accent `#00ffff`, accentAlt `#ff8200`, danger `#ff4d4d`, grid `#1e2130`, glowBlur `0`. Reproduce el look actual 1:1 (la llama del propulsor mantiene su `0.85` vía `globalAlpha`).
- `retro`: bg `#04120b`, fg `#4dff9b`, fgDim `#33b978`, accent `#c8ffe0`, accentAlt `#2bd47a`, danger `#7dffb5`, grid `#0c3a24`, glowBlur `4`. 4 tonos de verde + bg.
- `neon`: bg `#05010d`, fg `#00f0ff`, fgDim `#9a86ff`, accent `#ff2bd6`, accentAlt `#b6ff3b`, danger `#ff3b6b`, grid `#20124a`, glowBlur `12`. Glow con `shadowColor` = color del elemento; HUD/overlay sin glow.

Contraste estimado (WCAG) de todos los pares relevantes contra su `bg`: todos ≥ 4.5:1 para `fg`/`fgDim`/`accent`-texto y ≥ 3:1 para acentos-figura. Verificación real pendiente en `/spec-impl`.

**Riesgos anotados:**

- Regresión sutil en `clasico` al pasar `palette` a las entidades → el plan implementa `clasico` sin glow primero y compara lado a lado.
- `shadowBlur` sin resetear difuminaría el HUD en `retro`/`neon` → reset explícito antes de `drawHUD()` + criterio de aceptación.
- Coste del glow `neon` con pantalla saturada → si baja de ~55 FPS, reducir `neon.glowBlur` a 8 y/o excluir `Particle`.
- Hueco de compilación: ampliar `GameEngine` rompe los 4 engines a la vez; `caida`/`bloque-buster`/`serpentina` necesitan su `setSkin` no-op (o su spec real) en la misma pasada de `/spec-impl`.

**Orden de implementación:** `specs/skins/00-contrato-skins.md` → `specs/skins/rocas.md`.

### 2026-09-02 — caida + bloque-buster + serpentina

Escritos los 3 specs de skin restantes (borradores), mismo patrón que `rocas.md`. `00-contrato-skins.md` ya está implementado (`Palette` / `SkinId` en `types.ts`, `GameEngine.setSkin` en la interfaz, `setSkin` no-op en los 3 engines).

**caida (`specs/skins/caida.md`, borrador).**

- Paletas (rol → hex):
  - `clasico`: bg `#000000`, fg `#ffffff` (reservado), fgDim `rgba(255,255,255,0.12)` (bisel), grid `rgba(255,255,255,0.08)`, glowBlur `0`. accent/accentAlt/danger reservados.
  - `retro`: bg `#04120b`, fg `#c8ffe0`, fgDim `rgba(200,255,224,0.12)`, grid `rgba(77,255,155,0.10)`, glowBlur `4`.
  - `neon`: bg `#05010d`, fg `#d9f7ff` (pálido, no blanco), fgDim `rgba(217,247,255,0.12)`, grid `rgba(123,97,255,0.18)`, glowBlur `8`.
- **Decisión de mapeo más delicada:** los 8 colores de tetrominó no caben en los roles genéricos de `Palette`; se añade `PIECE_COLORS: Record<SkinId, readonly (string|null)[]>` game-local en `caida/skins.ts` (índice 0 = hueco). `clasico` = `#4dd0e1/#ffd54f/#ba68c8/#81c784/#e57373/#90caf9/#ffb74d/#9e9e9e` (1:1). `retro` colapsa a 4 tonos verdes (colisiones I≡N, T≡J, Z≡L — look Game Boy). `neon` = 8 neones saturados con glow por bloque.
- El bisel superior se mapea a `fgDim` como cadena `rgba(...)` con alpha 0.12 ya incluido (el `globalAlpha` activo lo sigue multiplicando: 0.024 en la pieza fantasma). `draw()` sustituye `clearRect` por `fillRect(palette.bg)`; el canvas de preview mantiene `clearRect`. `drawBlock` gana parámetro `glow = true`; la fantasma pasa `false`.

**bloque-buster (`specs/skins/bloque-buster.md`, borrador).**

- Paletas (rol → hex):
  - `clasico`: bg `#000000`, fg `#ffffff` (paleta/bola/flash), glowBlur `0`. Resto de roles reservados.
  - `retro`: bg `#04120b`, fg `#c8ffe0`, fgDim `#4dff9b`, accentAlt `#2bd47a`, danger `#1c9e57`, grid `#0c3a24`, glowBlur `4`.
  - `neon`: bg `#05010d`, fg `#00f0ff` (flash en cian, no blanco), fgDim `#9a86ff`, accent `#ff2bd6`, accentAlt `#b6ff3b`, danger `#ff3b6b`, grid `#20124a`, glowBlur `8`.
- **Decisión de mapeo más delicada:** los 7 nombres CSS de ladrillo (`red/yellow/cyan/magenta/hotpink/green/gray`) pasan a ser `type BrickKey` (identificadores de rol), resueltos por `BRICK_COLORS: Record<SkinId, Record<BrickKey,string>>` game-local. `clasico` = los hex CSS exactos, incluido `green` = `#008000` (~4.1:1, figura, se conserva). `retro` colapsa a 4 tonos verdes. `neon` = 7 neones.
- La **bola** hoy hereda por accidente el `#fff` de la paleta: el spec la fija a `palette.fg` explícito. El flash de explosión pasa de `#fff` a `palette.fg` (conserva `alpha = 1 - t`). Helper `applyGlow(color)` + reset de `shadowBlur` tras cada grupo (ladrillos / explosiones / paleta+bola).

**serpentina (`specs/skins/serpentina.md`, borrador).**

- Paletas (rol → hex):
  - `clasico`: bg `#000000`, fg `#4ade80` (cabeza), fgDim `#16a34a` (cuerpo), accent `#ef4444` (fallback fruta), glowBlur `0`.
  - `retro`: bg `#04120b`, fg `#9bffc0`, fgDim `#3fdd85`, accent `#c8ffe0`, glowBlur `4`. Solo 3 tonos de figura + bg.
  - `neon`: bg `#05010d`, fg `#aaff00` (cabeza lima), fgDim `#00e0ff` (cuerpo cian), accent `#ff2bd6` (halo fruta magenta), glowBlur `8`.
- **Decisión de mapeo más delicada:** mapeo directo a `Palette` (sin estructura game-local — es el engine más simple). El **sprite `fruits.png` NO se recolorea** en ningún skin: en `retro`/`neon` solo se le añade un halo (`shadowColor = palette.accent`); en `clasico` sin halo. `grid` queda reservado (este spec no dibuja rejilla). `fgDim` se usa como figura (cuerpo), umbral ≥ 3:1.

**Riesgos anotados (comunes):**

- Regresión sutil en `clasico` al pasar la paleta → cada plan implementa `clasico` **sin** glow primero y compara lado a lado.
- `shadowBlur` sin resetear difuminaría rejilla/bisel (`caida`), fondo/paleta/bola (`bloque-buster`), fruta/fondo (`serpentina`) → resets explícitos tras cada grupo + criterio de aceptación.
- `neon.glowBlur = 8` en los tres (no 12 como `rocas`): los tres llenan más pantalla de rects contiguos. Si baja de ~55 FPS con la escena saturada, bajar a 6 y/o limitar el glow (pila bloqueada en `caida`, partículas en `bloque-buster`, cola en `serpentina`).
- `retro`: colisiones de tono en `caida` (I≡N, T≡J, Z≡L) y en `bloque-buster` (filas colapsadas) — intencional por el límite de 4 tonos; el bisel/silueta separa. En `serpentina` el sprite de fruta a color sobre fondo verde.
- `av:skin` es clave global (spec 00): un skin elegido en un juego real se aplica a todos.

**Orden de implementación:** `specs/skins/00-contrato-skins.md` (hecho) → `specs/skins/rocas.md` (hecho) → `specs/skins/caida.md` → `specs/skins/bloque-buster.md` → `specs/skins/serpentina.md` (independientes entre sí; cualquier orden vale una vez hecho el 00).
