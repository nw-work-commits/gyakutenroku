/**
 * 人物事典。
 *
 * このゲームの主眼。誰の生涯でも、いつでも、ここから引ける。
 * 一覧で人を探し、決定でその者の伝を読む。
 *
 * 伝の中では、確かなことと推し量ったことを**色で分ける**。
 *   金 … 史書が伝えること
 *   灰 … 所属と年から導いたこと（その場にいたはず、というだけ）
 *   翠 … あなたが歩んだ道
 *
 * 遊びの途中から開いたときは、その者を演じているなら自分の記録が同じ列に混ざる。
 */

import { audio } from '../../engine/audio';
import type { GameKey, Input } from '../../engine/input';
import type { Scene } from '../../engine/scene';
import { Menu, SCREEN_H, SCREEN_W, drawText, wrapText } from '../../engine/ui';
import type { ChronicleApp } from '../app';
import { FACTIONS, factionsAt } from '../data/factions';
import { SOURCES, STANDING_LABEL, isHistorical } from '../data/sources';
import { witness } from '../ending';
import { lifeWithYours } from '../lore';
import type { Life, LifeLine } from '../lore';
import { ALL_OFFICERS, OFFICERS, allegianceOf } from '../registry';
import type { Officer } from '../types';
import { INK, backdrop, blink, heading, panel, rule } from './theme';

/**
 * 一行をどの色で出すか。
 *
 * 出典と、真実からの隔たりの両方で決まる。
 *   金  正史の記載        朱  演義の創作
 *   青  異説（裴注など）   橙  脚色
 *   灰  所属からの推測     翠  あなたの道
 */
function lineColor(line: LifeLine): string {
  if (line.certainty === 'yours') return INK.jade;
  if (line.certainty === 'inferred') return INK.dim;
  const source = line.attribution;
  if (!source) return INK.text;
  if (source.standing === 'invention') return INK.blood;
  if (source.standing === 'dramatized') return INK.accent;
  if (source.standing === 'variant') return INK.water;
  return INK.text;
}

/** 〔正史・関羽伝〕 のような、小さな出典の印。 */
function attributionTag(line: LifeLine): string | null {
  const source = line.attribution;
  if (!source) return null;
  const work = SOURCES[source.work];
  const parts = [work.tag];
  if (source.locus) parts.push(source.locus);
  if (source.standing !== 'record') parts.push(STANDING_LABEL[source.standing]);
  return `〔${parts.join('・')}〕`;
}

/**
 * 伝の本文に使える高さ。
 * 行の高さが揃っていない（事件の一文だけ小さい）ので、
 * 行数ではなく**入るぶんだけ**詰める。薄い伝が一画面で読み切れるのはこのため。
 */
const LIFE_TOP = 76;
const LIFE_BOTTOM = SCREEN_H - 124;

interface LifeRow {
  text: string;
  size: number;
  color: string;
  indent: number;
}

function rowHeight(row: LifeRow): number {
  return row.size >= 13 ? 22 : 17;
}

/** start 行目から、収まるだけ並べたときの行数。 */
function rowsThatFit(rows: LifeRow[], start: number): number {
  let used = 0;
  let count = 0;
  for (let i = start; i < rows.length; i++) {
    const h = rowHeight(rows[i]!);
    if (used + h > LIFE_BOTTOM - LIFE_TOP) break;
    used += h;
    count++;
  }
  return count;
}

type Mode = 'list' | 'life';

export class LoreScene implements Scene {
  private mode: Mode = 'list';
  /** 13行ずつ送る。Menu 自身が巻き取りを持っている。 */
  private menu = new Menu([], 1, 13);
  private time = 0;
  private scroll = 0;

  /** 勢力での絞り込み。null なら全員。 */
  private factionFilter: string | null = null;
  private filtered: Officer[] = [];
  private life: Life | null = null;

  /**
   * 伝を読んでいるとき、本文を追っているのか、人の名を選んでいるのか。
   * 決定で名前の列に降り、もう一度決定でその者へ渡る。
   */
  private focus: 'read' | 'links' = 'read';
  private linkIndex = 0;
  /** 辿ってきた道。X で一人ずつ戻る。 */
  private trail: Officer[] = [];

  constructor(
    private app: ChronicleApp,
    /** はじめから開いておきたい武将。町で話しかけたときなどに使う。 */
    private startWith: Officer | null = null,
  ) {}

  onEnter(): void {
    this.app.input.flush();
    this.rebuild();
    if (this.startWith) this.open(this.startWith);
  }

  // ------------------------------------------------------------ 一覧

