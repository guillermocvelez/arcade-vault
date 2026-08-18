<script setup lang="ts">
import { AsteroidsEngine, type EngineSnapshot } from "~/games/asteroids/engine";

const emit = defineEmits<{
  snapshot: [s: EngineSnapshot];
  gameover: [score: number];
}>();

const canvasEl = ref<HTMLCanvasElement | null>(null);
let engine: AsteroidsEngine | null = null;
let prevPhase: EngineSnapshot["phase"] | null = null;

onMounted(() => {
  if (!canvasEl.value) return;
  engine = new AsteroidsEngine(canvasEl.value);
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

const pause = () => engine?.pause();
const resume = () => engine?.resume();
const restart = () => engine?.restart();

defineExpose({ pause, resume, restart });
</script>

<template>
  <div class="asteroids-stage">
    <canvas ref="canvasEl" width="800" height="600" class="asteroids-canvas"></canvas>
  </div>
</template>
