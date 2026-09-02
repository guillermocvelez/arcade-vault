import type { Palette, SkinId } from "~/games/types";

export const SKINS: Record<SkinId, Palette> = {
  clasico: {
    bg: "#000000",
    fg: "#4ade80",
    fgDim: "#16a34a",
    accent: "#ef4444",
    accentAlt: "#facc15",
    danger: "#ef4444",
    grid: "rgba(255,255,255,0.06)",
    glowBlur: 0,
  },
  retro: {
    bg: "#04120b",
    fg: "#9bffc0",
    fgDim: "#3fdd85",
    accent: "#c8ffe0",
    accentAlt: "#3fdd85",
    danger: "#c8ffe0",
    grid: "rgba(155,255,192,0.08)",
    glowBlur: 4,
  },
  neon: {
    bg: "#05010d",
    fg: "#aaff00",
    fgDim: "#00e0ff",
    accent: "#ff2bd6",
    accentAlt: "#b6ff3b",
    danger: "#ff3b6b",
    grid: "#20124a",
    glowBlur: 8,
  },
};
