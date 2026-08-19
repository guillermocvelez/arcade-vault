// Motor de Arkanoid portado de references/started-games/04-arkanoid/game.js + levels.js
// Porte literal (función por función) a TypeScript, envuelto en BloqueBusterEngine:
// sin globals de window/document del original — el canvas se recibe por constructor
// y los listeners de teclado/mouse se agregan/quitan en start()/stop(). Bloques,
// paddle, bola y explosiones se dibujan con fillRect/arc en vez de drawImage contra
// el spritesheet original (sin sprites ni audio, ver spec 08 — Decisiones).

import type { EngineSnapshot, GameEngine, Phase } from "~/games/types";

export type { Phase, EngineSnapshot } from "~/games/types";

const W = 800;
const H = 600;

const PADDLE_SPEED = 400;
const PADDLE_W = 81;
const PADDLE_H = 14;
const PADDLE_Y = 560;

const BALL_W = 16;
const BALL_H = 16;

const BLOCK_COLS = 10;
const BLOCK_ROWS = 6;
const BLOCK_W = 64;
const BLOCK_H = 24;
const BLOCKS_ORIGIN_X = (W - BLOCK_COLS * BLOCK_W) / 2;
const BLOCKS_ORIGIN_Y = 80;

const BASE_BALL_VX = 200;
const BASE_BALL_VY = -300;

const EXPLOSION_DURATION = 150; // ms, igual que el original

const CONTROL_CODES = new Set(["ArrowLeft", "ArrowRight"]);

interface LevelDef {
  speed: number;
  blocks: Array<{ col: number; row: number; color: string }>;
}

const LEVELS: LevelDef[] = (() => {
  const rowColors1 = ["red", "yellow", "cyan", "magenta", "hotpink", "green"];
  const rowColors2 = ["gray", "cyan", "hotpink", "yellow", "magenta", "green"];
  const rowColors4 = ["cyan", "magenta", "green", "yellow", "hotpink", "red"];

  const l1: LevelDef["blocks"] = [];
  for (let row = 0; row < BLOCK_ROWS; row++)
    for (let col = 0; col < BLOCK_COLS; col++) l1.push({ col, row, color: rowColors1[row]! });

  const l2: LevelDef["blocks"] = [];
  const pyStart = [4, 3, 2, 1, 0, 0];
  const pyEnd = [5, 6, 7, 8, 9, 9];
  for (let row = 0; row < BLOCK_ROWS; row++)
    for (let col = pyStart[row]!; col <= pyEnd[row]!; col++)
      l2.push({ col, row, color: rowColors2[row]! });

  const l3: LevelDef["blocks"] = [];
  for (let row = 0; row < BLOCK_ROWS; row++)
    for (let col = 0; col < BLOCK_COLS; col++)
      if ((col + row) % 2 === 0) l3.push({ col, row, color: row < 3 ? "yellow" : "magenta" });

  const gaps4 = [
    [2, 5, 8],
    [0, 4, 7, 9],
    [1, 3, 6],
    [2, 5, 8, 9],
    [0, 4, 7],
    [1, 3, 6, 9],
  ];
  const l4: LevelDef["blocks"] = [];
  for (let row = 0; row < BLOCK_ROWS; row++)
    for (let col = 0; col < BLOCK_COLS; col++)
      if (!gaps4[row]!.includes(col)) l4.push({ col, row, color: rowColors4[row]! });

  const l5: LevelDef["blocks"] = [];
  for (let row = 0; row < BLOCK_ROWS; row++)
    for (let col = 0; col < BLOCK_COLS; col++) {
      const isFrame = col === 0 || col === 9 || row === 0 || row === 5;
      const isCross = col === 4 || row === 2;
      if (isFrame || isCross)
        l5.push({ col, row, color: isCross && !isFrame ? "hotpink" : "cyan" });
    }

  return [
    { speed: 1.0, blocks: l1 },
    { speed: 1.1, blocks: l2 },
    { speed: 1.21, blocks: l3 },
    { speed: 1.33, blocks: l4 },
    { speed: 1.46, blocks: l5 },
  ];
})();

