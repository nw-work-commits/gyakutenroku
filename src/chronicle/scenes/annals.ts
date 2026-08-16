/**
 * 年代記。「本来この年に何があったか」と「いま現状はどうなっているか」を並べる。
 *
 * 史実を隠さず、常に見える基準線として置く。差分を読むために史実を知ることになるので、
 * 遊びと勉強が同じ動作になる。
 */

import { audio } from '../../engine/audio';
import type { GameKey, Input } from '../../engine/input';
import type { Scene } from '../../engine/scene';
import { Menu, SCREEN_H, SCREEN_W, drawText, wrapText } from '../../engine/ui';
import type { ChronicleApp } from '../app';
import { placeOf } from '../data/world/event-places';
import { PROVINCE_BY_ID } from '../data/world/overworld';
import { tallyOf } from '../ending';
import { OFFICERS } from '../lookup';
import { HEART_LEAVING, heartLabel, heartOf } from '../systems/hearts';
import { ALL_EVENTS } from '../registry';
import { LAST_YEAR } from '../runner';
import { ensureWorld, outcomeOf, powersAt, recentNews } from '../systems/world';
import type { Chronicle, Deed, HistoryEvent, WorldNews } from '../types';
import { LoreScene } from './lore';
import { INK, backdrop, heading, panel, rule } from './theme';

interface Row {
  kind: 'year' | 'event' | 'blank';
  text: string;
  actual?: string;
  diverged?: boolean;
  /** まだ来ていない年か。 */
  future?: boolean;
}

/**
 * 年代記（史実との突き合わせ）・世情（いまの天下）・手控え（記録と出入り）の三枚。
 * 左右で回す。
 */
type Page = 'annals' | 'realm' | 'record';

const PAGE_ORDER: Page[] = ['annals', 'realm', 'record'];

const NEWS_COLOR: Record<WorldNews['kind'], string> = {
  history: INK.dim,
  divergence: INK.jade,
  death: INK.blood,
  seize: INK.water,
  ruin: INK.blood,
};

export class AnnalsScene implements Scene {
  private rows: Row[] = [];
  private scroll = 0;
  private time = 0;
  private page: Page = 'annals';
  /** 手控えの品書き。 */
  private recordMenu = new Menu([], 1);
  private notice = '';

  constructor(private app: ChronicleApp) {}

  onEnter(): void {
    this.app.input.flush();
    this.build();
    // 現在の年のあたりを開いておく。
    // 事件の無い年に立っていることもあるので、ぴったり一致しなければ直近の年に寄せる。
    const now = this.app.state.year;
    let index = -1;
    this.rows.forEach((row, i) => {
      if (row.kind !== 'year') return;
      const year = Number.parseInt(row.text, 10);
      if (Number.isFinite(year) && year <= now) index = i;
    });
    if (index >= 0) this.scroll = Math.max(0, index - 2);
  }

  private build(): void {
    const c = this.app.state;
    const rows: Row[] = [];
    let lastYear = -1;

    for (const event of ALL_EVENTS) {
      if (event.year !== lastYear) {
        if (lastYear !== -1) rows.push({ kind: 'blank', text: '' });
        rows.push({
          kind: 'year',
          text: `${event.year}年`,
          future: event.year > c.year,
        });
        lastYear = event.year;
      }
      rows.push({
        kind: 'event',
        text: event.name,
        actual: this.actualOf(event, c),
        diverged: this.divergedAt(event, c),
        future: event.year > c.year,
      });
    }

    this.rows = rows;
  }

  /** その事件が、いまどうなっているか。 */
  private actualOf(event: HistoryEvent, c: Chronicle): string {
    if (event.year > c.year) return 'まだ来ていない';

    const deed = c.deeds.find((d: Deed) => d.eventId === event.id);
    if (deed) return deed.diverged ? deed.text : `そのとおり（${deed.text}）`;

    // 今年の出来事は、まだ決着していない可能性がある
    if (event.year === c.year) return 'この年に起きる';

    // 居合わせなかったぶんは、世界の側が勝手に片づけている
    const settled = outcomeOf(ensureWorld(c), event.id);
    if (!settled) return 'そのとおり（あなたは居合わせなかった）';
    // 史書と同じ文面をもう一度読ませても意味がない
    if (settled.text === event.record) return '居合わせず。史書のとおりに終わった';
    return `居合わせず。${settled.text}`;
  }

