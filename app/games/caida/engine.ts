// Motor de Tetris portado de references/started-games/03-tetris/game.js
// Porte literal (función por función) a TypeScript, envuelto en CaidaEngine:
// sin globals de window/document del original — los canvas (tablero + preview
// de siguiente pieza) se reciben por constructor y el listener de teclado se
// agrega/quita en start()/stop(). El drop automático conserva la lógica de
// acumulación del original (dropAccum += dt contra dropInterval) pero con dt
// en segundos y clamped a 0.05s, igual que el resto del contrato de motores.

import type { EngineSnapshot, GameEngine, Palette, SkinId } from "~/games/types";
import { PIECE_COLORS, SKINS } from "~/games/caida/skins";

export type { EngineSnapshot } from "~/games/types";

const COLS = 10;
const ROWS = 20;
const BLOCK = 30;
const NEXT_BLOCK = 30;

const PIECES: Array<number[][] | null> = [
  null,
  [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ], // I
  [
    [2, 2],
    [2, 2],
  ], // O
  [
    [0, 3, 0],
    [3, 3, 3],
    [0, 0, 0],
  ], // T
  [
    [0, 4, 4],
    [4, 4, 0],
    [0, 0, 0],
  ], // S
  [
    [5, 5, 0],
    [0, 5, 5],
    [0, 0, 0],
  ], // Z
  [
    [6, 0, 0],
    [6, 6, 6],
    [0, 0, 0],
  ], // J
  [
    [0, 0, 7],
    [7, 7, 7],
    [0, 0, 0],
  ], // L
  [
    [8, 8, 8],
    [8, 0, 8],
    [8, 8, 8],
  ], // N (tuerca)
];

const LINE_SCORES = [0, 100, 300, 500, 800];

const CONTROL_CODES = new Set(["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Space"]);

interface Piece {
  type: number;
  shape: number[][];
  x: number;
  y: number;
}

function createBoard(): number[][] {
  return Array.from({ length: ROWS }, () => new Array(COLS).fill(0));
}

export class CaidaEngine implements GameEngine {
  private readonly ctx: CanvasRenderingContext2D;
  private readonly nextCtx: CanvasRenderingContext2D;

  private board: number[][] = createBoard();
  private current!: Piece;
  private next!: Piece;

  private score = 0;
  private lines = 0;
  private level = 1;
  private phase: EngineSnapshot["phase"] = "playing";

  private dropInterval = 1;
  private dropAccum = 0;

  private running = false;
  private paused = false;
  private rafId: number | null = null;
  private lastTime: number | null = null;

  private snapshotCb: ((s: EngineSnapshot) => void) | null = null;

  private palette: Palette;
  private pieceColors: readonly (string | null)[];