  /** 絞り込みに使える勢力。年に関わらず、誰かが属していた旗はすべて出す。 */
  private get factionCycle(): (string | null)[] {
    const used = new Set<string>();
    for (const who of ALL_OFFICERS) {
      for (const entry of allegianceOf(who)) used.add(entry.factionId);
    }
    const ordered = factionsAt(9999)
      .concat(Object.values(FACTIONS))
      .filter((f) => used.has(f.id))
      .map((f) => f.id);
    return [null, ...[...new Set(ordered)]];
  }

  private rebuild(): void {
    this.filtered = ALL_OFFICERS.filter((who) => {
      if (!this.factionFilter) return true;
      return allegianceOf(who).some((a) => a.factionId === this.factionFilter);
    }).sort((a, b) => a.died - b.died);

    this.menu.setItems(
      this.filtered.map((who) => {
        // 正史にいない人物は、一覧の時点でそれと分かるようにしておく
        const source = who.attribution;
        const invented = source && !isHistorical(source.work, source.standing);
        const right = invented
          ? `${SOURCES[source.work].tag}のみ`
          : who.epithet
            ? `「${who.epithet}」`
            : (FACTIONS[allegianceOf(who)[0]!.factionId]?.name ?? '');
        // 一度でも生涯を読んだ者には印を付ける。
        // 何人ぶんを見届けたかがこの遊びの本題なので、
        // どこまで読んだかは、一覧の時点で見えていてほしい
        const seen = this.witnessed.has(who.id);
        return { label: `${seen ? '読 ' : '　 '}${who.name}`, value: who.id, right };
      }),
    );
  }

  /** すでに生涯を読んだ者。 */
  private get witnessed(): Set<string> {
    const c = this.app.chronicle;
    if (!c) return new Set();
    return new Set([...(c.met ?? []), ...c.roster]);
  }

  private cycleFaction(step: number): void {
    const cycle = this.factionCycle;
    const index = cycle.indexOf(this.factionFilter);
    const next = cycle[(index + step + cycle.length) % cycle.length] ?? null;
    this.factionFilter = next;
    this.rebuild();
  }

  private open(who: Officer): void {
    // 開いた伝は「見届けた」に数える。結びで讃えるのはこの数。
    // 題の画面から事典だけを開いたときは、まだ誰の一生でもないので数えない
    if (this.app.chronicle) witness(this.app.chronicle, who.id);
    this.life = lifeWithYours(who, this.app.chronicle);
    this.mode = 'life';
    this.scroll = 0;
    this.focus = 'read';
    this.linkIndex = 0;
  }

  /** いま読んでいる伝から辿れる者。 */
  private get links(): Officer[] {
    return (this.life?.mentions ?? [])
      .map((id) => OFFICERS[id])
      .filter((o): o is Officer => Boolean(o));
  }

  /** 名前を辿って、その者の伝へ渡る。来た道は覚えておく。 */
  private follow(who: Officer): void {
    const current = this.life ? OFFICERS[this.life.officerId] : undefined;
    if (current) this.trail.push(current);
    audio.sfx('confirm');
    this.open(who);
  }

  /**
   * ひとつ戻る。辿ってきた道があればそこへ、無ければ一覧へ。
   * 一人だけを見に来たとき（町で話しかけたなど）は、そのまま画面を閉じる。
   */
  private goBack(): void {
    audio.sfx('cancel');
    const previous = this.trail.pop();
    if (previous) {
      this.open(previous);
      return;
    }
    if (this.startWith) {
      this.app.scenes.pop();
      return;
    }
    this.mode = 'list';
  }

  // ------------------------------------------------------------ 更新

  update(dt: number, input: Input): void {
    this.time += dt;

    // 名前を選んでいるあいだは、上下は本文送りに使わない
    if (this.mode === 'life' && this.focus === 'read') {
      if (input.isDown('down')) this.scroll += dt * 0.022;
      if (input.isDown('up')) this.scroll -= dt * 0.022;
      this.scroll = Math.max(0, Math.min(this.scroll, this.maxScroll));
    }

    let key: GameKey | null;
    while ((key = input.consume()) !== null) {
      if (this.mode === 'life') {
        this.handleLifeKey(key);
        return;
      }

      if (key === 'cancel') {
        audio.sfx('cancel');
        this.app.scenes.pop();
        return;
      }
      if (key === 'confirm') {
        const id = this.menu.selected?.value;
        const who = this.filtered.find((o) => o.id === id);
        if (who) {
          audio.sfx('confirm');
          this.open(who);
        }
        return;
      }
      if (key === 'left' || key === 'right') {
        audio.sfx('cursor');
        this.cycleFaction(key === 'right' ? 1 : -1);
        return;
      }
      if (this.menu.move(key)) audio.sfx('cursor');
    }
  }

