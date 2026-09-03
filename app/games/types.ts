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

export interface EngineSnapshot {
  score: number;
  lives: number;
  level: number;
  phase: Phase;
  extras?: Array<{ label: string; value: string }>;
}

/** Un control táctil que el engine expone para que la capa Vue lo dibuje.
 *  `shape`/`dir` son sólo presentación (dónde pintar el control); no cambian
 *  la semántica de `pressControl`/`releaseControl`. */
export interface TouchControl {
  id: string; // identificador estable, p. ej. "girar-izq"
  label: string; // glifo a pintar, p. ej. "◀" "▲" "⟳" "●"
  kind: "hold" | "tap"; // hold = press+release mantenido; tap = pulso único
  side: "left" | "right"; // zona de la carcasa donde se agrupa
  shape: "dpad" | "round"; // dpad = brazo de la cruz direccional; round = botón de acción (diagonal A/B)
  dir?: "up" | "down" | "left" | "right"; // obligatorio si shape:"dpad"
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

  // Capa táctil (móvil). Ver §9 de engine-contract.md.
  readonly touchControls: TouchControl[]; // estático por engine; [] si no aplica
  pressControl(id: string): void; // id desconocido = no-op silencioso
  releaseControl(id: string): void; // id desconocido = no-op silencioso
}
