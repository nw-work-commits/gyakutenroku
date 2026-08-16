/**
 * 部隊戦の画面。編成 → 命令 → 解決を繰り返し、一騎討ちを挟む。
 * 一騎討ちの消耗は戦のあいだ持ち越されるので、代わる代わる挑めば格上も削れる。
 */

import { chance, pick, randFloat } from '../../engine/rng';
import { audio } from '../../engine/audio';
import type { GameKey, Input } from '../../engine/input';
import type { Scene } from '../../engine/scene';
import { Menu, SCREEN_H, SCREEN_W, drawGauge, drawText, wrapText } from '../../engine/ui';
import type { ChronicleApp } from '../app';
import { abilitiesAt } from '../abilities';
import { ROLES } from '../data/roles';
import { UNITS, recruitableIn, unitType } from '../data/units';
import { OFFICERS, allegianceOf } from '../registry';
import { morale as moraleOf } from '../rules';
import { regimentSlots, stirRetinue } from '../runner';
import { ensureWorld, slay } from '../systems/world';
import { aptitudeNote, aptitudeOf, aptitudeTable } from '../systems/aptitude';
import { HEART_LEAVING, heartLabel, heartOf } from '../systems/hearts';
import {
  CAPTIVE_FATE_TEXT,
  DUEL_MORALE,
  DuelBook,
  decideCaptiveFate,
  renownForDuel,
  runBouts,
  startDuel,
  willAcceptDuel,
  withdrawFromDuel,
} from '../systems/duel';
import type { DuelState } from '../systems/duel';
import {
  ALIVE,
  STRATAGEMS,
  collapseUnder,
  formRegiments,
  isDefeated,
  resolveOrder,
  shiftMorale,
  commanderNameOf,
  survivingTroops,
  updateRegimentView,
} from '../systems/war';
import type { Order, Side } from '../systems/war';
import type { Abilities, Officer, OrderId, Regiment } from '../types';
import { FACTIONS } from '../data/factions';
import { drawDuelist } from './duelists';
import { LoreScene } from './lore';
import { battleGround } from '../data/world/terrain';
import { drawBattlefield as drawField } from './scenery';
import { drawCompany } from './troops';
import { INK, backdrop, blink, heading, panel, rule } from './theme';

export interface WarOptions {
  enemies: string[];
  escapable: boolean;
  /** 表示用の名前。 */
  eventName: string;
  /** 勝敗フラグを立てるためのID。運命の回避条件がこれを見る。 */
  eventId: string;
  /**
   * 敵の頭数。省略すればこちらの手勢に合わせる。
   * 賊の砦のように「相手の規模が先に決まっている」戦だけが、これを渡す。
   */
  foeTroops?: number;
  /**
   * 戦場の地形。世界地図で立っていたマスの一文字。
   * 赤壁は水辺で、剣閣は山あいで戦うことになる。
   */
  terrain?: string;
}

/** 同じ兵科を分けたときの呼び分け。 */
const ORDINAL = ['一の', '二の', '三の', '四の', '五の'];

type Phase = 'compose' | 'captains' | 'order' | 'target' | 'stratagem' | 'resolve' | 'duel' | 'duelAsk' | 'end';

const ORDER_LABEL: Record<OrderId, string> = {
  charge: '突撃',
  volley: '斉射',
  guard: '守備',
  stratagem: '計略',
  duel: '一騎討ち',
  retreat: '退却',
};

export class WarScene implements Scene {
  private phase: Phase = 'compose';
  private time = 0;
  private log: string[] = [];

  private player!: Side;
  private foe!: Side;
  private foeOfficers: Officer[] = [];
  private book = new DuelBook();

  /** 編成 */
  private composeMenu = new Menu([], 1);
  private mix: { unitId: string; share: number }[] = [];
  /** 隊を預けられる者。先頭は自分。統率の高い順に隊長になる。 */
  private captains: string[] = [];

  /** 命令 */
  private regimentIndex = 0;
  private orderMenu = new Menu([], 1);
  private targetMenu = new Menu([], 1);
  private stratagemMenu = new Menu([], 1);
  private pendingOrders: Order[] = [];
  private queue: Order[] = [];
  private resolveTimer = 0;

  /** 一瞬だけ出る演出。 */
  private effects: {
    kind: 'slash' | 'arrow' | 'fire' | 'spark' | 'shade';
    x: number;
    y: number;
    tx: number;
    ty: number;
    t: number;
    life: number;
  }[] = [];

  /** 一騎討ち */
  private duel: DuelState | null = null;
  private duelFoe: Officer | null = null;
  /** こちらから出ている者。自分とは限らない。 */
  private duelMine: Officer | null = null;
  private duelLines: string[] = [];
  private duelMenu = new Menu([], 1);
  private duelAskText = '';
  private outcomeText = '';
  /** 刃が噛み合った残光。 */
  private duelClash = 0;
  /** 直前に打ち込んだ側。前に踏み込ませる。 */
  private duelAttacker: 'a' | 'b' = 'a';

  constructor(
    private app: ChronicleApp,
    private options: WarOptions,
  ) {}

  onEnter(): void {
    this.app.input.flush();
    audio.playBgm('battle');
    this.buildSides();

    // 兵がひとりもいなければ、編成のしようがない。
    // 空の編成画面に立たせて「出陣する」以外を選べなくするのは、行き止まりでしかない。
    if (this.app.state.troops <= 0) {
      this.endWithoutTroops();
      return;
    }
    this.openCompose();
  }

  /** 手勢が無いまま戦になったとき。逃げられるなら逃げ、逃げられないなら呑まれる。 */
  private endWithoutTroops(): void {
    const c = this.app.state;
    if (this.options.escapable) {
      this.outcomeText = '率いる兵がない。戦うどころではなく、その場を離れた。';
      c.flags[`retreated:${this.currentEventId}`] = true;
    } else {
      this.outcomeText = '率いる兵がない。なすすべもなく、呑まれた。';
      c.flags[`retreated:${this.currentEventId}`] = true;
    }
    this.phase = 'end';
    audio.sfx('cancel');
  }

  // ------------------------------------------------------------ 準備

  private buildSides(): void {
    const c = this.app.state;
    const who = this.app.who;
    const ab = abilitiesAt(who, c.year, c.virtueDelta);

    // 配下は隊長として前に出る。誰を連れているかが、そのまま部隊の強さになる。
    // 兵科の得手不得手もここで持たせる。同じ騎馬でも、預ける相手で速さが変わる
    const retinue: Record<
      string,
      { abilities: Abilities; name: string; aptitude: Record<string, number> }
    > = {
      [who.id]: { abilities: ab, name: who.name, aptitude: aptitudeTable(who, c.year) },
    };
    for (const id of c.roster) {
      const sub = OFFICERS[id];
      if (sub) {
        retinue[id] = {
          abilities: abilitiesAt(sub, c.year, 0),
          name: sub.name,
          aptitude: aptitudeTable(sub, c.year),
        };
      }
    }
    this.captains = [who.id, ...c.roster.filter((id) => OFFICERS[id])];

    this.player = {
      commander: ab,
      commanderName: who.name,
      regiments: [],
      // 士気は出ている者の最高の徳。配下を連れていれば、その徳も数える
      morale: moraleOf(Object.values(retinue).map((r) => r.abilities.virtue)),
      officers: retinue,
      commanderAptitude: aptitudeTable(who, c.year),
    };

    // 敵は武将IDか役柄ID。武将なら大将として立ち、一騎討ちの相手にもなる。
    this.foeOfficers = this.options.enemies
      .map((id) => OFFICERS[id])
      .filter((o): o is Officer => Boolean(o));

    const leader = this.foeOfficers[0];
    const foeAb = leader
      ? abilitiesAt(leader, c.year, 0)
      : { war: 55, intel: 40, lead: 45, mobility: 50, virtue: 40 };

    // 敵の規模はこちらの手勢に合わせる。
    // ここを敵将の統率だけで決めると、布衣で始めた者は必ず数に呑まれて何もできない。
    // 名のある敵の恐ろしさは頭数ではなく、一撃の重さと一騎討ちで出す。
    //
    // ただし賊の砦のように、相手の規模が先に決まっている戦もある。
    // そのときは合わせない。手に負えない一党は、手に負えないままでよい。
    const foeTroops =
      this.options.foeTroops ??
      Math.max(100, Math.round(Math.max(c.troops, 120) * (0.8 + this.foeOfficers.length * 0.3)));

    this.foe = {
      commander: foeAb,
      commanderName: leader?.name ?? this.roleName(this.options.enemies[0]),
      regiments: formRegiments(leader?.id ?? null, foeTroops, this.foeComposition(regimentSlots(c))),
      morale: moraleOf([foeAb.virtue]),
      officers: Object.fromEntries(
        this.foeOfficers.map((o) => [
          o.id,
          {
            abilities: abilitiesAt(o, c.year, 0),
            name: o.name,
            aptitude: aptitudeTable(o, c.year),
          },
        ]),
      ),
      commanderAptitude: leader ? aptitudeTable(leader, c.year) : undefined,
    };

    // 敵将が複数いるなら、隊ごとに分けて立たせる。
    // 全隊が同じ大将では、どの隊を崩しても同じ顔が出てくることになる
    this.foe.regiments.forEach((r, i) => {
      const o = this.foeOfficers[i % Math.max(1, this.foeOfficers.length)];
      if (o) r.officerId = o.id;
    });
  }