  /** 伝を読んでいるあいだのキー。 */
  private handleLifeKey(key: GameKey): void {
    const links = this.links;

    if (this.focus === 'links') {
      if (key === 'cancel') {
        audio.sfx('cancel');
        this.focus = 'read';
        return;
      }
      if (key === 'confirm') {
        const who = links[this.linkIndex];
        if (who) this.follow(who);
        return;
      }
      if (key === 'left' || key === 'right') {
        if (links.length === 0) return;
        const step = key === 'right' ? 1 : -1;
        this.linkIndex = (this.linkIndex + step + links.length) % links.length;
        audio.sfx('cursor');
      }
      return;
    }

    if (key === 'cancel') {
      this.goBack();
      return;
    }
    if (key === 'confirm' && links.length > 0) {
      audio.sfx('cursor');
      this.focus = 'links';
      this.linkIndex = 0;
    }
  }

  private get maxScroll(): number {
    if (!this.life) return 0;
    // 末尾まで収まる、いちばん手前の行を上限にする
    const rows = this.lifeRows;
    for (let start = 0; start < rows.length; start++) {
      if (start + rowsThatFit(rows, start) >= rows.length) return start;
    }
    return Math.max(0, rows.length - 1);
  }

  // ------------------------------------------------------------ 描画

  render(ctx: CanvasRenderingContext2D): void {
    backdrop(ctx, SCREEN_W, SCREEN_H);
    if (this.mode === 'life' && this.life) {
      this.renderLife(ctx, this.life);
      return;
    }
    this.renderList(ctx);
  }

  private renderList(ctx: CanvasRenderingContext2D): void {
    heading(ctx, '人物事典', 16, 16, 22);
    const name = this.factionFilter ? (FACTIONS[this.factionFilter]?.name ?? '') : 'すべて';
    drawText(ctx, `◀ ${name} ▶`, SCREEN_W - 16, 20, {
      size: 14,
      align: 'right',
      color: INK.accent,
    });
    // どこまで読んだか。一生ぶんの数え上げを、読んでいる最中にも出す
    const seen = this.filtered.filter((who) => this.witnessed.has(who.id)).length;
    drawText(
      ctx,
      this.app.chronicle
        ? `${this.filtered.length}人　うち見届けた ${seen}人`
        : `${this.filtered.length}人`,
      SCREEN_W - 16,
      42,
      { size: 11, align: 'right', color: seen > 0 ? INK.accent : INK.dim },
    );

    panel(ctx, 16, 56, SCREEN_W - 32, SCREEN_H - 100);
    this.menu.draw(ctx, 36, 72, SCREEN_W - 72, {
      size: 15,
      lineHeight: 26,
      blink: blink(this.time),
    });

    drawText(ctx, '決定: 伝を読む　左右: 勢力で絞る　X: 閉じる', SCREEN_W / 2, SCREEN_H - 30, {
      size: 12,
      align: 'center',
      color: INK.dim,
    });
  }

  /** 伝の本文を、描く前に一列の行にならす。 */
  private get lifeRows(): LifeRow[] {
    const life = this.life;
    if (!life) return [];
    const rows: LifeRow[] = [];
    const push = (text: string, color: string, size = 13, indent = 0) =>
      rows.push({ text, size, color, indent });

    for (const line of life.opening) {
      for (const wrapped of wrapText(line, SCREEN_W - 110, 13)) push(wrapped, INK.text);
    }
    push('', INK.dim);

    if (life.years.length > 0) {
      push('年譜', INK.accent, 12);
      for (const entry of life.years) {
        const color = lineColor(entry);
        const mark = entry.certainty === 'inferred' ? '　' : entry.certainty === 'yours' ? '＊' : '・';
        const tag = entry.certainty === 'yours' ? null : attributionTag(entry);
        push(`${entry.year}年　${mark}${entry.text}${tag ? ` ${tag}` : ''}`, color, 13, 0);
        if (entry.note) {
          for (const wrapped of wrapText(entry.note, SCREEN_W - 190, 11)) {
            push(wrapped, INK.dim, 11, 1);
          }
        }
        // 史実と隔たりのある話は、正史のほうも並べる。ここが勉強の要。
        const truly = entry.attribution?.insteadTruly;
        if (truly) {
          for (const wrapped of wrapText(`正史では——${truly}`, SCREEN_W - 190, 11)) {
            push(wrapped, INK.water, 11, 1);
          }
        }
      }
      push('', INK.dim);
    }

    push('最期', INK.accent, 12);
    for (const line of life.closing) {
      for (const wrapped of wrapText(line, SCREEN_W - 110, 13)) push(wrapped, INK.text);
    }

    if (life.silences.length > 0) {
      push('', INK.dim);
      push('史書が伝えないこと', INK.blood, 12);
      for (const line of life.silences) {
        for (const wrapped of wrapText(line, SCREEN_W - 110, 12)) push(wrapped, INK.dim, 12);
      }
    }

    return rows;
  }

