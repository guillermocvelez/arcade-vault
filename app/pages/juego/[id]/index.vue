<script setup lang="ts">
import { GAMES, seededScores } from "~/data/games";

definePageMeta({
  middleware: [
    (to) => {
      if (!GAMES.some((g) => g.id === to.params.id)) return navigateTo("/");
    },
  ],
});

const route = useRoute();
const id = route.params.id as string;

const game = computed(() => GAMES.find((g) => g.id === id));
const scores = computed(() => seededScores(id.length * 17 + 3, 10));

const rowClass = (i: number) => ["lb-row", i === 0 ? "top1" : i === 1 ? "top2" : i === 2 ? "top3" : ""];
</script>

<template>
  <div v-if="game" class="av-detail fade-in">
    <div>
      <div class="detail-cover">
        <div :class="['cover-bg', game.cover]"></div>
      </div>
      <div class="detail-info" style="margin-top: 20px">
        <div class="detail-tags">
          <span>{{ game.cat }}</span>
          <span>1 JUGADOR</span>
          <span>TECLADO / TÁCTIL</span>
          <span>RETRO 1985</span>
        </div>
        <h2 class="neon-cyan">{{ game.title }}</h2>
        <p>{{ game.long }}</p>
        <div class="stat-strip">
          <div>
            <div class="l">Partidas</div>
            <div class="v">{{ game.plays }}</div>
          </div>
          <div>
            <div class="l">Mejor global</div>
            <div class="v" style="color: var(--magenta); text-shadow: 0 0 6px rgba(255, 0, 110, 0.5)">
              {{ game.best.toLocaleString("es-ES") }}
            </div>
          </div>
          <div>
            <div class="l">Dificultad</div>
            <div class="v" style="color: var(--yellow); text-shadow: 0 0 6px rgba(245, 255, 0, 0.5)">★ ★ ★ ☆ ☆</div>
          </div>
        </div>
        <div class="detail-actions">
          <NuxtLink :to="`/juego/${game.id}/jugar`" class="btn xl pulse">▶ JUGAR AHORA</NuxtLink>
          <NuxtLink to="/" class="btn ghost lg">VOLVER AL VAULT</NuxtLink>
        </div>
      </div>
    </div>

    <aside>
      <div class="leaderboard">
        <h3>MEJORES PUNTUACIONES</h3>
        <div v-for="(r, i) in scores" :key="r.name" :class="rowClass(i)">
          <div class="rk">#{{ String(r.rank).padStart(2, "0") }}</div>
          <div class="pl">
            {{ r.name }}
            <div style="font-size: 10px; color: var(--ink-faint); letter-spacing: 0.1em">{{ r.date }}</div>
          </div>
          <div class="sc">{{ r.score.toLocaleString("es-ES") }}</div>
        </div>
      </div>
    </aside>
  </div>
</template>
