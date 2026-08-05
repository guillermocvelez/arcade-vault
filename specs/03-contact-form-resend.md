# SPEC 03 — Formulario de contacto funcional con Resend

> **Estado:** Approved.
> **Depende de:** `02-home-about-pages.md`
> **Fecha:** 2026-08-04
> **Objetivo:** Conectar el formulario de contacto de la página Acerca de (`/acerca-de`) a un endpoint del servidor que envíe el mensaje por email vía Resend, agregando validación de formato de email, estado de carga y manejo de error, sin modificar el resto del diseño ya implementado en SPEC 02.

## Scope

**In:**

- Nuevo endpoint de servidor `server/api/contact.post.ts` (Nitro) que recibe `{ name, email, msg }`, valida en el servidor (no vacíos, formato de email) y envía el correo vía Resend usando el SDK oficial `resend`.
- Nueva dependencia npm `resend` en `package.json`.
- `runtimeConfig` en `nuxt.config.ts` para exponer `RESEND_API_KEY` (privado, solo servidor) y `RESEND_TO_EMAIL` (privado, `guillermo.c.velez@gmail.com` por defecto).
- Nuevo archivo `.env.example` documentando `RESEND_API_KEY` y `RESEND_TO_EMAIL` (sin valores reales).
- El correo se envía desde `onboarding@resend.dev` (sandbox de Resend) hacia `RESEND_TO_EMAIL`, con `reply_to` seteado al email ingresado en el formulario.
- Cuerpo del correo en HTML simple con estética pixel/terminal (fondo oscuro, texto monoespaciado, colores del proyecto), incluyendo nombre, email y mensaje del formulario.
- Actualización de `app/pages/acerca-de.vue`:
  - Validación de formato de email (regex simple) además de la validación de "no vacío" ya existente — ambas disparan el "shake" actual.
  - Llamada a `POST /api/contact` (vía `$fetch`) en `onSubmit`, reemplazando el `sent.value = form.value.name.trim()` directo por la espera de la respuesta del servidor.
  - Nuevo estado de carga: botón deshabilitado con texto "ENVIANDO..." mientras la petición está en curso.
  - Nuevo estado de error: si `$fetch` falla, se muestra un bloque "terminal de error" (misma estética que el bloque de éxito actual, líneas `[ERROR]` en rojo) con un botón para reintentar, sin perder lo escrito en el formulario.

**Out of scope (para specs futuros):**

- Cualquier protección anti-spam (honeypot, captcha, límites por IP, etc.).
- Dominio propio verificado en Resend — se usa el sandbox `onboarding@resend.dev`, lo que implica que el envío solo funcionará de forma confiable mientras `RESEND_TO_EMAIL` sea el correo con el que está registrada la cuenta de Resend.
- Persistencia de los mensajes de contacto (en `localStorage`, base de datos, o cualquier otro storage).
- Panel de administración o listado de mensajes recibidos.
- Notificaciones adicionales (confirmación por email al remitente, Slack, etc.) más allá del correo a `RESEND_TO_EMAIL`.
- Tests automatizados (no hay tooling configurado en el repo).
- Cambios a cualquier otra pantalla o componente fuera de `acerca-de.vue`, `nuxt.config.ts`, `package.json` y el nuevo `server/api/contact.post.ts`.

## Data model

```ts
// server/api/contact.post.ts
interface ContactPayload {
  name: string;
  email: string;
  msg: string;
}

interface ContactSuccessResponse {
  ok: true;
}
// Error: throws createError({ statusCode: 400 | 500, statusMessage: string })
```

```ts
// nuxt.config.ts (runtimeConfig, privado — no expuesto al cliente)
interface RuntimeConfig {
  resendApiKey: string;  // env: RESEND_API_KEY
  resendToEmail: string; // env: RESEND_TO_EMAIL
}
```

```ts
// app/pages/acerca-de.vue (estado local ampliado)
interface ContactForm {
  name: string;
  email: string;
  msg: string;
}
// ref<ContactForm>, ref<string | null> sent, ref<boolean> shake,
// ref<boolean> sending, ref<boolean> sendError
```

## Implementation plan

1. Agregar la dependencia `resend` (`npm install resend`) y crear `.env.example` documentando `RESEND_API_KEY` y `RESEND_TO_EMAIL` (sin valores reales). Prueba: `npm install` sigue funcionando sin errores.
2. Agregar `runtimeConfig` en `nuxt.config.ts` con `resendApiKey` (env `RESEND_API_KEY`) y `resendToEmail` (env `RESEND_TO_EMAIL`, default `"guillermo.c.velez@gmail.com"`). Prueba: `npm run dev` sigue arrancando sin errores.
3. Crear `server/api/contact.post.ts`: lee el body, valida `name`/`email`/`msg` no vacíos y formato de `email`, arma el HTML pixel/terminal del correo, y llama a `resend.emails.send(...)` con `from: "onboarding@resend.dev"`, `to: runtimeConfig.resendToEmail`, `reply_to: email`. Devuelve `{ ok: true }` en éxito o lanza `createError` en fallo.
4. Actualizar `app/pages/acerca-de.vue`: agregar validación de formato de email (mismo mecanismo de "shake" que la validación de campos vacíos), agregar los estados `sending` y `sendError`.
5. Reemplazar la lógica de `onSubmit` en `acerca-de.vue` para que, tras pasar las validaciones locales, llame a `$fetch("/api/contact", { method: "POST", body: form.value })`, mostrando `sending` mientras espera, `sent` en éxito, y `sendError` (bloque "terminal de error") si la petición falla.
6. Agregar el bloque de estilos para la "terminal de error" en `app/assets/css/main.css`, reutilizando y adaptando las clases `terminal-*`/`term-*` existentes (líneas `[ERROR]` en rojo en vez de verde) y el botón de reintentar.
7. Prueba de integración manual: con `RESEND_API_KEY` real en `.env` (provista por el usuario, no generada por Claude), enviar el formulario completo y confirmar que llega el correo a `RESEND_TO_EMAIL` con `reply_to` correcto; enviar con un campo vacío o email inválido y confirmar el "shake"; forzar un error (p.ej. `RESEND_API_KEY` inválida) y confirmar que aparece el bloque de error con botón de reintento.

