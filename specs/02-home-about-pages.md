# SPEC 02 — Home y Acerca de

> **Estado:** Implementado
> **Depende de:** `01-mvp-visual-nuxt.md`
> **Fecha:** 2026-08-04
> **Objetivo:** Portar las pantallas Home (portada/landing) y Acerca de (about + contacto) del prototipo a la app Nuxt, reubicando la Biblioteca actual de `/` a `/games` y actualizando la navegación para reflejar las 4 secciones (Inicio, Biblioteca, Salón de la Fama, Acerca de).

## Scope

**In:**

- Nueva ruta `/` → página **Home** (portada/landing), reemplazando a la Biblioteca actual en esa ruta.
- La Biblioteca actual se muda a la nueva ruta `/games` (nuevo `app/pages/games.vue` con el contenido que hoy vive en `app/pages/index.vue`: hero, buscador, chips, grid y `GameCard`).
- Nueva ruta `/acerca-de` → página **About** (misión + contacto), portada de `about.jsx`.
- Nuevos componentes: `MiniCard.vue` (tarjeta liviana de portada+título+categoría para la sección "Juegos disponibles ahora" del Home), `FeatureIcon.vue` y `HighlightIcon.vue` (iconos pixel-art SVG).
- Nuevo composable `useReveal.ts` que porta el hook `useReveal` del prototipo (IntersectionObserver que agrega la clase `.in` a los elementos `.reveal` al hacer scroll), reutilizado tanto en Home como en About.
- Actualización de `AppNav.vue`: se agregan los links "Inicio" (`/`) y "Acerca de" (`/acerca-de`) al menú de escritorio y al panel móvil; se ajusta `isActive` para que "Biblioteca" resalte en `/games` (y en Detalle/Reproductor) en vez de en `/`.
- Mapeo de CTAs internos del Home a rutas reales: "Explorar juegos" / "Ver todos los juegos" / "Insertar moneda" → `/games`; "Crear cuenta" / botón del plan gratuito → `/auth`; click en `MiniCard` → `/juego/[id]`.
- Datos "constantes temporales" del Home (features, stats, ticker de actividad, top 5 jugadores, plan de precios, FAQ) como arrays literales dentro de `app/pages/index.vue`, portados 1:1 de `home.jsx`.
- Sección "Juegos disponibles ahora" del Home lee los primeros 6 elementos del array `GAMES` ya existente (`app/data/games.ts`).
- Formulario de contacto en About: 100% decorativo, estado local con `ref`, sin persistencia ni envío real — misma UX que el prototipo (animación de "terminal de éxito" al enviar datos válidos, animación de "shake" si falta algún campo).
- Migración de los estilos correspondientes desde `references/templates/home-about/styles.css` (selectores `home-*`, `about-*`, `feature-*`, `mini-*`, `activity-*`, `ticker`, `top-*`, `pricing-*`, `price-*`, `faq-*`, `final-*`, `highlight`, `contact-*`, `terminal-*`, `div-*`) agregados a `app/assets/css/main.css`.
- Actualizar los redirects `navigateTo("/")` existentes en `app/pages/juego/[id]/index.vue` y `app/pages/juego/[id]/jugar.vue` (cuando el `id` de la URL no existe en `GAMES`) para que apunten a `/games` en vez de `/`.

**Out of scope (para specs futuros):**

- Sistema de créditos real (el contador "03" sigue siendo decorativo).
- Conectar el ticker de actividad o el top 5 de jugadores a `useScores`/`localStorage` real — quedan hardcodeados según lo acordado.
- Cualquier lógica de pagos/checkout — la sección "PRECIOS" es solo informativa (plan único gratuito).
- Envío real de mensajes de contacto (email, backend, API).
- Cambios a Auth, Detalle de juego, Reproductor o Salón de la Fama más allá de lo estrictamente necesario en `AppNav.vue` y en los dos redirects mencionados arriba.
- Tests automatizados (no hay tooling configurado en el repo).

## Data model

Este spec no introduce entidades persistentes nuevas (no hay cambios en `localStorage` ni en `app/data/games.ts`). Sí define las formas de los datos hardcodeados que vive cada sección del Home, como tipos locales dentro de `app/pages/index.vue`:

```ts
// app/pages/index.vue (tipos locales, sin exportar)
interface FeatureItem {
  icon: "GAMEPAD" | "FREE" | "TROPHY" | "ROCKET";
  title: string;
  desc: string;
  color: "cyan" | "yellow" | "magenta" | "green";
}

interface StatItem {
  n: string;    // "12+", "MILES", "GLOBAL"
  unit: string; // "JUEGOS", "DE PARTIDAS", "RANKING"
  sub: string;
}

interface ActivityRow {
  player: string;
  game: string;
  score: number;
  time: string;   // "hace 2 min"
  color: "magenta" | "yellow" | "green" | "cyan";
}

interface TopPlayerRow {
  rank: number;
  player: string;
  score: number;
}

interface FaqItem {
  question: string;
  answer: string;
}
```