  private renderLife(ctx: CanvasRenderingContext2D, life: Life): void {
    heading(ctx, life.name, 16, 16, 24);
    drawText(ctx, life.courtesy, 16 + 30 + life.name.length * 24, 24, {
      size: 12,
      color: INK.dim,
    });
    drawText(ctx, life.span, SCREEN_W - 16, 18, {
      size: 12,
      align: 'right',
      color: INK.accent,
    });
    // 伝わりの厚さ。史書にどれだけ残っている人物か
    drawText(ctx, '●'.repeat(life.attestation) + '○'.repeat(5 - life.attestation), SCREEN_W - 16, 38, {
      size: 10,
      align: 'right',
      color: INK.dim,
    });

    panel(ctx, 16, 56, SCREEN_W - 32, LIFE_BOTTOM - 56 + 8);
    rule(ctx, 36, 66, SCREEN_W - 72);

    const rows = this.lifeRows;
    // 本文の長さは伝ごとに違う。送りすぎたまま切り替わっても空白にならないよう、ここでも締める
    const start = Math.max(0, Math.min(Math.floor(this.scroll), this.maxScroll));
    let y = LIFE_TOP;
    for (const row of rows.slice(start, start + rowsThatFit(rows, start))) {
      if (row.text) {
        drawText(ctx, row.text, 40 + row.indent * 28, y, { size: row.size, color: row.color });
      }
      y += rowHeight(row);
    }

    this.drawLinks(ctx);

    const legend =
      this.app.chronicle?.officerId === life.officerId
        ? '金:正史　青:異説　橙:脚色　朱:創作　灰:推測　翠:あなたの道'
        : '金:正史　青:異説　橙:脚色　朱:創作　灰:所属と年からの推測';
    drawText(ctx, legend, SCREEN_W / 2, SCREEN_H - 52, {
      size: 10,
      align: 'center',
      color: INK.dim,
    });

    const hint =
      this.focus === 'links'
        ? '左右で選ぶ　決定: その者の伝へ　X: 本文にもどる'
        : this.links.length > 0
          ? `上下で読み進める　決定: 名を辿る　X: ${this.trail.length > 0 ? '来た道へ' : 'もどる'}`
          : '上下で読み進める　　X: もどる';
    drawText(ctx, hint, SCREEN_W / 2, SCREEN_H - 30, {
      size: 12,
      align: 'center',
      color: INK.dim,
    });
  }

  /**
   * 伝に出てくる人の名を横に並べる。
   * 一人の生涯は必ず他の誰かと絡むので、ここから隣の伝へ渡っていける。
   */
  private drawLinks(ctx: CanvasRenderingContext2D): void {
    const links = this.links;
    if (links.length === 0) return;

    const y = LIFE_BOTTOM + 14;
    const active = this.focus === 'links';
    drawText(ctx, '登場', 24, y, { size: 10, color: active ? INK.accent : INK.dim });

    // 選んでいる者が必ず見えるように、その前後だけを出す
    const room = 7;
    const start = Math.max(0, Math.min(this.linkIndex - 3, links.length - room));
    let x = 76;
    links.slice(start, start + room).forEach((who, i) => {
      const index = start + i;
      const chosen = active && index === this.linkIndex;
      if (chosen) {
        drawText(ctx, '▶', x - 12, y, { size: 11, color: INK.accent });
      }
      drawText(ctx, who.name, x, y, {
        size: 12,
        color: chosen ? INK.accent : active ? INK.text : INK.dim,
        alpha: chosen ? blink(this.time) : 1,
      });
      x += who.name.length * 13 + 18;
    });
    if (start + room < links.length) {
      drawText(ctx, `ほか${links.length - start - room}`, x, y, { size: 10, color: INK.dim });
    }

    // 辿ってきた道の深さ
    if (this.trail.length > 0) {
      drawText(ctx, `${this.trail.map((o) => o.name).join(' › ')} ›`, SCREEN_W - 28, 40, {
        size: 10,
        align: 'right',
        color: INK.dim,
      });
    }
  }
}
