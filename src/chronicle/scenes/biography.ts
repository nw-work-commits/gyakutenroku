/** 列伝。エンディングを書かずに、やったことから生成する。 */

import { audio } from '../../engine/audio';
import type { GameKey, Input } from '../../engine/input';
import type { Scene } from '../../engine/scene';
import { SCREEN_H, SCREEN_W, drawText, wrapText } from '../../engine/ui';
import type { ChronicleApp } from '../app';
import { writeBiography } from '../biography';
import { INK, backdrop, panel, rule } from './theme';
import { ChronicleTitle } from './title';

const LINE_H = 26;

export class BiographyScene implements Scene {
  private lines: string[] = [];
  private title = '';
  private scroll = 0;
  private time = 0;

  constructor(private app: ChronicleApp) {}

  onEnter(): void {
    this.app.input.flush();
    audio.playBgm('title');
    const bio = writeBiography(this.app.who, this.app.state);
    this.title = bio.title;
    // 「**〜**」で囲んだ強調は、色を変えて出すための印
    this.lines = bio.lines.flatMap((line) =>
      line === '' ? [''] : wrapText(line, SCREEN_W - 120, 16),
    );
  }

  update(dt: number, input: Input): void {
    this.time += dt;
    if (input.isDown('down')) this.scroll += dt * 0.12;
    if (input.isDown('up')) this.scroll = Math.max(0, this.scroll - dt * 0.12);

    let key: GameKey | null;
    while ((key = input.consume()) !== null) {
      if (key === 'cancel' || key === 'confirm') {
        // 最後まで読んだら題に戻る
        if (this.scroll >= this.maxScroll - 1 || key === 'cancel') {
          audio.sfx('confirm');
          this.app.scenes.fade(() => this.app.scenes.reset(new ChronicleTitle(this.app)));
          return;
        }
        this.scroll = Math.min(this.maxScroll, this.scroll + 6);
      }
    }
    this.scroll = Math.min(this.scroll, this.maxScroll);
  }

  /** 一画面に収まる行数。 */
  private get visibleRows(): number {
    return Math.floor((SCREEN_H - 140) / LINE_H);
  }

  private get maxScroll(): number {
    return Math.max(0, this.lines.length - this.visibleRows);
  }

  render(ctx: CanvasRenderingContext2D): void {
    backdrop(ctx, SCREEN_W, SCREEN_H);

    drawText(ctx, this.title, SCREEN_W / 2, 26, {
      size: 26,
      align: 'center',
      color: INK.accent,
    });
    rule(ctx, 60, 62, SCREEN_W - 120);

    panel(ctx, 40, 74, SCREEN_W - 80, SCREEN_H - 130);

    const start = Math.floor(this.scroll);
    const rows = this.lines.slice(start, start + this.visibleRows);
    rows.forEach((line, i) => {
      const emphasised = line.includes('**');
      const text = line.replace(/\*\*/g, '');
      drawText(ctx, text, 64, 92 + i * LINE_H, {
        size: 16,
        color: emphasised ? INK.accent : INK.text,
      });
    });

    const more = this.scroll < this.maxScroll;
    drawText(
      ctx,
      more ? '▼ 下キーで読み進める' : '決定キーで題に戻る',
      SCREEN_W / 2,
      SCREEN_H - 40,
      {
        size: 13,
        align: 'center',
        color: INK.dim,
        alpha: more ? (this.time % 1000 < 600 ? 1 : 0.35) : 1,
      },
    );
  }
}
