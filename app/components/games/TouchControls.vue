<script setup lang="ts">
import type { TouchControl } from "~/games/types";

const props = defineProps<{ controls: TouchControl[] }>();

const emit = defineEmits<{
  press: [id: string];
  release: [id: string];
}>();

type Dir = "up" | "down" | "left" | "right";
const DIRS: Dir[] = ["up", "down", "left", "right"];

// Nombre accesible por control, indexado por id, con fallback al glifo (label).
// Es presentación: vive aquí, no en el tipo TouchControl ni en los *_TOUCH_CONTROLS.
const ARIA: Record<string, string> = {
  "girar-izq": "Girar a la izquierda",
  "girar-der": "Girar a la derecha",
  propulsar: "Propulsar",
  disparar: "Disparar",
  arriba: "Arriba",
  abajo: "Abajo",
  izq: "Izquierda",
  der: "Derecha",
  bajar: "Bajar",
  rotar: "Rotar pieza",
  soltar: "Soltar pieza",
};
const ariaFor = (c: TouchControl): string => ARIA[c.id] ?? c.label;

const dpadByDir = computed<Partial<Record<Dir, TouchControl>>>(() => {
  const map: Partial<Record<Dir, TouchControl>> = {};
  for (const c of props.controls) {
    if (c.shape === "dpad" && c.dir) map[c.dir] = c;
  }
  return map;
});

const hasDpad = computed(() => DIRS.some((d) => dpadByDir.value[d]));
const actions = computed(() => props.controls.filter((c) => c.shape === "round"));

// Punteros con un control "hold" activo, para garantizar el release aunque el
// pointerup / pointercancel llegue con el dedo ya fuera del botón.
const held = new Map<number, string>();

const onDown = (control: TouchControl, e: PointerEvent): void => {
  e.preventDefault();
  try {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  } catch {
    // pointer ya liberado / id no capturable — no bloquea el input
  }
  emit("press", control.id);
  if (control.kind === "hold") held.set(e.pointerId, control.id);
};

const onDpadDown = (d: Dir, e: PointerEvent): void => {
  const c = dpadByDir.value[d];
  if (c) onDown(c, e);
};

const onUp = (e: PointerEvent): void => {
  const id = held.get(e.pointerId);
  if (id === undefined) return;
  held.delete(e.pointerId);
  emit("release", id);
};

onUnmounted(() => {
  for (const id of held.values()) emit("release", id);
  held.clear();
});
</script>

<template>
  <div class="tc-shell" role="group" aria-label="Controles táctiles del juego">
    <div v-if="hasDpad" class="tc-dpad">
      <button
        v-for="d in DIRS"
        v-show="dpadByDir[d]"
        :key="d"
        type="button"
        class="tc-key"
        :class="`tc-${d}`"
        :aria-label="dpadByDir[d] ? ariaFor(dpadByDir[d]) : undefined"
        @pointerdown="onDpadDown(d, $event)"
        @pointerup="onUp"
        @pointercancel="onUp"
        @pointerleave="onUp"
        @contextmenu.prevent
      >
        <span>{{ dpadByDir[d]?.label }}</span>
      </button>
      <span class="tc-hub" />
    </div>

    <div v-if="actions.length" class="tc-actions" :class="{ single: actions.length === 1 }">
      <button
        v-for="(c, i) in actions"
        :key="c.id"
        type="button"
        class="tc-round"
        :class="`tc-pos-${i}`"
        :aria-label="ariaFor(c)"
        @pointerdown="onDown(c, $event)"
        @pointerup="onUp"
        @pointercancel="onUp"
        @pointerleave="onUp"
        @contextmenu.prevent
      >
        {{ c.label }}
      </button>
    </div>
  </div>
</template>
