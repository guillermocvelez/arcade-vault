import { defineAsyncComponent, type Component } from "vue";

export const GAME_ENGINES: Record<string, Component> = {
  rocas: defineAsyncComponent(() => import("~/components/games/AsteroidsGame.vue")),
  caida: defineAsyncComponent(() => import("~/components/games/CaidaGame.vue")),
  "bloque-buster": defineAsyncComponent(() => import("~/components/games/BloqueBusterGame.vue")),
  serpentina: defineAsyncComponent(() => import("~/components/games/SerpentinaGame.vue")),
};