interface Paddle {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Ball {
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
}

interface Block {
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  alive: boolean;
}

interface ExplosionParticle {
  angle: number;
  speed: number;
}

interface Explosion {
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  elapsed: number;
  particles: ExplosionParticle[];
}

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function collideAABB(ball: Ball, box: { x: number; y: number; w: number; h: number }): boolean {
  return (
    ball.x < box.x + box.w &&
    ball.x + ball.w > box.x &&
    ball.y < box.y + box.h &&
    ball.y + ball.h > box.y
  );
}

export class BloqueBusterEngine implements GameEngine {
  private readonly ctx: CanvasRenderingContext2D;
  private readonly canvas: HTMLCanvasElement;

  private paddle: Paddle = { x: 0, y: PADDLE_Y, w: PADDLE_W, h: PADDLE_H };
  private ball: Ball = { x: 0, y: 0, w: BALL_W, h: BALL_H, vx: BASE_BALL_VX, vy: BASE_BALL_VY };
  private blocks: Block[] = [];
  private explosions: Explosion[] = [];

  private score = 0;
  private lives = 3;
  private currentLevel = 1;
  private phase: Phase = "playing";
  private won = false;

  private readonly keys: Record<string, boolean> = {};

  private running = false;
  private paused = false;
  private rafId: number | null = null;
  private lastTime: number | null = null;

  private snapshotCb: ((s: EngineSnapshot) => void) | null = null;

