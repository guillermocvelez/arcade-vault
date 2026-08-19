// Motor de Snake escrito desde cero para SERPENTINA (sin game.js de referencia,
// ver spec 09 — Alcance). Los sprites de fruta se portan de
// references/source-assets/snake-assets/fruits.png + sprites.js (atlas original
// obtenido de https://www.spriters-resource.com/browser_games/googlesnakegame/,
// ver spec 09 — Riesgos).

import type { EngineSnapshot, GameEngine, Phase } from "~/games/types";

export type { Phase, EngineSnapshot } from "~/games/types";

interface FruitSprite {
  x: number;
  y: number;
  w: number;
  h: number;
}

// Atlas embebido, adaptado de references/source-assets/snake-assets/sprites.js
// (fila de frutas de fruits.png, hoja 3790x442px, fondo transparente).
const FRUIT_ATLAS: Record<string, FruitSprite> = {
  banana: { x: 34, y: 136, w: 110, h: 160 },
  orange: { x: 186, y: 136, w: 150, h: 160 },
  grape: { x: 378, y: 136, w: 110, h: 160 },
  garlic: { x: 540, y: 136, w: 130, h: 160 },
  eggplant: { x: 712, y: 136, w: 130, h: 160 },
  strawberry: { x: 894, y: 136, w: 110, h: 160 },
  cherry: { x: 1066, y: 136, w: 110, h: 160 },
  carrot: { x: 1228, y: 136, w: 130, h: 160 },
  mushroom: { x: 1400, y: 136, w: 130, h: 160 },
  broccoli: { x: 1582, y: 136, w: 110, h: 160 },
  watermelon: { x: 1734, y: 136, w: 150, h: 160 },
  pepper: { x: 1906, y: 136, w: 150, h: 160 },
  kiwi: { x: 2068, y: 136, w: 170, h: 160 },
  lemon: { x: 2250, y: 136, w: 140, h: 160 },
  peach: { x: 2432, y: 136, w: 130, h: 160 },
  peanut: { x: 2604, y: 136, w: 130, h: 160 },
  apple: { x: 2786, y: 136, w: 110, h: 160 },
  tomato: { x: 2948, y: 136, w: 130, h: 160 },
  berries: { x: 3110, y: 136, w: 150, h: 160 },
  grapes2: { x: 3302, y: 136, w: 110, h: 160 },
  pineapple: { x: 3454, y: 136, w: 150, h: 160 },
  melon: { x: 3637, y: 136, w: 130, h: 160 },
};

const FRUIT_KEYS = Object.keys(FRUIT_ATLAS);

type Direction = "up" | "down" | "left" | "right";

interface Vec2 {
  x: number;
  y: number;
} // coordenadas de grilla, no píxeles

interface Food {
  pos: Vec2;
  sprite: string;
}

const COLS = 20;
const ROWS = 15;
const CELL = 32;
const W = COLS * CELL; // 640
const H = ROWS * CELL; // 480

const MOVE_INTERVAL_BASE = 0.15;
const MOVE_INTERVAL_STEP = 0.012;
const MOVE_INTERVAL_FLOOR = 0.06;
const FRUITS_PER_LEVEL = 5;
const INITIAL_LENGTH = 3;

const DIRECTION_DELTA: Record<Direction, Vec2> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

const OPPOSITE: Record<Direction, Direction> = {
  up: "down",
  down: "up",
  left: "right",
  right: "left",
};

const DIRECTION_KEYS: Record<string, Direction> = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
  KeyW: "up",
  KeyS: "down",
  KeyA: "left",
  KeyD: "right",
};

const ARROW_CODES = new Set(["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"]);

export class SerpentinaEngine implements GameEngine {
  private readonly ctx: CanvasRenderingContext2D;
  private readonly canvas: HTMLCanvasElement;
  private readonly fruitImage: HTMLImageElement = new Image();

  private snake: Vec2[] = [];
  private direction: Direction = "right";
  private pendingDirection: Direction = "right";
  private food: Food = { pos: { x: 0, y: 0 }, sprite: FRUIT_KEYS[0]! };

  private score = 0;
  private lives = 1;
  private level = 1;
  private fruitsEaten = 0;
  private phase: Phase = "playing";