```ts
// app/components/MiniCard.vue (props)
defineProps<{ game: Game }>(); // Game ya definido en app/data/games.ts
// emit("select", game.id) → la página Home navega a /juego/[id]
```

```ts
// app/components/FeatureIcon.vue y HighlightIcon.vue (props)
defineProps<{ kind: string }>(); // "GAMEPAD" | "FREE" | "TROPHY" | "ROCKET" (Feature)
                                  // "HEART" | "BROWSER" | "PLANT" (Highlight)
```

```ts
// app/pages/acerca-de.vue (estado local del form, sin persistencia)
interface ContactForm {
  name: string;
  email: string;
  msg: string;
}
// ref<ContactForm>, ref<string | null> sent, ref<boolean> shake
```

## Implementation plan

1. Crear `app/composables/useReveal.ts` portando el hook `useReveal` del prototipo (IntersectionObserver que agrega `.in` a los elementos `.reveal`). Prueba: `npm run dev` sigue arrancando sin errores.
2. Crear `app/components/MiniCard.vue`, `app/components/FeatureIcon.vue` y `app/components/HighlightIcon.vue`, portados literal de `home.jsx` / `about.jsx`.
3. Mover el contenido actual de `app/pages/index.vue` (hero de Biblioteca, buscador, chips, grid) a un nuevo `app/pages/games.vue`, sin cambiar su comportamiento. Prueba: `/games` muestra la Biblioteca completa funcionando igual que antes en `/`.
4. Reescribir `app/pages/index.vue` como la página **Home**: hero con silhouettes flotantes, sección "POR QUÉ ARCADE VAULT" (con `FeatureIcon`), sección "JUEGOS DISPONIBLES AHORA" (con `MiniCard` sobre los primeros 6 de `GAMES`), sección de stats, sección "ACTIVIDAD EN VIVO" (ticker + top 5 jugadores hardcodeados), sección de precios/FAQ, y CTA final — todas usando `useReveal`.
5. Crear `app/pages/acerca-de.vue`: hero de misión, highlights (con `HighlightIcon`), separador decorativo, y formulario de contacto con estados de éxito/shake, usando `useReveal`.
6. Portar los estilos correspondientes de `references/templates/home-about/styles.css` (selectores `home-*`, `about-*`, `feature-*`, `mini-*`, `activity-*`, `ticker`, `top-*`, `pricing-*`, `price-*`, `faq-*`, `final-*`, `highlight`, `contact-*`, `terminal-*`, `div-*`) al final de `app/assets/css/main.css`.
7. Actualizar `app/components/AppNav.vue`: agregar los links "Inicio" (`/`) y "Acerca de" (`/acerca-de`) en el menú de escritorio y en el panel móvil; ajustar `isActive` para que "Biblioteca" resalte en `/games` (y rutas de Detalle/Reproductor) en vez de en `/`. Actualizar los redirects `navigateTo("/")` en `app/pages/juego/[id]/index.vue` y `app/pages/juego/[id]/jugar.vue` (cuando el `id` no existe en `GAMES`) para que apunten a `/games` en vez de `/`.
8. Repaso de integración final: verificar navegación cruzada entre Home, Biblioteca (`/games`), Detalle, Reproductor, Auth, Salón de la Fama y Acerca de; confirmar que el estado activo del Nav es correcto en cada ruta, y que las animaciones `.reveal` disparan correctamente al hacer scroll en Home y About.

## Acceptance criteria

