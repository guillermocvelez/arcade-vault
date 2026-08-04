<script setup lang="ts">
const { login } = useAuth();
const router = useRouter();

const tab = ref<"in" | "up">("in");
const user = ref("");
const pass = ref("");
const email = ref("");

const submit = () => {
  login({ name: (user.value || "PLAYER1").toUpperCase().slice(0, 10) });
  router.push("/");
};

const playAsGuest = () => {
  login(null);
  router.push("/");
};
</script>

<template>
  <div class="av-auth-wrap fade-in">
    <div class="auth-card">
      <div class="auth-header">
        <div class="mark"></div>
        <h2 class="neon-cyan">ARCADE VAULT</h2>
        <div class="mono" style="font-size: 11px; color: var(--ink-faint); letter-spacing: 0.16em; margin-top: 6px">
          ACCESO AL SISTEMA · v2.6
        </div>
      </div>

      <div class="auth-tabs">
        <button :class="{ on: tab === 'in' }" @click="tab = 'in'">INICIAR SESIÓN</button>
        <button :class="{ on: tab === 'up' }" @click="tab = 'up'">CREAR CUENTA</button>
      </div>

      <form @submit.prevent="submit">
        <div class="field">
          <label>Usuario</label>
          <input v-model="user" placeholder="px_kai" />
        </div>
        <div v-if="tab === 'up'" class="field slide-in">
          <label>Correo electrónico</label>
          <input v-model="email" type="email" placeholder="jugador@vault.gg" />
        </div>
        <div class="field">
          <label>Contraseña</label>
          <input v-model="pass" type="password" placeholder="••••••••" />
        </div>

        <button class="btn lg" type="submit" style="width: 100%; margin-top: 8px">
          {{ tab === "in" ? "ENTRAR AL VAULT" : "CREAR Y JUGAR" }}
        </button>
      </form>

      <button class="btn ghost" style="width: 100%; margin-top: 10px" @click="playAsGuest">JUGAR COMO INVITADO</button>

      <div class="auth-divider">O CONTINÚA CON</div>
      <div class="social">
        <button class="btn ghost" type="button">◆ GOOGLE</button>
        <button class="btn ghost" type="button">▣ GITHUB</button>
      </div>

      <div style="margin-top: 18px; text-align: center; font-size: 11px; color: var(--ink-faint); letter-spacing: 0.1em">
        AL ENTRAR ACEPTAS LOS TÉRMINOS DEL SALÓN ARCADE
      </div>
    </div>
  </div>
</template>
