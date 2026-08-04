<script setup lang="ts">
import type { Game } from "~/data/games";

const props = defineProps<{ game: Game }>();
const emit = defineEmits<{ select: [game: Game] }>();

const cardRef = ref<HTMLElement | null>(null);

const onMove = (e: MouseEvent) => {
  const el = cardRef.value;
  if (!el) return;
  const r = el.getBoundingClientRect();
  const px = (e.clientX - r.left) / r.width - 0.5;
  const py = (e.clientY - r.top) / r.height - 0.5;
  el.style.transform = `translateY(-6px) rotateX(${-py * 6}deg) rotateY(${px * 8}deg)`;
};

const onLeave = () => {
  const el = cardRef.value;
  if (!el) return;
  el.style.transform = "";
};

const colorClass = computed(() => {
  if (props.game.color === "magenta") return "magenta";
  if (props.game.color === "yellow") return "yellow";
  return "";
});

const bestScore = computed(() => props.game.best.toLocaleString("es-ES"));
</script>

<template>
  <div ref="cardRef" class="card" @mousemove="onMove" @mouseleave="onLeave" @click="emit('select', game)">
    <div class="cover">
      <div :class="['cover-bg', game.cover]"></div>
      <div class="label">{{ game.cat }}</div>
    </div>
    <div class="meta">
      <div class="title">{{ game.title }}</div>
      <div class="desc">{{ game.short }}</div>
      <div class="row">
        <div class="score-badge">
          <span>MEJOR PUNTUACIÓN</span>
          <b>{{ bestScore }}</b>
        </div>
        <button class="btn" :class="colorClass" @click.stop="emit('select', game)">JUGAR</button>
      </div>
    </div>
  </div>
</template>
