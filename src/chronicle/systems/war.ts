/**
 * 部隊戦。持ち兵を兵科ごとの部隊に分けて戦う。
 *
 * 損害は「攻める側の兵数 × 力関係の比」で出す。比だけで決めると
 * 二百の兵と四千の兵が互角になってしまうので、絶対数を掛けている。
 * これで小勢は数で押し潰され、精鋭は少数でも粘る。
 */

import { chance, randFloat } from '../../engine/rng';
import { matchupMultiplier, unitType } from '../data/units';
import type { BattleGround } from '../data/world/terrain';
import { stratagemSuccess } from '../rules';
import type { Abilities, DamageKind, OrderId, Regiment } from '../types';

/**
 * 一撃で削れる割合を決める係数。戦の長さはここで調整する。
 * 大きすぎると一手で部隊が消し飛び、駆け引きの余地がなくなる。
 */
const DAMAGE_SCALE = 0.32;

export interface Side {
  /** 大将の能力。隊長のいない部隊はこの人の指揮下にある。 */
  commander: Abilities;
  commanderName: string;
  regiments: Regiment[];
  /** 60〜100。徳の高い者が出ていると上がる。 */
  morale: number;
  /**
   * 隊長たち。武将IDごとの能力と名。
   * 部隊に隊長が付いていれば、その者の武力と統率で戦う。
   * 誰を前に出すかが、そのまま強さになる。
   */
  officers?: Record<string, {
    abilities: Abilities;
    name: string;
    /** 兵科ごとの倍率。systems/aptitude が算出したものを入れる。 */
    aptitude?: Record<string, number>;
  }>;
  /** 隊長のいない隊は大将が見る。そのときの適性。 */
  commanderAptitude?: Record<string, number>;
}

/** その部隊を率いている者。隊長がいなければ大将。 */
export function commanderOf(side: Side, regiment: Regiment): Abilities {
  const id = regiment.officerId;
  if (id && side.officers?.[id]) return side.officers[id]!.abilities;
  return side.commander;
}

/** その部隊を率いている者の、その兵科への適性。 */
export function aptitudeOfRegiment(side: Side, regiment: Regiment): number {
  const id = regiment.officerId;
  const table = (id && side.officers?.[id]?.aptitude) || side.commanderAptitude;
  return table?.[regiment.unitId] ?? 1;
}

/** その部隊の隊長の名。 */
export function commanderNameOf(side: Side, regiment: Regiment): string {
  const id = regiment.officerId;
  if (id && side.officers?.[id]) return side.officers[id]!.name;
  return side.commanderName;
}

export interface Order {
  regiment: Regiment;
  order: OrderId;
  /** 相手の部隊。潜入と一騎討ちでは使わない。 */
  target?: Regiment;
  /** 計略の種類。 */
  stratagem?: StratagemId;
}

export type StratagemId = 'fire' | 'ambush' | 'confuse' | 'assassinate';

export const STRATAGEMS: Record<StratagemId, { name: string; kind: DamageKind; power: number; desc: string }> = {
  fire: { name: '火計', kind: 'fire', power: 0.5, desc: '火を放つ。藤甲兵は一瞬で燃え尽きる。' },
  ambush: { name: '伏兵', kind: 'melee', power: 0.45, desc: '伏せておいた兵で横腹を突く。守備を無視する。' },
  confuse: { name: '混乱', kind: 'melee', power: 0.1, desc: '偽報で敵を惑わす。次の命令を潰す。' },
  assassinate: {
    name: '暗殺',
    kind: 'melee',
    power: 0,
    desc: '刺客を放ち、敵将ひとりの命を狙う。滅多に成らず、成っても手は汚れる。',
  },
};

/** 暗殺で失う徳。人を兵で破らずに殺すことの代償。 */
export const ASSASSINATION_VIRTUE_COST = 7;

export const ALIVE = (r: Regiment): boolean => !r.routed && r.troops > 0;

/** 士気の倍率。100で1.25倍、60で0.75倍。 */
function moraleRatio(morale: number): number {
  return morale / 80;
}