  private moveInterval = MOVE_INTERVAL_BASE;
  private moveTimer = 0;

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
    this.fruitImage.src = "/games/serpentina/fruits.png";
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.paused = false;
    window.addEventListener("keydown", this.onKeyDown);
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
      level: this.level,
      phase: this.phase,
      extras: [{ label: "LARGO", value: String(this.snake.length) }],
    };
  }

  onSnapshot(cb: (s: EngineSnapshot) => void): void {
    this.snapshotCb = cb;
  }

  // ── Input ───────────────────────────────────────────────────────────────────
  private readonly onKeyDown = (e: KeyboardEvent): void => {
    const dir = DIRECTION_KEYS[e.code];
    if (!dir) return;
    if (ARROW_CODES.has(e.code)) e.preventDefault();
    this.pendingDirection = dir;
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
  private initGame(): void {
    this.score = 0;
    this.lives = 1;
    this.level = 1;
    this.fruitsEaten = 0;
    this.phase = "playing";
    this.moveInterval = MOVE_INTERVAL_BASE;
    this.moveTimer = 0;

    const cx = Math.floor(COLS / 2);
    const cy = Math.floor(ROWS / 2);
    this.snake = [];
    for (let i = 0; i < INITIAL_LENGTH; i++) {
      this.snake.push({ x: cx - i, y: cy });
    }
    this.direction = "right";
    this.pendingDirection = "right";

    this.spawnFood();
  }

  private spawnFood(): void {
    const free: Vec2[] = [];
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        if (!this.snake.some((seg) => seg.x === x && seg.y === y)) free.push({ x, y });
      }
    }
    const pos = free[Math.floor(Math.random() * free.length)]!;
    const sprite = FRUIT_KEYS[Math.floor(Math.random() * FRUIT_KEYS.length)]!;
    this.food = { pos, sprite };
  }

  private step(): void {
    if (this.pendingDirection !== OPPOSITE[this.direction]) {
      this.direction = this.pendingDirection;
    }

    const delta = DIRECTION_DELTA[this.direction];
    const head = this.snake[0]!;
    const newHead: Vec2 = { x: head.x + delta.x, y: head.y + delta.y };

    if (newHead.x < 0 || newHead.x >= COLS || newHead.y < 0 || newHead.y >= ROWS) {
      this.lives = 0;
      this.phase = "gameover";
      return;
    }

    const willEat = newHead.x === this.food.pos.x && newHead.y === this.food.pos.y;
    const bodyToCheck = willEat ? this.snake : this.snake.slice(0, -1);
    const hitSelf = bodyToCheck.some((seg) => seg.x === newHead.x && seg.y === newHead.y);
    if (hitSelf) {
      this.lives = 0;
      this.phase = "gameover";
      return;
    }

    this.snake.unshift(newHead);
    if (willEat) {
      this.score += 10;
      this.fruitsEaten++;
      this.level = 1 + Math.floor(this.fruitsEaten / FRUITS_PER_LEVEL);
      this.moveInterval = Math.max(
        MOVE_INTERVAL_FLOOR,
        MOVE_INTERVAL_BASE - (this.level - 1) * MOVE_INTERVAL_STEP,
      );
      this.spawnFood();
    } else {
      this.snake.pop();
    }
  }

  // ── Update ──────────────────────────────────────────────────────────────────
  private update(dt: number): void {
    if (this.phase !== "playing") return;

    this.moveTimer += dt;
    while (this.moveTimer >= this.moveInterval) {
      this.moveTimer -= this.moveInterval;
      this.step();
      if (this.phase !== "playing") break;
    }
  }

  // ── Draw ────────────────────────────────────────────────────────────────────
  private draw(): void {
    const ctx = this.ctx;
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, W, H);

    for (let i = this.snake.length - 1; i >= 0; i--) {
      const seg = this.snake[i]!;
      ctx.fillStyle = i === 0 ? "#4ade80" : "#16a34a";
      ctx.fillRect(seg.x * CELL, seg.y * CELL, CELL, CELL);
    }

    const { pos, sprite } = this.food;
    if (this.fruitImage.complete && this.fruitImage.naturalWidth > 0) {
      const frame = FRUIT_ATLAS[sprite]!;
      ctx.drawImage(
        this.fruitImage,
        frame.x,
        frame.y,
        frame.w,
        frame.h,
        pos.x * CELL,
        pos.y * CELL,
        CELL,
        CELL,
      );
    } else {
      ctx.fillStyle = "#ef4444";
      ctx.fillRect(pos.x * CELL, pos.y * CELL, CELL, CELL);
    }
  }
}
