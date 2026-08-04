# SPEC 01 — MVP visual de Arcade Vault (migración a Nuxt 4)

> **Status:** Approved
> **Depends on:** —
> **Date:** 2026-07-29
> **Objective:** Migrar el prototipo visual de Arcade Vault (React + HTML estático en `references/templates/`) a un MVP en Nuxt 4 con todas sus pantallas, navegación y datos simulados, sin implementar lógica real de ningún juego.

## Scope

**In:**

- 5 pantallas navegables con file-based routing en español: Biblioteca (`/`), Detalle de juego (`/juego/[id]`), Reproductor mock (`/juego/[id]/jugar`), Autenticación (`/auth`), Salón de la Fama (`/salon-de-la-fama`).
- Componente de navegación (`AppNav`) con estado activo por ruta, menú móvil tipo panel lateral, contador de créditos estático ("03", decorativo) y botón de sesión (Iniciar sesión / nombre de usuario).
- Listado de 8 juegos mock (`GAMES`) con búsqueda por nombre y filtro por categoría (`CATS`), portado desde `data.jsx`.
- Tabla de puntuaciones simuladas (`seededScores`) reutilizada en Detalle y Salón de la Fama.
- Formulario de Auth con tabs Iniciar sesión / Crear cuenta, opción "Jugar como invitado", y botones sociales decorativos (Google/GitHub, sin funcionalidad real) — cualquier usuario/contraseña autentica.
- Pantalla Reproductor portada tal cual del prototipo: HUD (jugador, puntuación, vidas, nivel), simulación de partida vía `setInterval` que incrementa puntuación aleatoriamente, pausa, botón FIN, arena CRT decorativa (CSS, sin sprites ni colisiones), y modal de fin de partida para guardar la puntuación.
- Persistencia 100% en `localStorage` del navegador: usuario logueado (`av_user`) vía `useState` de Nuxt sincronizado con localStorage, y puntuaciones guardadas (`av_scores`) — sin backend, sin API real.
- Estructura de carpetas: `app/data/` (datos mock), `app/composables/` (`useAuth`, `useScores`), `app/components/` (Nav, GameCard, etc.), `app/pages/` (una página por ruta).

**Out of scope (for future specs):**

- Lógica real de cualquiera de los 8 juegos (Bloque Buster, Caída, Serpentina, etc.) — el Reproductor sigue siendo una simulación visual, no un motor de juego.
- Backend, API real, base de datos o autenticación con validación de credenciales.
- Sistema de créditos funcional (el contador "03" es solo decorativo).
- Login social real (Google/GitHub) — los botones quedan como UI no funcional.
- Edición de perfil de usuario, configuración de cuenta, o logout persistente más allá de limpiar `localStorage`.
- Sonido, animaciones de juego reales, multijugador o versión táctil optimizada más allá de lo que ya trae el CSS portado.
- Tests automatizados (no hay tooling de test configurado en el repo).

## Data model

```ts
// app/data/games.ts
interface Game {
  id: string;
  title: string;
  short: string;
  long: string;
  cat: "ARCADE" | "PUZZLE" | "SHOOTER" | "VERSUS";
  cover: string;   // clase CSS, p.ej. "cover-bricks"
  color: "cyan" | "magenta" | "green" | "yellow";
  best: number;
  plays: string;   // p.ej. "12.4K"
}

const GAMES: Game[] = [ /* los 8 juegos, portados literal de data.jsx */ ];
const CATS = ["TODOS", "ARCADE", "PUZZLE", "SHOOTER", "VERSUS"] as const;
const PLAYERS: string[] = [ /* 18 nombres, portados literal de data.jsx */ ];

interface ScoreRow {
  rank: number;
  name: string;
  score: number;
  date: string; // DD/MM/2026
}

function seededScores(seed: number, count?: number): ScoreRow[];
```

```ts
// app/composables/useAuth.ts
interface AuthUser {
  name: string; // máx 10 chars, mayúsculas
}
// useState<AuthUser | null>("av-user"), sincronizado con localStorage["av_user"]
function useAuth(): {
  user: Ref<AuthUser | null>;
  login: (u: AuthUser | null) => void; // null = invitado
  signOut: () => void;
};
```