  private divergedAt(event: HistoryEvent, c: Chronicle): boolean {
    return c.deeds.some((d: Deed) => d.eventId === event.id && d.diverged === true);
  }

  private get divergenceCount(): number {
    return this.app.state.deeds.filter((d) => d.diverged).length;
  }

  update(dt: number, input: Input): void {
    this.time += dt;
    if (input.isDown('down')) this.scroll += dt * 0.02;
    if (input.isDown('up')) this.scroll -= dt * 0.02;
    this.scroll = Math.max(0, Math.min(this.scroll, this.maxScroll));

    let key: GameKey | null;
    while ((key = input.consume()) !== null) {
      if (key === 'left' || key === 'right') {
        audio.sfx('cursor');
        const step = key === 'right' ? 1 : -1;
        const at = PAGE_ORDER.indexOf(this.page);
        this.page = PAGE_ORDER[(at + step + PAGE_ORDER.length) % PAGE_ORDER.length]!;
        this.scroll = 0;
        this.notice = '';
        if (this.page === 'record') this.buildRecordMenu();
        return;
      }

      if (this.page === 'record') {
        if (key === 'confirm') {
          this.onRecordChoice();
          return;
        }
        if (key === 'cancel') {
          audio.sfx('cancel');
          this.app.scenes.pop();
          return;
        }
        if (this.recordMenu.move(key)) audio.sfx('cursor');
        continue;
      }

      if (key === 'confirm') {
        // 年表から人へ。事件の裏にいた者を、その場で引ける
        audio.sfx('confirm');
        this.app.scenes.push(new LoreScene(this.app));
        return;
      }
      if (key === 'cancel') {
        audio.sfx('cancel');
        this.app.scenes.pop();
        return;
      }
    }
  }

  private get visibleRows(): number {
    return 11;
  }

  // ------------------------------------------------------------ 手控え

  private buildRecordMenu(): void {
    this.recordMenu.setItems([
      { label: '記録を残す', value: 'save' },
      { label: '記録を残して、初めの画面へ', value: 'save_title' },
      { label: '記録を残さずに、初めの画面へ', value: 'title' },
      { label: '閉じる', value: 'close' },
    ]);
  }

  private onRecordChoice(): void {
    const value = this.recordMenu.selected?.value;
    audio.sfx('confirm');

    if (value === 'close') {
      this.app.scenes.pop();
      return;
    }
    if (value === 'save' || value === 'save_title') {
      const ok = this.app.save();
      this.notice = ok ? '記録を残した。' : '記録を残せなかった。';
      if (!ok) audio.sfx('cancel');
      if (value === 'save') return;
      if (!ok) return;
    }
    this.app.returnToTitle?.();
  }

