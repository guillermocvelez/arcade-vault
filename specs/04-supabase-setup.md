# SPEC 04 — Setup de Supabase (infraestructura)

> **Estado:** Implementado
> **Depende de:** `03-contact-form-resend.md`
> **Fecha:** 2026-08-18
> **Objetivo:** Instalar y configurar el módulo `@nuxtjs/supabase` en la app Nuxt, conectado al proyecto Supabase ya existente (`wtgqrqoqisdvsercmtpq.supabase.co`), sin implementar autenticación ni crear tablas — dejando la infraestructura del cliente lista para que specs futuros construyan Auth y persistencia de datos sobre ella.

## Scope

**In:**

- Nueva dependencia npm `@nuxtjs/supabase` (módulo oficial de Nuxt).
- Registro del módulo en `nuxt.config.ts` (`modules: [..., '@nuxtjs/supabase']`), con `redirectOptions` configurado para **no proteger ninguna ruta todavía**: `{ login: '/auth', callback: '/', exclude: ['/*'] }`.
- Nuevas variables de entorno `SUPABASE_URL` y `SUPABASE_KEY` (nombres que el módulo lee por convención), apuntando al proyecto ya vinculado `wtgqrqoqisdvsercmtpq.supabase.co` y su anon/publishable key (obtenida vía MCP en el momento de implementación, no hardcodeada en el spec).
- Actualización de `.env.example` documentando `SUPABASE_URL` y `SUPABASE_KEY` (sin valores reales), siguiendo el mismo patrón que `RESEND_API_KEY`/`RESEND_TO_EMAIL`.
- Un chequeo mínimo de conectividad al arrancar el servidor (ej. `server/plugins/` o similar) que llama a algo trivial del cliente Supabase (`supabase.auth.getSession()`) y loguea éxito/error **solo en la consola de terminal**, sin UI visible ni afectar el render.

**Out of scope (para specs futuros):**

- Cualquier lógica de autenticación real (login, signup, logout, sesión persistente, recuperación de contraseña, OAuth). `auth.vue` y `useAuth.ts` quedan exactamente como están hoy (fake, con `localStorage`).
- Protección real de rutas (el `exclude: ['/*']` de este spec desactiva explícitamente la protección; activarla es parte del spec de Auth).
- Cualquier tabla, schema, migration o política RLS en la base de datos.
- Conectar `useScores.ts` o `salon-de-la-fama.vue` a Supabase — siguen usando `localStorage`/datos hardcodeados.
- Generación de tipos TypeScript desde la base de datos (`generate_typescript_types`) — no aplica sin tablas.
- Cualquier cambio visual o de UX en pantallas existentes.

## Data model

Este spec no introduce estructuras de datos nuevas (no hay tablas, ni schema, ni tipos de dominio) — solo configura el cliente. La única pieza de "datos" son las dos variables de entorno ya descritas en Scope (`SUPABASE_URL`, `SUPABASE_KEY`), que no ameritan una interfaz propia.

## Implementation plan

1. Instalar la dependencia: `npm install @nuxtjs/supabase`. Prueba: `npm install` termina sin errores.
2. Agregar `'@nuxtjs/supabase'` al array `modules` en `nuxt.config.ts`, con la config `supabase: { redirectOptions: { login: '/auth', callback: '/', exclude: ['/*'] } }`. Prueba: `npm run dev` sigue arrancando sin errores (sin credenciales todavía puede loguear un warning, se resuelve en el paso 4).
3. Crear `.env.example` (o actualizar el existente) documentando `SUPABASE_URL` y `SUPABASE_KEY` sin valores reales, junto a las variables de Resend ya documentadas.
4. Obtener la URL y la anon/publishable key del proyecto ya vinculado (vía herramientas MCP de Supabase: `get_project_url`, `get_publishable_keys`) y completarlas en `.env.local` (no committeado). Prueba: las variables quedan disponibles para `runtimeConfig.public.supabase`.

   > **Nota de implementación:** Nuxt (vía c12) solo carga `.env` automáticamente para `runtimeConfig`/`process.env` en el servidor — no lee `.env.local` por defecto. Se detectó al probar el paso 5 (`supabaseUrl is required.`). Consultado con el usuario, se optó por renombrar `.env.local` a `.env`, consistente con el patrón ya usado para `RESEND_API_KEY` en `03-contact-form-resend.md`.

5. Crear un chequeo mínimo de conectividad (ej. `server/plugins/supabase-check.ts`) que en el arranque del servidor llama a `serverSupabaseClient` / cliente de Supabase con `auth.getSession()` (o una operación igualmente trivial) y loguea `[supabase] client conectado OK` o el error correspondiente, únicamente en la consola de terminal.
6. Prueba de integración final: `npm run dev` arranca sin errores, la consola de terminal muestra el log de conexión exitosa, `npm run build` compila sin errores, y navegar por las 7 pantallas existentes (Home, Biblioteca, Detalle, Reproductor, Auth, Salón de la Fama, Acerca de) funciona exactamente igual que antes (sin redirecciones nuevas, sin cambios visuales).

