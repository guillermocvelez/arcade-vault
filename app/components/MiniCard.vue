<script setup lang="ts">
import type { Game } from "~/data/games";

defineProps<{ game: Game }>();
const emit = defineEmits<{ select: [id: string] }>();
</script>

<template>
  <div class="mini-card" @click="emit('select', game.id)">
    <div class="mini-cover">
      <div :class="['cover-bg', game.cover]"></div>
    </div>
    <div class="mini-meta">
      <div class="mini-title">{{ game.title }}</div>
      <div class="mini-cat">{{ game.cat }}</div>
    </div>
  </div>
</template>
