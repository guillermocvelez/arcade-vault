# Bitácora de skins — Arcade Vault

Memoria persistente del agente `skin-designer`. Estado de skins por engine real.
Estados: `pendiente` · `spec-escrito` · `implementado`.
Skins obligatorios: `clasico` (default) · `retro` · `neon`.

| Juego / id               | Skins requeridos       | Skins con spec         | Estado         | Modo oscuro OK          | Notas                                                                  |
| ------------------------ | ---------------------- | ---------------------- | -------------- | ----------------------- | ---------------------------------------------------------------------- |
| rocas (Asteroids)        | clasico · retro · neon | clasico · retro · neon | `spec-escrito` | Sí (estimado, ver spec) | `specs/skins/rocas.md`. Depende de `specs/skins/00-contrato-skins.md`. |
| caida (Tetris)           | clasico · retro · neon | —                      | `pendiente`    | —                       | Sin spec de skin todavía.                                              |
| bloque-buster (Arkanoid) | clasico · retro · neon | —                      | `pendiente`    | —                       | Sin spec de skin todavía.                                              |
| serpentina (Snake)       | clasico · retro · neon | —                      | `pendiente`    | —                       | Sin spec de skin todavía.                                              |

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