```ts
// app/composables/useScores.ts
interface SavedScore {
  game: string;   // Game.id
  score: number;
  name: string;
  at: number;     // Date.now()
}
// localStorage["av_scores"] = SavedScore[]
function useScores(): {
  saveScore: (entry: Omit<SavedScore, "at">) => void;
};
```

Claves de localStorage: `av_user`, `av_scores` (mismos nombres que el prototipo, para continuidad conceptual aunque no haya migración de datos real).

## Implementation plan

1. Crear `app/data/games.ts` con `GAMES`, `CATS`, `PLAYERS` y `seededScores`, tipados y portados de `data.jsx`. Prueba manual: `npm run dev` sigue arrancando sin errores.
2. Crear `app/composables/useAuth.ts` (estado global vía `useState`, sincronizado con `localStorage["av_user"]`) y `app/composables/useScores.ts` (`saveScore` escribe en `localStorage["av_scores"]`).
3. Crear `app/components/AppNav.vue`: barra superior (logo, links Biblioteca/Salón, contador de créditos estático, botón sesión) y panel móvil, usando `useAuth`.
4. Reescribir `app/app.vue` para renderizar `AppNav`, `<NuxtPage />` y el footer (`© 2026 ARCADE VAULT...`), eliminando el hero placeholder actual del scaffold.
5. Crear `app/components/GameCard.vue` (tarjeta con efecto tilt, portada por categoría, badge de mejor puntuación y botón JUGAR), portado de `GameCard` en `biblioteca.jsx`.
6. Crear `app/pages/index.vue` (Biblioteca): hero, buscador, chips de categoría, grid con `GameCard` y estado "sin resultados". Prueba: la home filtra por texto y categoría en el navegador.
7. Crear `app/pages/juego/[id]/index.vue` (Detalle): portada, tags, descripción, stat-strip, acciones (Jugar ahora / Volver) y leaderboard lateral con `seededScores`.
8. Crear `app/pages/auth.vue`: tabs Iniciar sesión / Crear cuenta, formulario, botón "Jugar como invitado", botones sociales decorativos, integrado con `useAuth().login` y redirección a Biblioteca tras enviar.
9. Crear `app/pages/salon-de-la-fama.vue`: tabs por juego, podio (oro/plata/bronce), tabla completa de puntuaciones y fila "tu mejor marca" cuando hay sesión activa.
10. Crear `app/pages/juego/[id]/jugar.vue` (Reproductor): HUD (jugador/puntuación/vidas/nivel), arena CRT decorativa, simulación de partida con `setInterval`, pausa, botón FIN y modal de fin de partida que llama a `useScores().saveScore`.
11. Repaso de integración final: verificar navegación cruzada entre las 5 pantallas, estado activo del `AppNav` por ruta, y redirección a Biblioteca si `/juego/[id]` recibe un `id` que no existe en `GAMES`.

## Acceptance criteria

- [ ] `npm run dev` levanta la app sin errores en consola del navegador ni de terminal.
- [ ] `/` muestra la Biblioteca con las 8 tarjetas de juego, buscador y chips de categoría funcionando (filtrar por "caída" muestra solo ese juego; elegir "PUZZLE" filtra por categoría).
- [ ] Buscar un texto sin coincidencias muestra el estado "NO HAY RESULTADOS".
- [ ] Click en una tarjeta o su botón JUGAR navega a `/juego/[id]` con la información correcta del juego (título, descripción, stats, portada).
- [ ] `/juego/[id]` muestra el leaderboard lateral con 10 filas ordenadas de mayor a menor puntuación.
- [ ] Botón "JUGAR AHORA" en Detalle navega a `/juego/[id]/jugar` y muestra el HUD y la arena CRT.
- [ ] En el Reproductor, la puntuación aumenta automáticamente cada ~220ms mientras no está en pausa ni terminado.
- [ ] Botón "PAUSA" detiene el incremento de puntuación y muestra el overlay "EN PAUSA"; "REANUDAR" lo retoma.
- [ ] Botón "FIN" abre el modal de fin de partida con la puntuación final.
- [ ] Guardar la puntuación desde el modal persiste una entrada en `localStorage["av_scores"]` y muestra el mensaje de confirmación.
- [ ] `/auth` permite iniciar sesión con cualquier usuario/contraseña, o entrar como invitado, y en ambos casos redirige a `/` actualizando el botón de sesión en el Nav.
- [ ] Cerrar sesión desde el Nav limpia `localStorage["av_user"]` y el botón vuelve a mostrar "Iniciar Sesión".
- [ ] Recargar la página (F5) conserva la sesión iniciada (persistida en `localStorage`).
- [ ] `/salon-de-la-fama` muestra tabs por cada uno de los 8 juegos, podio de los 3 primeros y tabla completa; cambiar de tab cambia las puntuaciones mostradas.
- [ ] Con sesión iniciada, `/salon-de-la-fama` muestra la fila "TU MEJOR MARCA"; sin sesión, no aparece.
- [ ] Navegar a `/juego/id-inexistente` redirige a `/` en vez de mostrar una página rota.
- [ ] El menú móvil (hamburguesa) abre y cierra el panel lateral y permite navegar entre las 5 pantallas.
- [ ] El link activo del Nav refleja correctamente la sección actual (incluye Detalle y Reproductor resaltando "Biblioteca").