  /** 戦場の土地。兵科の効きと守りの固さがここから決まる。 */
  private get ground() {
    return battleGround(this.options.terrain ?? '.');
  }

  private roleName(id: string | undefined): string {
    if (!id) return '敵軍';
    return ROLES[id]?.name ?? '敵軍';
  }

  /**
   * 敵の隊数はこちらの隊数に合わせる。
   * 数で上回られると行動回数まで倍になり、何もできないまま終わってしまう。
   */
  private foeComposition(slots: number): { unitId: string; share: number }[] {
    const rotation = ['infantry', 'archer', 'cavalry', 'infantry'];
    return rotation.slice(0, Math.max(1, slots)).map((unitId, i) => ({
      unitId,
      share: i === 0 ? 3 : 2,
    }));
  }

  private openCompose(): void {
    const c = this.app.state;
    const slots = regimentSlots(c);
    const available = recruitableIn(c.factionId);
    // 兵科ごとに「何隊出すか」を選ぶ。同じ兵科を二隊に割って、
    // それぞれ別の将に預けることもできる。
    this.mix = available.slice(0, slots).map((u) => ({ unitId: u.id, share: 1 }));
    this.refreshCompose();
    this.phase = 'compose';
  }

  private refreshCompose(): void {
    const c = this.app.state;
    const available = recruitableIn(c.factionId);
    const ground = this.ground;
    const slots = regimentSlots(c);
    const used = this.mix.length;
    const each = used > 0 ? Math.round(c.troops / used) : 0;
    const items = available.map((u) => {
      const count = this.mix.filter((m) => m.unitId === u.id).length;
      // 土地の向き不向きを、選ぶ前に見せる
      const effect = ground.unit[u.id] ?? 1;
      const mark = effect >= 1.15 ? '　◎' : effect >= 1.05 ? '　○' : effect <= 0.6 ? '　✕' : effect < 0.95 ? '　△' : '';
      return {
        label: u.name + mark,
        value: u.id,
        right: count > 0 ? `${count}隊　${each * count}` : '—',
        desc: `${u.desc}
【${ground.name}】${ground.note}`,
      };
    });
    items.push({
      label: '　この編成で出陣する',
      value: ':go',
      right: `${used}／${slots}隊`,
      desc: '左右で隊の数を増減する。同じ兵科を二隊に分ければ、二人の将に預けられる。',
    });
    this.composeMenu.setItems(items);
  }

  // ------------------------------------------------------------ 入力

  /** 駒の位置。演出をどこに出すか決めるのに使う。 */
  private pieceAt(regiment: Regiment, mine: boolean): { x: number; y: number } {
    const list = mine ? this.player.regiments : this.foe.regiments;
    const index = Math.max(0, list.indexOf(regiment));
    const slot = (SCREEN_W - 60) / Math.max(1, list.length);
    return { x: 30 + slot * index + slot / 2, y: mine ? 202 : 78 };
  }

  private addEffect(
    kind: 'slash' | 'arrow' | 'fire' | 'spark' | 'shade',
    from: { x: number; y: number },
    to: { x: number; y: number },
    life = 420,
  ): void {
    this.effects.push({ kind, x: from.x, y: from.y, tx: to.x, ty: to.y, t: 0, life });
  }

  update(dt: number, input: Input): void {
    this.time += dt;

    // 駒の光り・揺れ・数字の浮き上がりを進める
    for (const r of [...this.player.regiments, ...this.foe.regiments]) {
      updateRegimentView(r, dt);
    }
    this.effects = this.effects.filter((fx) => (fx.t += dt) < fx.life);

    if (this.phase === 'resolve') {
      this.resolveTimer -= dt;
      if (input.consume() === 'confirm') this.resolveTimer = 0;
      if (this.resolveTimer <= 0) this.stepResolve();
      return;
    }
    if (this.duelClash > 0) this.duelClash = Math.max(0, this.duelClash - dt);

    if (this.phase === 'duel') {
      this.resolveTimer -= dt;
      if (input.consume() === 'confirm') this.resolveTimer = 0;
      if (this.resolveTimer <= 0) this.stepDuel();
      return;
    }

    let key: GameKey | null;
    while ((key = input.consume()) !== null) {
      switch (this.phase) {
        case 'compose':
          this.onComposeKey(key);
          break;
        case 'captains':
          this.onCaptainsKey(key);
          break;
        case 'order':
          this.onOrderKey(key);
          break;
        case 'target':
          this.onTargetKey(key);
          break;
        case 'stratagem':
          this.onStratagemKey(key);
          break;
        case 'duelAsk':
          this.onDuelAskKey(key);
          break;
        case 'end':
          if (key === 'confirm') {
            audio.sfx('confirm');
            this.finish();
            return;
          }
          break;
      }
      // 命令が解決や一騎討ちに移ったら、残りの入力は次のフェーズに渡さない
      if ((this.phase as Phase) === 'resolve' || (this.phase as Phase) === 'duel') return;
    }
  }

  private onComposeKey(key: GameKey): void {
    const value = this.composeMenu.selected?.value;

    // 編成の段でも退ける。挑んでから「勝てない」と分かることはあるし、
    // 引き返せない画面に閉じ込めるのが一番よくない。
    if (key === 'cancel' && this.options.escapable) {
      audio.sfx('cancel');
      this.outcomeText = '兵を退いた。戦う前に、この場を離れる。';
      this.app.state.flags[`retreated:${this.currentEventId}`] = true;
      this.phase = 'end';
      return;
    }

    if (key === 'confirm' && value === ':go') {
      const total = this.mix.reduce((s, m) => s + m.share, 0);
      if (total <= 0) {
        // 黙って弾かず、なぜ進めないかを言う
        this.say('どの兵科にも兵を割り振っていない。左右で割り振る。');
        audio.sfx('cancel');
        return;
      }
      audio.sfx('confirm');
      this.player.regiments = formRegiments(this.app.who.id, this.app.state.troops, this.mix);
      this.assignCaptains();
      // 連れている者がいるなら、誰にどの隊を預けるかを選ばせる
      if (this.captains.length > 1) {
        this.openCaptains();
        return;
      }
      this.beginTurn();
      return;
    }
    if ((key === 'left' || key === 'right') && value && value !== ':go') {
      // 右で一隊増やし、左で一隊減らす。兵は出した隊の数で等分される
      if (key === 'right') {
        if (this.mix.length >= regimentSlots(this.app.state)) {
          audio.sfx('cancel');
          return;
        }
        this.mix.push({ unitId: value, share: 1 });
      } else {
        const at = this.mix.map((m) => m.unitId).lastIndexOf(value);
        if (at < 0) {
          audio.sfx('cancel');
          return;
        }
        this.mix.splice(at, 1);
      }
      audio.sfx('cursor');
      this.refreshCompose();
      return;
    }
    if (this.composeMenu.move(key)) audio.sfx('cursor');
  }

  /**
   * 同じ兵科が二隊並ぶので、名で区別できるようにする。
   * 「歩兵隊」が二つあると、どちらに命じたのか分からなくなる。
   */
  private regimentLabel(regiment: Regiment, side: Side = this.player): string {
    const same = side.regiments.filter((r) => r.unitId === regiment.unitId);
    const name = unitType(regiment.unitId).name;
    if (same.length <= 1) return `${name}隊`;
    return `${ORDINAL[same.indexOf(regiment)] ?? ''}${name}隊`;
  }

