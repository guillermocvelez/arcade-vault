<script setup lang="ts">
const { fetchTop } = useScores();

const { data: games } = await useAsyncData("games", fetchGamesList);

const tab = ref(games.value?.[0]?.id ?? "");

const { data: rows } = await useAsyncData("hall-scores", () => fetchTop(tab.value, 12), {
  watch: [tab],
});

const game = computed(() => games.value?.find((g) => g.id === tab.value));

const trClass = (i: number) => ["tr", i === 0 ? "top1" : i === 1 ? "top2" : i === 2 ? "top3" : ""];
</script>

<template>
  <div class="av-hall fade-in">
    <div class="hall-head">
      <h1>SALÓN DE LA FAMA</h1>
      <p class="pixel" style="font-size: 10px">LOS NOMBRES QUE NUNCA SE BORRAN DE LA PANTALLA</p>
    </div>

    <div class="hall-tabs">
      <button
        v-for="g in games"
        :key="g.id"
        class="chip"
        :class="{ active: tab === g.id }"
        @click="tab = g.id"
      >
        {{ g.title }}
      </button>
    </div>

    <div v-if="rows && rows.length >= 3" class="podium">
      <div class="podium-slot silver">
        <div class="rank-num">02</div>
        <div class="name">{{ rows[1].name }}</div>
        <div class="score">{{ rows[1].score.toLocaleString("es-ES") }}</div>
        <div class="date">{{ rows[1].date }}</div>
      </div>
      <div class="podium-slot gold">
        <div class="pixel" style="font-size: 9px; color: var(--gold); letter-spacing: 0.18em">
          CAMPEÓN
        </div>
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
      <div
        v-for="(r, i) in rows"
        :key="r.name + i"
        :class="trClass(i)"
        :style="{ animationDelay: `${i * 50}ms` }"
      >
        <div class="rk">#{{ String(r.rank).padStart(2, "0") }}</div>
        <div class="pl">{{ r.name }}</div>
        <div class="sc">{{ r.score.toLocaleString("es-ES") }}</div>
        <div class="dt">{{ r.date }}</div>
      </div>
      <div
        v-if="!rows || rows.length === 0"
        class="tr"
        style="justify-content: center; color: var(--ink-faint)"
      >
        AÚN NO HAY PUNTUACIONES PARA {{ game?.title }}
      </div>
    </div>

    <div style="text-align: center; margin-top: 32px">
      <NuxtLink to="/" class="btn lg">VOLVER A LA BIBLIOTECA</NuxtLink>
    </div>
  </div>
</template>
