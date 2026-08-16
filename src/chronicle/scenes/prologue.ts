/**
 * 運命の告知。
 * ラスボスの位置に「自分の死ぬ日」を置く、という設計の顔になる画面。
 */

import { audio } from '../../engine/audio';
import type { GameKey, Input } from '../../engine/input';
import type { Scene } from '../../engine/scene';
import { SCREEN_H, SCREEN_W, drawText, wrapText } from '../../engine/ui';
import type { ChronicleApp } from '../app';
import { escapeConditions } from '../biography';
import { maxTroops } from '../rules';
import { INK, backdrop, panel, rule } from './theme';
import { WorldScene } from './world';

const FATE_LABEL: Record<string, string> = {
  battle: '戦場に斃れる',
  execution: '捕らえられ、斬らる',
  illness: '病に斃れる',
  assassination: '身近な者に討たる',
  longevity: '天寿を全うする',
};

export class PrologueScene implements Scene {
  private time = 0;
  private page = 0;

  constructor(private app: ChronicleApp) {}

  onEnter(): void {
    this.app.input.flush();
    audio.playBgm('cave');
    // 兵はまだ持っていない。最初の事件で集める。
    const c = this.app.state;
    c.troops = Math.round(maxTroops(this.app.who, c) * 0.25);
  }

  update(dt: number, input: Input): void {
    this.time += dt;
    let key: GameKey | null;
    while ((key = input.consume()) !== null) {
      if (key === 'confirm') {
        audio.sfx('confirm');
        this.page++;
        if (this.page >= 2) {
          this.app.scenes.fade(() => this.app.scenes.reset(new WorldScene(this.app)));
        }
        return;
      }
      if (key === 'cancel' && this.page === 0) {
        audio.sfx('cancel');
        this.app.scenes.pop();
        return;
      }
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    backdrop(ctx, SCREEN_W, SCREEN_H);
    const who = this.app.who;
    const c = this.app.state;

    // 中央に大きく名前
    drawText(ctx, who.name, SCREEN_W / 2, 60, {
      size: 44,
      align: 'center',
      color: INK.text,
      weight: 'bold',
    });
    if (who.courtesy) {
      drawText(ctx, `字 ${who.courtesy}`, SCREEN_W / 2, 112, {
        size: 14,
        align: 'center',
        color: INK.dim,
      });
    }

    const fate = who.fate;
    panel(ctx, 60, 148, SCREEN_W - 120, 216);

    if (this.page === 0) {
      drawText(ctx, '汝の行く末は、すでに書かれている。', SCREEN_W / 2, 176, {
        size: 15,
        align: 'center',
        color: INK.dim,
      });
      rule(ctx, 100, 208, SCREEN_W - 200);

      if (!fate) {
        drawText(ctx, '—— 史書に、汝の名は無い。', SCREEN_W / 2, 236, {
          size: 22,
          align: 'center',
          color: INK.jade,
        });
        drawText(ctx, '定められた最期はない。だが、歴史は汝を必要としていない。', SCREEN_W / 2, 276, {
          size: 13,
          align: 'center',
          color: INK.dim,
        });
        drawText(ctx, 'どこまで食い込めるかが、汝の物語になる。', SCREEN_W / 2, 300, {
          size: 13,
          align: 'center',
          color: INK.dim,
        });
      } else {
        drawText(ctx, `${fate.year}年`, SCREEN_W / 2, 228, {
          size: 34,
          align: 'center',
          color: INK.blood,
          weight: 'bold',
        });
        drawText(ctx, FATE_LABEL[fate.kind] ?? '', SCREEN_W / 2, 272, {
          size: 20,
          align: 'center',
          color: INK.text,
        });
        if (fate.record) {
          wrapText(fate.record, SCREEN_W - 200, 13)
            .slice(0, 2)
            .forEach((line, i) =>
              drawText(ctx, line, SCREEN_W / 2, 306 + i * 20, {
                size: 13,
                align: 'center',
                color: INK.dim,
              }),
            );
        }
        const left = fate.year - c.year;
        drawText(ctx, left > 0 ? `残り ${left} 年` : 'その年は、もう来ている', SCREEN_W / 2, 342, {
          size: 13,
          align: 'center',
          color: INK.accent,
        });
      }
    } else {
      // 2ページ目：抗う手だて
      drawText(ctx, '抗う手だて', SCREEN_W / 2, 172, {
        size: 18,
        align: 'center',
        color: INK.accent,
      });
      rule(ctx, 100, 200, SCREEN_W - 200);

      const conditions = escapeConditions(who);
      if (conditions.length === 0) {
        drawText(ctx, 'この者に、抗うべき運命はない。', SCREEN_W / 2, 240, {
          size: 15,
          align: 'center',
          color: INK.dim,
        });
      } else {
        conditions.forEach((cond, i) => {
          const y = 220 + i * 44;
          drawText(ctx, '☐', 96, y, { size: 16, color: INK.dim });
          drawText(ctx, cond.label, 122, y, { size: 16, color: INK.text });
          if (cond.hint) {
            drawText(ctx, cond.hint, 122, y + 20, { size: 11, color: INK.dim });
          }
        });
        drawText(ctx, 'すべて満たせば、史書から外れる。', SCREEN_W / 2, 344, {
          size: 12,
          align: 'center',
          color: INK.accent,
        });
      }
    }

    drawText(ctx, '▼', SCREEN_W / 2, SCREEN_H - 46, {
      size: 16,
      align: 'center',
      color: INK.accent,
      alpha: this.time % 1000 < 600 ? 1 : 0.2,
    });
  }
}
