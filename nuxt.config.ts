// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    resendApiKey: process.env.RESEND_API_KEY,
    resendToEmail: process.env.RESEND_TO_EMAIL || 'guillermo.c.velez@gmail.com'
  },
  app: {
    head: {
      title: 'Arcade Vault',
      htmlAttrs: { lang: 'es' }
    }
  }
})