/** 部隊の攻撃力。 */
function attackPower(side: Side, regiment: Regiment, ground?: BattleGround): number {
  // 土地が兵科に効く。森の弓、水辺の騎馬はここで鈍る
  const terrain = ground?.unit[regiment.unitId] ?? 1;
  return commanderOf(side, regiment).war * unitType(regiment.unitId).attack * terrain;
}

/** 部隊の防御力。守備中は大きく上がり、守りやすい土地ではさらに上がる。 */
function defensePower(
  side: Side,
  regiment: Regiment,
  ignoreGuard = false,
  ground?: BattleGround,
): number {
  const base = commanderOf(side, regiment).lead * unitType(regiment.unitId).defense;
  const guarding = regiment.guarding && !ignoreGuard;
  return base * (guarding ? 1.8 * (ground?.guard ?? 1) : 1);
}

/** ダメージ種別ごとの通りやすさ。藤甲兵が火で溶けるのはここ。 */
function resistOf(regiment: Regiment, kind: DamageKind): number {
  return unitType(regiment.unitId).resist?.[kind] ?? 1;
}

export interface Damage {
  amount: number;
  matchup: number;
  resist: number;
}

/** 部隊から部隊への損害。 */
export function computeDamage(
  attacker: Side,
  attackerRegiment: Regiment,
  defender: Side,
  defenderRegiment: Regiment,
  opts: { kind?: DamageKind; power?: number; ignoreGuard?: boolean; ground?: BattleGround } = {},
): Damage {
  const kind = opts.kind ?? 'melee';
  const ground = opts.ground;
  const atk = attackPower(attacker, attackerRegiment, ground);
  const def = defensePower(defender, defenderRegiment, opts.ignoreGuard, ground);
  // 兵科の得手不得手。
  //
  // 攻守の綱引き（ratio）に混ぜると互いに打ち消し合い、ほとんど効かなくなる。
  // だから損害に直に掛ける。攻める側の適性で重くなり、受ける側の適性で軽くなる。
  // 馬超に騎馬を預ければ二割強く当たり、曹仁に歩兵を預ければ一割崩れにくい。
  const apt =
    aptitudeOfRegiment(attacker, attackerRegiment) /
    aptitudeOfRegiment(defender, defenderRegiment);
  // 火は土地でよく回る。葦の岸、乾いた草原
  const fire = kind === 'fire' ? (ground?.fire ?? 1) : 1;
  const ratio = atk / (atk + def);
  const matchup = matchupMultiplier(attackerRegiment.unitId, defenderRegiment.unitId);
  const resist = resistOf(defenderRegiment, kind);

  const amount = Math.max(
    1,
    Math.round(
      attackerRegiment.troops *
        DAMAGE_SCALE *
        (opts.power ?? 1) *
        ratio *
        apt *
        matchup *
        resist *
        fire *
        moraleRatio(attacker.morale) *
        randFloat(0.9, 1.1),
    ),
  );
  return { amount, matchup, resist };
}

/** 損害を与える。0になった部隊は潰走する。 */
export function applyDamage(regiment: Regiment, amount: number, kind: DamageKind = 'melee'): boolean {
  regiment.troops = Math.max(0, regiment.troops - amount);
  // 見せ方のための値。数字だけだと何も起きていないように見えるので、駒を光らせて揺らす
  regiment.flash = 280;
  regiment.shake = 260;
  regiment.popups.push({
    text: `-${amount}`,
    color: kind === 'fire' ? '#ff9a4a' : kind === 'arrow' ? '#d8d0a8' : '#ff8f8f',
    life: 900,
  });
  if (regiment.troops <= 0) {
    regiment.routed = true;
    regiment.fade = 0.001;
    return true;
  }
  return false;
}

// ---------------------------------------------------------------- 命令の解決

export interface OrderResult {
  text: string;
  damage?: number;
  routed?: boolean;
  /** 一騎討ちを申し込んだ。呼び出し側で処理する。 */
  duelRequested?: boolean;
  /** 企てが見破られた。 */
  detected?: boolean;
  /** 暗殺が成った。討たれた隊長のID。呼び出し側で名簿と世界に反映する。 */
  slainCommander?: string;
  slainCommanderName?: string;
  /** 徳の増減。暗殺部隊を使うと下がる。 */
  virtue?: number;
}