  /**
   * 隊に隊長をあてがう。
   *
   * ただ統率順に並べるのではなく、兵科との相性まで見る。
   * 馬超がいるのに彼を歩兵に立たせては、連れてきた意味がない。
   * 一人が二隊は率いられないので、隊ごとに空いている者から最も合う者を取る。
   */
  private assignCaptains(): void {
    const side = this.player;
    const fitness = (id: string, unitId: string): number => {
      const o = side.officers?.[id];
      if (!o) return 0;
      const base = o.abilities.lead * 0.6 + o.abilities.war * 0.4;
      return base * (o.aptitude?.[unitId] ?? 1);
    };

    // 隊の順に「その隊で一番強い者」を取っていくと、先頭の隊が最強の者をさらう。
    // 馬超が歩兵の先頭に立ち、騎馬が余る——それでは適性を見た意味がない。
    // 組み合わせ全部を並べて、合いのよい対から順に決める。
    const pairs: { regiment: Regiment; id: string; score: number }[] = [];
    for (const r of side.regiments) {
      for (const id of this.captains) pairs.push({ regiment: r, id, score: fitness(id, r.unitId) });
    }
    pairs.sort((a, b) => b.score - a.score);

    const filled = new Set<Regiment>();
    const taken = new Set<string>();
    for (const p of pairs) {
      if (filled.has(p.regiment) || taken.has(p.id)) continue;
      p.regiment.officerId = p.id;
      filled.add(p.regiment);
      taken.add(p.id);
    }
    // 人が足りなければ、残りは大将が見る
    for (const r of side.regiments) {
      if (!filled.has(r)) r.officerId = this.app.who.id;
    }
  }

  // ------------------------------------------------------------ 隊長を決める

  private captainMenu = new Menu([], 1);

  private openCaptains(): void {
    this.refreshCaptains();
    this.phase = 'captains';
  }

  private refreshCaptains(): void {
    const side = this.player;
    const items = side.regiments.map((r, i) => {
      const id = r.officerId;
      const who = id ? OFFICERS[id] : undefined;
      const apt = who ? aptitudeOf(who, r.unitId, this.app.state.year) : null;
      const badge = apt && apt.tier !== 0 ? `（${apt.label}）` : '';
      return {
        label: `${this.regimentLabel(r)}　${r.troops}`,
        value: String(i),
        right: `${commanderNameOf(side, r)}${badge}`,
        desc: who
          ? [unitType(r.unitId).desc, aptitudeNote(who, r.unitId, this.app.state.year)]
              .filter(Boolean)
              .join('\n')
          : unitType(r.unitId).desc,
      };
    });
    items.push({
      label: '　この陣立てで出陣する',
      value: ':go',
      right: '',
      desc: '左右で隊長を替える。得手の兵科を預けるほど、その隊は強くなる。',
    });
    this.captainMenu.setItems(items);
  }

  private onCaptainsKey(key: GameKey): void {
    const value = this.captainMenu.selected?.value;

    if (key === 'cancel') {
      // 割り振りからやり直す
      audio.sfx('cancel');
      this.phase = 'compose';
      return;
    }
    if (key === 'confirm' && value === ':go') {
      audio.sfx('confirm');
      this.beginTurn();
      return;
    }
    if ((key === 'left' || key === 'right') && value && value !== ':go') {
      this.rotateCaptain(Number(value), key === 'right' ? 1 : -1);
      audio.sfx('cursor');
      this.refreshCaptains();
      return;
    }
    if (this.captainMenu.move(key)) audio.sfx('cursor');
  }

  /**
   * その隊の隊長を隣の者に替える。
   * 既に別の隊を率いていれば入れ替える。ひとりが二隊は率いられない。
   */
  private rotateCaptain(index: number, step: number): void {
    const side = this.player;
    const regiment = side.regiments[index];
    if (!regiment) return;

    const order = this.captains;
    const at = order.indexOf(regiment.officerId ?? '');
    const next = order[(at + step + order.length) % order.length];
    if (!next || next === regiment.officerId) return;

    const held = side.regiments.find((r) => r !== regiment && r.officerId === next);
    if (held) held.officerId = regiment.officerId;
    regiment.officerId = next;
  }

  /** 隊長の向き不向き。武力は突撃に、統率は守りに効く。 */
  private captainNote(id: string): string {
    const ab = this.player.officers?.[id]?.abilities;
    if (!ab) return '';
    if (ab.war >= 85 && ab.lead >= 85) return '攻めも守りも任せられる。';
    if (ab.war >= 85) return '斬り込ませたい。突撃と一騎討ちに向く。';
    if (ab.lead >= 80) return '守らせたい。崩れにくく、兵をよく保つ。';
    if (ab.intel >= 85) return '計略を任せたい。';
    return '取り立てて向き不向きは無い。';
  }

  private beginTurn(): void {
    this.pendingOrders = [];
    this.regimentIndex = -1;
    this.nextRegiment();
  }

  private nextRegiment(): void {
    const alive = this.player.regiments.filter(ALIVE);
    this.regimentIndex++;
    if (this.regimentIndex >= alive.length) {
      this.startResolve();
      return;
    }
    const regiment = alive[this.regimentIndex]!;
    const unit = unitType(regiment.unitId);
    this.orderMenu.setItems(
      unit.orders
        .filter((o) => o !== 'retreat' || this.options.escapable)
        .map((o) => ({ label: ORDER_LABEL[o], value: o })),
    );
    this.phase = 'order';
  }

  private get currentRegiment(): Regiment | undefined {
    return this.player.regiments.filter(ALIVE)[this.regimentIndex];
  }

  private onOrderKey(key: GameKey): void {
    if (key === 'cancel' && this.regimentIndex > 0) {
      audio.sfx('cancel');
      this.regimentIndex -= 2;
      this.pendingOrders.pop();
      this.nextRegiment();
      return;
    }
    if (key !== 'confirm') {
      if (this.orderMenu.move(key)) audio.sfx('cursor');
      return;
    }
    const order = this.orderMenu.selected?.value as OrderId | undefined;
    const regiment = this.currentRegiment;
    if (!order || !regiment) return;
    audio.sfx('confirm');

    if (order === 'duel') {
      this.pendingOrders.push({ regiment, order });
      this.nextRegiment();
      return;
    }
    if (order === 'guard' || order === 'retreat') {
      this.pendingOrders.push({ regiment, order });
      this.nextRegiment();
      return;
    }
    if (order === 'stratagem') {
      this.stratagemMenu.setItems(
        (Object.keys(STRATAGEMS) as (keyof typeof STRATAGEMS)[]).map((id) => ({
          label: STRATAGEMS[id].name,
          value: id,
          desc: STRATAGEMS[id].desc,
        })),
      );
      this.phase = 'stratagem';
      return;
    }
    this.openTarget(order);
  }

  private pendingStratagem: keyof typeof STRATAGEMS = 'fire';

  private onStratagemKey(key: GameKey): void {
    if (key === 'cancel') {
      audio.sfx('cancel');
      this.phase = 'order';
      return;
    }
    if (key !== 'confirm') {
      if (this.stratagemMenu.move(key)) audio.sfx('cursor');
      return;
    }
    this.pendingStratagem = (this.stratagemMenu.selected?.value ?? 'fire') as keyof typeof STRATAGEMS;
    audio.sfx('confirm');
    this.openTarget('stratagem');
  }

  private pendingOrderId: OrderId = 'charge';

  private openTarget(order: OrderId): void {
    this.pendingOrderId = order;
    let targets = this.foe.regiments.filter(ALIVE);

    // 刺客は本陣までは届かない。
    // 敵の大将を寝所で刺せてしまうなら、どんな戦も一夜で終わってしまう。
    // 狙えるのは前に出ている将まで——それが暗殺という手の限界でもある。
    if (order === 'stratagem' && this.pendingStratagem === 'assassinate') {
      const chief = this.foeOfficers[0]?.id;
      targets = targets.filter((r) => r.officerId && r.officerId !== chief);
      if (targets.length === 0) {
        this.say('狙えるのは前に出ている将だけだ。大将の寝所には近づけない。');
        this.resolveTimer = 900;
        this.phase = 'order';
        return;
      }
    }

    if (targets.length === 0) return;
    this.targetMenu.setItems(
      targets.map((r) => ({
        label: this.regimentLabel(r, this.foe),
        value: String(this.foe.regiments.indexOf(r)),
        right: `${commanderNameOf(this.foe, r)}　${r.troops}`,
      })),
    );
    this.phase = 'target';
  }