- [x] `npm run dev` levanta la app sin errores en consola del navegador ni de terminal.
- [x] `/` muestra el Home (portada) con hero, silhouettes flotantes, sección "POR QUÉ ARCADE VAULT", "JUEGOS DISPONIBLES AHORA", stats, "ACTIVIDAD EN VIVO", precios/FAQ y CTA final.
- [x] `/games` muestra la Biblioteca completa (buscador, chips de categoría, grid de 8 juegos) con el mismo comportamiento que tenía antes en `/`.
- [x] `/acerca-de` muestra la misión, los 3 highlights y el formulario de contacto.
- [x] En Home, el botón "EXPLORAR JUEGOS" y "VER TODOS LOS JUEGOS →" navegan a `/games`; "CREAR CUENTA" y el botón del plan gratuito navegan a `/auth`; "INSERTAR MONEDA →" (CTA final) navega a `/games`.
- [x] En Home, hacer click en una `MiniCard` de la sección "Juegos disponibles ahora" navega a `/juego/[id]` con el juego correcto.
- [x] Las secciones marcadas con `.reveal` en Home y About aparecen animadas (clase `.in`) al hacer scroll hasta ellas, y no antes.
- [x] En `/acerca-de`, enviar el formulario de contacto sin completar todos los campos dispara la animación de "shake" y no muestra el estado de éxito.
- [x] En `/acerca-de`, enviar el formulario con los 3 campos completos muestra el bloque "terminal de éxito" con el nombre ingresado en mayúsculas, y el botón "ENVIAR OTRO MENSAJE" limpia el formulario y vuelve al estado inicial.
- [x] El `AppNav` (escritorio y panel móvil) muestra 4 links: Inicio, Biblioteca, Salón de la Fama, Acerca de.
- [x] El link activo del Nav refleja correctamente la sección actual: "Inicio" en `/`, "Biblioteca" en `/games` y en las rutas de Detalle/Reproductor, "Acerca de" en `/acerca-de`.
- [x] Navegar a `/juego/id-inexistente` o `/juego/id-inexistente/jugar` redirige a `/games` en vez de a `/` o a una página rota.
- [x] Navegar entre las 7 pantallas (Home, Biblioteca, Detalle, Reproductor, Auth, Salón de la Fama, Acerca de) no produce rutas rotas ni errores en consola.

## Decisions

- **Sí:** Home pasa a ser `/` y la Biblioteca se muda a `/games`. Refleja el comportamiento real del prototipo (Inicio y Biblioteca son pantallas distintas en el nav) y revierte la decisión de SPEC 01 de que `/` era la Biblioteca.
- **Sí:** la ruta de About queda en español (`/acerca-de`), pese a que `/games` rompe la convención en inglés. Prioriza consistencia con el resto de rutas (`/salon-de-la-fama`, `/juego/[id]`); `/games` queda como la única excepción explícita pedida por el usuario.
- **No:** crear un archivo `app/data/home.ts` para los datos mock del Home. Se dejan inline en `app/pages/index.vue`, igual que en el prototipo — son "constantes temporales" sin intención de reutilizarse en otras pantallas.
- **No:** conectar el ticker de actividad ni el top 5 de jugadores a `useScores`/`localStorage` real en este spec. Quedan hardcodeados por ahora; conectarlos a datos reales queda para un spec futuro.
- **Sí:** crear `MiniCard.vue` como componente nuevo en vez de reutilizar `GameCard.vue`. Reproduce fielmente el diseño más liviano del prototipo (sin tilt, sin badge de puntuación, sin botón), pensado como vista previa, sin forzar props opcionales sobre `GameCard`.
- **Sí:** portar `FeatureIcon` y `HighlightIcon` como componentes Vue reutilizables en vez de dejarlos inline. Preferencia explícita del usuario.
- **Sí:** formulario de contacto 100% decorativo, sin backend ni persistencia. Coherente con que el resto del proyecto no tiene backend real (SPEC 01).
- **Sí:** crear un composable `useReveal.ts` compartido entre Home y About en vez de duplicar la lógica del `IntersectionObserver` en cada página. Ambas pantallas usan exactamente el mismo patrón `.reveal` / `.in`.
- **Sí:** portar los estilos nuevos dentro del mismo `app/assets/css/main.css` existente, sin crear un archivo CSS separado. Mantiene el patrón de SPEC 01 de un único archivo de estilos globales.
- **No:** tocar `references/templates/` tras la migración. Queda como material de referencia histórico (mismo criterio que SPEC 01).

## Risks

| Riesgo | Mitigación |
|---|---|
| El `IntersectionObserver` de `useReveal` accede a `document`/`IntersectionObserver`, que no existen durante el render SSR de Nuxt. | Ejecutar toda la lógica dentro de `onMounted` (equivalente al `useEffect` del prototipo), evitando cualquier acceso a `document` en el render de servidor. |
| Mover la Biblioteca de `/` a `/games` puede dejar referencias sueltas a `/` como "página de biblioteca" en otras partes del código (redirects, links hardcodeados). | Ya cubierto explícitamente en el paso 7 del plan (redirects de `id` inválido); revisar en el paso 8 (repaso de integración) que no queden otras referencias a `/` asumiendo que ahí vive la Biblioteca. |
| El CSS portado (~460 reglas nuevas) puede colisionar con clases ya existentes en `main.css` si hay nombres repetidos entre prototipos. | Revisar visualmente cada sección tras portar el CSS (paso 6) y renombrar/ajustar si aparece algún conflicto de especificidad o de nombre de clase. |
