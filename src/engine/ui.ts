/** 描画の共通部品。ウィンドウ・文字・メニュー・メッセージ送りはすべてここに集約する。 */

import type { GameKey } from './input';

export const SCREEN_W = 640;
export const SCREEN_H = 480;

export const COLORS = {
  window: '#0b1024',
  windowEdge: '#e6ecff',
  windowInner: '#3d4a86',
  text: '#ffffff',
  dim: '#8f9ac9',
  gold: '#ffd766',
  hp: '#5ad07a',
  mp: '#57b6ff',
  danger: '#ff6b6b',
  accent: '#ffe08a',
} as const;

export function font(size: number, weight: 'normal' | 'bold' = 'normal'): string {
  return `${weight} ${size}px "Yu Gothic UI", "Meiryo", "Hiragino Kaku Gothic ProN", system-ui, sans-serif`;
}

/** 文字幅を測るためだけの隠しコンテキスト（描画前にも折り返しを計算したい）。 */
const measureCtx: CanvasRenderingContext2D = document.createElement('canvas').getContext('2d')!;

export function measure(text: string, size: number, weight: 'normal' | 'bold' = 'normal'): number {
  measureCtx.font = font(size, weight);
  return measureCtx.measureText(text).width;
}

/** 行頭に来てほしくない文字（簡易禁則処理）。 */
const NO_LINE_START = '、。，．・？！」』）］｝〉》ぁぃぅぇぉっゃゅょゎァィゥェォッャュョヮーぇ';

/** 日本語向けの1文字ずつの折り返し。'\n' は強制改行。 */
export function wrapText(text: string, maxWidth: number, size: number): string[] {
  measureCtx.font = font(size);
  const lines: string[] = [];
  for (const paragraph of text.split('\n')) {
    let line = '';
    for (const ch of paragraph) {
      const candidate = line + ch;
      if (line !== '' && measureCtx.measureText(candidate).width > maxWidth) {
        if (NO_LINE_START.includes(ch) && line.length > 1) {
          // ぶら下げ: 禁則文字は前の行に押し込む
          lines.push(candidate);
          line = '';
          continue;
        }
        lines.push(line);
        line = ch;
      } else {
        line = candidate;
      }
    }
    lines.push(line);
  }
  return lines;
}

export interface TextOptions {
  size?: number;
  color?: string;
  align?: CanvasTextAlign;
  baseline?: CanvasTextBaseline;
  weight?: 'normal' | 'bold';
  /** 縁取り。マップ上の文字など背景が読めないところで使う。 */
  stroke?: string;
  alpha?: number;
}

export function drawText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  opts: TextOptions = {},
): void {
  const { size = 18, color = COLORS.text, align = 'left', baseline = 'top', weight = 'normal' } = opts;
  ctx.save();
  if (opts.alpha !== undefined) ctx.globalAlpha = opts.alpha;
  ctx.font = font(size, weight);
  ctx.textAlign = align;
  ctx.textBaseline = baseline;
  if (opts.stroke) {
    ctx.lineWidth = Math.max(3, size / 5);
    ctx.lineJoin = 'round';
    ctx.strokeStyle = opts.stroke;
    ctx.strokeText(text, x, y);
  }
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
  ctx.restore();
}