## Acceptance criteria

- [x] `@nuxtjs/supabase` está instalado como dependencia en `package.json`.
- [x] `npm run dev` levanta la app sin errores en consola del navegador ni de terminal.
- [x] `npm run build` compila sin errores.
- [x] La consola de terminal muestra `[supabase] client conectado OK` (o mensaje equivalente) al arrancar el servidor con credenciales válidas en `.env` (renombrado desde `.env.local`, ver nota de implementación en el paso 4).
- [x] `.env.example` documenta `SUPABASE_URL` y `SUPABASE_KEY` sin valores reales.
- [x] Ninguna ruta existente redirige a `/auth` ni a ninguna otra página por falta de sesión — la navegación entre las 7 pantallas (Home, Biblioteca, Detalle, Reproductor, Auth, Salón de la Fama, Acerca de) es idéntica a antes del spec.
- [x] `auth.vue` y `useAuth.ts` no tienen cambios de comportamiento (login/signup/invitado siguen siendo 100% locales vía `localStorage`, sin llamadas a Supabase).
- [x] No existen tablas nuevas en el proyecto Supabase (`list_tables` sigue devolviendo vacío) ni migraciones aplicadas.

## Decisions

- **Sí:** usar el módulo `@nuxtjs/supabase` en vez de `@supabase/supabase-js` a mano. Da composables (`useSupabaseClient`, `useSupabaseUser`) y manejo de SSR listos de fábrica para cuando se implemente Auth en un spec futuro, sin tener que resolver eso ahora. Decisión explícita del usuario.
- **Sí:** reutilizar el proyecto Supabase ya vinculado (`wtgqrqoqisdvsercmtpq.supabase.co`) en vez de crear uno nuevo. Ya está conectado vía MCP y sin tablas, es terreno limpio. Decisión explícita del usuario.
- **Sí:** desactivar la protección de rutas del módulo (`redirectOptions.exclude: ['/*']`) en este spec. El comportamiento por defecto del módulo redirige toda ruta sin sesión a `/login`, lo que rompería la navegación actual ya que no hay Auth real todavía. Se activa la protección real en el spec de Auth.
- **No:** implementar ninguna lógica de autenticación (login, signup, OAuth, sesión persistente) en este spec. Queda explícitamente para un spec futuro dedicado a Auth. Decisión explícita del usuario.
- **No:** crear tablas, schemas, migrations ni políticas RLS en este spec. Queda para un spec futuro (posiblemente el mismo de Auth, o uno de persistencia de puntajes). Decisión explícita del usuario.
- **No:** usar el `DB_PASSWORD` presente en `.env.local` (marcado `#DO_NOT_USE`) — no se usa para nada en este spec ni se referencia en la configuración de Supabase; las credenciales vienen exclusivamente de las herramientas MCP de Supabase (`get_project_url`, `get_publishable_keys`).
- **Sí:** agregar un chequeo mínimo de conectividad en el servidor (log en consola) en vez de no verificar nada. Da una señal rápida de que las credenciales están bien configuradas sin necesitar UI ni tocar pantallas existentes.

## Risks

| Riesgo                                                                                                                                                                                                                                                                                                                                                | Mitigación                                                                                                                                                                                                                                                       |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| El comportamiento por defecto de `@nuxtjs/supabase` protege todas las rutas y redirige a `/login` sin sesión, lo que rompería la navegación actual de la app.                                                                                                                                                                                         | Cubierto explícitamente en el paso 2 del plan (`redirectOptions.exclude: ['/*']`); verificado en el paso 6 (repaso de integración) y en los criterios de aceptación.                                                                                             |
| Si `SUPABASE_URL`/`SUPABASE_KEY` no están configuradas o son inválidas en `.env.local`, el chequeo de conectividad falla silenciosamente o rompe el arranque del servidor.                                                                                                                                                                            | El chequeo del paso 5 loguea el error explícitamente en consola de terminal en vez de fallar silenciosamente, facilitando el diagnóstico.                                                                                                                        |
| El anon/publishable key de Supabase es público por diseño (se expone al cliente vía `runtimeConfig.public`), a diferencia del patrón usado con `RESEND_API_KEY` (privado, solo servidor). Confundir ambos patrones podría llevar a exponer accidentalmente una key que debía ser privada, o a bloquear innecesariamente una que es segura de exponer. | Documentado explícitamente: `SUPABASE_KEY` (anon) va en `runtimeConfig.public`, a diferencia de `resendApiKey` que va en `runtimeConfig` privado. Revisar en la implementación que no se use por error una `service_role` key (esa sí es privada) en el cliente. |
| El proyecto Supabase vinculado vía MCP podría no ser el mismo proyecto que el usuario espera usar en producción.                                                                                                                                                                                                                                      | Confirmado explícitamente con el usuario en la fase de preguntas (Fase 2) que se reutiliza el proyecto detectado (`wtgqrqoqisdvsercmtpq.supabase.co`).                                                                                                           |
