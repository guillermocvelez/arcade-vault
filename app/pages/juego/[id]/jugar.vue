<script setup lang="ts">
import type { EngineSnapshot } from "~/games/types";
import { GAME_ENGINES } from "~/games/registry";

interface GameRef {
  pause(): void;
  resume(): void;
  restart(): void;
}

const route = useRoute();
const id = route.params.id as string;

const { data: games } = await useAsyncData("games", fetchGamesList);
const game = computed(() => games.value?.find((g) => g.id === id));

if (!game.value) {
  await navigateTo("/games");
}

const { user } = useAuth();
const { saveScore } = useScores();

const realGame = computed(() => GAME_ENGINES[id] ?? null);
const isRealGame = computed(() => !!realGame.value);
const gameRef = ref<GameRef | null>(null);

const score = ref(0);
const lives = ref(3);
const level = ref(1);
const extras = ref<EngineSnapshot["extras"]>(undefined);
const paused = ref(false);
const over = ref(false);
const name = ref(user.value ? user.value.name : "INVITADO");
const saved = ref(false);
const saving = ref(false);
const saveError = ref(false);

let timer: ReturnType<typeof setInterval> | null = null;

const clearTimer = () => {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
};

const startTimer = () => {
  clearTimer();
  if (isRealGame.value) return;
  if (!import.meta.client || over.value || paused.value) return;
  timer = setInterval(() => {
    score.value += Math.floor(10 + Math.random() * 90);
  }, 220);
};

watch([over, paused], startTimer, { immediate: true });

watch(score, (s) => {
  if (isRealGame.value) return;
  if (s > 0 && s % 2500 < 100) level.value += 1;
});

watch([paused, over], () => {
  if (!isRealGame.value) return;
  if (paused.value || over.value) gameRef.value?.pause();
  else gameRef.value?.resume();
});

onUnmounted(clearTimer);

const endGame = () => {
  over.value = true;
};

const onSnapshot = (s: EngineSnapshot) => {
  score.value = s.score;
  lives.value = s.lives;
  level.value = s.level;
  extras.value = s.extras;
};

const onGameOver = (finalScore: number) => {
  score.value = finalScore;
  over.value = true;
};

const restart = () => {
  if (isRealGame.value) gameRef.value?.restart();
  score.value = 0;
  lives.value = 3;
  level.value = 1;
  extras.value = undefined;
  paused.value = false;
  over.value = false;
  saved.value = false;
  saving.value = false;
  saveError.value = false;
};

const heartsDisplay = computed(() => "♥ ".repeat(lives.value).trim() || "—");

const onNameInput = (e: Event) => {
  const target = e.target as HTMLInputElement;
  name.value = target.value.toUpperCase().slice(0, 10);
};

const handleSave = async () => {
  if (!game.value) return;
  saving.value = true;
  saveError.value = false;
  try {
    await saveScore({ game: game.value.id, score: score.value, name: name.value });
    saved.value = true;
  } catch {
    saveError.value = true;
  } finally {
    saving.value = false;
  }
};
</script>

<template>
  <div v-if="game" class="av-player fade-in">
    <div class="player-hud">
      <div style="display: flex; gap: 24px; flex-wrap: wrap">
        <div class="hud-stat">
          <div class="l">Jugador</div>
          <div class="v" style="color: var(--ink)">{{ name }}</div>
        </div>
        <div class="hud-stat">
          <div class="l">Puntuación</div>
          <div class="v">{{ score.toLocaleString("es-ES") }}</div>
        </div>
        <div class="hud-stat lives">
          <div class="l">Vidas</div>
          <div class="v">{{ heartsDisplay }}</div>
        </div>
        <div class="hud-stat level">
          <div class="l">Nivel</div>
          <div class="v">{{ String(level).padStart(2, "0") }}</div>
        </div>
        <div v-for="e in extras" :key="e.label" class="hud-stat triple">
          <div class="l">{{ e.label }}</div>
          <div class="v">{{ e.value }}</div>
        </div>
      </div>
      <div class="hud-actions">
        <button class="btn yellow" @click="paused = !paused">
          {{ paused ? "REANUDAR" : "PAUSA" }}
        </button>
        <button class="btn magenta" @click="endGame">FIN</button>
        <NuxtLink :to="`/juego/${game.id}`" class="btn ghost">SALIR</NuxtLink>
      </div>
    </div>

    <div class="crt">
      <div class="crt-screen">
        <component
          :is="realGame"
          v-if="realGame"
          ref="gameRef"
          @snapshot="onSnapshot"
          @gameover="onGameOver"
        />
        <div v-else class="game-arena">
          <div class="grid-floor"></div>
          <div class="enemy e1"></div>
          <div class="enemy e2"></div>
          <div class="enemy e3"></div>
          <div class="player-ship"></div>
        </div>
        <div v-if="paused" class="crt-content" style="background: rgba(0, 0, 0, 0.6); z-index: 5">
          <div>
            <div class="pixel neon-yellow" style="font-size: 22px">EN PAUSA</div>
            <div
              class="mono"
              style="
                font-size: 11px;
                color: var(--ink-dim);
                margin-top: 10px;
                letter-spacing: 0.16em;
              "
            >
              PULSA REANUDAR PARA CONTINUAR
            </div>
          </div>
        </div>
      </div>
      <div class="crt-bottom">
        <span class="led">SEÑAL OK</span>
        <span>{{ game.title }} · CRT-83 · 60 HZ</span>
        <span>CARGA · 1MB</span>
      </div>
    </div>

    <div v-if="over" class="modal-bd">
      <div class="modal">
        <h2>FIN DEL JUEGO</h2>
        <div class="final-label">PUNTUACIÓN FINAL</div>
        <div class="final">{{ score.toLocaleString("es-ES") }}</div>
        <div v-if="!saved" class="input-row">
          <input :value="name" placeholder="TUS INICIALES" @input="onNameInput" />
          <button class="btn yellow" :disabled="saving" @click="handleSave">
            {{ saving ? "GUARDANDO..." : "GUARDAR PUNTUACIÓN" }}
          </button>
        </div>
        <div v-if="saveError" class="toast-error">
          ▸ NO SE PUDO GUARDAR. <button class="btn ghost" @click="handleSave">REINTENTAR</button>
        </div>
        <div v-if="saved" class="toast-saved">▸ PUNTUACIÓN GUARDADA_</div>
        <div class="actions">
          <button class="btn" @click="restart">JUGAR DE NUEVO</button>
          <NuxtLink to="/" class="btn magenta">VOLVER AL VAULT</NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>