export function resolveOrder(
  order: Order,
  attacker: Side,
  defender: Side,
  ground?: BattleGround,
): OrderResult {
  const regiment = order.regiment;
  const unit = unitType(regiment.unitId);

  // 同じ兵科を二隊に分けられるので、「歩兵隊」だけではどちらか分からない。
  // 誰の隊かを添えると、戦の記述としても読める
  const mine = `${commanderNameOf(attacker, regiment)}の${unit.name}隊`;
  const theirs = (r: Regiment) => `${commanderNameOf(defender, r)}の${unitType(r.unitId).name}隊`;

  if (regiment.confused > 0) {
    regiment.confused--;
    return { text: `${mine}は混乱していて、命令が届かない。` };
  }

  regiment.guarding = false;

  switch (order.order) {
    case 'guard':
      regiment.guarding = true;
      return { text: `${mine}は守りを固めた。` };

    case 'retreat':
      regiment.routed = true;
      return { text: `${mine}は兵を退いた。` };

    case 'duel':
      return { text: `${attacker.commanderName}が一騎討ちを呼ばわった！`, duelRequested: true };

    case 'volley': {
      const target = order.target;
      if (!target || !ALIVE(target)) return { text: '射る相手がいない。' };
      // 斉射は反撃を受けない代わりに威力は控えめ
      const dmg = computeDamage(attacker, regiment, defender, target, { kind: 'arrow', power: 0.75, ground });
      const routed = applyDamage(target, dmg.amount, 'arrow');
      return {
        text:
          `${mine}の斉射！ ${theirs(target)}に ${dmg.amount} の損害。` +
          hint(dmg),
        damage: dmg.amount,
        routed,
      };
    }

    case 'charge': {
      const target = order.target;
      if (!target || !ALIVE(target)) return { text: '突っ込む相手がいない。' };
      const dmg = computeDamage(attacker, regiment, defender, target, { kind: 'melee', ground });
      const routed = applyDamage(target, dmg.amount, 'melee');
      return {
        text:
          `${mine}が突撃！ ${theirs(target)}に ${dmg.amount} の損害。` +
          hint(dmg),
        damage: dmg.amount,
        routed,
      };
    }

    case 'stratagem': {
      const target = order.target;
      const spec = STRATAGEMS[order.stratagem ?? 'ambush'];
      if (!target || !ALIVE(target)) return { text: '仕掛ける相手がいない。' };

      // 暗殺だけは別の勘定をする。当たれば兵ではなく将ひとりが死ぬ
      if (order.stratagem === 'assassinate') {
        const virtue = -ASSASSINATION_VIRTUE_COST;
        const name = commanderNameOf(defender, target);
        // 陣中の一人を狙うのは、陣そのものを崩すより遥かに難しい
        const odds = stratagemSuccess(attacker.commander, defender.commander) * 0.4;
        if (!chance(odds)) {
          // 刺客は帰らない。放った隊が薄くなる
          const lost = Math.max(1, Math.round(regiment.troops * 0.06));
          regiment.troops = Math.max(0, regiment.troops - lost);
          if (regiment.troops <= 0) regiment.routed = true;
          return {
            text: `刺客は${name}の陣で捕らえられた。${lost} を失う。`,
            virtue,
            detected: true,
          };
        }
        return {
          text: `${name}、寝所にて刺された。`,
          virtue,
          slainCommander: target.officerId ?? undefined,
          slainCommanderName: name,
          routed: true,
        };
      }

      if (!chance(stratagemSuccess(attacker.commander, defender.commander))) {
        return { text: `${spec.name}を仕掛けたが、見破られた。` };
      }
      if (order.stratagem === 'confuse') {
        target.confused = 2;
        return { text: `${spec.name}が決まった！ ${theirs(target)}は混乱している。` };
      }
      const dmg = computeDamage(attacker, regiment, defender, target, {
        kind: spec.kind,
        power: spec.power * 2,
        ignoreGuard: order.stratagem === 'ambush',
        ground,
      });
      const routed = applyDamage(target, dmg.amount, spec.kind);
      return {
        text:
          `${spec.name}！ ${theirs(target)}に ${dmg.amount} の損害。` + hint(dmg),
        damage: dmg.amount,
        routed,
      };
    }
  }
}