  private onTargetKey(key: GameKey): void {
    if (key === 'cancel') {
      audio.sfx('cancel');
      this.phase = 'order';
      return;
    }
    if (key !== 'confirm') {
      if (this.targetMenu.move(key)) audio.sfx('cursor');
      return;
    }
    const index = Number(this.targetMenu.selected?.value ?? -1);
    const target = this.foe.regiments[index];
    const regiment = this.currentRegiment;
    if (!target || !regiment) return;
    audio.sfx('confirm');
    this.pendingOrders.push({
      regiment,
      order: this.pendingOrderId,
      target,
      stratagem: this.pendingOrderId === 'stratagem' ? this.pendingStratagem : undefined,
    });
    this.nextRegiment();
  }

  // ------------------------------------------------------------ 解決

  private startResolve(): void {
    // 敵の命令を足して、速い順に並べる
    const foeOrders: Order[] = this.foe.regiments.filter(ALIVE).map((regiment) => {
      const unit = unitType(regiment.unitId);
      const targets = this.player.regiments.filter(ALIVE);

      // 徳の薄い相手は刺客を使う。ただし本陣までは届かない——
      // 大将が寝首を掻かれて終わり、では戦った意味がなくなる。狙われるのは配下
      const reachable = targets.filter((r) => r.officerId && r.officerId !== this.app.state.officerId);
      if (this.foe.commander.virtue < 45 && reachable.length > 0 && Math.random() < 0.06) {
        return { regiment, order: 'stratagem', stratagem: 'assassinate', target: pick(reachable) };
      }

      const order: OrderId = unit.orders.includes('volley') && Math.random() < 0.4 ? 'volley' : 'charge';
      return { regiment, order, target: targets.length > 0 ? pick(targets) : undefined };
    });

    this.queue = [...this.pendingOrders, ...foeOrders].sort(
      (a, b) =>
        unitType(b.regiment.unitId).speed * randFloat(0.85, 1.15) -
        unitType(a.regiment.unitId).speed * randFloat(0.85, 1.15),
    );
    this.log = [];
    this.phase = 'resolve';
    this.resolveTimer = 0;
  }

  private isPlayerRegiment(regiment: Regiment): boolean {
    return this.player.regiments.includes(regiment);
  }

  private stepResolve(): void {
    const next = this.queue.shift();
    if (!next) {
      if (this.checkEnd()) return;
      this.beginTurn();
      return;
    }
    if (!ALIVE(next.regiment)) {
      this.stepResolve();
      return;
    }

    const mine = this.isPlayerRegiment(next.regiment);
    const attacker = mine ? this.player : this.foe;
    const defender = mine ? this.foe : this.player;

    if (next.order === 'duel') {
      this.beginDuelChallenge(next.regiment);
      return;
    }

    const from = this.pieceAt(next.regiment, mine);
    const to = next.target ? this.pieceAt(next.target, !mine) : { x: from.x, y: mine ? 78 : 202 };

    const result = resolveOrder(next, attacker, defender, this.ground);
    this.say(`${mine ? '' : '敵・'}${result.text}`);
    if (result.virtue) {
      this.app.state.virtueDelta += result.virtue;
      // 隣に立っている者たちが見ている。刺客を放てば、徳の高い配下ほど傷つく
      if (mine) {
        for (const line of stirRetinue(this.app.state, result.virtue, '刺客を放つ')) {
          this.say(line);
        }
      }
    }

    // 刺客を放ったなら、影が敵陣へ渡るのを見せる
    if (next.order === 'stratagem' && next.stratagem === 'assassinate') {
      this.addEffect('shade', from, to, 900);
      audio.sfx(result.slainCommander ? 'defeat' : 'miss');
      this.resolveTimer = 1000;
    }

    // 暗殺が成った。将ひとりが死に、その隊は主を失って散る
    if (result.slainCommander || result.slainCommanderName) {
      const id = result.slainCommander;
      const who = id ? OFFICERS[id] : undefined;
      const fallen = next.target;
      if (fallen) {
        // 主を失った隊は散る。その者が他の隊も率いていれば、そちらも同じこと
        if (id) collapseUnder(defender, id);
        fallen.routed = true;
      }
      if (mine) {
        // こちらが放った側。相手の将を世界の帳簿からも消す
        if (who) {
          slay(ensureWorld(this.app.state), who.id, this.app.state.year);
          this.app.state.deeds.push({
            year: this.app.state.year,
            text: `${who.name}を刺客に討たせる`,
            diverged: who.died !== this.app.state.year,
          });
        }
      } else if (who && this.app.state.roster.includes(who.id)) {
        // 狙われたのはこちらの配下だった
        this.app.state.roster = this.app.state.roster.filter((x) => x !== who.id);
        this.loseCaptain(who);
      } else if (who && who.id === this.app.state.officerId) {
        // 大将自身が刺された
        this.app.state.alive = false;
      }
      this.resolveTimer = 1200;
      return;
    }

    // 何をしたかが目で分かるようにする
    if (result.damage) {
      audio.sfx('hit');
      switch (next.order) {
        case 'volley':
          this.addEffect('arrow', from, to, 620);
          break;
        case 'stratagem':
          this.addEffect(next.stratagem === 'fire' ? 'fire' : 'spark', to, to, 520);
          break;
        default:
          // 突撃は駒が実際に踏み込む
          next.regiment.lunge = 1;
          this.addEffect('slash', to, to, 400);
      }
    } else if (next.order === 'charge' || next.order === 'stratagem') {
      audio.sfx('miss');
    }
    this.resolveTimer = 620;

    // 隊が全滅すれば、率いていた将も無事では済まない
    if (result.routed && next.target) this.captainFalls(next.target);
    if (this.checkEnd()) return;
  }

  /** 配下を失う。名簿から消し、世界の帳簿にも死んだ年を記す。 */
  private loseCaptain(who: Officer): void {
    const c = this.app.state;
    slay(ensureWorld(c), who.id, c.year);
    c.deeds.push({ year: c.year, text: `${who.name}を失う`, diverged: who.died !== c.year });
  }

  /**
   * 潰れた隊の隊長の身の上。
   *
   * 名簿に載っているだけの配下は、これまで誰も死ななかった。
   * 前に出して隊を預ける以上、失うこともある——そこまで含めて登用の重みになる。
   * 統率が高いほど、崩れても身を全うしやすい。
   */
  private captainFalls(regiment: Regiment): void {
    const c = this.app.state;
    const id = regiment.officerId;
    if (!id || id === c.officerId) return;
    if (!c.roster.includes(id)) return;

    const who = OFFICERS[id];
    if (!who) return;
    const ab = abilitiesAt(who, c.year, 0);
    // 統率100でも一割は落命する。低ければ半ばを超える
    const doom = Math.max(0.1, 0.62 - ab.lead / 200);
    if (!chance(doom)) {
      this.say(`${who.name}は隊を失ったが、身ひとつで戻った。`);
      return;
    }

    c.roster = c.roster.filter((x) => x !== id);
    this.loseCaptain(who);
    audio.sfx('defeat');
    this.say(`${who.name}、乱軍の中に討たる。`);
  }

  private say(text: string): void {
    this.log = [...this.log, ...wrapText(text, SCREEN_W - 80, 15)].slice(-4);
  }

  private checkEnd(): boolean {
    if (isDefeated(this.foe)) {
      this.outcomeText = '敵は総崩れとなった。';
      this.app.state.flags[`won:${this.currentEventId}`] = true;
      this.phase = 'end';
      audio.sfx('levelup');
      return true;
    }
    if (isDefeated(this.player)) {
      this.outcomeText = 'こちらの兵は、ことごとく散った。';
      this.app.state.flags[`retreated:${this.currentEventId}`] = true;
      this.phase = 'end';
      audio.sfx('defeat');
      return true;
    }
    return false;
  }

  private get currentEventId(): string {
    return this.options.eventId;
  }

  // ------------------------------------------------------------ 一騎討ち