  constructor(canvas: HTMLCanvasElement, nextCanvas: HTMLCanvasElement, skin: SkinId = "clasico") {
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("No se pudo obtener el contexto 2D del canvas");
    this.ctx = ctx;

    const nextCtx = nextCanvas.getContext("2d");
    if (!nextCtx) throw new Error("No se pudo obtener el contexto 2D del canvas de preview");
    this.nextCtx = nextCtx;

    this.palette = SKINS[skin];
    this.pieceColors = PIECE_COLORS[skin];
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

  setSkin(id: SkinId): void {
    this.palette = SKINS[id];
    this.pieceColors = PIECE_COLORS[id];
    if (this.current) this.draw();
  }

  getSnapshot(): EngineSnapshot {
    return {
      score: this.score,
      lives: 1, // Tetris no tiene vidas: game over directo al chocar el spawn
      level: this.level,
      phase: this.phase,
      extras: [{ label: "LINEAS", value: String(this.lines) }],
    };
  }

  onSnapshot(cb: (s: EngineSnapshot) => void): void {
    this.snapshotCb = cb;
  }

  // ── Input ───────────────────────────────────────────────────────────────────
  private readonly onKeyDown = (e: KeyboardEvent): void => {
    if (CONTROL_CODES.has(e.code)) e.preventDefault();
    if (!this.running || this.paused || this.phase !== "playing") return;
    switch (e.code) {
      case "ArrowLeft":
        this.tryMove(-1);
        break;
      case "ArrowRight":
        this.tryMove(1);
        break;
      case "ArrowDown":
        this.softDrop();
        break;
      case "ArrowUp":
      case "KeyX":
        this.tryRotate();
        break;
      case "Space":
        this.hardDrop();
        break;
    }
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

  private update(dt: number): void {
    if (this.phase === "gameover") return;
    this.dropAccum += dt;
    if (this.dropAccum >= this.dropInterval) {
      this.dropAccum = 0;
      if (!this.collide(this.current.shape, this.current.x, this.current.y + 1)) {
        this.current.y++;
      } else {
        this.lockPiece();
      }
    }
  }

  // ── Estado del juego ───────────────────────────────────────────────────────
  private randomPiece(): Piece {
    const type = Math.floor(Math.random() * 8) + 1;
    const shape = PIECES[type]!.map((row) => [...row]);
    return { type, shape, x: Math.floor(COLS / 2) - Math.floor(shape[0]!.length / 2), y: 0 };
  }

  private collide(shape: number[][], ox: number, oy: number): boolean {
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r]!.length; c++) {
        if (!shape[r]![c]) continue;
        const nx = ox + c;
        const ny = oy + r;
        if (nx < 0 || nx >= COLS || ny >= ROWS) return true;
        if (ny >= 0 && this.board[ny]![nx]) return true;
      }
    }
    return false;
  }

  private rotateCW(shape: number[][]): number[][] {
    const rows = shape.length;
    const cols = shape[0]!.length;
    const result: number[][] = Array.from({ length: cols }, () => new Array(rows).fill(0));
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        result[c]![rows - 1 - r] = shape[r]![c]!;
      }
    }
    return result;
  }

  private tryMove(dx: number): void {
    if (!this.collide(this.current.shape, this.current.x + dx, this.current.y)) {
      this.current.x += dx;
    }
  }

  private tryRotate(): void {
    const rotated = this.rotateCW(this.current.shape);
    const kicks = [0, -1, 1, -2, 2];
    for (const kick of kicks) {
      if (!this.collide(rotated, this.current.x + kick, this.current.y)) {
        this.current.shape = rotated;
        this.current.x += kick;
        return;
      }
    }
  }

  private merge(): void {
    for (let r = 0; r < this.current.shape.length; r++) {
      for (let c = 0; c < this.current.shape[r]!.length; c++) {
        if (this.current.shape[r]![c]) {
          this.board[this.current.y + r]![this.current.x + c] = this.current.shape[r]![c]!;
        }
      }
    }
  }

  private clearLines(): void {
    let cleared = 0;
    for (let r = ROWS - 1; r >= 0; r--) {
      if (this.board[r]!.every((v) => v !== 0)) {
        this.board.splice(r, 1);
        this.board.unshift(new Array(COLS).fill(0));
        cleared++;
        r++;
      }
    }
    if (cleared) {
      this.lines += cleared;
      this.score += (LINE_SCORES[cleared] || 0) * this.level;
      this.level = Math.floor(this.lines / 10) + 1;
      this.dropInterval = Math.max(0.1, 1 - (this.level - 1) * 0.09);
    }
  }

  private ghostY(): number {
    let gy = this.current.y;
    while (!this.collide(this.current.shape, this.current.x, gy + 1)) gy++;
    return gy;
  }

  private hardDrop(): void {
    const gy = this.ghostY();
    this.score += (gy - this.current.y) * 2;
    this.current.y = gy;
    this.lockPiece();
  }

  private softDrop(): void {
    if (!this.collide(this.current.shape, this.current.x, this.current.y + 1)) {
      this.current.y++;
      this.score += 1;
    } else {
      this.lockPiece();
    }
  }

  private lockPiece(): void {
    this.merge();
    this.clearLines();
    this.spawn();
  }

  private spawn(): void {
    this.current = this.next;
    this.next = this.randomPiece();
    if (this.collide(this.current.shape, this.current.x, this.current.y)) {
      this.phase = "gameover";
    }
  }

  private initGame(): void {
    this.board = createBoard();
    this.score = 0;
    this.lines = 0;
    this.level = 1;
    this.phase = "playing";
    this.dropInterval = 1;
    this.dropAccum = 0;
    this.next = this.randomPiece();
    this.spawn();
  }

  // ── Draw ────────────────────────────────────────────────────────────────────
  private drawBlock(
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    colorIndex: number,
    size: number,
    alpha?: number,
    glow = true,
  ): void {
    const color = this.pieceColors[colorIndex];
    if (!color) return;
    context.globalAlpha = alpha ?? 1;
    context.fillStyle = color;
    if (glow && this.palette.glowBlur > 0) {
      context.shadowColor = color;
      context.shadowBlur = this.palette.glowBlur;
    }
    context.fillRect(x * size + 1, y * size + 1, size - 2, size - 2);
    context.shadowBlur = 0;
    context.fillStyle = this.palette.fgDim;
    context.fillRect(x * size + 1, y * size + 1, size - 2, 4);
    context.globalAlpha = 1;
  }

  private drawGrid(): void {
    const ctx = this.ctx;
    ctx.shadowBlur = 0;
    ctx.strokeStyle = this.palette.grid;
    ctx.lineWidth = 0.5;
    for (let c = 1; c < COLS; c++) {
      ctx.beginPath();
      ctx.moveTo(c * BLOCK, 0);
      ctx.lineTo(c * BLOCK, ROWS * BLOCK);
      ctx.stroke();
    }
    for (let r = 1; r < ROWS; r++) {
      ctx.beginPath();
      ctx.moveTo(0, r * BLOCK);
      ctx.lineTo(COLS * BLOCK, r * BLOCK);
      ctx.stroke();
    }
  }

  private drawNext(): void {
    this.nextCtx.clearRect(0, 0, 4 * NEXT_BLOCK, 4 * NEXT_BLOCK);
    const shape = this.next.shape;
    const offX = Math.floor((4 - shape[0]!.length) / 2);
    const offY = Math.floor((4 - shape.length) / 2);
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r]!.length; c++) {
        this.drawBlock(this.nextCtx, offX + c, offY + r, shape[r]![c]!, NEXT_BLOCK);
      }
    }
  }

  private draw(): void {
    const ctx = this.ctx;
    ctx.shadowBlur = 0;
    ctx.fillStyle = this.palette.bg;
    ctx.fillRect(0, 0, COLS * BLOCK, ROWS * BLOCK);
    this.drawGrid();

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        this.drawBlock(ctx, c, r, this.board[r]![c]!, BLOCK);
      }
    }

    const gy = this.ghostY();
    for (let r = 0; r < this.current.shape.length; r++) {
      for (let c = 0; c < this.current.shape[r]!.length; c++) {
        if (this.current.shape[r]![c]) {
          this.drawBlock(
            ctx,
            this.current.x + c,
            gy + r,
            this.current.shape[r]![c]!,
            BLOCK,
            0.2,
            false,
          );
        }
      }
    }

    for (let r = 0; r < this.current.shape.length; r++) {
      for (let c = 0; c < this.current.shape[r]!.length; c++) {
        this.drawBlock(
          ctx,
          this.current.x + c,
          this.current.y + r,
          this.current.shape[r]![c]!,
          BLOCK,
        );
      }
    }

    this.drawNext();
  }
}
