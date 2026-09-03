// Motor de Asteroids portado de references/started-games/02-asteroids/game.js
// Porte literal (clase por clase) a TypeScript, envuelto en AsteroidsEngine:
// sin globals de window/document del original — el canvas se recibe por
// constructor y los listeners de teclado se agregan/quitan en start()/stop().

import type {
  EngineSnapshot,
  GameEngine,
  Palette,
  Phase,
  SkinId,
  TouchControl,
} from "~/games/types";
import { SKINS } from "~/games/asteroids/skins";

export type { Phase, EngineSnapshot } from "~/games/types";

const W = 800;
const H = 600;

const POWERUP_DROP_CHANCE = 0.15;
const POWERUP_DURATION = 5;
const POWERUP_TTL = 12;
const TRIPLE_SPREAD = 0.18;

const RADII = [0, 16, 30, 50]; // por tamaño 1, 2, 3
const SPEEDS = [0, 85, 55, 32]; // velocidad base por tamaño
const POINTS = [0, 100, 50, 20]; // puntos por tamaño

const CONTROL_CODES = new Set(["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Space"]);

// ── Utils ─────────────────────────────────────────────────────────────────────
function wrap(v: number, max: number): number {
  return ((v % max) + max) % max;
}
function dist(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}
function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}
function randInt(min: number, max: number): number {
  return Math.floor(rand(min, max + 1));
}

/** Convierte un color de la paleta a `rgba(r,g,b,alpha)`. Acepta `#rgb` / `#rrggbb`.
 *  Si el color ya viene como `rgb(...)` / `rgba(...)` lo devuelve tal cual — en ese
 *  caso quien llama aplica el alpha vía `globalAlpha`. */
