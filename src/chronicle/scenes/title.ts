/** 三国志「もしも」のタイトル。 */

import type { GameKey, Input } from '../../engine/input';
import type { Scene } from '../../engine/scene';
import { Menu, SCREEN_H, SCREEN_W, drawText } from '../../engine/ui';
import { audio } from '../../engine/audio';
import type { ChronicleApp } from '../app';
import { INK, backdrop, blink, panel } from './theme';
import { LoreScene } from './lore';
import { SelectScene } from './select';
import { WorldScene } from './world';

export class ChronicleTitle implements Scene {
  private menu = new Menu([], 1);
  private time = 0;
  private message = '';

  constructor(private app: ChronicleApp) {}

  onEnter(): void {
    audio.playBgm('title');
    this.refresh();
  }

  onResume(): void {
    audio.playBgm('title');
    this.refresh();
  }

  private refresh(): void {
    this.menu.setItems([
      { label: '武将を選ぶ', value: 'new' },
      { label: 'つづきから', value: 'continue', disabled: !this.app.hasSave() },
      // 遊ばずに読むだけでもよい。武将の生涯を知ることがこのゲームの主眼なので
      { label: '人物事典', value: 'lore' },
    ]);
  }

  update(dt: number, input: Input): void {
    this.time += dt;
    let key: GameKey | null;
    while ((key = input.consume()) !== null) {
      if (key === 'confirm') {
        this.choose();
        return;
      }
      if (this.menu.move(key)) audio.sfx('cursor');
    }
  }

  private choose(): void {
    const selected = this.menu.selected;
    if (!selected || selected.disabled) {
      audio.sfx('cancel');
      return;
    }
    audio.sfx('confirm');

    if (selected.value === 'new') {
      this.app.scenes.push(new SelectScene(this.app));
      return;
    }
    if (selected.value === 'lore') {
      this.app.scenes.push(new LoreScene(this.app));
      return;
    }
    if (!this.app.load()) {
      this.message = '記録が読み込めませんでした。';
      audio.sfx('cancel');
      this.refresh();
      return;
    }
    this.app.scenes.fade(() => this.app.scenes.reset(new WorldScene(this.app)));
  }

  render(ctx: CanvasRenderingContext2D): void {
    backdrop(ctx, SCREEN_W, SCREEN_H);

    // 遠くの山影
    ctx.fillStyle = '#0a0710';
    ctx.beginPath();
    ctx.moveTo(0, SCREEN_H);
    ctx.lineTo(0, 330);
    ctx.lineTo(150, 268);
    ctx.lineTo(280, 340);
    ctx.lineTo(420, 250);
    ctx.lineTo(540, 320);
    ctx.lineTo(SCREEN_W, 280);
    ctx.lineTo(SCREEN_W, SCREEN_H);
    ctx.closePath();
    ctx.fill();

    // 朱の落款ふうの印
    ctx.save();
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = INK.blood;
    ctx.fillRect(SCREEN_W - 96, 36, 52, 52);
    ctx.restore();
    drawText(ctx, '逆', SCREEN_W - 70, 44, { size: 20, align: 'center', color: '#f3e9d8' });
    drawText(ctx, '天', SCREEN_W - 70, 66, { size: 20, align: 'center', color: '#f3e9d8' });

    drawText(ctx, '三國志', SCREEN_W / 2, 104, {
      size: 40,
      align: 'center',
      color: INK.dim,
      weight: 'bold',
      stroke: '#0a0710',
    });
    drawText(ctx, '逆 天 録', SCREEN_W / 2, 152, {
      size: 52,
      align: 'center',
      color: INK.text,
      weight: 'bold',
      stroke: '#0a0710',
    });
    drawText(ctx, '謀事は人に在り、成事は天に在り', SCREEN_W / 2, 214, {
      size: 14,
      align: 'center',
      color: INK.accent,
    });
    drawText(ctx, 'その天に、抗う', SCREEN_W / 2, 238, {
      size: 13,
      align: 'center',
      color: INK.dim,
    });

    // 何を目指す遊びなのかを、始める前に書いておく。
    // 目的の見えない遊びは、遊ぶ側が何のために歩いているのか分からない
    const aim = [
      '一人の武将として乱世を生き、',
      'ほかの武将の生涯を見届け、史書をどれだけ外せるか。',
    ];
    aim.forEach((line, i) =>
      drawText(ctx, line, SCREEN_W / 2, 262 + i * 20, {
        size: 12,
        align: 'center',
        color: INK.dim,
      }),
    );

    // 品書きの数だけ窓を伸ばす
    panel(ctx, SCREEN_W / 2 - 110, 308, 220, 28 + this.menu.items.length * 32);
    this.menu.draw(ctx, SCREEN_W / 2 - 82, 326, 170, {
      size: 18,
      lineHeight: 34,
      blink: blink(this.time),
    });

    if (this.message) {
      drawText(ctx, this.message, SCREEN_W / 2, 372, {
        size: 13,
        align: 'center',
        color: INK.blood,
      });
    }

    drawText(ctx, '決定: Z / Enter　　もどる: X / Esc', SCREEN_W / 2, SCREEN_H - 28, {
      size: 12,
      align: 'center',
      color: INK.dim,
      alpha: 0.5 + 0.35 * Math.sin(this.time / 600),
    });
  }
}