  private renderRecord(ctx: CanvasRenderingContext2D): void {
    const c = this.app.state;
    backdrop(ctx, SCREEN_W, SCREEN_H);
    heading(ctx, '手控え', 16, 16, 22);

    panel(ctx, 16, 52, SCREEN_W - 32, 146);
    const who = this.app.who;
    drawText(ctx, `${who.name}　${c.year}年`, 36, 68, { size: 15, color: INK.text });
    drawText(
      ctx,
      `兵 ${c.troops}　金 ${c.gold}　名声 ${c.renown}　配下 ${c.roster.length}`,
      36,
      94,
      { size: 12, color: INK.dim },
    );

    // この遊びが何を数えているかを、遊んでいる最中にも出しておく。
    // 結びで初めて知らされたのでは、目指しようがない
    const tally = tallyOf(c);
    drawText(ctx, '見届けた生涯', 36, 120, { size: 12, color: INK.dim });
    drawText(ctx, `${tally.witnessed} / ${tally.witnessable}`, 150, 120, {
      size: 13,
      color: tally.witnessed > 0 ? INK.accent : INK.dim,
    });
    drawText(ctx, '史書に無い事柄', 260, 120, { size: 12, color: INK.dim });
    drawText(ctx, `${tally.divergence}`, 380, 120, {
      size: 13,
      color: tally.divergence > 0 ? INK.jade : INK.dim,
    });
    drawText(ctx, `残した事跡　${c.deeds.length}　　世の終わりまで ${LAST_YEAR - c.year}年`, 36, 146, {
      size: 12,
      color: INK.dim,
    });
    drawText(ctx, '生涯は、町で「生涯を聞く」か人物事典で読むと数に入る。', 36, 170, {
      size: 11,
      color: INK.dim,
    });

    // 連れている者と、その心。誰がどんな目で主を見ているか
    if (c.roster.length > 0) {
      drawText(ctx, '従いし者', 470, 68, { size: 12, color: INK.dim });
      c.roster.slice(0, 5).forEach((id, i) => {
        const who = OFFICERS[id];
        if (!who) return;
        const heart = heartOf(c, id);
        const ry = 90 + i * 20;
        drawText(ctx, who.name, 470, ry, { size: 12, color: INK.text });
        drawText(ctx, heartLabel(heart), SCREEN_W - 36, ry, {
          size: 11,
          align: 'right',
          color: heart >= 55 ? INK.jade : heart > HEART_LEAVING ? INK.dim : INK.blood,
        });
      });
      if (c.roster.length > 5) {
        drawText(ctx, `ほか ${c.roster.length - 5}人`, 470, 190, { size: 10, color: INK.dim });
      }
    }

    panel(ctx, 16, 210, SCREEN_W - 32, SCREEN_H - 290);
    this.recordMenu.draw(ctx, 44, 230, SCREEN_W - 88, {
      size: 15,
      lineHeight: 30,
      blink: 0.55 + 0.45 * Math.sin(this.time / 160),
    });

    if (this.notice) {
      drawText(ctx, this.notice, SCREEN_W / 2, SCREEN_H - 74, {
        size: 13,
        align: 'center',
        color: INK.accent,
      });
    }
    drawText(ctx, '左右で年代記へ　　X: 閉じる', SCREEN_W / 2, SCREEN_H - 30, {
      size: 12,
      align: 'center',
      color: INK.dim,
    });
  }

  private get maxScroll(): number {
    if (this.page === 'record') return 0;
    if (this.page === 'realm') return Math.max(0, this.newsRows.length - 8);
    return Math.max(0, this.rows.length - this.visibleRows);
  }

  private get newsRows(): WorldNews[] {
    return recentNews(ensureWorld(this.app.state), 80);
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (this.page === 'record') {
      this.renderRecord(ctx);
      return;
    }
    if (this.page === 'realm') {
      this.renderRealm(ctx);
      return;
    }
    this.renderAnnals(ctx);
  }

  // ------------------------------------------------------------ 世情

  /** いまの天下。誰がどれだけ持っていて、この頃どんな報せが流れたか。 */
  private renderRealm(ctx: CanvasRenderingContext2D): void {
    const c = this.app.state;
    const world = ensureWorld(c);
    backdrop(ctx, SCREEN_W, SCREEN_H);
    heading(ctx, '世情', 16, 16, 22);
    drawText(ctx, `${c.year}年`, SCREEN_W - 16, 20, {
      size: 14,
      align: 'right',
      color: INK.accent,
    });

    // ---- 版図
    const powers = powersAt(world, c.year).filter((p) => p.factionId !== 'ronin');
    const total = powers.reduce((sum, p) => sum + p.cities.length, 0) || 1;
    panel(ctx, 16, 52, SCREEN_W - 32, 132);
    drawText(ctx, '天下の分かれよう', 36, 64, { size: 12, color: INK.dim });

    let py = 86;
    for (const power of powers.slice(0, 5)) {
      const width = Math.round(((SCREEN_W - 220) * power.cities.length) / total);
      ctx.fillStyle = power.color;
      ctx.fillRect(120, py + 2, Math.max(3, width), 10);
      drawText(ctx, power.name, 110, py, {
        size: 13,
        align: 'right',
        color: power.factionId === c.factionId ? INK.accent : INK.text,
      });
      drawText(ctx, `${power.cities.length}城`, SCREEN_W - 40, py, {
        size: 11,
        align: 'right',
        color: INK.dim,
      });
      py += 19;
    }
    if (powers.length === 0) {
      drawText(ctx, '旗を立てる者なし', 120, py, { size: 13, color: INK.dim });
    }

    // ---- 報せ
    panel(ctx, 16, 192, SCREEN_W - 32, SCREEN_H - 236);
    drawText(ctx, '風の便り', 36, 204, { size: 12, color: INK.dim });
    rule(ctx, 36, 220, SCREEN_W - 72);

    const news = this.newsRows;
    if (news.length === 0) {
      drawText(ctx, 'まだ、これといった報せはない。', 40, 236, { size: 13, color: INK.dim });
    }
    let ny = 234;
    for (const item of news.slice(Math.floor(this.scroll), Math.floor(this.scroll) + 8)) {
      drawText(ctx, `${item.year}年`, 40, ny, { size: 11, color: INK.dim });
      wrapText(item.text, SCREEN_W - 150, 13)
        .slice(0, 1)
        .forEach((line) => drawText(ctx, line, 92, ny - 1, { size: 13, color: NEWS_COLOR[item.kind] }));
      ny += 24;
    }

    drawText(ctx, '左右で頁を繰る　決定: 人物事典　　X: 閉じる', SCREEN_W / 2, SCREEN_H - 30, {
      size: 12,
      align: 'center',
      color: INK.dim,
    });
  }