  constructor(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("No se pudo obtener el contexto 2D del canvas");
    this.ctx = ctx;
    this.canvas = canvas;
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.paused = false;
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
    this.canvas.addEventListener("mousemove", this.onMouseMove);
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
    this.canvas.removeEventListener("mousemove", this.onMouseMove);
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

  getSnapshot(): EngineSnapshot {
    return {
      score: this.score,
      lives: this.lives,
      level: this.currentLevel,
      phase: this.phase,
      extras: this.won ? [{ label: "ESTADO", value: "¡COMPLETADO!" }] : undefined,
    };
  }

  onSnapshot(cb: (s: EngineSnapshot) => void): void {
    this.snapshotCb = cb;
  }

  // ── Input ───────────────────────────────────────────────────────────────────
  private readonly onKeyDown = (e: KeyboardEvent): void => {
    if (CONTROL_CODES.has(e.code)) e.preventDefault();
    if (e.code === "ArrowLeft") this.keys["ArrowLeft"] = true;
    if (e.code === "ArrowRight") this.keys["ArrowRight"] = true;
  };

  private readonly onKeyUp = (e: KeyboardEvent): void => {
    if (e.code === "ArrowLeft") this.keys["ArrowLeft"] = false;
    if (e.code === "ArrowRight") this.keys["ArrowRight"] = false;
  };

  private readonly onMouseMove = (e: MouseEvent): void => {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const mouseX = (e.clientX - rect.left) * scaleX;
    this.paddle.x = Math.max(0, Math.min(W - this.paddle.w, mouseX - this.paddle.w / 2));
  };

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
  private initPaddle(): void {
    this.paddle.x = (W - this.paddle.w) / 2;
  }

  private initBall(): void {
    const speed = LEVELS[this.currentLevel - 1]!.speed;
    this.ball.x = this.paddle.x + (this.paddle.w - this.ball.w) / 2;
    this.ball.y = this.paddle.y - this.ball.h;
    this.ball.vx = BASE_BALL_VX * speed;
    this.ball.vy = BASE_BALL_VY * speed;
  }

  private loadLevel(n: number): void {
    this.currentLevel = n;
    const level = LEVELS[n - 1]!;
    this.blocks = level.blocks.map((b) => ({
      x: BLOCKS_ORIGIN_X + b.col * BLOCK_W,
      y: BLOCKS_ORIGIN_Y + b.row * BLOCK_H,
      w: BLOCK_W,
      h: BLOCK_H,
      color: b.color,
      alive: true,
    }));
    this.explosions = [];
    this.initBall();
  }

  private initGame(): void {
    this.score = 0;
    this.lives = 3;
    this.phase = "playing";
    this.won = false;
    this.initPaddle();
    this.loadLevel(1);
  }

  private spawnExplosion(block: Block): void {
    const particles: ExplosionParticle[] = [];
    for (let i = 0; i < 8; i++) {
      particles.push({ angle: rand(0, Math.PI * 2), speed: rand(40, 120) });
    }
    this.explosions.push({
      x: block.x,
      y: block.y,
      w: block.w,
      h: block.h,
      color: block.color,
      elapsed: 0,
      particles,
    });
  }

  // ── Update ──────────────────────────────────────────────────────────────────
  private update(dt: number): void {
    if (this.phase !== "playing") return;

    // Paddle (teclado)
    if (this.keys["ArrowLeft"]) this.paddle.x = Math.max(0, this.paddle.x - PADDLE_SPEED * dt);
    if (this.keys["ArrowRight"])
      this.paddle.x = Math.min(W - this.paddle.w, this.paddle.x + PADDLE_SPEED * dt);

    // Ball movement
    this.ball.x += this.ball.vx * dt;
    this.ball.y += this.ball.vy * dt;

    // Wall bounces (left, right, top)
    if (this.ball.x <= 0) {
      this.ball.x = 0;
      this.ball.vx = Math.abs(this.ball.vx);
    }
    if (this.ball.x + this.ball.w >= W) {
      this.ball.x = W - this.ball.w;
      this.ball.vx = -Math.abs(this.ball.vx);
    }
    if (this.ball.y <= 0) {
      this.ball.y = 0;
      this.ball.vy = Math.abs(this.ball.vy);
    }

    // Paddle bounce
    if (
      this.ball.vy > 0 &&
      this.ball.x + this.ball.w > this.paddle.x &&
      this.ball.x < this.paddle.x + this.paddle.w &&
      this.ball.y + this.ball.h >= this.paddle.y &&
      this.ball.y + this.ball.h <= this.paddle.y + this.paddle.h + 8
    ) {
      this.ball.y = this.paddle.y - this.ball.h;
      this.ball.vy = -Math.abs(this.ball.vy);
    }

    // Block collisions (uno por frame, como el original)
    for (const block of this.blocks) {
      if (!block.alive) continue;
      if (collideAABB(this.ball, block)) {
        block.alive = false;
        this.spawnExplosion(block);
        this.score += 10;
        this.ball.vy = -this.ball.vy;
        if (this.blocks.every((b) => !b.alive)) {
          if (this.currentLevel < 5) {
            this.loadLevel(this.currentLevel + 1);
          } else {
            this.won = true;
            this.phase = "gameover";
          }
        }
        break;
      }
    }

    // Explosions
    for (const exp of this.explosions) exp.elapsed += dt * 1000;
    this.explosions = this.explosions.filter((exp) => exp.elapsed < EXPLOSION_DURATION);

    // Ball lost
    if (this.ball.y > H) {
      this.lives--;
      if (this.lives <= 0) {
        this.lives = 0;
        this.phase = "gameover";
      } else {
        this.initBall();
      }
    }
  }

  // ── Draw ────────────────────────────────────────────────────────────────────
  private draw(): void {
    const ctx = this.ctx;
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, W, H);

    for (const block of this.blocks) {
      if (!block.alive) continue;
      ctx.fillStyle = block.color;
      ctx.fillRect(block.x, block.y, block.w, block.h);
    }

    for (const exp of this.explosions) {
      const t = Math.min(exp.elapsed / EXPLOSION_DURATION, 1);
      const cx = exp.x + exp.w / 2;
      const cy = exp.y + exp.h / 2;

      ctx.globalAlpha = 1 - t;
      ctx.fillStyle = "#fff";
      ctx.fillRect(exp.x, exp.y, exp.w, exp.h);

      ctx.fillStyle = exp.color;
      for (const p of exp.particles) {
        const dist = p.speed * t;
        const px = cx + Math.cos(p.angle) * dist;
        const py = cy + Math.sin(p.angle) * dist;
        ctx.beginPath();
        ctx.arc(px, py, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    ctx.fillStyle = "#fff";
    ctx.fillRect(this.paddle.x, this.paddle.y, this.paddle.w, this.paddle.h);

    ctx.beginPath();
    ctx.arc(
      this.ball.x + this.ball.w / 2,
      this.ball.y + this.ball.h / 2,
      this.ball.w / 2,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }
}