  private beginDuelChallenge(regiment: Regiment): void {
    const c = this.app.state;
    // 名乗りを上げるのは、その隊を率いている者。自分とは限らない
    const challenger = this.duelChallenger(regiment);
    this.duelMine = challenger;
    const me = abilitiesAt(challenger, c.year, challenger.id === c.officerId ? c.virtueDelta : 0);
    const candidates = this.foeOfficers.filter((o) => !c.flags[`duelDone:${o.id}`]);
    const target = candidates[0];

    if (!target) {
      this.say('名乗りを上げたが、応じる者がいない。');
      this.resolveTimer = 700;
      this.phase = 'resolve';
      return;
    }

    const targetAb = abilitiesAt(target, c.year, 0);
    if (!willAcceptDuel(targetAb, me)) {
      this.say(`${target.name}は応じなかった。`);
      shiftMorale(this.foe, -4);
      this.resolveTimer = 800;
      this.phase = 'resolve';
      return;
    }

    this.duelFoe = target;
    this.duel = startDuel(
      this.book.side(challenger, challenger.id === c.officerId ? c.virtueDelta : 0),
      this.book.side(target, 0),
    );
    // 消耗は持ち越されるので、疲れた相手には勝ち目が出る
    this.duelLines = [
      `${challenger.name}の名乗りに、${target.name}が受けて立った！`,
      `武力 ${me.war} ── ${targetAb.war}`,
    ];
    this.phase = 'duel';
    this.resolveTimer = 900;
    audio.sfx('encounter');
  }

  /**
   * 一騎討ちに出る者。
   *
   * その隊を率いている者が出る。武力の高い配下を前に置けば代わりに挑めるが、
   * 負ければその者を失う。誰を隊長に据えるかが、そのまま誰を賭けるかになる。
   */
  private duelChallenger(regiment: Regiment): Officer {
    const id = regiment.officerId;
    if (id && id !== this.app.state.officerId) {
      const sub = OFFICERS[id];
      if (sub && this.app.state.roster.includes(id)) return sub;
    }
    return this.app.who;
  }

  private stepDuel(): void {
    const state = this.duel;
    const foeOfficer = this.duelFoe;
    if (!state || !foeOfficer) return;

    if (state.result) {
      this.endDuel();
      return;
    }

    // 一合ずつ見せる。十合まとめて流すと、何が起きたか分からない
    const rounds = runBouts(state, 1);
    for (const round of rounds) {
      this.duelLines.push(round.text);
      this.duelAttacker = round.attacker;
      this.duelClash = round.damage > 0 ? 260 : 140;
      audio.sfx(round.damage > 0 ? 'hit' : 'attack');
    }
    this.duelLines = this.duelLines.slice(-3);
    this.resolveTimer = 380;

    if (state.result) {
      this.resolveTimer = 700;
      return;
    }

    // 十合ごとに、続けるか退くかを訊く
    if (state.bouts % 10 !== 0) return;
    this.duelMenu.setItems([
      { label: 'なお打ち合う', value: 'go' },
      { label: '兵を退く', value: 'stop' },
    ]);
    this.duelAskText = `${state.bouts}合。${this.vigorText()}`;
    this.phase = 'duelAsk';
  }

  private vigorText(): string {
    const state = this.duel;
    if (!state) return '';
    const mine = Math.round((state.a.vigor / state.a.maxVigor) * 100);
    const theirs = Math.round((state.b.vigor / state.b.maxVigor) * 100);
    return `こちら ${mine}% ── 相手 ${theirs}%`;
  }

  private onDuelAskKey(key: GameKey): void {
    // 目の前にいる相手が誰なのか、その場で読める。
    // 顔良と斬り合っている最中こそ、顔良が何者かを知りたい
    if (key === 'cancel' && this.duelFoe) {
      audio.sfx('confirm');
      this.app.scenes.push(new LoreScene(this.app, this.duelFoe));
      return;
    }
    if (key !== 'confirm') {
      if (this.duelMenu.move(key)) audio.sfx('cursor');
      return;
    }
    audio.sfx('confirm');
    const state = this.duel;
    if (!state) return;
    if (this.duelMenu.selected?.value === 'stop') {
      withdrawFromDuel(state);
      shiftMorale(this.player, DUEL_MORALE.withdraw);
      this.duelLines.push('刃を引いて、馬を返した。');
      this.endDuel();
      return;
    }
    this.phase = 'duel';
    this.resolveTimer = 500;
  }

  private endDuel(): void {
    const state = this.duel;
    const foeOfficer = this.duelFoe;
    const c = this.app.state;
    if (!state?.result || !foeOfficer) return;

    // 出ていたのは自分とは限らない
    const mine = this.duelMine ?? this.app.who;
    const isSelf = mine.id === c.officerId;
    const me = abilitiesAt(mine, c.year, isSelf ? c.virtueDelta : 0);
    const theirs = abilitiesAt(foeOfficer, c.year, 0);
    const result = state.result;
    c.flags[`duelDone:${foeOfficer.id}`] = true;

    if (result.outcome === 'draw') {
      const gain = renownForDuel('draw', false, me, theirs);
      c.renown += gain;
      shiftMorale(this.player, DUEL_MORALE.draw);
      shiftMorale(this.foe, DUEL_MORALE.draw);
      this.duelLines.push(`${state.bouts}合、勝負つかず。` + (gain > 0 ? `（名声 +${gain}）` : ''));
    } else if (result.winner === 'a') {
      const gain = renownForDuel(result.outcome, true, me, theirs);
      c.renown += gain;
      shiftMorale(this.player, DUEL_MORALE.win);
      shiftMorale(this.foe, DUEL_MORALE.lose);
      const lost = collapseUnder(this.foe, foeOfficer.id);
      this.duelLines.push(
        `${isSelf ? '' : `${mine.name}、`}${foeOfficer.name}を` +
          `${result.outcome === 'capture' ? '捕らえた' : '討ち取った'}！（名声 +${gain}）`,
      );
      if (lost.length > 0) this.duelLines.push('大将を失った隊は、そのまま散った。');
      if (result.outcome === 'capture') {
        c.flags[`captured:${foeOfficer.id}`] = true;
        this.duelLines.push(`${foeOfficer.name}は捕虜となった。`);
      }
      audio.sfx('levelup');
    } else {
      shiftMorale(this.player, DUEL_MORALE.lose);
      shiftMorale(this.foe, DUEL_MORALE.win);
      const fate = result.outcome === 'capture' ? decideCaptiveFate(theirs, me) : null;
      const dies = fate ? fate === 'execute' : true;

      if (isSelf) {
        // 自分が出て負けたときは、これまでどおり生涯が閉じうる
        if (fate) {
          this.duelLines.push(`敗れて捕らえられた。${CAPTIVE_FATE_TEXT[fate]}。`);
          c.flags[`captured:${this.options.eventId}`] = true;
        } else {
          this.duelLines.push('討ち取られた。');
        }
        if (dies) c.alive = false;
      } else {
        // 代わりに出た配下が敗れた。失うのはこちらの人
        if (fate) {
          this.duelLines.push(`${mine.name}は敗れて捕らえられた。${CAPTIVE_FATE_TEXT[fate]}。`);
          c.flags[`captured:${mine.id}`] = true;
        } else {
          this.duelLines.push(`${mine.name}、討ち取られた。`);
        }
        if (dies) this.loseCaptain(mine);
        else this.say(`${mine.name}は捕らえられ、陣には戻らなかった。`);
        // 主を失った隊は散る
        collapseUnder(this.player, mine.id);
        c.roster = c.roster.filter((x) => x !== mine.id);
      }
      audio.sfx('defeat');
    }

    this.duel = null;
    this.duelFoe = null;
    this.resolveTimer = 900;
    this.phase = 'resolve';
    if (!c.alive) {
      this.outcomeText = 'ここで、生涯は閉じた。';
      this.phase = 'end';
    }
  }

  // ------------------------------------------------------------ 終わり

  private finish(): void {
    const c = this.app.state;
    c.troops = survivingTroops(this.player);
    this.app.scenes.pop();
  }

  // ------------------------------------------------------------ 描画

  render(ctx: CanvasRenderingContext2D): void {
    backdrop(ctx, SCREEN_W, SCREEN_H);
    heading(ctx, this.options.eventName, 16, 16, 18);

    if (this.phase === 'captains') {
      this.drawCaptains(ctx);
      return;
    }
    if (this.phase === 'compose') {
      this.drawCompose(ctx);
      return;
    }
    if (this.phase === 'duel' || this.phase === 'duelAsk') {
      this.drawDuel(ctx);
      return;
    }
    this.drawField(ctx);
  }

