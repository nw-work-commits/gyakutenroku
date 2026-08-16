/** 三国志側の見た目。墨と朱、竹簡の色。勇者RPGとは別の顔にする。 */

import { COLORS, drawText, roundRect } from '../../engine/ui';

export const INK = {
  paper: '#141017',
  panel: '#1b1620',
  panelEdge: '#c8b48a',
  panelInner: '#4a3d2e',
  text: '#efe6d6',
  dim: '#9a8f7d',
  accent: '#e0b357',
  blood: '#b8434a',
  jade: '#6fae8a',
  water: '#6f93c4',
} as const;

/** 竹簡ふうのウィンドウ。 */
export function panel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  opts: { alpha?: number } = {},
): void {
  ctx.save();
  if (opts.alpha !== undefined) ctx.globalAlpha = opts.alpha;

  const grad = ctx.createLinearGradient(x, y, x, y + h);
  grad.addColorStop(0, '#221b26');
  grad.addColorStop(1, '#14101a');
  ctx.fillStyle = grad;
  roundRect(ctx, x, y, w, h, 4);
  ctx.fill();

  ctx.strokeStyle = INK.panelEdge;
  ctx.lineWidth = 1.5;
  roundRect(ctx, x + 1, y + 1, w - 2, h - 2, 3);
  ctx.stroke();

  ctx.strokeStyle = INK.panelInner;
  ctx.lineWidth = 1;
  roundRect(ctx, x + 5, y + 5, w - 10, h - 10, 2);
  ctx.stroke();
  ctx.restore();
}

/** 画面全体の下地。 */
export function backdrop(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, '#0d0a11');
  grad.addColorStop(0.55, '#171220');
  grad.addColorStop(1, '#1d1218');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
}

/** 見出し。朱の縦線を添える。 */
export function heading(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  size = 20,
): void {
  ctx.save();
  ctx.fillStyle = INK.blood;
  ctx.fillRect(x, y + 2, 3, size);
  ctx.restore();
  drawText(ctx, text, x + 12, y, { size, color: INK.accent });
}

/** 細い区切り線。 */
export function rule(ctx: CanvasRenderingContext2D, x: number, y: number, w: number): void {
  ctx.save();
  ctx.strokeStyle = 'rgba(200,180,138,0.22)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, y + 0.5);
  ctx.lineTo(x + w, y + 0.5);
  ctx.stroke();
  ctx.restore();
}

/** 数値の増減を色分けして書く。 */
export function delta(value: number): string {
  return `${value > 0 ? '+' : ''}${value}`;
}

export function deltaColor(value: number): string {
  return value > 0 ? INK.jade : value < 0 ? INK.blood : INK.dim;
}

/** カーソルの点滅。 */
export function blink(time: number): number {
  return 0.55 + 0.45 * Math.sin(time / 160);
}

/** 勇者RPG側の色も一部借りる（ゲージなど）。 */
export const SHARED = COLORS;