## Acceptance criteria

- [ ] `npm run dev` levanta la app sin errores en consola del navegador ni de terminal, con `resend` instalado como dependencia.
- [ ] `.env.example` existe en la raíz del repo y documenta `RESEND_API_KEY` y `RESEND_TO_EMAIL` sin valores reales; `.env` sigue ignorado por git (ya lo está).
- [ ] Enviar el formulario en `/acerca-de` con los 3 campos completos y un email con formato válido, con `RESEND_API_KEY` real configurada, llega un correo a `RESEND_TO_EMAIL` con nombre, email y mensaje, y con `Reply-To` igual al email ingresado.
- [ ] Enviar el formulario con algún campo vacío dispara el "shake" y no llama al endpoint `/api/contact`.
- [ ] Enviar el formulario con un email de formato inválido (p.ej. `"nombre"` sin `@`) dispara el "shake" y no llama al endpoint `/api/contact`.
- [ ] Mientras la petición a `/api/contact` está en curso, el botón de envío se deshabilita y muestra "ENVIANDO...".
- [ ] Si `/api/contact` responde con éxito, se muestra el bloque "terminal de éxito" existente (sin cambios respecto a SPEC 02).
- [ ] Si `/api/contact` falla (por red o por error del servidor, p.ej. `RESEND_API_KEY` inválida), se muestra el bloque "terminal de error" con estética similar a la de éxito, sin perder lo escrito en el formulario, y con un botón para reintentar el envío.
- [ ] El resto de `/acerca-de` (hero, highlights, divisor) permanece visualmente idéntico a SPEC 02.

## Decisions

- **Sí:** usar el SDK oficial `resend` en vez de fetch directo a la API REST. Es lo recomendado por Resend para Node, más simple y tipado. Decisión explícita del usuario.
- **Sí:** usar el sandbox `onboarding@resend.dev` como remitente en vez de un dominio verificado. El usuario no tiene un dominio propio configurado en Resend todavía; permite dejar el formulario funcional sin bloquear el spec en configuración de DNS. Implica la limitación de que el destino confiable es el correo registrado en la cuenta de Resend.
- **Sí:** `RESEND_TO_EMAIL` es configurable vía `runtimeConfig`/env (con default `guillermo.c.velez@gmail.com`) en vez de hardcodeado en el endpoint. Facilita cambiar el destino sin tocar código si más adelante se verifica un dominio y se quiere usar otro correo.
- **Sí:** agregar validación de formato de email (regex simple) además de la validación de "no vacío" ya existente. Evita llamadas innecesarias a Resend con direcciones claramente inválidas. Decisión explícita del usuario.
- **No:** honeypot ni ninguna otra protección anti-spam en este spec. Decisión explícita del usuario — se deja fuera por ahora, sin necesidad inmediata; queda disponible para un spec futuro si aparece spam real.
- **Sí:** `Reply-To` del correo enviado = email ingresado en el formulario. Permite responder directo al visitante desde el cliente de correo. Decisión explícita del usuario.
- **Sí:** cuerpo del correo en HTML con estética pixel/terminal en vez de texto plano. Consistencia con la identidad visual del proyecto. Decisión explícita del usuario.
- **No:** persistir los mensajes de contacto en ningún storage (ni `localStorage`, ni base de datos). El mensaje solo existe en tránsito hacia Resend; coherente con que el proyecto no tiene backend/DB real (SPEC 01).
- **No:** implementar rate-limiting o captcha en este spec.
- **Sí:** reutilizar y adaptar las clases `terminal-*`/`term-*` existentes para el bloque de error, en vez de crear un sistema de estilos nuevo. Mantiene consistencia visual con el bloque de éxito ya implementado en SPEC 02.

## Risks

| Riesgo | Mitigación |
|---|---|
| El sandbox `onboarding@resend.dev` de Resend solo permite enviar correos de forma confiable al correo con el que está registrada la cuenta de Resend; enviar a otro `RESEND_TO_EMAIL` puede fallar o quedar bloqueado. | Documentado explícitamente en Scope y Decisions. Si se necesita otro destino, el spec para verificar un dominio propio en Resend es un paso futuro. |
| Sin honeypot ni rate-limiting, el endpoint `/api/contact` es un blanco fácil para spam automatizado o abuso (consumo de cuota de Resend). | Aceptado como riesgo conocido por decisión explícita del usuario; si se vuelve un problema real, se implementa protección anti-spam en un spec futuro. |
| La `RESEND_API_KEY` debe manejarse solo en el servidor (`runtimeConfig`, no `public`) — si se expone accidentalmente al cliente, cualquiera podría enviar correos con la cuenta de Resend del proyecto. | El plan usa `runtimeConfig` privado (no `runtimeConfig.public`) explícitamente en el paso 2; verificar en la revisión de código que `resendApiKey` nunca se referencia desde código de cliente. |
| Si `RESEND_API_KEY` no está configurada en `.env` (p.ej. en un entorno nuevo tras clonar el repo), el endpoint fallará en cada intento de envío. | `.env.example` documenta la variable requerida; el bloque de error en el formulario comunica el fallo al usuario en vez de fallar silenciosamente. |