  // ------------------------------------------------------------ 年代記

  private renderAnnals(ctx: CanvasRenderingContext2D): void {
    backdrop(ctx, SCREEN_W, SCREEN_H);
    heading(ctx, '年代記', 16, 16, 22);
    drawText(ctx, `史実との差　${this.divergenceCount}`, SCREEN_W - 16, 20, {
      size: 14,
      align: 'right',
      color: this.divergenceCount > 0 ? INK.jade : INK.dim,
    });

    panel(ctx, 16, 52, SCREEN_W - 32, SCREEN_H - 96);

    let y = 68;
    const start = Math.floor(this.scroll);
    for (const row of this.rows.slice(start, start + this.visibleRows)) {
      if (row.kind === 'blank') {
        y += 10;
        continue;
      }
      if (row.kind === 'year') {
        drawText(ctx, row.text, 36, y, {
          size: 17,
          color: row.future ? INK.dim : INK.accent,
        });
        rule(ctx, 36, y + 22, SCREEN_W - 72);
        y += 32;
        continue;
      }

      // 事件：史実と現状を並べる
      const event = ALL_EVENTS.find((e) => e.name === row.text);
      drawText(ctx, row.text, 48, y, {
        size: 14,
        color: row.future ? INK.dim : INK.text,
      });
      y += 20;

      if (event) {
        // どこで起きるか。行き先の手がかりになる。
        const place = placeOf(event.id);
        if (place) {
          drawText(ctx, PROVINCE_BY_ID[place]?.name ?? '', SCREEN_W - 48, y - 20, {
            size: 11,
            align: 'right',
            color: INK.water,
          });
        }
        drawText(ctx, '史実', 64, y, { size: 11, color: INK.dim });
        wrapText(event.record, SCREEN_W - 180, 12)
          .slice(0, 1)
          .forEach((line) => drawText(ctx, line, 100, y, { size: 12, color: INK.dim }));
        y += 18;
      }

      drawText(ctx, '現状', 64, y, { size: 11, color: row.diverged ? INK.jade : INK.dim });
      drawText(ctx, row.diverged ? '●' : '○', 88, y, {
        size: 11,
        color: row.diverged ? INK.jade : INK.dim,
      });
      wrapText(row.actual ?? '', SCREEN_W - 190, 12)
        .slice(0, 1)
        .forEach((line) =>
          drawText(ctx, line, 104, y, {
            size: 12,
            color: row.diverged ? INK.jade : INK.dim,
          }),
        );
      y += 24;
    }

    drawText(ctx, '上下で読む　左右で頁を繰る　決定: 人物事典　　X: 閉じる', SCREEN_W / 2, SCREEN_H - 30, {
      size: 12,
      align: 'center',
      color: INK.dim,
    });
  }
}
