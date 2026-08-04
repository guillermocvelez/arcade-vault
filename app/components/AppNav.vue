<script setup lang="ts">
const { user, signOut } = useAuth();
const route = useRoute();
const open = ref(false);

const isActive = (name: "inicio" | "biblioteca" | "salon" | "acerca" | "auth") => {
  if (name === "inicio") return route.path === "/";
  if (name === "biblioteca") return route.path === "/games" || route.path.startsWith("/juego");
  if (name === "salon") return route.path === "/salon-de-la-fama";
  if (name === "acerca") return route.path === "/acerca-de";
  return route.path === "/auth";
};

const close = () => {
  open.value = false;
};
</script>

<template>
  <nav class="av-nav">
    <NuxtLink to="/" class="logo">
      <div class="logo-mark"></div>
      <div class="logo-text neon-cyan">ARCADE <span class="neon-magenta">VAULT</span></div>
    </NuxtLink>
    <div class="links">
      <NuxtLink to="/" :class="{ active: isActive('inicio') }">Inicio</NuxtLink>
      <NuxtLink to="/games" :class="{ active: isActive('biblioteca') }">Biblioteca</NuxtLink>
      <NuxtLink to="/salon-de-la-fama" :class="{ active: isActive('salon') }">Salón de la Fama</NuxtLink>
      <NuxtLink to="/acerca-de" :class="{ active: isActive('acerca') }">Acerca de</NuxtLink>
    </div>
    <div class="spacer"></div>
    <div class="coin-counter">
      <span class="coin"></span>
      <span>CRÉDITOS · 03</span>
    </div>
    <button v-if="user" class="btn ghost auth-btn" @click="signOut">{{ user.name }} ▾</button>
    <NuxtLink v-else to="/auth" class="btn auth-btn">Iniciar Sesión</NuxtLink>
    <button class="btn ghost hamburger" aria-label="Menú" @click="open = true">≡</button>
  </nav>

  <div class="av-mobile-backdrop" :class="{ open }" @click="close"></div>
  <aside class="av-mobile-panel" :class="{ open }">
    <div class="pixel neon-cyan" style="font-size: 11px; margin-bottom: 16px">MENÚ</div>
    <NuxtLink to="/" :class="{ active: isActive('inicio') }" @click="close">Inicio</NuxtLink>
    <NuxtLink to="/games" :class="{ active: isActive('biblioteca') }" @click="close">Biblioteca</NuxtLink>
    <NuxtLink to="/salon-de-la-fama" :class="{ active: isActive('salon') }" @click="close">Salón de la Fama</NuxtLink>
    <NuxtLink to="/acerca-de" :class="{ active: isActive('acerca') }" @click="close">Acerca de</NuxtLink>
    <NuxtLink to="/auth" :class="{ active: isActive('auth') }" @click="close">{{ user ? "Cuenta" : "Iniciar Sesión" }}</NuxtLink>
    <div style="flex: 1"></div>
    <div class="pixel" style="font-size: 9px; color: var(--ink-faint); letter-spacing: 0.16em">CRÉDITOS · 03</div>
  </aside>
</template>
