/** 事件の画面。本文を読み、立場に応じた選択肢を選ぶ。 */

import { audio } from '../../engine/audio';
import { namesIn } from '../lore';
import { OFFICERS } from '../lookup';
import { LoreScene } from './lore';
import type { Officer } from '../types';
import type { GameKey, Input } from '../../engine/input';
import type { Scene } from '../../engine/scene';
import { Menu, SCREEN_H, SCREEN_W, drawText, wrapText } from '../../engine/ui';
import type { ChronicleApp } from '../app';
import { applyEffect, sceneFor } from '../runner';
import type { EventChoice, EventScene as SceneDef, HistoryEvent } from '../types';
import { INK, backdrop, blink, heading, panel, rule } from './theme';
import { OVERWORLD_TILES } from '../data/world/overworld';
import { WarScene } from './battle';

type Phase = 'read' | 'choose' | 'result';

export class EventScene implements Scene {
  private phase: Phase = 'read';
  private scene: SceneDef | null = null;
  private menu = new Menu([], 1, 4);
  private lines: string[] = [];
  private revealed = 0;
  private timer = 0;
  private time = 0;
  private resultLines: string[] = [];

  constructor(
    private app: ChronicleApp,
    private event: HistoryEvent,
  ) {}

  onEnter(): void {
    this.app.input.flush();
    const c = this.app.state;
    this.scene = sceneFor(this.event, c);
    if (!this.scene) {
      this.app.scenes.pop();
      return;
    }
    this.lines = wrapText(this.scene.text, SCREEN_W - 120, 17);
    this.menu.setItems(
      this.scene.choices.map((choice, i) => ({
        label: choice.label,
        value: String(i),
        disabled: choice.requires ? !choice.requires(c) : false,
        right: choice.historical ? '史実' : '',
      })),
    );
  }

  onResume(): void {
    // 戦闘から戻ってきた。結果を見せて終わる。
    this.app.input.flush();
    this.phase = 'result';
  }

  update(dt: number, input: Input): void {
    this.time += dt;

    if (this.phase === 'read' && this.revealed < this.totalChars) {
      this.timer += dt;
      while (this.timer >= 14 && this.revealed < this.totalChars) {
        this.timer -= 14;
        this.revealed++;
      }
    }

    let key: GameKey | null;
    while ((key = input.consume()) !== null) {
      if (this.phase === 'read') {
        if (key === 'confirm') {
          if (this.revealed < this.totalChars) this.revealed = this.totalChars;
          else this.phase = 'choose';
        }
        // 本文に名の出ている者を、その場で引く。
        // 読んでいる最中こそ、その人が誰なのかを知りたい
        if (key === 'cancel') this.openLore();
        continue;
      }
      if (this.phase === 'result') {
        if (key === 'confirm') {
          audio.sfx('confirm');
          this.app.scenes.pop();
          return;
        }
        continue;
      }
      // choose
      if (key === 'confirm') {
        this.pick();
        return;
      }
      if (key === 'cancel') {
        this.openLore();
        return;
      }
      if (this.menu.move(key)) audio.sfx('cursor');
    }
  }

  /** 本文に出てくる武将。読みながら引けるようにしておく。 */
  private get mentioned(): Officer[] {
    const text = `${this.event.name}${this.event.record}${this.scene?.text ?? ''}`;
    return namesIn(text)
      .map((id) => OFFICERS[id])
      .filter((o): o is Officer => Boolean(o));
  }

  private openLore(): void {
    const who = this.mentioned[0];
    if (!who) return;
    audio.sfx('confirm');
    this.app.scenes.push(new LoreScene(this.app, who));
  }

  private get totalChars(): number {
    return this.lines.reduce((sum, line) => sum + line.length, 0);
  }

  private pick(): void {
    const index = Number(this.menu.selected?.value ?? -1);
    const choice: EventChoice | undefined = this.scene?.choices[index];
    if (!choice || this.menu.selected?.disabled) return;
    audio.sfx('confirm');

    const report = applyEffect(
      this.app.state,
      this.app.who,
      choice.effect,
      this.event,
      choice.historical === true,
    );
    this.resultLines = [choice.effect.deed, ...report.lines];

    if (report.battle) {
      this.app.scenes.push(
        new WarScene(this.app, {
          enemies: report.battle.enemies,
          escapable: report.battle.escapable,
          eventName: this.event.name,
          eventId: this.event.id,
          // 史実の戦も、いま立っている土地の上で起きる
          terrain: OVERWORLD_TILES[this.app.state.y]?.[this.app.state.x] ?? '.',
        }),
      );
      return;
    }
    this.phase = 'result';
  }

  render(ctx: CanvasRenderingContext2D): void {
    backdrop(ctx, SCREEN_W, SCREEN_H);
    heading(ctx, `${this.event.year}年　${this.event.name}`, 16, 18, 20);

    // 本文
    panel(ctx, 16, 60, SCREEN_W - 32, 200);
    let budget = this.phase === 'read' ? this.revealed : this.totalChars;
    let y = 84;
    for (const line of this.lines.slice(0, 7)) {
      const shown = line.slice(0, Math.max(0, budget));
      budget -= line.length;
      drawText(ctx, shown, 40, y, { size: 17, color: INK.text });
      y += 26;
      if (budget <= 0) break;
    }

    // 本文に名の出ている者を、その場で引けることを知らせる
    const first = this.mentioned[0];
    if (first) {
      drawText(ctx, `X: ${first.name}の生涯を読む`, 40, 246, { size: 11, color: INK.dim });
    }

    if (this.phase === 'read') {
      drawText(ctx, '▼', SCREEN_W - 40, 236, {
        size: 14,
        color: INK.accent,
        alpha: this.time % 1000 < 600 ? 1 : 0.2,
      });
      return;
    }

    if (this.phase === 'result') {
      panel(ctx, 16, 274, SCREEN_W - 32, 190);
      drawText(ctx, 'こうして', 40, 292, { size: 13, color: INK.dim });
      rule(ctx, 40, 314, SCREEN_W - 80);
      this.resultLines.slice(0, 5).forEach((line, i) => {
        drawText(ctx, line, 40, 328 + i * 26, {
          size: i === 0 ? 17 : 14,
          color: i === 0 ? INK.text : INK.jade,
        });
      });
      drawText(ctx, '▼', SCREEN_W - 40, 440, {
        size: 14,
        color: INK.accent,
        alpha: this.time % 1000 < 600 ? 1 : 0.2,
      });
      return;
    }

    // 選択肢
    panel(ctx, 16, 274, SCREEN_W - 32, 190);
    drawText(ctx, 'どうする', 40, 290, { size: 13, color: INK.accent });
    this.menu.draw(ctx, 40, 316, SCREEN_W - 90, {
      size: 17,
      lineHeight: 34,
      blink: blink(this.time),
    });
  }
}
