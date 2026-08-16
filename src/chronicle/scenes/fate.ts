/** 運命の日。ラスボス戦の位置にある画面。 */

import { audio } from '../../engine/audio';
import type { GameKey, Input } from '../../engine/input';
import type { Scene } from '../../engine/scene';
import { SCREEN_H, SCREEN_W, drawText, wrapText } from '../../engine/ui';
import type { ChronicleApp } from '../app';
import { escapeConditions } from '../biography';
import { resolveFate } from '../runner';
import { INK, backdrop, panel, rule } from './theme';
import { EndingScene } from './ending';

export class FateScene implements Scene {
  private time = 0;
  private page = 0;
  private outcome: ReturnType<typeof resolveFate> | null = null;

  constructor(private app: ChronicleApp) {}

  onEnter(): void {
    this.app.input.flush();
    audio.stopBgm();
    this.outcome = resolveFate(this.app.state, this.app.who);
    audio.sfx(this.outcome.survived ? 'levelup' : 'defeat');
  }

  update(dt: number, input: Input): void {
    this.time += dt;
    let key: GameKey | null;
    while ((key = input.consume()) !== null) {
      if (key === 'confirm') {
        audio.sfx('confirm');
        this.page++;
        if (this.page < 2) return;

        // 運命の日を越えた者は、越えたところから先を生きる。
        //
        // ここでこれまで列伝に送っていたのは誤りだった。
        // 「史書と違う道を進んだらどうなるか」がこの遊びの二本目の柱なのに、
        // その道に入った瞬間に幕を引いていたことになる。
        // 史書から外れた生涯は、外れてからが本番である。
        if (this.outcome?.survived) {
          this.app.scenes.pop();
          return;
        }
        this.app.scenes.fade(() => this.app.scenes.reset(new EndingScene(this.app, 'slain')));
        return;
      }
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    backdrop(ctx, SCREEN_W, SCREEN_H);
    const who = this.app.who;
    const c = this.app.state;
    const fate = who.fate;
    const outcome = this.outcome;
    if (!outcome) return;

    const survived = outcome.survived;

    if (this.page === 0) {
      // 史書が何と書いているか
      drawText(ctx, `${fate?.year ?? c.year} 年`, SCREEN_W / 2, 72, {
        size: 40,
        align: 'center',
        color: INK.blood,
        weight: 'bold',
      });
      panel(ctx, 60, 140, SCREEN_W - 120, 190);
      drawText(ctx, '史に曰く ——', SCREEN_W / 2, 166, {
        size: 14,
        align: 'center',
        color: INK.dim,
      });
      rule(ctx, 100, 192, SCREEN_W - 200);
      wrapText(fate?.record ?? `${who.name}、没す`, SCREEN_W - 200, 19)
        .slice(0, 3)
        .forEach((line, i) =>
          drawText(ctx, line, SCREEN_W / 2, 212 + i * 30, {
            size: 19,
            align: 'center',
            color: INK.text,
          }),
        );
      drawText(ctx, `抗う手だて ${outcome.met.length} / ${outcome.total}`, SCREEN_W / 2, 300, {
        size: 14,
        align: 'center',
        color: outcome.met.length === outcome.total ? INK.jade : INK.blood,
      });
    } else {
      // どうなったか
      panel(ctx, 60, 120, SCREEN_W - 120, 230);
      if (survived) {
        drawText(ctx, '然れども', SCREEN_W / 2, 150, {
          size: 18,
          align: 'center',
          color: INK.dim,
        });
        drawText(ctx, 'その者は、この年を越えて生きた。', SCREEN_W / 2, 196, {
          size: 24,
          align: 'center',
          color: INK.jade,
        });
        drawText(ctx, '史書は、ここから先を知らない。', SCREEN_W / 2, 244, {
          size: 15,
          align: 'center',
          color: INK.dim,
        });
      } else {
        drawText(ctx, '—— 史書のとおりであった。', SCREEN_W / 2, 190, {
          size: 22,
          align: 'center',
          color: INK.text,
        });
        const missing = escapeConditions(who).filter((cond) => !outcome.met.includes(cond.id));
        drawText(ctx, '満たせなかったもの', SCREEN_W / 2, 240, {
          size: 13,
          align: 'center',
          color: INK.dim,
        });
        missing.slice(0, 3).forEach((cond, i) =>
          drawText(ctx, `・${cond.label}`, SCREEN_W / 2, 264 + i * 22, {
            size: 14,
            align: 'center',
            color: INK.blood,
          }),
        );
      }
    }

    drawText(ctx, '▼', SCREEN_W / 2, SCREEN_H - 48, {
      size: 16,
      align: 'center',
      color: INK.accent,
      alpha: this.time % 1000 < 600 ? 1 : 0.2,
    });
  }
}
