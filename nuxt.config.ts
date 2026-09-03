// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  css: ["~/assets/css/main.css"],
  components: [{ path: "~/components/games", pathPrefix: false }, "~/components"],
  modules: ["@nuxt/eslint", "@nuxtjs/supabase"],
  eslint: {
    config: { stylistic: false }, // formato lo maneja Prettier
  },
  supabase: {
    redirectOptions: {
      login: "/auth",
      callback: "/",
      exclude: ["/*"],
    },
  },
  runtimeConfig: {
    resendApiKey: process.env.RESEND_API_KEY,
    resendToEmail: process.env.RESEND_TO_EMAIL || "guillermo.c.velez@gmail.com",
  },
  app: {
    head: {
      title: "Arcade Vault",
      htmlAttrs: { lang: "es" },
      meta: [
        { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
        { name: "theme-color", content: "#0a0a0f" },
      ],
    },
  },
});