function hint(dmg: Damage): string {
  const parts: string[] = [];
  if (dmg.matchup > 1.1) parts.push('相性が良い');
  else if (dmg.matchup < 0.9) parts.push('相性が悪い');
  if (dmg.resist > 1.5) parts.push('よく通った');
  else if (dmg.resist < 0.6) parts.push('ほとんど通らない');
  return parts.length > 0 ? `（${parts.join('・')}）` : '';
}

// ---------------------------------------------------------------- 進行

/** 行動順。兵科の速さと大将の機動で決まる。 */
export function battleOrder(orders: Order[], sideOf: (r: Regiment) => Side): Order[] {
  return [...orders]
    .map((o) => ({
      o,
      roll:
        unitType(o.regiment.unitId).speed * sideOf(o.regiment).commander.mobility * randFloat(0.85, 1.15),
    }))
    .sort((a, b) => b.roll - a.roll)
    .map((entry) => entry.o);
}

export function isDefeated(side: Side): boolean {
  return side.regiments.filter(ALIVE).length === 0;
}

/**
 * 大将を討たれた（あるいは捕らえられた）部隊は瓦解する。
 * 一騎討ちに勝つ最大の見返りがこれで、指揮官を失った隊はそのまま散る。
 */
export function collapseUnder(side: Side, officerId: string): Regiment[] {
  const lost = side.regiments.filter((r) => ALIVE(r) && r.officerId === officerId);
  for (const regiment of lost) regiment.routed = true;
  return lost;
}

/** 士気を動かす。60〜100の範囲に収める。 */
export function shiftMorale(side: Side, delta: number): void {
  side.morale = Math.max(30, Math.min(100, side.morale + delta));
}

/** 生き残った兵を持ち兵に戻す。 */
export function survivingTroops(side: Side): number {
  return side.regiments.reduce((sum, r) => sum + (r.routed ? 0 : r.troops), 0);
}

/** 兵力から部隊を編成する。 */
export function formRegiments(
  officerId: string | null,
  troops: number,
  composition: { unitId: string; share: number }[],
): Regiment[] {
  const total = composition.reduce((sum, c) => sum + c.share, 0) || 1;
  return composition
    .map((c) => {
      const count = Math.round((troops * c.share) / total);
      return {
        officerId,
        unitId: c.unitId,
        troops: count,
        maxTroops: count,
        guarding: false,
        confused: 0,
        routed: count <= 0,
        flash: 0,
        shake: 0,
        lunge: 0,
        fade: 0,
        popups: [],
      };
    })
    .filter((r) => r.troops > 0);
}

/** 毎フレームの見せ方の更新。数字が浮いて消え、光が引いていく。 */
export function updateRegimentView(regiment: Regiment, dt: number): void {
  if (regiment.flash > 0) regiment.flash = Math.max(0, regiment.flash - dt);
  if (regiment.shake > 0) regiment.shake = Math.max(0, regiment.shake - dt);
  /**
   * 突撃の進み具合。1 から 0 へ一定の速さで落とす。
   * 描く側はこれを sin に通すので、1 で自陣、0.5 で敵陣、0 で戻ってきた形になる。
   * 指数で減らすと「出た瞬間に戻っている」ように見えてしまい、突っ込んだ感じが出ない。
   */
  if (regiment.lunge > 0) {
    regiment.lunge = Math.max(0, regiment.lunge - dt / 560);
  }
  if (regiment.routed && regiment.fade > 0 && regiment.fade < 1) {
    regiment.fade = Math.min(1, regiment.fade + dt / 500);
  }
  regiment.popups = regiment.popups.filter((p) => (p.life -= dt) > 0);
}
