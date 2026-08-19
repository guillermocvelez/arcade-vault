import { defineAsyncComponent, type Component } from "vue";

export const GAME_ENGINES: Record<string, Component> = {
  rocas: defineAsyncComponent(() => import("~/components/games/AsteroidsGame.vue")),
  caida: defineAsyncComponent(() => import("~/components/games/CaidaGame.vue")),
};
