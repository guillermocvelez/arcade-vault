<script setup lang="ts">
import { GAMES, CATS } from "~/data/games";
import type { Game } from "~/data/games";

const q = ref("");
const cat = ref<(typeof CATS)[number]>("TODOS");

const filtered = computed(() =>
  GAMES.filter(
    (g) => (cat.value === "TODOS" || g.cat === cat.value) && g.title.toLowerCase().includes(q.value.toLowerCase()),
  ),
);

const router = useRouter();
const goToDetail = (game: Game) => {
  router.push(`/juego/${game.id}`);
};
</script>

<template>
  <div class="fade-in">
    <section class="av-hero">
      <h1 class="flicker">ARCADE VAULT</h1>
      <div class="sub">INSERTA UNA MONEDA PARA JUGAR <span class="blink">_</span></div>
    </section>

    <div class="av-filters">
      <div class="av-search">
        <span class="ico">⌕</span>
        <input v-model="q" placeholder="Buscar un juego por nombre…" />
      </div>
      <div class="av-chips">
        <button v-for="c in CATS" :key="c" class="chip" :class="{ active: cat === c }" @click="cat = c">
          {{ c }}
        </button>
      </div>
    </div>

    <div class="av-grid">
      <GameCard v-for="g in filtered" :key="g.id" :game="g" @select="goToDetail" />
      <div
        v-if="filtered.length === 0"
        style="grid-column: 1 / -1; text-align: center; padding: 80px; color: var(--ink-faint)"
      >
        <div class="pixel" style="font-size: 14px; color: var(--magenta); margin-bottom: 12px">NO HAY RESULTADOS</div>
        <div>Intenta otra búsqueda o categoría.</div>
      </div>
    </div>
  </div>
</template>
