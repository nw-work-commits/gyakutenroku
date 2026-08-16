/** 武将を選ぶ。名前の出る者は誰でも選べる、という方針の入口。 */

import { audio } from '../../engine/audio';
import type { GameKey, Input } from '../../engine/input';
import type { Scene } from '../../engine/scene';
import { Menu, SCREEN_W, drawText, wrapText } from '../../engine/ui';
import type { ChronicleApp } from '../app';
import { abilitiesAt, ageAt, currentAbilities, lifeStage } from '../abilities';
import { escapeConditions } from '../biography';
import { FACTIONS } from '../data/factions';
import { ROLES } from '../data/roles';
import { ALL_OFFICERS, allegianceOf } from '../registry';
import type { Officer } from '../types';
import { INK, backdrop, blink, heading, panel, rule } from './theme';
import { LoreScene } from './lore';
import { PrologueScene } from './prologue';

const FATE_LABEL: Record<string, string> = {
  battle: '戦死',
  execution: '処刑',
  illness: '病没',
  assassination: '暗殺',
  longevity: '天寿',
};

const LIST_X = 16;
const LIST_Y = 74;
const LIST_W = 258;
const LIST_H = 386;
const DETAIL_X = 288;
const DETAIL_W = SCREEN_W - DETAIL_X - 16;

export class SelectScene implements Scene {
  private menu = new Menu([], 1, 12);
  private factions: { id: string; name: string }[] = [];
  private factionIndex = 0;
  private time = 0;

  constructor(private app: ChronicleApp) {}

  onEnter(): void {
    this.app.input.flush();
    const used = new Set(ALL_OFFICERS.map((o) => allegianceOf(o)[0]!.factionId));
    this.factions = [
      { id: '', name: 'すべて' },
      ...[...used].map((id) => ({ id, name: FACTIONS[id]?.name ?? id })),
    ];
    this.rebuild();
  }

  private get filtered(): Officer[] {
    const factionId = this.factions[this.factionIndex]?.id ?? '';
    const list = factionId
      ? ALL_OFFICERS.filter((o) => allegianceOf(o).some((a) => a.factionId === factionId))
      : [...ALL_OFFICERS];
    return list.sort((a, b) => {
      const ya = allegianceOf(a)[0]!.from;
      const yb = allegianceOf(b)[0]!.from;
      return ya - yb || a.name.localeCompare(b.name, 'ja');
    });
  }

  private rebuild(): void {
    const list = this.filtered;
    this.menu.setItems(
      list.map((o) => ({
        label: o.name,
        value: o.id,
        right: `${allegianceOf(o)[0]!.from}`,
      })),
    );
  }

  private get selected(): Officer | undefined {
    const id = this.menu.selected?.value;
    return this.filtered.find((o) => o.id === id);
  }

  update(dt: number, input: Input): void {
    this.time += dt;
    let key: GameKey | null;
    while ((key = input.consume()) !== null) {
      if (key === 'cancel') {
        audio.sfx('cancel');
        this.app.scenes.pop();
        return;
      }
      if (this.asking) {
        this.answer(key);
        return;
      }
      if (key === 'confirm') {
        const who = this.selected;
        if (!who) return;
        audio.sfx('confirm');
        // その生涯を歩む前に、その生涯を読める。
        // 知ってから選ぶのと、知らずに選ぶのと、どちらも遊び方として残す。
        this.asking = true;
        this.askMenu.setItems([
          { label: `${who.name}の生涯を読む`, value: 'lore' },
          { label: 'この者として歩む', value: 'begin' },
          { label: 'やめる', value: 'close' },
        ]);
        return;
      }
      if (key === 'left' || key === 'right') {
        const step = key === 'left' ? -1 : 1;
        this.factionIndex =
          (this.factionIndex + step + this.factions.length) % this.factions.length;
        this.menu.index = 0;
        this.rebuild();
        audio.sfx('cursor');
        continue;
      }
      if (this.menu.move(key)) audio.sfx('cursor');
    }
  }

  // ------------------------------------------------------------ 読むか、歩むか

  private asking = false;
  private askMenu = new Menu([], 1);

  private answer(key: GameKey): void {
    if (key === 'cancel') {
      audio.sfx('cancel');
      this.asking = false;
      return;
    }
    if (key !== 'confirm') {
      if (this.askMenu.move(key)) audio.sfx('cursor');
      return;
    }
    const value = this.askMenu.selected?.value;
    const who = this.selected;
    this.asking = false;
    audio.sfx('confirm');
    if (!who || value === 'close') return;

    if (value === 'lore') {
      this.app.scenes.push(new LoreScene(this.app, who));
      return;
    }
    this.app.begin(who);
    this.app.scenes.replace(new PrologueScene(this.app));
  }

  private drawAsk(ctx: CanvasRenderingContext2D): void {
    const h = 24 + this.askMenu.items.length * 30;
    const y = 300;
    panel(ctx, 120, y, SCREEN_W - 240, h);
    this.askMenu.draw(ctx, 148, y + 14, SCREEN_W - 296, {
      size: 15,
      lineHeight: 28,
      blink: blink(this.time),
    });
  }

