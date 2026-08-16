/**
 * 兵科の得手不得手。
 *
 * 誰が率いるかで隊の強さが変わる。馬超に騎馬を預ければ西涼の騎兵になり、
 * 同じ馬を文官に預ければただの馬になる。
 *
 * ただしここには注意がいる。史書は「誰が何を得意としたか」をほとんど書かない。
 * 白馬義従の公孫瓚、西涼の馬超、弩を引いた黄忠——書かれている者は数えるほどで、
 * 残りは分からない。だから適性は二段になっている。
 *
 *   ・書かれている者      officer.aptitude に手で書く。史料の裏がある
 *   ・書かれていない者    能力値と名から機械的に割り振る。当てにならない
 *
 * 後者を「史実」の顔で出してはならない。画面では推し量りである旨を必ず添え、
 * 列伝には一行も書かない。ここはあくまで遊びの都合の数字である。
 */

import { abilitiesAt } from '../abilities';
import { UNIT_IDS } from '../data/units';
import { seededUnit } from '../../engine/rng';
import type { Officer } from '../types';

/** 段位。2が名手、-2が不得手の極み。 */
export type AptitudeTier = -2 | -1 | 0 | 1 | 2;

/** 段位ごとの倍率。名手なら二割強、不得手なら一割弱を失う。 */
const FACTOR: Record<AptitudeTier, number> = {
  2: 1.24,
  1: 1.11,
  0: 1,
  '-1': 0.9,
  '-2': 0.82,
} as unknown as Record<AptitudeTier, number>;

const LABEL: Record<AptitudeTier, string> = {
  2: '名手',
  1: '得手',
  0: '並',
  '-1': '不得手',
  '-2': '苦手',
} as unknown as Record<AptitudeTier, string>;

export interface Aptitude {
  tier: AptitudeTier;
  factor: number;
  label: string;
  /** 史料に見えるか。偽なら推し量っただけの数字。 */
  recorded: boolean;
}

/**
 * 書かれていない者の得手を、能力値から割り振る。
 *
 * 兵科ごとに「その兵科らしい能力」を採点し、いちばん高いものを得手、
 * いちばん低いものを不得手にする。同点に近ければどちらも並のままにして、
 * 誰も彼もが名手になるのを防ぐ。
 */
function guessTiers(who: Officer, year: number): Record<string, AptitudeTier> {
  const ab = abilitiesAt(who, year, 0);
  const jitter = (unitId: string) => (seededUnit(`apt:${who.id}:${unitId}`) - 0.5) * 14;

  // 中原の三兵科だけを並べて比べる。
  // 藤甲は南中でしか編めない兵で、扱えるのは孟獲たちだけ。
  // ここに混ぜると誰もが「藤甲が不得手」になってしまい、比べる意味がなくなる。
  const score: Record<string, number> = {
    // 歩兵は崩れぬことが第一。統率がそのまま出る
    infantry: ab.lead * 0.7 + ab.war * 0.3,
    // 騎馬は当たり負けせぬこと。武がものを言う
    cavalry: ab.war * 0.75 + ab.lead * 0.25,
    // 弓は間合いと折り目の見切り。知が効く
    archer: ab.intel * 0.5 + ab.war * 0.25 + ab.lead * 0.25,
  };
  for (const id of Object.keys(score)) score[id]! += jitter(id);

  const ids = Object.keys(score).filter((id) => UNIT_IDS.includes(id));
  const sorted = [...ids].sort((a, b) => score[b]! - score[a]!);
  const top = sorted[0];
  const bottom = sorted[sorted.length - 1];
  const spread = score[top!]! - score[bottom!]!;

  // 南中の外の者には、藤甲は編めない
  const tiers: Record<string, AptitudeTier> = { rattan: -2 };
  // 差が小さいなら、その人に得手はない。凡庸をそのまま凡庸として扱う
  if (spread >= 12 && top) tiers[top] = 1;
  if (spread >= 12 && bottom) tiers[bottom] = -1;
  return tiers;
}

/**
 * その者がその兵科を率いたときの適性。
 * 手で書いた段位があればそれを、なければ推し量ったものを返す。
 */
export function aptitudeOf(who: Officer, unitId: string, year: number): Aptitude {
  const written = who.aptitude?.[unitId];
  if (written !== undefined) {
    const tier = clampTier(written);
    return { tier, factor: FACTOR[tier], label: LABEL[tier], recorded: true };
  }
  const tier = guessTiers(who, year)[unitId] ?? 0;
  return { tier, factor: FACTOR[tier], label: LABEL[tier], recorded: false };
}

/** 戦のはじめに一度だけ作る、兵科ごとの倍率表。 */
export function aptitudeTable(who: Officer, year: number): Record<string, number> {
  return Object.fromEntries(UNIT_IDS.map((id) => [id, aptitudeOf(who, id, year).factor]));
}

/** 隊長を選ぶ画面に出す一行。推し量っただけなら、そう断る。 */
export function aptitudeNote(who: Officer, unitId: string, year: number): string {
  const apt = aptitudeOf(who, unitId, year);
  if (apt.tier === 0) return '';
  if (apt.recorded) return `${apt.label}。史にそう見える`;
  return `${apt.label}か。史には見えぬ`;
}

function clampTier(v: number): AptitudeTier {
  return Math.max(-2, Math.min(2, Math.round(v))) as AptitudeTier;
}
