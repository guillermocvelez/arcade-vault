<script setup lang="ts">
import { GAMES, seededScores } from "~/data/games";

const { user } = useAuth();

const tab = ref(GAMES[0].id);

const rows = computed(() => seededScores(tab.value.length * 23 + 7, 12));
const game = computed(() => GAMES.find((g) => g.id === tab.value));

const youRank = computed(() => (user.value ? Math.floor(8 + (tab.value.length % 4)) : null));
const youScore = computed(() => (user.value ? (rows.value[5]?.score ?? 0) - 2400 : null));

const trClass = (i: number) => ["tr", i === 0 ? "top1" : i === 1 ? "top2" : i === 2 ? "top3" : ""];
</script>

<template>
  <div class="av-hall fade-in">
    <div class="hall-head">
      <h1>SALÓN DE LA FAMA</h1>
      <p class="pixel" style="font-size: 10px">LOS NOMBRES QUE NUNCA SE BORRAN DE LA PANTALLA</p>
    </div>

    <div class="hall-tabs">
      <button v-for="g in GAMES" :key="g.id" class="chip" :class="{ active: tab === g.id }" @click="tab = g.id">
        {{ g.title }}
      </button>
    </div>

    <div class="podium">
      <div class="podium-slot silver">
        <div class="rank-num">02</div>
        <div class="name">{{ rows[1].name }}</div>
        <div class="score">{{ rows[1].score.toLocaleString("es-ES") }}</div>
        <div class="date">{{ rows[1].date }}</div>
      </div>
      <div class="podium-slot gold">
        <div class="pixel" style="font-size: 9px; color: var(--gold); letter-spacing: 0.18em">CAMPEÓN</div>
        <div class="rank-num" style="font-size: 36px; margin-top: 4px">01</div>
        <div class="name">{{ rows[0].name }}</div>
        <div class="score" style="font-size: 20px">{{ rows[0].score.toLocaleString("es-ES") }}</div>
        <div class="date">{{ rows[0].date }}</div>
      </div>
      <div class="podium-slot bronze">
        <div class="rank-num">03</div>
        <div class="name">{{ rows[2].name }}</div>
        <div class="score">{{ rows[2].score.toLocaleString("es-ES") }}</div>
        <div class="date">{{ rows[2].date }}</div>
      </div>
    </div>

    <div class="hall-table">
      <div class="th">
        <div>RANGO</div>
        <div>JUGADOR</div>
        <div>PUNTUACIÓN</div>
        <div>FECHA</div>
      </div>
      <div v-for="(r, i) in rows" :key="r.name + i" :class="trClass(i)" :style="{ animationDelay: `${i * 50}ms` }">
        <div class="rk">#{{ String(r.rank).padStart(2, "0") }}</div>
        <div class="pl">{{ r.name }}</div>
        <div class="sc">{{ r.score.toLocaleString("es-ES") }}</div>
        <div class="dt">{{ r.date }}</div>
      </div>
      <template v-if="user">
        <div class="tr you-label">▸ TU MEJOR MARCA EN {{ game?.title }}</div>
        <div class="tr you" :style="{ animationDelay: `${rows.length * 50 + 50}ms` }">
          <div class="rk" style="color: var(--yellow)">#{{ String(youRank).padStart(2, "0") }}</div>
          <div class="pl" style="color: var(--yellow)">{{ user.name }}</div>
          <div class="sc" style="color: var(--yellow); text-shadow: 0 0 6px rgba(245, 255, 0, 0.5)">
            {{ (youScore || 9999).toLocaleString("es-ES") }}
          </div>
          <div class="dt">11/05/2026</div>
        </div>
      </template>
    </div>

    <div style="text-align: center; margin-top: 32px">
      <NuxtLink to="/" class="btn lg">VOLVER A LA BIBLIOTECA</NuxtLink>
    </div>
  </div>
</template>
