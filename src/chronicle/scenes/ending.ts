/**
 * 結びの一景。
 *
 * 一生が閉じたとき、あるいは世が終わったときに開く。
 * 四景を一枚ずつ捲らせてから、列伝の全文に送る。
 *
 * 一息に全部出さないのは、数字を読ませたいからではなく、
 * 「見届けた生涯」の一景で一度手を止めてほしいからである。
 */

import { audio } from '../../engine/audio';
import type { GameKey, Input } from '../../engine/input';
import type { Scene } from '../../engine/scene';
import { SCREEN_H, SCREEN_W, drawText, wrapText } from '../../engine/ui';
import type { ChronicleApp } from '../app';
import { writeEnding } from '../ending';
import type { Ending, EndingKind } from '../ending';
import { INK, backdrop, panel, rule } from './theme';
import { BiographyScene } from './biography';

export class EndingScene implements Scene {
  private time = 0;
  private page = 0;
  private ending: Ending | null = null;
  /** 見出しが出るまでの間。いきなり数字を見せない */
  private reveal = 0;

  constructor(
    private app: ChronicleApp,
    private kind: EndingKind,
  ) {}

  onEnter(): void {
    this.app.input.flush();
    audio.stopBgm();
    this.ending = writeEnding(this.app.who, this.app.state, this.kind);
    audio.sfx(this.kind === 'slain' ? 'defeat' : 'levelup');
    // 生き延びた記録はここで残す。読み終える前に閉じられても失われないように
    this.app.save();
  }

  update(dt: number, input: Input): void {
    this.time += dt;
    this.reveal = Math.min(1, this.reveal + dt / 700);

    let key: GameKey | null;
    while ((key = input.consume()) !== null) {
      if (key !== 'confirm' && key !== 'cancel') continue;
      // 出そろう前に押されたら、まず出しきる
      if (this.reveal < 1) {
        this.reveal = 1;
        continue;
      }
      audio.sfx('confirm');
      this.page++;
      this.reveal = 0;
      const total = (this.ending?.scenes.length ?? 0) + 1; // 表紙ぶん
      if (this.page >= total) {
        this.app.scenes.fade(() => this.app.scenes.reset(new BiographyScene(this.app)));
        return;
      }
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    backdrop(ctx, SCREEN_W, SCREEN_H);
    const ending = this.ending;
    if (!ending) return;

    // 表紙
    if (this.page === 0) {
      this.drawCover(ctx, ending);
      return;
    }

    const scene = ending.scenes[this.page - 1];
    if (!scene) return;

    drawText(ctx, scene.title, SCREEN_W / 2, 44, {
      size: 15,
      align: 'center',
      color: INK.dim,
    });
    rule(ctx, 120, 68, SCREEN_W - 240);

    let y = 106;
    // 数え上げは大きく。読み飛ばせない位置に置く
    if (scene.figure) {
      drawText(ctx, scene.figure.value, SCREEN_W / 2, y, {
        size: 46,
        align: 'center',
        color: INK.accent,
        weight: 'bold',
        alpha: this.reveal,
      });
      drawText(ctx, scene.figure.note, SCREEN_W / 2, y + 54, {
        size: 13,
        align: 'center',
        color: INK.dim,
        alpha: this.reveal,
      });
      y += 96;
    }

    panel(ctx, 70, y, SCREEN_W - 140, SCREEN_H - y - 90);
    let ly = y + 22;
    for (const line of scene.lines) {
      if (line === '') {
        ly += 14;
        continue;
      }
      const emphasised = line.includes('**');
      for (const row of wrapText(line.replace(/\*\*/g, ''), SCREEN_W - 190, 16)) {
        drawText(ctx, row, 94, ly, {
          size: 16,
          color: emphasised ? INK.accent : INK.text,
          alpha: this.reveal,
        });
        ly += 26;
      }
    }

    this.drawPrompt(ctx, this.page >= ending.scenes.length ? '列伝を読む' : '次へ');
  }

  private drawCover(ctx: CanvasRenderingContext2D, ending: Ending): void {
    const who = this.app.who;
    drawText(ctx, `${ending.year} 年`, SCREEN_W / 2, 118, {
      size: 22,
      align: 'center',
      color: INK.dim,
      alpha: this.reveal,
    });
    drawText(ctx, ending.headline, SCREEN_W / 2, 178, {
      size: 42,
      align: 'center',
      color: ending.kind === 'slain' ? INK.blood : INK.accent,
      weight: 'bold',
      alpha: this.reveal,
    });
    rule(ctx, 200, 216, SCREEN_W - 400);
    drawText(
      ctx,
      ending.age !== null ? `${who.name}　享年 ${ending.age}` : who.name,
      SCREEN_W / 2,
      248,
      { size: 18, align: 'center', color: INK.text, alpha: this.reveal },
    );
    this.drawPrompt(ctx, '結びを読む');
  }

  private drawPrompt(ctx: CanvasRenderingContext2D, label: string): void {
    drawText(ctx, `▼ ${label}`, SCREEN_W / 2, SCREEN_H - 44, {
      size: 13,
      align: 'center',
      color: INK.dim,
      alpha: this.time % 1000 < 600 ? 1 : 0.3,
    });
  }
}
