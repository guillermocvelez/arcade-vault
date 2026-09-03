<script setup lang="ts">
import type { TouchControl } from "~/games/types";

// Capa de input táctil genérica para los engines reales (spec 10). Recibe el
// array `touchControls` del engine y emite `press` / `release` con el `id`. No
// conoce ningún juego: jugar.vue cablea los emits a
// `engine.pressControl` / `engine.releaseControl` y la monta en una barra bajo
// el CRT (no superpuesta al canvas).
const props = defineProps<{ controls: TouchControl[] }>();

const emit = defineEmits<{
  press: [id: string];
  release: [id: string];
}>();

const left = computed(() => props.controls.filter((c) => c.side === "left"));
const right = computed(() => props.controls.filter((c) => c.side === "right"));

// pointerId -> id del control `hold` que ese puntero mantiene presionado.
// Sirve para soltar (`release`) aunque el pointerup/pointercancel llegue con el
// dedo ya fuera del botón.
const held = new Map<number, string>();

function onPointerDown(control: TouchControl, e: PointerEvent) {
  e.preventDefault();
  emit("press", control.id);
  if (control.kind === "hold") {
    held.set(e.pointerId, control.id);
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  }
}

function releasePointer(e: PointerEvent) {
  const id = held.get(e.pointerId);
  if (id === undefined) return;
  held.delete(e.pointerId);
  emit("release", id);
}

onUnmounted(() => {
  // Suelta cualquier control que hubiera quedado presionado al desmontar.
  for (const id of held.values()) emit("release", id);
  held.clear();
});
</script>

<template>
  <div class="tc-bar" role="group" aria-label="Controles táctiles">
    <div class="tc-cluster left">
      <button
        v-for="c in left"
        :key="c.id"
        type="button"
        class="tc-btn"
        :data-kind="c.kind"
        :aria-label="c.id.replace(/-/g, ' ')"
        @pointerdown="onPointerDown(c, $event)"
        @pointerup="releasePointer"
        @pointercancel="releasePointer"
        @pointerleave="releasePointer"
        @contextmenu.prevent
      >
        {{ c.label }}
      </button>
    </div>

    <div class="tc-cluster right">
      <button
        v-for="c in right"
        :key="c.id"
        type="button"
        class="tc-btn"
        :data-kind="c.kind"
        :aria-label="c.id.replace(/-/g, ' ')"
        @pointerdown="onPointerDown(c, $event)"
        @pointerup="releasePointer"
        @pointercancel="releasePointer"
        @pointerleave="releasePointer"
        @contextmenu.prevent
      >
        {{ c.label }}
      </button>
    </div>
  </div>
</template>

<style scoped>
/* Sólo lo estrictamente conductual vive acá; el look (posición, borde neón,
   tamaño) está en main.css junto al resto de la paleta CRT — ver spec 10 §10. */
.tc-btn {
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
  -webkit-tap-highlight-color: transparent;
}
</style>