## Decisions

- **Sí:** rutas file-based en español (`/`, `/juego/[id]`, `/juego/[id]/jugar`, `/auth`, `/salon-de-la-fama`). Coherente con el idioma de toda la UI y evita mezclar dominios.
- **No:** mantener el router propio basado en hash del prototipo (`#{"name":...}`). Nuxt ya trae file-based routing real; reinventarlo sería trabajo innecesario y menos idiomático.
- **Sí:** `/` renderiza directamente la Biblioteca (sin redirect intermedio a `/biblioteca`). Simplifica el árbol de rutas; la Biblioteca es la pantalla de entrada tanto en el prototipo como en la app real.
- **Sí:** portar el Reproductor tal cual, incluyendo el `setInterval` que simula puntuación. Sigue siendo 100% mock visual, no lógica de juego real, y preserva la demo completa del flujo de partida.
- **No:** implementar mecánicas reales de ninguno de los 8 juegos. Explícitamente fuera de alcance según el pedido original.
- **Sí:** `useState` de Nuxt para el usuario logueado, sincronizado con `localStorage`. Evita bugs de hidratación SSR y es el patrón idiomático de Nuxt para estado compartido entre componentes.
- **Sí:** login/registro sin validación real (cualquier usuario/contraseña autentica). Igual que el prototipo; no hay backend en este MVP.
- **No:** tocar `references/templates/` tras la migración. Queda como material de referencia histórico.
- **Sí:** reutilizar los mismos nombres de clave de `localStorage` (`av_user`, `av_scores`) que el prototipo, aunque no haya migración de datos real entre ambos. Mantiene continuidad conceptual y facilita comparar comportamiento.
- **No:** extraer un componente `Leaderboard` compartido entre Detalle y Salón de la Fama. Sus markups (`lb-row` vs `hall-table`/podio) son suficientemente distintos como para que la abstracción sea prematura; se implementan por separado.

## Risks

| Riesgo                                                                 | Mitigación                                                                                          |
| ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Nuxt 4 renderiza en servidor (SSR) y `localStorage` no existe ahí       | `useAuth`/`useScores` leen `localStorage` solo dentro de `onMounted`/`process.client`, con `useState` como fuente reactiva inicializada en `null`/`[]` en servidor. |
| `localStorage` deshabilitado (modo privado / navegador restringido)     | Los `try/catch` alrededor de `localStorage` (igual que en el prototipo) evitan que la app crashee; la sesión y las puntuaciones simplemente no persisten. |
| El `setInterval` del Reproductor sigue corriendo si el usuario navega fuera de la página sin pasar por "FIN" | Limpiar el intervalo en el hook de desmontaje del componente (`onUnmounted`), igual que el `useEffect` cleanup del prototipo. |

## What is **not** in this spec

- Lógica real de cualquiera de los 8 juegos (Bloque Buster, Caída, Serpentina, Glotón, Invasores, Rocas, Ranaria, Duelo Pixel).
- Backend, API real o base de datos — todo vive en `localStorage`.
- Validación real de credenciales o login social funcional.
- Sistema de créditos funcional, edición de perfil, o logout más allá de limpiar `localStorage`.
- Sonido, multijugador, versión táctil optimizada más allá del CSS ya portado, y tests automatizados.

Cada uno de estos, si se implementa, va en su propio spec.
