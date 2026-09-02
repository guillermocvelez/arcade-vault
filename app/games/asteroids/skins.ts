import type { Palette, SkinId } from "~/games/types";

export const SKINS: Record<SkinId, Palette> = {
  clasico: {
    bg: "#000000",
    fg: "#ffffff",
    fgDim: "rgba(255,255,255,0.65)",
    accent: "#00ffff",
    accentAlt: "#ff8200",
    danger: "#ff4d4d",
    grid: "#1e2130",
    glowBlur: 0,
  },
  retro: {
    bg: "#04120b",
    fg: "#4dff9b",
    fgDim: "#33b978",
    accent: "#c8ffe0",
    accentAlt: "#2bd47a",
    danger: "#7dffb5",
    grid: "#0c3a24",
    glowBlur: 4,
  },
  neon: {
    bg: "#05010d",
    fg: "#00f0ff",
    fgDim: "#9a86ff",
    accent: "#ff2bd6",
    accentAlt: "#b6ff3b",
    danger: "#ff3b6b",
    grid: "#20124a",
    glowBlur: 12,
  },
};
