export type Phase = "playing" | "dead" | "gameover";

export type SkinId = "clasico" | "retro" | "neon";

/** Paleta por roles semánticos. Cada engine mapea sus entidades a estos roles;
 *  ningún engine vuelve a escribir un literal de color. */
export interface Palette {
  bg: string; // relleno del canvas (casi negro en los 3 skins)
  fg: string; // trazo/relleno primario: siluetas de juego + texto HUD
  fgDim: string; // texto secundario (subtítulos de overlay), elementos tenues
  accent: string; // acento principal (power-ups, lecturas destacadas del HUD)
  accentAlt: string; // acento secundario (propulsores, estados puntuales)
  danger: string; // colisión / game over — reservado; lo usan otros juegos
  grid: string; // rejilla / fondo estructurado — reservado; lo usan otros juegos
  glowBlur: number; // 0 = sin glow. >0 => ctx.shadowBlur=glowBlur con
  //        ctx.shadowColor = color del propio elemento (nunca blanco)
}

/** Un botón táctil que el engine expone para que la capa Vue lo dibuje. */
export interface TouchControl {
  id: string; // identificador estable, p. ej. "girar-izq"
  label: string; // glifo/carácter a pintar en el botón, p. ej. "◀" "▲" "⟳" "●"
  kind: "hold" | "tap"; // hold = press+release mantenido; tap = pulso único
  side: "left" | "right"; // en qué cúmulo (esquina) del stage se agrupa
}

export interface EngineSnapshot {
  score: number;
  lives: number;
  level: number;
  phase: Phase;
  extras?: Array<{ label: string; value: string }>;
}

export interface GameEngine {
  start(): void;
  stop(): void;
  pause(): void;
  resume(): void;
  restart(): void;
  setSkin(id: SkinId): void;
  getSnapshot(): EngineSnapshot;
  onSnapshot(cb: (s: EngineSnapshot) => void): void;

  // NUEVO — capa táctil
  readonly touchControls: TouchControl[]; // estático por engine; [] si no aplica
  pressControl(id: string): void; // id desconocido = no-op silencioso
  releaseControl(id: string): void; // id desconocido = no-op silencioso
}
