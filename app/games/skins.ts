import type { SkinId } from "~/games/types";

export const SKIN_STORAGE_KEY = "av:skin";

export const SKIN_IDS: ReadonlyArray<{ id: SkinId; label: string }> = [
  { id: "clasico", label: "CLÁSICO" },
  { id: "retro", label: "RETRO" },
  { id: "neon", label: "NEON" },
];

const VALID = new Set<SkinId>(["clasico", "retro", "neon"]);

/** Normaliza cualquier valor (p. ej. de localStorage) a un SkinId válido. */
export function resolveSkin(raw: string | null): SkinId {
  return raw && VALID.has(raw as SkinId) ? (raw as SkinId) : "clasico";
}