function rgbaFrom(color: string, alpha: number): string {
  if (!color.startsWith("#")) return color;
  let hex = color.slice(1);
  if (hex.length === 3) hex = hex[0]! + hex[0]! + hex[1]! + hex[1]! + hex[2]! + hex[2]!;
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha.toFixed(2)})`;
}

/** Glow del grupo "mundo": si la paleta lo pide (`glowBlur > 0`), fija
 *  `shadowBlur` con el color del propio elemento. No-op en `clasico`. */
function applyGlow(ctx: CanvasRenderingContext2D, palette: Palette, color: string): void {
  if (palette.glowBlur <= 0) return;
  ctx.shadowColor = color;
  ctx.shadowBlur = palette.glowBlur;
}

// ── Bullet ────────────────────────────────────────────────────────────────────
class Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  ttl: number;
  radius: number;
  dead: boolean;

  constructor(x: number, y: number, angle: number) {
    this.x = x;
    this.y = y;
    const SPEED = 520;
    this.vx = Math.cos(angle) * SPEED;
    this.vy = Math.sin(angle) * SPEED;
    this.ttl = 1.1;
    this.radius = 2;
    this.dead = false;
  }

  update(dt: number): void {
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw(ctx: CanvasRenderingContext2D, palette: Palette): void {
    ctx.fillStyle = palette.fg;
    applyGlow(ctx, palette, palette.fg);
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ── Asteroid ──────────────────────────────────────────────────────────────────
class Asteroid {
  x: number;
  y: number;
  size: number;
  radius: number;
  dead: boolean;
  vx: number;
  vy: number;
  rotSpeed: number;
  rot: number;
  verts: Array<[number, number]>;

  constructor(x: number, y: number, size = 3) {
    this.x = x;
    this.y = y;
    this.size = size;
    this.radius = RADII[size]!;
    this.dead = false;

    const angle = rand(0, Math.PI * 2);
    const speed = SPEEDS[size]! + rand(-15, 15);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.rotSpeed = rand(-1.2, 1.2);
    this.rot = rand(0, Math.PI * 2);

    // Polígono irregular
    const n = randInt(8, 13);
    this.verts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const r = this.radius * rand(0.6, 1.0);
      this.verts.push([Math.cos(a) * r, Math.sin(a) * r]);
    }
  }

  update(dt: number): void {
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
    this.rot += this.rotSpeed * dt;
  }

  split(): Asteroid[] {
    if (this.size <= 1) return [];
    return [
      new Asteroid(this.x, this.y, this.size - 1),
      new Asteroid(this.x, this.y, this.size - 1),
    ];
  }

  draw(ctx: CanvasRenderingContext2D, palette: Palette): void {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);
    ctx.strokeStyle = palette.fg;
    applyGlow(ctx, palette, palette.fg);
    ctx.lineWidth = 1.5;
    ctx.lineJoin = "round";
    ctx.beginPath();
    const first = this.verts[0]!;
    ctx.moveTo(first[0], first[1]);
    for (let i = 1; i < this.verts.length; i++) {
      const v = this.verts[i]!;
      ctx.lineTo(v[0], v[1]);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }
}

// ── PowerUp ───────────────────────────────────────────────────────────────────
class PowerUp {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  ttl: number;
  dead: boolean;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    const angle = rand(0, Math.PI * 2);
    const speed = rand(20, 40);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.radius = 12;
    this.ttl = POWERUP_TTL;
    this.dead = false;
  }

  update(dt: number): void {
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw(ctx: CanvasRenderingContext2D, palette: Palette): void {
    if (this.ttl < 2 && Math.floor(this.ttl * 8) % 2 === 0) return;
    const pulse = 0.85 + Math.sin(performance.now() / 150) * 0.15;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(Math.PI / 4);
    ctx.strokeStyle = palette.accent;
    applyGlow(ctx, palette, palette.accent);
    ctx.lineWidth = 2;
    const r = this.radius * pulse;
    ctx.strokeRect(-r, -r, r * 2, r * 2);
    ctx.restore();
    ctx.fillStyle = palette.accent;
    applyGlow(ctx, palette, palette.accent);
    ctx.font = "bold 12px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("3x", this.x, this.y);
  }
}

// ── Ship ──────────────────────────────────────────────────────────────────────
class Ship {
  x = 0;
  y = 0;
  angle = 0;
  vx = 0;
  vy = 0;
  radius = 12;
  thrusting = false;
  invincible = 0;
  shootCooldown = 0;
  dead = false;
  tripleShot = 0;

  constructor() {
    this.reset();
  }

  reset(): void {
    this.x = W / 2;
    this.y = H / 2;
    this.angle = -Math.PI / 2;
    this.vx = 0;
    this.vy = 0;
    this.radius = 12;
    this.thrusting = false;
    this.invincible = 3;
    this.shootCooldown = 0;
    this.dead = false;
  }

  update(dt: number, keys: Record<string, boolean>): void {
    if (this.dead) return;
    if (this.invincible > 0) this.invincible -= dt;
    if (this.shootCooldown > 0) this.shootCooldown -= dt;
    if (this.tripleShot > 0) this.tripleShot -= dt;

    const ROT = 3.5; // rad/s
    const THRUST = 260; // px/s²
    const DRAG = 0.987;

    if (keys["ArrowLeft"]) this.angle -= ROT * dt;
    if (keys["ArrowRight"]) this.angle += ROT * dt;

    this.thrusting = !!keys["ArrowUp"];
    if (this.thrusting) {
      this.vx += Math.cos(this.angle) * THRUST * dt;
      this.vy += Math.sin(this.angle) * THRUST * dt;
    }

    this.vx *= DRAG;
    this.vy *= DRAG;
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
  }

  tryShoot(): Bullet[] {
    if (this.shootCooldown > 0 || this.dead) return [];
    this.shootCooldown = 0.2;
    const NOSE = 21;
    const ox = this.x + Math.cos(this.angle) * NOSE;
    const oy = this.y + Math.sin(this.angle) * NOSE;
    if (this.tripleShot > 0) {
      return [
        new Bullet(ox, oy, this.angle - TRIPLE_SPREAD),
        new Bullet(ox, oy, this.angle),
        new Bullet(ox, oy, this.angle + TRIPLE_SPREAD),
      ];
    }
    return [new Bullet(ox, oy, this.angle)];
  }

  draw(ctx: CanvasRenderingContext2D, palette: Palette): void {
    if (this.dead) return;
    // Parpadeo durante invencibilidad de reaparición
    if (this.invincible > 0 && Math.floor(this.invincible * 8) % 2 === 0) return;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.strokeStyle = palette.fg;
    applyGlow(ctx, palette, palette.fg);
    ctx.lineWidth = 1.5;
    ctx.lineJoin = "round";

    // Silueta clásica: triángulo con muesca trasera
    ctx.beginPath();
    ctx.moveTo(20, 0); // nariz
    ctx.lineTo(-12, -9); // ala izquierda
    ctx.lineTo(-7, 0); // muesca trasera
    ctx.lineTo(-12, 9); // ala derecha
    ctx.closePath();
    ctx.stroke();

    // Llama del propulsor
    if (this.thrusting && Math.random() > 0.35) {
      ctx.save();
      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      ctx.moveTo(-8, -4);
      ctx.lineTo(-8 - rand(6, 14), 0);
      ctx.lineTo(-8, 4);
      ctx.strokeStyle = palette.accentAlt;
      applyGlow(ctx, palette, palette.accentAlt);
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore();
  }
}

// ── Partículas (explosión) ────────────────────────────────────────────────────
class Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  ttl: number;
  dead: boolean;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    const angle = rand(0, Math.PI * 2);
    const speed = rand(30, 130);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.life = rand(0.4, 1.1);
    this.ttl = this.life;
    this.dead = false;
  }

  update(dt: number): void {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw(ctx: CanvasRenderingContext2D, palette: Palette): void {
    const alpha = this.ttl / this.life;
    const stroke = rgbaFrom(palette.fg, alpha);
    const viaGlobalAlpha = stroke === palette.fg;
    if (viaGlobalAlpha) {
      ctx.save();
      ctx.globalAlpha *= alpha;
    }
    ctx.strokeStyle = stroke;
    applyGlow(ctx, palette, palette.fg);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x - this.vx * 0.05, this.y - this.vy * 0.05);
    ctx.stroke();
    if (viaGlobalAlpha) ctx.restore();
  }
}

// ── Motor ─────────────────────────────────────────────────────────────────────
export class AsteroidsEngine implements GameEngine {
  private readonly ctx: CanvasRenderingContext2D;

  private ship: Ship = new Ship();
  private bullets: Bullet[] = [];
  private asteroids: Asteroid[] = [];
  private particles: Particle[] = [];
  private powerUps: PowerUp[] = [];

  private score = 0;
  private lives = 3;
  private level = 1;
  private phase: Phase = "playing";
  private deadTimer = 0;
  private powerUpSpawned = false;
  private killsSinceSpawn = 0;

  private readonly keys: Record<string, boolean> = {};
  private readonly justPressed: Record<string, boolean> = {};

  private running = false;
  private paused = false;
  private rafId: number | null = null;
  private lastTime: number | null = null;

  private snapshotCb: ((s: EngineSnapshot) => void) | null = null;

  private palette: Palette;

  constructor(canvas: HTMLCanvasElement, skin: SkinId = "clasico") {
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("No se pudo obtener el contexto 2D del canvas");
    this.ctx = ctx;
    this.palette = SKINS[skin];
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.paused = false;
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
    this.initGame();
    this.lastTime = null;
    this.rafId = requestAnimationFrame(this.loop);
  }

  stop(): void {
    this.running = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
  }

  pause(): void {
    this.paused = true;
  }

  resume(): void {
    if (!this.paused) return;
    this.paused = false;
    this.lastTime = null; // evita un salto grande de dt tras reanudar
  }

  restart(): void {
    this.paused = false;
    this.initGame();
  }

  setSkin(id: SkinId): void {
    this.palette = SKINS[id];
    this.draw();
  }

  getSnapshot(): EngineSnapshot {
    return {
      score: this.score,
      lives: this.lives,
      level: this.level,
      phase: this.phase,
      extras:
        this.ship.tripleShot > 0
          ? [{ label: "3x", value: `${this.ship.tripleShot.toFixed(1)}s` }]
          : undefined,
    };
  }

  onSnapshot(cb: (s: EngineSnapshot) => void): void {
    this.snapshotCb = cb;
  }

  // ── Capa táctil ─────────────────────────────────────────────────────────────
  // Enruta al mismo estado de input que el teclado (`keys` / `justPressed`);
  // no registra listeners nuevos en window.
  private static readonly TOUCH_CODE: Record<string, string> = {
    "girar-izq": "ArrowLeft",
    "girar-der": "ArrowRight",
    propulsar: "ArrowUp",
    disparar: "Space",
  };

  readonly touchControls: TouchControl[] = [
    { id: "girar-izq", label: "◀", kind: "hold", side: "left" },
    { id: "girar-der", label: "▶", kind: "hold", side: "left" },
    { id: "propulsar", label: "▲", kind: "hold", side: "right" },
    { id: "disparar", label: "●", kind: "tap", side: "right" },
  ];

  pressControl(id: string): void {
    const code = AsteroidsEngine.TOUCH_CODE[id];
    if (!code) return;
    if (code === "Space") {
      // tap: pulso discreto, equivale al keydown que `update()` consume vía `pressed("Space")`
      this.justPressed["Space"] = true;
      return;
    }
    if (!this.keys[code]) this.justPressed[code] = true;
    this.keys[code] = true;
  }

  releaseControl(id: string): void {
    const code = AsteroidsEngine.TOUCH_CODE[id];
    if (!code || code === "Space") return;
    this.keys[code] = false;
  }

  // ── Input ───────────────────────────────────────────────────────────────────
  private readonly onKeyDown = (e: KeyboardEvent): void => {
    if (CONTROL_CODES.has(e.code)) e.preventDefault();
    if (!this.keys[e.code]) this.justPressed[e.code] = true;
    this.keys[e.code] = true;
  };

  private readonly onKeyUp = (e: KeyboardEvent): void => {
    this.keys[e.code] = false;
  };

  private pressed(code: string): boolean {
    const val = this.justPressed[code] ?? false;
    this.justPressed[code] = false;
    return val;
  }

  // ── Loop principal ─────────────────────────────────────────────────────────
  private readonly loop = (ts: number): void => {
    if (!this.running) return;
    if (!this.paused) {
      const dt = this.lastTime === null ? 0 : Math.min((ts - this.lastTime) / 1000, 0.05);
      this.lastTime = ts;
      this.update(dt);
    } else {
      this.lastTime = ts;
    }
    this.draw();
    this.snapshotCb?.(this.getSnapshot());
    this.rafId = requestAnimationFrame(this.loop);
  };

  // ── Estado del juego ───────────────────────────────────────────────────────
  private spawnAsteroids(count: number): void {
    const SAFE_DIST = 130;
    for (let i = 0; i < count; i++) {
      let x: number;
      let y: number;
      do {
        x = rand(0, W);
        y = rand(0, H);
      } while (Math.hypot(x - W / 2, y - H / 2) < SAFE_DIST);
      this.asteroids.push(new Asteroid(x, y, 3));
    }
  }

  private initGame(): void {
    this.ship = new Ship();
    this.bullets = [];
    this.asteroids = [];
    this.particles = [];
    this.powerUps = [];
    this.powerUpSpawned = false;
    this.killsSinceSpawn = 0;
    this.score = 0;
    this.lives = 3;
    this.level = 1;
    this.phase = "playing";
    this.spawnAsteroids(4);
  }

  private nextLevel(): void {
    this.level++;
    this.bullets = [];
    this.particles = [];
    this.powerUps = [];
    this.powerUpSpawned = false;
    this.killsSinceSpawn = 0;
    this.ship.reset();
    this.spawnAsteroids(3 + this.level);
  }

  private explode(x: number, y: number, count = 8): void {
    for (let i = 0; i < count; i++) this.particles.push(new Particle(x, y));
  }

  private killShip(): void {
    this.explode(this.ship.x, this.ship.y, 14);
    this.ship.dead = true;
    this.lives--;
    if (this.lives <= 0) {
      this.phase = "gameover";
    } else {
      this.phase = "dead";
      this.deadTimer = 2;
    }
  }

  // ── Update ──────────────────────────────────────────────────────────────────
  private update(dt: number): void {
    if (this.phase === "gameover") {
      // Reinicio nativo con Espacio desactivado: lo maneja el modal Vue.
      this.particles.forEach((p) => p.update(dt));
      this.particles = this.particles.filter((p) => !p.dead);
      return;
    }

    if (this.phase === "dead") {
      this.deadTimer -= dt;
      this.particles.forEach((p) => p.update(dt));
      this.particles = this.particles.filter((p) => !p.dead);
      this.asteroids.forEach((a) => a.update(dt));
      if (this.deadTimer <= 0) {
        this.phase = "playing";
        this.ship.reset();
      }
      return;
    }

    // Disparar
    if (this.pressed("Space")) {
      this.bullets.push(...this.ship.tryShoot());
    }

    this.ship.update(dt, this.keys);
    this.bullets.forEach((b) => b.update(dt));
    this.asteroids.forEach((a) => a.update(dt));
    this.particles.forEach((p) => p.update(dt));
    this.powerUps.forEach((p) => p.update(dt));

    this.bullets = this.bullets.filter((b) => !b.dead);
    this.particles = this.particles.filter((p) => !p.dead);
    this.powerUps = this.powerUps.filter((p) => !p.dead);

    for (const p of this.powerUps) {
      if (!p.dead && dist(this.ship, p) < this.ship.radius + p.radius) {
        p.dead = true;
        this.ship.tripleShot = POWERUP_DURATION;
      }
    }

    // Bala vs asteroide
    const newAsteroids: Asteroid[] = [];
    for (const b of this.bullets) {
      for (const a of this.asteroids) {
        if (!a.dead && !b.dead && dist(b, a) < a.radius) {
          b.dead = true;
          a.dead = true;
          this.score += POINTS[a.size]!;
          this.explode(a.x, a.y, a.size * 5);
          newAsteroids.push(...a.split());
          if (!this.powerUpSpawned) {
            this.killsSinceSpawn++;
            const guaranteed = this.killsSinceSpawn >= 5;
            if (guaranteed || Math.random() < POWERUP_DROP_CHANCE) {
              this.powerUps.push(new PowerUp(a.x, a.y));
              this.powerUpSpawned = true;
            }
          }
        }
      }
    }
    this.asteroids = this.asteroids.filter((a) => !a.dead).concat(newAsteroids);
    this.bullets = this.bullets.filter((b) => !b.dead);

    // Nave vs asteroide
    if (this.ship.invincible <= 0) {
      for (const a of this.asteroids) {
        if (dist(this.ship, a) < this.ship.radius + a.radius * 0.82) {
          this.killShip();
          break;
        }
      }
    }

    // Nivel completado
    if (this.asteroids.length === 0) this.nextLevel();
  }

  // ── Draw ────────────────────────────────────────────────────────────────────
  private drawLifeIcon(x: number, y: number): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-Math.PI / 2);
    ctx.strokeStyle = this.palette.fg;
    ctx.lineWidth = 1.2;
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(9, 0);
    ctx.lineTo(-6, -5);
    ctx.lineTo(-3, 0);
    ctx.lineTo(-6, 5);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }

  private drawHUD(): void {
    const ctx = this.ctx;
    ctx.fillStyle = this.palette.fg;
    ctx.font = "15px monospace";

    ctx.textAlign = "left";
    ctx.fillText(`SCORE  ${this.score}`, 14, 26);

    ctx.textAlign = "center";
    ctx.fillText(`NIVEL ${this.level}`, W / 2, 26);

    for (let i = 0; i < this.lives; i++) this.drawLifeIcon(W - 16 - i * 22, 18);

    if (this.ship.tripleShot > 0) {
      ctx.textAlign = "left";
      ctx.fillStyle = this.palette.accent;
      ctx.fillText(`3x  ${this.ship.tripleShot.toFixed(1)}s`, 14, 46);
    }
  }

  private drawOverlay(title: string, sub: string): void {
    const ctx = this.ctx;
    ctx.textAlign = "center";
    ctx.fillStyle = this.palette.fg;
    ctx.font = "bold 46px monospace";
    ctx.fillText(title, W / 2, H / 2 - 18);
    ctx.font = "18px monospace";
    ctx.fillStyle = this.palette.fgDim;
    ctx.fillText(sub, W / 2, H / 2 + 22);
  }

  private draw(): void {
    const ctx = this.ctx;
    const palette = this.palette;
    ctx.fillStyle = palette.bg;
    ctx.fillRect(0, 0, W, H);

    // Grupo "mundo": glow por `shadowBlur` si el skin lo pide (neon/retro).
    const worldGlow = palette.glowBlur > 0;
    if (worldGlow) ctx.save();
    this.particles.forEach((p) => p.draw(ctx, palette));
    this.asteroids.forEach((a) => a.draw(ctx, palette));
    this.powerUps.forEach((p) => p.draw(ctx, palette));
    this.bullets.forEach((b) => b.draw(ctx, palette));
    this.ship.draw(ctx, palette);
    if (worldGlow) ctx.restore();

    // HUD + overlay nunca llevan glow — legibilidad ante todo.
    ctx.shadowBlur = 0;
    this.drawHUD();

    if (this.phase === "gameover") this.drawOverlay("GAME OVER", `PUNTAJE: ${this.score}`);
  }
}