/** 絵文字をタイルやキャラの位置に置く。中心そろえ。 */
export function drawEmoji(
  ctx: CanvasRenderingContext2D,
  glyph: string,
  cx: number,
  cy: number,
  size: number,
  alpha = 1,
): void {
  if (!glyph) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  // 色を持つ絵文字なら fillStyle は無視されるが、字形として描かれる絵文字には効く。
  // ここで塗りを決めておかないと、直前に誰かが残した色（地形の市松模様の
  // rgba(0,0,0,0.07) など）をそのまま使ってしまい、絵文字が透けて消える。
  ctx.fillStyle = '#ffffff';
  ctx.font = `${size}px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(glyph, cx, cy);
  ctx.restore();
}

export function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

/** 標準のコマンドウィンドウ。二重枠が古き良きRPGの顔。 */
export function drawWindow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  opts: { alpha?: number } = {},
): void {
  ctx.save();
  if (opts.alpha !== undefined) ctx.globalAlpha = opts.alpha;

  const gradient = ctx.createLinearGradient(x, y, x, y + h);
  gradient.addColorStop(0, '#101733');
  gradient.addColorStop(1, '#070b1c');
  ctx.fillStyle = gradient;
  roundRect(ctx, x, y, w, h, 8);
  ctx.fill();

  ctx.strokeStyle = COLORS.windowEdge;
  ctx.lineWidth = 2;
  roundRect(ctx, x + 1, y + 1, w - 2, h - 2, 7);
  ctx.stroke();

  ctx.strokeStyle = COLORS.windowInner;
  ctx.lineWidth = 1;
  roundRect(ctx, x + 5, y + 5, w - 10, h - 10, 4);
  ctx.stroke();

  ctx.restore();
}

/** HP/MPバー。 */
export function drawGauge(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  ratio: number,
  color: string,
): void {
  const clamped = Math.max(0, Math.min(1, ratio));
  ctx.save();
  ctx.fillStyle = '#000';
  roundRect(ctx, x, y, w, h, h / 2);
  ctx.fill();
  ctx.fillStyle = color;
  if (clamped > 0) {
    roundRect(ctx, x + 1, y + 1, Math.max(2, (w - 2) * clamped), h - 2, (h - 2) / 2);
    ctx.fill();
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.45)';
  ctx.lineWidth = 1;
  roundRect(ctx, x + 0.5, y + 0.5, w - 1, h - 1, h / 2);
  ctx.stroke();
  ctx.restore();
}

// ---------------------------------------------------------------- メニュー

export interface MenuItem {
  label: string;
  /** 呼び出し側が識別に使う値。 */
  value: string;
  /** 右寄せで添える文字（値段や個数）。 */
  right?: string;
  /** 選べないが表示はする項目。 */
  disabled?: boolean;
  /** 説明文。呼び出し側が別ウィンドウに出す用。 */
  desc?: string;
}

export class Menu {
  index = 0;
  private scroll = 0;

  constructor(
    public items: MenuItem[],
    public cols = 1,
    /** 一度に表示する行数。0 なら全部。 */
    public rows = 0,
  ) {}

  get selected(): MenuItem | undefined {
    return this.items[this.index];
  }

  setItems(items: MenuItem[]): void {
    this.items = items;
    this.index = Math.min(this.index, Math.max(0, items.length - 1));
    this.scroll = 0;
  }

  /** カーソル移動。移動したら true。 */
  move(key: GameKey): boolean {
    const count = this.items.length;
    if (count === 0) return false;
    const before = this.index;
    const rowCount = Math.ceil(count / this.cols);
    let row = Math.floor(this.index / this.cols);
    let col = this.index % this.cols;

    switch (key) {
      case 'up':
        row = (row - 1 + rowCount) % rowCount;
        break;
      case 'down':
        row = (row + 1) % rowCount;
        break;
      case 'left':
        if (this.cols === 1) row = (row - 1 + rowCount) % rowCount;
        else col = (col - 1 + this.cols) % this.cols;
        break;
      case 'right':
        if (this.cols === 1) row = (row + 1) % rowCount;
        else col = (col + 1) % this.cols;
        break;
      default:
        return false;
    }

    // 端の欠けたマスに入ったら最後の項目へ寄せる
    this.index = Math.min(row * this.cols + col, count - 1);
    this.ensureVisible();
    return this.index !== before;
  }

  private ensureVisible(): void {
    if (this.rows <= 0) return;
    const row = Math.floor(this.index / this.cols);
    if (row < this.scroll) this.scroll = row;
    const last = this.scroll + this.rows - 1;
    if (row > last) this.scroll = row - this.rows + 1;
  }

  draw(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    opts: { size?: number; lineHeight?: number; blink?: number } = {},
  ): void {
    const size = opts.size ?? 18;
    const lineHeight = opts.lineHeight ?? size + 10;
    const colWidth = w / this.cols;
    const rowCount = Math.ceil(this.items.length / this.cols);
    const first = this.rows > 0 ? this.scroll : 0;
    const last = this.rows > 0 ? Math.min(rowCount, this.scroll + this.rows) : rowCount;

    for (let row = first; row < last; row++) {
      for (let col = 0; col < this.cols; col++) {
        const i = row * this.cols + col;
        const item = this.items[i];
        if (!item) continue;
        const ix = x + col * colWidth;
        const iy = y + (row - first) * lineHeight;
        const active = i === this.index;
        const color = item.disabled ? COLORS.dim : active ? COLORS.accent : COLORS.text;

        if (active) {
          const blink = opts.blink ?? 1;
          drawText(ctx, '▶', ix - 4, iy, { size: size - 2, color: COLORS.accent, alpha: blink });
        }
        drawText(ctx, item.label, ix + 18, iy, { size, color });
        if (item.right) {
          drawText(ctx, item.right, ix + colWidth - 12, iy, {
            size,
            color: item.disabled ? COLORS.dim : COLORS.gold,
            align: 'right',
          });
        }
      }
    }

    // スクロール可能を示す小さな三角
    if (this.rows > 0 && rowCount > this.rows) {
      if (this.scroll > 0) drawText(ctx, '▲', x + w - 4, y - 4, { size: 12, color: COLORS.dim, align: 'right' });
      if (this.scroll + this.rows < rowCount) {
        drawText(ctx, '▼', x + w - 4, y + this.rows * lineHeight - 8, {
          size: 12,
          color: COLORS.dim,
          align: 'right',
        });
      }
    }
  }
}

// ---------------------------------------------------------------- メッセージ

const CHAR_MS = 16;

/** 1文字ずつ表示するメッセージウィンドウ。ページ送りつき。 */
export class MessageBox {
  private pages: string[][] = [];
  private page = 0;
  private revealed = 0;
  private timer = 0;
  private blink = 0;
  /** 全ページを読み終えたか。 */
  finished = true;
  /** true の間は「▼待ち」をせず自動で流す（戦闘ログ用）。 */
  auto = false;

  constructor(
    public x: number,
    public y: number,
    public w: number,
    public h: number,
    private maxLines = 3,
  ) {}

  get textWidth(): number {
    return this.w - 40;
  }

  /** 表示待ちのテキストを積む。 */
  say(text: string, size = 18): void {
    const lines = wrapText(text, this.textWidth, size);
    for (let i = 0; i < lines.length; i += this.maxLines) {
      this.pages.push(lines.slice(i, i + this.maxLines));
    }
    this.finished = false;
  }

  clear(): void {
    this.pages = [];
    this.page = 0;
    this.revealed = 0;
    this.timer = 0;
    this.finished = true;
  }

  get hasPages(): boolean {
    return this.pages.length > 0;
  }

  /** 今のページを全部表示し終えたか。 */
  get pageComplete(): boolean {
    const lines = this.pages[this.page];
    if (!lines) return true;
    return this.revealed >= lines.join('').length;
  }

  update(dt: number): void {
    this.blink = (this.blink + dt) % 1000;
    if (this.finished || this.pages.length === 0) return;
    if (!this.pageComplete) {
      this.timer += dt;
      while (this.timer >= CHAR_MS) {
        this.timer -= CHAR_MS;
        this.revealed++;
      }
    } else if (this.auto) {
      this.timer += dt;
      if (this.timer > 420) this.next();
    }
  }

  /** 決定キー。まだ表示途中なら全部出す、終わっていれば次のページへ。 */
  confirm(): void {
    if (this.finished) return;
    if (!this.pageComplete) {
      const lines = this.pages[this.page];
      this.revealed = lines ? lines.join('').length : 0;
      return;
    }
    this.next();
  }

  private next(): void {
    this.page++;
    this.revealed = 0;
    this.timer = 0;
    if (this.page >= this.pages.length) {
      this.pages = [];
      this.page = 0;
      this.finished = true;
    }
  }

  /** 残り全部を即座に読み飛ばす。 */
  skipAll(): void {
    this.clear();
  }

  draw(ctx: CanvasRenderingContext2D, opts: { window?: boolean; size?: number } = {}): void {
    const size = opts.size ?? 18;
    if (opts.window !== false) drawWindow(ctx, this.x, this.y, this.w, this.h);
    const lines = this.pages[this.page];
    if (!lines) return;

    let budget = this.revealed;
    let ty = this.y + 18;
    for (const line of lines) {
      const shown = line.slice(0, Math.max(0, budget));
      budget -= line.length;
      drawText(ctx, shown, this.x + 20, ty, { size });
      ty += size + 10;
      if (budget <= 0) break;
    }

    if (this.pageComplete && !this.auto && this.blink < 600) {
      drawText(ctx, '▼', this.x + this.w - 22, this.y + this.h - 26, {
        size: 14,
        color: COLORS.accent,
      });
    }
  }
}