  /** 誰にどの隊を預けるか。 */
  private drawCaptains(ctx: CanvasRenderingContext2D): void {
    panel(ctx, 16, 52, 340, 300);
    drawText(ctx, '誰に預けるか', 36, 66, { size: 13, color: INK.accent });
    drawText(ctx, '左右で隊長を替える　X: 割り振りに戻る', 36, 86, { size: 11, color: INK.dim });
    this.captainMenu.draw(ctx, 36, 112, 300, {
      size: 16,
      lineHeight: 30,
      blink: blink(this.time),
    });

    panel(ctx, 372, 52, SCREEN_W - 388, 300);
    const value = this.captainMenu.selected?.value;
    const regiment = value && value !== ':go' ? this.player.regiments[Number(value)] : undefined;
    const id = regiment?.officerId;
    const entry = id ? this.player.officers?.[id] : undefined;
    if (!entry) {
      drawText(ctx, '陣立てが決まれば、出陣する。', 392, 68, { size: 14, color: INK.dim });
      return;
    }

    const ab = entry.abilities;
    drawText(ctx, entry.name, 392, 68, { size: 20, color: INK.text });
    drawText(ctx, `${this.regimentLabel(regiment!)}　${regiment!.troops}`, 392, 98, {
      size: 13,
      color: INK.accent,
    });
    rule(ctx, 392, 118, SCREEN_W - 428);

    const stats: [string, number][] = [
      ['武力', ab.war],
      ['統率', ab.lead],
      ['知力', ab.intel],
      ['徳', ab.virtue],
    ];
    stats.forEach(([label, v], i) => {
      const ry = 134 + i * 26;
      drawText(ctx, label, 392, ry, { size: 13, color: INK.dim });
      drawText(ctx, `${v}`, 452, ry, { size: 15, align: 'right', color: INK.text });
      ctx.save();
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      ctx.fillRect(466, ry + 4, SCREEN_W - 500, 7);
      ctx.fillStyle = v >= 85 ? INK.accent : INK.jade;
      ctx.fillRect(466, ry + 4, ((SCREEN_W - 500) * v) / 100, 7);
      ctx.restore();
    });

    // 兵科の得手不得手。史料に見えるかどうかを必ず添える——
    // 推し量っただけの数字を、史実の顔で出さないために
    const who = id ? OFFICERS[id] : undefined;
    const apt = who ? aptitudeOf(who, regiment!.unitId, this.app.state.year) : null;

    // その者が、いまどんな目で主を見ているか
    if (who && this.app.state.roster.includes(who.id)) {
      const heart = heartOf(this.app.state, who.id);
      drawText(ctx, `心　${heartLabel(heart)}`, 392, 240, {
        size: 13,
        color: heart >= 55 ? INK.jade : heart > HEART_LEAVING ? INK.dim : INK.blood,
      });
    }
    if (apt && apt.tier !== 0) {
      drawText(ctx, `${unitType(regiment!.unitId).name}　${apt.label}`, 392, 264, {
        size: 14,
        color: apt.tier > 0 ? INK.accent : INK.blood,
      });
      drawText(ctx, apt.recorded ? '史にそう見える' : '史には見えぬ。当てにはならぬ', 392, 284, {
        size: 11,
        color: apt.recorded ? INK.jade : INK.dim,
      });
    }

    wrapText(this.captainNote(id!), SCREEN_W - 428, 12).forEach((line, i) =>
      drawText(ctx, line, 392, 308 + i * 18, { size: 12, color: INK.jade }),
    );
    drawText(ctx, '隊が全滅すれば、この者も無事では済まない。', 392, 334, {
      size: 11,
      color: INK.blood,
    });
  }

  private drawCompose(ctx: CanvasRenderingContext2D): void {
    const c = this.app.state;
    panel(ctx, 16, 52, 340, 300);
    drawText(ctx, `兵 ${c.troops}　隊 ${regimentSlots(c)}まで`, 36, 66, {
      size: 13,
      color: INK.accent,
    });
    drawText(ctx, '左右で隊の数を増減する', 36, 86, { size: 11, color: INK.dim });
    this.composeMenu.draw(ctx, 36, 112, 300, {
      size: 16,
      lineHeight: 30,
      blink: blink(this.time),
    });

    panel(ctx, 372, 52, SCREEN_W - 388, 300);
    const selected = this.composeMenu.selected;
    const unit = selected && UNITS[selected.value];
    if (unit) {
      drawText(ctx, unit.name, 392, 68, { size: 20, color: INK.text });
      wrapText(unit.desc, SCREEN_W - 428, 12)
        .slice(0, 3)
        .forEach((line, i) => drawText(ctx, line, 392, 100 + i * 18, { size: 12, color: INK.dim }));
      rule(ctx, 392, 160, SCREEN_W - 428);
      const strong = unit.strongAgainst.map((id) => UNITS[id]?.name).filter(Boolean).join('・');
      drawText(ctx, strong ? `${strong} に強い` : '三すくみの外', 392, 176, {
        size: 13,
        color: INK.jade,
      });
      if (unit.virtueCost) {
        drawText(ctx, `用いれば徳が ${unit.virtueCost} 下がる`, 392, 200, {
          size: 12,
          color: INK.blood,
        });
      }
      if (unit.resist) {
        const parts = Object.entries(unit.resist).map(
          ([k, v]) => `${k === 'fire' ? '火' : k === 'arrow' ? '矢' : '白兵'}×${v}`,
        );
        drawText(ctx, parts.join('　'), 392, 224, { size: 12, color: INK.dim });
      }
    }

    panel(ctx, 16, 364, SCREEN_W - 32, 100);
    const foeNames = [...new Set(this.foeOfficers.map((o) => o.name))].join('・');
    drawText(ctx, `敵　${foeNames || this.foe.commanderName}`, 36, 380, {
      size: 15,
      color: INK.blood,
    });
    this.foe.regiments.forEach((r, i) => {
      drawText(
        ctx,
        `${this.regimentLabel(r, this.foe)} ${r.troops}`,
        36 + i * 150,
        404,
        { size: 13, color: INK.dim },
      );
      drawText(ctx, commanderNameOf(this.foe, r), 36 + i * 150, 424, {
        size: 12,
        color: INK.blood,
      });
    });
  }

  private drawField(ctx: CanvasRenderingContext2D): void {
    this.drawBattlefield(ctx);

    // どんな土地で戦っているか。見た目と数字が同じものを指していると分かるように
    const ground = this.ground;
    drawText(ctx, ground.name, SCREEN_W / 2, 36, {
      size: 12,
      align: 'center',
      color: INK.accent,
      stroke: 'rgba(0,0,0,0.8)',
    });
    drawText(ctx, ground.note, SCREEN_W / 2, 286, {
      size: 11,
      align: 'center',
      color: INK.dim,
      stroke: 'rgba(0,0,0,0.8)',
    });

    // 敵の見出し
    drawText(ctx, `敵　${this.foe.commanderName}`, 24, 44, { size: 14, color: INK.blood });
    this.drawMoraleBanner(ctx, SCREEN_W - 24, 44, this.foe.morale, INK.blood);
    this.drawRegimentPieces(ctx, this.foe.regiments, 78, false);

    // 味方の見出し
    drawText(ctx, this.player.commanderName, 24, 268, { size: 14, color: INK.accent });
    this.drawMoraleBanner(ctx, SCREEN_W - 24, 268, this.player.morale, INK.jade);
    this.drawRegimentPieces(ctx, this.player.regiments, 202, true);

    this.drawEffects(ctx);

    // ログ／命令
    panel(ctx, 16, 304, SCREEN_W - 32, 160);

    if (this.phase === 'order' || this.phase === 'target' || this.phase === 'stratagem') {
      const regiment = this.currentRegiment;
      const menu =
        this.phase === 'order'
          ? this.orderMenu
          : this.phase === 'target'
            ? this.targetMenu
            : this.stratagemMenu;
      drawText(
        ctx,
        this.phase === 'target'
          ? 'どの隊に'
          : this.phase === 'stratagem'
            ? 'どの計略を'
            : regiment
              ? `${this.regimentLabel(regiment)}（${commanderNameOf(this.player, regiment)}）の命令`
              : '命令',
        36,
        318,
        { size: 13, color: INK.accent },
      );
      menu.draw(ctx, 36, 344, 260, { size: 16, lineHeight: 28, blink: blink(this.time) });
      const desc = menu.selected?.desc;
      if (desc) {
        wrapText(desc, SCREEN_W - 360, 12)
          .slice(0, 3)
          .forEach((line, i) => drawText(ctx, line, 320, 348 + i * 18, { size: 12, color: INK.dim }));
      }
      return;
    }

    this.log.slice(-4).forEach((line, i) => {
      drawText(ctx, line, 36, 322 + i * 26, { size: 15, color: INK.text });
    });

    if (this.phase === 'end') {
      drawText(ctx, this.outcomeText, 36, 426, { size: 17, color: INK.accent });
      drawText(ctx, '▼', SCREEN_W - 40, 430, {
        size: 14,
        color: INK.accent,
        alpha: this.time % 1000 < 600 ? 1 : 0.2,
      });
    }
  }

