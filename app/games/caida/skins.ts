import type { Palette, SkinId } from "~/games/types";

export const SKINS: Record<SkinId, Palette> = {
  clasico: {
    bg: "#000000",
    fg: "#ffffff",
    fgDim: "rgba(255,255,255,0.12)",
    accent: "#00ffff",
    accentAlt: "#ff8200",
    danger: "#ff4d4d",
    grid: "rgba(255,255,255,0.08)",
    glowBlur: 0,
  },
  retro: {
    bg: "#04120b",
    fg: "#c8ffe0",
    fgDim: "rgba(200,255,224,0.12)",
    accent: "#c8ffe0",
    accentAlt: "#4dff9b",
    danger: "#2bd47a",
    grid: "rgba(77,255,155,0.10)",
    glowBlur: 4,
  },
  neon: {
    bg: "#05010d",
    fg: "#d9f7ff",
    fgDim: "rgba(217,247,255,0.12)",
    accent: "#ff2bd6",
    accentAlt: "#b6ff3b",
    danger: "#ff3b6b",
    grid: "rgba(123,97,255,0.18)",
    glowBlur: 8,
  },
};

// Índice de tetrominó -> color. Índice 0 = celda vacía (drawBlock hace early-return).
export const PIECE_COLORS: Record<SkinId, readonly (string | null)[]> = {
  clasico: [
    null,
    "#4dd0e1",
    "#ffd54f",
    "#ba68c8",
    "#81c784",
    "#e57373",
    "#90caf9",
    "#ffb74d",
    "#9e9e9e",
  ],
  retro: [
    null,
    "#c8ffe0",
    "#4dff9b",
    "#2bd47a",
    "#4dff9b",
    "#1c9e57",
    "#2bd47a",
    "#1c9e57",
    "#c8ffe0",
  ],
  neon: [
    null,
    "#00f0ff",
    "#faff00",
    "#ff2bd6",
    "#39ff14",
    "#ff3b6b",
    "#4d8bff",
    "#ff9e00",
    "#b06bff",
  ],
};