  render(ctx: CanvasRenderingContext2D): void {
    backdrop(ctx, SCREEN_W, 480);
    heading(ctx, '誰の生涯を歩むか', 16, 20, 22);

    const faction = this.factions[this.factionIndex];
    drawText(ctx, `◀ ${faction?.name ?? ''} ▶`, SCREEN_W - 16, 26, {
      size: 15,
      align: 'right',
      color: INK.accent,
    });
    drawText(ctx, `${this.filtered.length}人`, SCREEN_W - 16, 48, {
      size: 12,
      align: 'right',
      color: INK.dim,
    });

    panel(ctx, LIST_X, LIST_Y, LIST_W, LIST_H);
    this.menu.draw(ctx, LIST_X + 18, LIST_Y + 16, LIST_W - 34, {
      size: 16,
      lineHeight: 30,
      blink: blink(this.time),
    });

    panel(ctx, DETAIL_X, LIST_Y, DETAIL_W, LIST_H);
    this.drawDetail(ctx, DETAIL_X + 20, LIST_Y + 18, DETAIL_W - 40);
    if (this.asking) this.drawAsk(ctx);
  }

  private drawDetail(ctx: CanvasRenderingContext2D, x: number, y: number, w: number): void {
    const who = this.selected;
    if (!who) return;
    const startYear = allegianceOf(who)[0]!.from;
    // 開始時に実際に振るえる力と、いずれ届く完成形の両方を見せる
    const ab = abilitiesAt(who, startYear, 0);
    const peak = currentAbilities(who, 0);

    drawText(ctx, who.name, x, y, { size: 26, color: INK.text });
    if (who.courtesy) {
      drawText(ctx, `字 ${who.courtesy}`, x + w, y + 8, { size: 13, color: INK.dim, align: 'right' });
    }
    if (who.epithet) {
      drawText(ctx, `「${who.epithet}」`, x, y + 34, { size: 13, color: INK.accent });
    }

    const first = allegianceOf(who)[0]!;
    drawText(
      ctx,
      `${ROLES[who.roleId]?.name ?? who.roleId}　${FACTIONS[first.factionId]?.name ?? ''}`,
      x,
      y + 58,
      { size: 13, color: INK.dim },
    );
    drawText(
      ctx,
      `${first.from}年に ${ageAt(who, startYear)}歳（${lifeStage(who, startYear)}）　〜${who.died}年`,
      x,
      y + 78,
      { size: 13, color: INK.dim },
    );

    rule(ctx, x, y + 102, w);

    // 能力値。濃い棒が「いま」、薄い棒が「いずれ届く高さ」。
    const stats: [string, number, number][] = [
      ['武力', ab.war, peak.war],
      ['知力', ab.intel, peak.intel],
      ['統率', ab.lead, peak.lead],
      ['機動', ab.mobility, peak.mobility],
      ['徳', ab.virtue, peak.virtue],
    ];
    stats.forEach(([label, value, top], i) => {
      const ry = y + 116 + i * 26;
      drawText(ctx, label, x, ry, { size: 14, color: INK.dim });
      drawText(ctx, `${value}`, x + 62, ry, { size: 15, align: 'right', color: INK.text });
      if (top !== value) {
        drawText(ctx, `→${top}`, x + 96, ry + 2, { size: 11, align: 'right', color: INK.jade });
      }
      const barX = x + 104;
      const barW = w - 104;
      ctx.save();
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      ctx.fillRect(barX, ry + 5, barW, 7);
      ctx.fillStyle = 'rgba(111,174,138,0.35)';
      ctx.fillRect(barX, ry + 5, barW * (top / 100), 7);
      ctx.fillStyle = label === '徳' ? INK.jade : INK.accent;
      ctx.fillRect(barX, ry + 5, barW * (value / 100), 7);
      ctx.restore();
    });

    rule(ctx, x, y + 252, w);

    // 運命
    const fate = who.fate;
    if (!fate) {
      drawText(ctx, '定められた最期を持たない。', x, y + 264, { size: 14, color: INK.jade });
      return;
    }
    drawText(ctx, `運命　${fate.year}年　${FATE_LABEL[fate.kind] ?? fate.kind}`, x, y + 264, {
      size: 15,
      color: INK.blood,
    });
    if (fate.record) {
      wrapText(fate.record, w, 12)
        .slice(0, 2)
        .forEach((linetext, i) =>
          drawText(ctx, linetext, x, y + 288 + i * 17, { size: 12, color: INK.dim }),
        );
    }

    const conditions = escapeConditions(who);
    drawText(ctx, `抗う手だて ${conditions.length}つ`, x, y + 328, { size: 13, color: INK.accent });
    conditions.slice(0, 3).forEach((cond, i) => {
      drawText(ctx, `・${cond.label}`, x, y + 348 + i * 18, { size: 12, color: INK.dim });
    });
  }
}