  /** 戦場の地面。上が敵、下が味方。 */
  private drawBattlefield(ctx: CanvasRenderingContext2D): void {
    // 立っていた土地の上で戦う。無地の盤ではなく、空と地面と遠景を敷く
    drawField(ctx, this.options.terrain ?? '.', 8, 30, SCREEN_W - 16, 268, this.time);

    // 中央の境目
    ctx.save();
    ctx.strokeStyle = 'rgba(200,180,138,0.18)';
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(20, 164);
    ctx.lineTo(SCREEN_W - 20, 164);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = 'rgba(200,180,138,0.35)';
    ctx.lineWidth = 1;
    ctx.strokeRect(8.5, 30.5, SCREEN_W - 17, 267);
    ctx.restore();
  }

  /** 士気を旗の高さで見せる。数字より、崩れかけているのが分かる。 */
  private drawMoraleBanner(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    morale: number,
    color: string,
  ): void {
    const ratio = Math.max(0, Math.min(1, (morale - 30) / 70));
    drawText(ctx, `士気 ${morale}`, x - 46, y, { size: 12, align: 'right', color: INK.dim });
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.fillRect(x - 40, y - 2, 40, 12);
    ctx.fillStyle = color;
    ctx.fillRect(x - 40, y - 2, 40 * ratio, 12);
    ctx.restore();
  }

  /** 部隊の駒。兵数で大きさが変わり、被弾で光って揺れる。 */
  /**
   * その隊がいま動作中か 0〜1。
   * 弓なら弦を引き、他なら得物を振りかぶる度合いに使う。
   * 命令が解決している最中だけ立ち上がる。
   */
  private actingOf(regiment: Regiment): number {
    if (this.phase !== 'resolve') return 0;
    const current = this.queue[0];
    if (!current || current.regiment !== regiment) return 0;
    // 解決待ちのあいだに引き絞り、撃った瞬間に戻る
    return Math.max(0, Math.min(1, 1 - this.resolveTimer / 620));
  }

