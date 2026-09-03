<script setup lang="ts">
import { BloqueBusterEngine, type EngineSnapshot } from "~/games/bloque-buster/engine";
import type { SkinId } from "~/games/types";

const props = defineProps<{ skin?: SkinId }>();

const emit = defineEmits<{
  snapshot: [s: EngineSnapshot];
  gameover: [score: number];
}>();

const canvasEl = ref<HTMLCanvasElement | null>(null);
let engine: BloqueBusterEngine | null = null;
let prevPhase: EngineSnapshot["phase"] | null = null;

onMounted(() => {
  if (!canvasEl.value) return;
  engine = new BloqueBusterEngine(canvasEl.value, props.skin ?? "clasico");
  engine.onSnapshot((s) => {
    emit("snapshot", s);
    if (s.phase === "gameover" && prevPhase !== "gameover") emit("gameover", s.score);
    prevPhase = s.phase;
  });
  engine.start();
});

onUnmounted(() => {
  engine?.stop();
  engine = null;
});

watch(
  () => props.skin,
  (s) => {
    if (s) engine?.setSkin(s);
  },
);

const pause = () => engine?.pause();
const resume = () => engine?.resume();
const restart = () => engine?.restart();

// La capa táctil (spec 10) se renderiza en jugar.vue, en una barra bajo el CRT.
defineExpose({
  pause,
  resume,
  restart,
  touchControls: () => engine?.touchControls ?? [],
  pressControl: (id: string) => engine?.pressControl(id),
  releaseControl: (id: string) => engine?.releaseControl(id),
});
</script>

<template>
  <div class="game-stage">
    <canvas ref="canvasEl" width="800" height="600" class="game-canvas"></canvas>
  </div>
</template>
