/**
 * 数値のきまり。バランス調整はこのファイルだけを触れば済むようにする。
 * 能力値が 1〜100 固定なので、強さの差は「兵力・地位・士気・計略」で作る。
 */

import { abilitiesAt } from './abilities';
import { RANKS } from './data/ranks';
import { OFFICERS } from './lookup';
import type { Abilities, Chronicle, Officer } from './types';

// ---------------------------------------------------------------- 兵力

/**
 * 兵の上限は 統率 × 地位。能力値が伸びない代わりに、ここが成長する。
 * 統率そのものも歳とともに熟すので、若い将は多くを率いられない。
 */
export function maxTroops(officer: Officer, c: Chronicle): number {
  const lead = abilitiesAt(officer, c.year, c.virtueDelta).lead;
  const factor = RANKS[c.rankId]?.troopFactor ?? 1;
  return Math.round((lead + retinueLead(c)) * 12 * factor);
}

/**
 * 配下の将が肩代わりする統率。
 *
 * 自分ひとりで見られる兵には限りがある。人を得れば、その者の統率のぶんだけ
 * 多くを率いられる。徳を積んで人を集めることが、そのまま軍の大きさになる。
 * 半分しか数えないのは、寄せ集めより自分の目が届くほうが強いという建前。
 */
export function retinueLead(c: Chronicle): number {
  return c.roster.reduce((sum, id) => {
    const sub = OFFICERS[id];
    return sub ? sum + abilitiesAt(sub, c.year, 0).lead * 0.5 : sum;
  }, 0);
}

/** 戦のあと、統率に応じた割合だけ勝手に戻る（まとめ役が優秀なら崩れない）。 */
export function recoverTroops(officer: Officer, c: Chronicle): number {
  const lead = abilitiesAt(officer, c.year, c.virtueDelta).lead;
  const rate = 0.08 + (lead / 100) * 0.17; // 統率100で25%
  return Math.round(maxTroops(officer, c) * rate);
}

// ---------------------------------------------------------------- 戦闘

/** 兵力の差はそのままぶつけると大味なので、平方根で効かせる。 */
export function troopFactor(troops: number, maxTroops: number): number {
  if (maxTroops <= 0) return 1;
  return 0.45 + 0.55 * Math.sqrt(Math.max(0, troops) / maxTroops);
}

/** 斬り合いの被害。相手の兵を削る。 */
export function meleeDamage(
  attacker: Abilities,
  defender: Abilities,
  attackerTroopFactor: number,
  morale: number,
): number {
  const base = attacker.war * 1.0 - defender.lead * 0.55;
  return Math.max(1, Math.round(base * attackerTroopFactor * (morale / 100) * 6));
}

/** 計略。知力差がそのまま効くので、諸葛亮の計は司馬懿に通りにくい。 */
export function stratagemDamage(power: number, caster: Abilities, target: Abilities): number {
  const base = power + caster.intel * 0.8 - target.intel * 0.6;
  return Math.max(1, Math.round(base * 5));
}

/** 計略の成否も知力差で決まる。 */
export function stratagemSuccess(caster: Abilities, target: Abilities): number {
  return clamp01(0.5 + (caster.intel - target.intel) / 140);
}

// ---------------------------------------------------------------- 士気

/**
 * 士気は「出撃している部隊の最高の徳」から決まる。
 * 在籍しているだけの武将は数えない（劉備を留守番させる選択に意味を出すため）。
 */
export function morale(deployedVirtues: number[]): number {
  const best = deployedVirtues.length > 0 ? Math.max(...deployedVirtues) : 40;
  return Math.round(60 + best * 0.4);
}

// ---------------------------------------------------------------- 登用

/**
 * 登用は「勢力の徳」＝在籍している者の最高の徳で判定する。
 * 劉備は本陣にいてよい。頑固さは相手の徳の低さと武名の高さから出す。
 */
export function recruitChance(
  factionVirtue: number,
  target: Abilities,
  targetRenown: number,
): number {
  const stubbornness = (100 - target.virtue) * 0.5 + targetRenown * 0.05;
  return clamp01((factionVirtue - stubbornness) / 100);
}

// ---------------------------------------------------------------- 討伐

/**
 * 旅立ちの支度金。
 *
 * 布衣は兵も金も持たないが、それでは兵舎にも市にも用がなく、
 * 賊を討つ足がかりすら作れない。ひと隊ぶんだけ持たせて世に出す。
 */
export const STARTING_GOLD = 120;

/**
 * 旅立ちの兵糧（石）。
 * 兵を持たぬうちは減らないので、最初の一隊を養うぶんだけあればよい。
 */
export const STARTING_FOOD = 30;

/** 賊の砦を落としたときの実入り。手強い相手ほど蓄えも人数も多い。 */
export interface Spoils {
  gold: number;
  renown: number;
  /** 降って手勢に加わる兵。 */
  captives: number;
}

/**
 * 名声は「弱い砦を三つ落とせば布衣を脱する」あたりを狙ってある（次の位に40）。
 * 統率の低い者は兵の上限で頭打ちになるので、位を上げることが唯一の出口になる。
 */
export function spoilsOf(strength: number): Spoils {
  return {
    gold: 30 + strength * 25,
    renown: 8 + strength * 6,
    captives: strength * 25,
  };
}

// ---------------------------------------------------------------- 出世

/** 次の地位に上がるのに要る名声。 */
export function renownForRank(tier: number): number {
  return Math.round(40 * Math.pow(tier + 1, 1.7));
}

function clamp01(v: number): number {
  return Math.max(0.02, Math.min(0.95, v));
}