  private drawRegimentPieces(
    ctx: CanvasRenderingContext2D,
    regiments: Regiment[],
    baseY: number,
    mine: boolean,
  ): void {
    const slot = (SCREEN_W - 60) / Math.max(1, regiments.length);
    regiments.forEach((r, i) => {
      const unit = unitType(r.unitId);
      const dead = !ALIVE(r);
      const alpha = dead ? Math.max(0, 1 - r.fade) : 1;
      if (alpha <= 0) return;

      const cx = 30 + slot * i + slot / 2;
      // 踏み込みと揺れは drawCompany の側で持つ
      const cy = baseY;

      const active =
        mine &&
        this.phase === 'order' &&
        this.player.regiments.filter(ALIVE)[this.regimentIndex] === r;
      const targeted =
        !mine && this.phase === 'target' &&
        this.foe.regiments[Number(this.targetMenu.selected?.value ?? -1)] === r;

      const ratio = r.maxTroops > 0 ? r.troops / r.maxTroops : 0;
      const size = 30 + 22 * Math.sqrt(Math.max(0.15, ratio));

      // 選ばれている隊の足元に輪を敷く
      if (active || targeted) {
        ctx.save();
        ctx.strokeStyle = targeted ? INK.blood : INK.accent;
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.7 + 0.3 * Math.sin(this.time / 180);
        ctx.beginPath();
        ctx.ellipse(cx, cy + 8, slot * 0.34, 11, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // 一隊を、兵の集まりとして描く
      drawCompany(ctx, {
        unitId: r.unitId,
        troops: r.troops,
        maxTroops: r.maxTroops,
        cx,
        cy,
        width: slot * 0.58,
        mine,
        lunge: r.lunge,
        shake: r.shake,
        flash: Math.min(1, r.flash / 280),
        guarding: r.guarding,
        routed: dead,
        fade: r.fade,
        time: this.time,
        acting: this.actingOf(r),
      });

      const labelY = cy + size * 0.55;
      // 誰が率いているか。名のある将が立っていることが分かる
      const captain = commanderNameOf(mine ? this.player : this.foe, r);
      if (captain && !dead) {
        drawText(ctx, captain, cx, labelY - 16, {
          size: 11,
          align: 'center',
          color: mine ? INK.jade : INK.blood,
          stroke: 'rgba(0,0,0,0.85)',
        });
      }
      drawText(ctx, unit.name, cx, labelY, {
        size: 12,
        align: 'center',
        color: dead ? INK.dim : active ? INK.accent : INK.text,
        stroke: 'rgba(0,0,0,0.85)',
      });
      drawText(ctx, dead ? '潰走' : `${r.troops}`, cx, labelY + 16, {
        size: 12,
        align: 'center',
        color: dead ? INK.blood : INK.dim,
        stroke: 'rgba(0,0,0,0.85)',
      });
      if (!dead) {
        drawGauge(ctx, cx - 34, labelY + 32, 68, 5, ratio, mine ? INK.jade : INK.blood);
      }

      if (r.guarding) {
        drawText(ctx, '守', cx + size * 0.6, cy - size * 0.4, { size: 13, color: INK.water });
      }
      if (r.confused > 0) {
        drawText(ctx, '乱', cx + size * 0.6, cy - size * 0.4, { size: 13, color: INK.blood });
      }

      // 損害の数字
      r.popups.forEach((p, n) => {
        const rise = (1 - p.life / 900) * 34;
        drawText(ctx, p.text, cx + n * 6, cy - size * 0.5 - rise, {
          size: 18,
          align: 'center',
          color: p.color,
          weight: 'bold',
          stroke: 'rgba(0,0,0,0.9)',
          alpha: Math.min(1, p.life / 320),
        });
      });
    });
  }

  /** 斬撃・矢・炎の一瞬。 */
  private drawEffects(ctx: CanvasRenderingContext2D): void {
    for (const fx of this.effects) {
      const t = Math.min(1, fx.t / fx.life);
      ctx.save();
      ctx.globalAlpha = 1 - t;
      switch (fx.kind) {
        // 刺客。三つの影が敵陣へ滑り込み、着いたところで消える
        case 'shade': {
          const reach = Math.min(1, t * 1.5);
          for (let i = 0; i < 3; i++) {
            const lag = i * 0.13;
            const k = Math.max(0, Math.min(1, (reach - lag) / (1 - lag || 1)));
            const px = fx.x + (fx.tx - fx.x) * k;
            const py = fx.y + (fx.ty - fx.y) * k + Math.sin(k * Math.PI) * -14;
            ctx.globalAlpha = (1 - t) * (0.35 + 0.25 * Math.sin(fx.t / 60 + i));
            ctx.fillStyle = '#0d0b12';
            ctx.beginPath();
            ctx.ellipse(px, py, 5, 9, (i - 1) * 0.2, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#1a1622';
            ctx.beginPath();
            ctx.arc(px, py - 9, 3.4, 0, Math.PI * 2);
            ctx.fill();
          }
          break;
        }
        case 'slash':
          ctx.strokeStyle = '#fff0c0';
          ctx.lineWidth = 5;
          ctx.beginPath();
          ctx.moveTo(fx.x - 40, fx.y - 34 + t * 40);
          ctx.lineTo(fx.x + 40, fx.y + 34 + t * 40);
          ctx.stroke();
          break;
        case 'arrow': {
          // 矢は放物線を描いて飛ぶ。矢ごとに撃ち出しをずらし、斉射に幅を持たせる
          ctx.globalAlpha = 1;
          const flightSpan = 0.72;
          for (let i = 0; i < 11; i++) {
            const offset = (i / 10) * (1 - flightSpan);
            const at = (t - offset) / flightSpan;
            if (at <= 0 || at >= 1) continue;

            const spread = (i - 5) * 9;
            const px = fx.x + spread * 0.5 + (fx.tx + spread - fx.x - spread * 0.5) * at;
            const flat = fx.y + (fx.ty - fx.y) * at;
            // 山なりに上がって落ちる
            const arc = Math.sin(at * Math.PI) * 46;
            const py = flat - arc;

            // 一つ手前の位置から向きを取り、矢を進行方向へ倒す
            const prev = Math.max(0, at - 0.05);
            const ppy = fx.y + (fx.ty - fx.y) * prev - Math.sin(prev * Math.PI) * 46;
            const ppx = fx.x + spread * 0.5 + (fx.tx + spread - fx.x - spread * 0.5) * prev;
            const angle = Math.atan2(py - ppy, px - ppx);

            ctx.save();
            ctx.globalAlpha = Math.min(1, (1 - at) * 3);
            ctx.translate(px, py);
            ctx.rotate(angle);
            ctx.strokeStyle = '#efe4bc';
            ctx.lineWidth = 1.6;
            ctx.beginPath();
            ctx.moveTo(-9, 0);
            ctx.lineTo(7, 0);
            ctx.stroke();
            // 鏃と矢羽
            ctx.fillStyle = '#cfd6d8';
            ctx.beginPath();
            ctx.moveTo(10, 0);
            ctx.lineTo(5, -2.4);
            ctx.lineTo(5, 2.4);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = 'rgba(220,210,180,0.8)';
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(-9, 0);
            ctx.lineTo(-12, -2.6);
            ctx.moveTo(-9, 0);
            ctx.lineTo(-12, 2.6);
            ctx.stroke();
            ctx.restore();
          }
          break;
        }
        case 'fire': {
          const grad = ctx.createRadialGradient(fx.x, fx.y, 4, fx.x, fx.y, 30 + t * 60);
          grad.addColorStop(0, '#fff0b0');
          grad.addColorStop(0.5, '#ff8a3c');
          grad.addColorStop(1, 'rgba(255,60,0,0)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(fx.x, fx.y, 30 + t * 60, 0, Math.PI * 2);
          ctx.fill();
          break;
        }
        case 'spark':
          ctx.fillStyle = '#ffe08a';
          for (let i = 0; i < 8; i++) {
            const a = (i / 8) * Math.PI * 2;
            const r = 8 + t * 46;
            ctx.beginPath();
            ctx.arc(fx.x + Math.cos(a) * r, fx.y + Math.sin(a) * r, 3, 0, Math.PI * 2);
            ctx.fill();
          }
          break;
      }
      ctx.restore();
    }
  }

  private drawDuel(ctx: CanvasRenderingContext2D): void {
    const state = this.duel;

    // 砂塵の立つ円。二騎が向き合う場
    const grad = ctx.createRadialGradient(SCREEN_W / 2, 150, 20, SCREEN_W / 2, 150, 230);
    grad.addColorStop(0, '#3a3024');
    grad.addColorStop(1, '#151119');
    ctx.fillStyle = grad;
    ctx.fillRect(8, 30, SCREEN_W - 16, 268);

    drawText(ctx, '一 騎 討 ち', SCREEN_W / 2, 44, {
      size: 18,
      align: 'center',
      color: INK.blood,
      stroke: 'rgba(0,0,0,0.8)',
    });

    if (state) {
      // 打ち合うたびに踏み込む。直前に打った側が前に出る。
      const lunge = Math.max(0, 1 - this.duelClash / 260);
      const mineForward = this.duelAttacker === 'a' ? lunge * 26 : 0;
      const theirsForward = this.duelAttacker === 'b' ? lunge * 26 : 0;
      const shake = this.duelClash > 0 ? Math.sin(this.duelClash / 14) * (this.duelClash / 60) : 0;

      const leftX = 150 + mineForward;
      const rightX = SCREEN_W - 150 - theirsForward;
      const cy = 150;

      // 打ち込む側は前傾して振り下ろし、受ける側は仰け反る
      const clash = Math.max(0, 1 - this.duelClash / 260);
      const mineStrikes = this.duelAttacker === 'a' ? clash : 0;
      const theirsStrikes = this.duelAttacker === 'b' ? clash : 0;

      const mine = this.duelMine ?? this.app.who;
      drawDuelist(ctx, {
        x: leftX,
        y: cy + 44 + shake,
        scale: 44,
        facing: 1,
        robe: FACTIONS[this.app.state.factionId]?.color ?? '#2f7a4a',
        striking: mineStrikes,
        reeling: theirsStrikes,
        vigor: state.a.vigor / state.a.maxVigor,
        time: this.time,
      });
      drawDuelist(ctx, {
        x: rightX,
        y: cy + 44 - shake,
        scale: 44,
        facing: -1,
        robe: this.duelFoe ? (FACTIONS[allegianceOf(this.duelFoe)[0]!.factionId]?.color ?? '#b8434a') : '#b8434a',
        striking: theirsStrikes,
        reeling: mineStrikes,
        vigor: state.b.vigor / state.b.maxVigor,
        time: this.time,
      });

      // 刃が噛み合った火花
      if (this.duelClash > 0) {
        const mid = (leftX + rightX) / 2;
        ctx.save();
        ctx.globalAlpha = Math.min(1, this.duelClash / 200);
        ctx.strokeStyle = '#fff0b0';
        ctx.lineWidth = 3;
        for (let i = 0; i < 7; i++) {
          const a = (i / 7) * Math.PI * 2 + this.time / 120;
          const r = 10 + (1 - this.duelClash / 260) * 40;
          ctx.beginPath();
          ctx.moveTo(mid + Math.cos(a) * r * 0.4, cy - 6 + Math.sin(a) * r * 0.4);
          ctx.lineTo(mid + Math.cos(a) * r, cy - 6 + Math.sin(a) * r);
          ctx.stroke();
        }
        ctx.restore();
      }

      // 名と体力
      drawText(ctx, mine.name, 150, cy + 62, {
        size: 17,
        align: 'center',
        color: INK.accent,
        stroke: 'rgba(0,0,0,0.85)',
      });
      drawText(ctx, this.duelFoe?.name ?? '', SCREEN_W - 150, cy + 62, {
        size: 17,
        align: 'center',
        color: INK.text,
        stroke: 'rgba(0,0,0,0.85)',
      });
      drawGauge(ctx, 80, cy + 84, 140, 9, state.a.vigor / state.a.maxVigor, INK.jade);
      drawGauge(ctx, SCREEN_W - 220, cy + 84, 140, 9, state.b.vigor / state.b.maxVigor, INK.blood);

      drawText(ctx, `${state.bouts}合`, SCREEN_W / 2, cy - 6, {
        size: 22,
        align: 'center',
        color: INK.accent,
        stroke: 'rgba(0,0,0,0.85)',
      });

      // 刃が噛み合った火花
      if (this.duelClash > 0) {
        const t = 1 - this.duelClash / 260;
        ctx.save();
        ctx.globalAlpha = this.duelClash / 260;
        ctx.fillStyle = '#ffe08a';
        for (let i = 0; i < 10; i++) {
          const a = (i / 10) * Math.PI * 2;
          const r = 10 + t * 52;
          ctx.beginPath();
          ctx.arc(SCREEN_W / 2 + Math.cos(a) * r, cy + Math.sin(a) * r * 0.6, 3.2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
    }

    this.duelLines.slice(-3).forEach((line, i) => {
      drawText(ctx, line, SCREEN_W / 2, 246 + i * 20, {
        size: 13,
        align: 'center',
        color: INK.text,
        stroke: 'rgba(0,0,0,0.85)',
      });
    });

    if (this.phase === 'duelAsk') {
      panel(ctx, 16, 300, SCREEN_W - 32, 164);
      drawText(ctx, this.duelAskText, 36, 316, { size: 14, color: INK.accent });
      this.duelMenu.draw(ctx, 36, 348, 260, {
        size: 16,
        lineHeight: 30,
        blink: blink(this.time),
      });
      drawText(ctx, '退けば士気が落ちる。だが、死なない。', 320, 352, {
        size: 12,
        color: INK.dim,
      });
      if (this.duelFoe) {
        drawText(ctx, `X: ${this.duelFoe.name}の生涯を読む`, 320, 376, {
          size: 11,
          color: INK.dim,
        });
      }
    }
  }
}
