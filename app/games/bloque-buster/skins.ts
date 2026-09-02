import type { Palette, SkinId } from "~/games/types";

export type BrickKey = "red" | "yellow" | "cyan" | "magenta" | "hotpink" | "green" | "gray";

export const SKINS: Record<SkinId, Palette> = {
  clasico: {
    bg: "#000000",
    fg: "#ffffff",
    fgDim: "rgba(255,255,255,0.65)",
    accent: "#00ffff",
    accentAlt: "#ff69b4",
    danger: "#ff0000",
    grid: "#1e2130",
    glowBlur: 0,
  },
  retro: {
    bg: "#04120b",
    fg: "#c8ffe0",
    fgDim: "#4dff9b",
    accent: "#c8ffe0",
    accentAlt: "#2bd47a",
    danger: "#1c9e57",
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
    glowBlur: 8,
  },
};

export const BRICK_COLORS: Record<SkinId, Record<BrickKey, string>> = {
  clasico: {
    red: "#ff0000",
    yellow: "#ffff00",
    cyan: "#00ffff",
    magenta: "#ff00ff",
    hotpink: "#ff69b4",
    green: "#008000",
    gray: "#808080",
  },
  retro: {
    red: "#1c9e57",
    yellow: "#c8ffe0",
    cyan: "#4dff9b",
    magenta: "#2bd47a",
    hotpink: "#2bd47a",
    green: "#4dff9b",
    gray: "#1c9e57",
  },
  neon: {
    red: "#ff3b6b",
    yellow: "#faff00",
    cyan: "#00f0ff",
    magenta: "#ff2bd6",
    hotpink: "#ff6ad5",
    green: "#39ff14",
    gray: "#9a86ff",
  },
};
