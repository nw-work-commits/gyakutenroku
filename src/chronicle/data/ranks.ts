/**
 * 出世の階段。実在武将も架空武将も同じ梯子を登る。
 * reach が「居合わせられる事件の重要度」の上限になるので、
 * 黄巾の下っ端は最初、天下の大事には呼ばれない。
 */

import type { Rank } from '../types';

const RANK_LIST: Rank[] = [
  { id: 'commoner', name: '布衣', tier: 0, reach: 1, troopFactor: 0.2 },
  { id: 'soldier', name: '兵卒', tier: 1, reach: 1, troopFactor: 0.4 },
  { id: 'squad', name: '什長', tier: 2, reach: 2, troopFactor: 0.7 },
  { id: 'platoon', name: '屯長', tier: 3, reach: 2, troopFactor: 1.0 },
  { id: 'captain', name: '軍侯', tier: 4, reach: 3, troopFactor: 1.4 },
  { id: 'colonel', name: '校尉', tier: 5, reach: 3, troopFactor: 1.9 },
  { id: 'commandant', name: '都尉', tier: 6, reach: 4, troopFactor: 2.4 },
  { id: 'general_of_the_household', name: '中郎将', tier: 7, reach: 4, troopFactor: 3.0 },
  { id: 'general', name: '将軍', tier: 8, reach: 5, troopFactor: 3.8 },
  { id: 'grand_general', name: '大将軍', tier: 9, reach: 5, troopFactor: 4.8 },
  { id: 'lord', name: '君主', tier: 10, reach: 5, troopFactor: 6.0 },
];

export const RANKS: Record<string, Rank> = Object.fromEntries(
  RANK_LIST.map((rank) => [rank.id, rank]),
);

export const RANK_ORDER = RANK_LIST;

export function rank(id: string): Rank {
  const found = RANKS[id];
  if (!found) throw new Error(`未定義の地位: ${id}`);
  return found;
}

export function nextRank(id: string): Rank | null {
  const current = rank(id);
  return RANK_ORDER.find((r) => r.tier === current.tier + 1) ?? null;
}

/**
 * 「どこまで入り込めたか」の到達度。架空武将の目標そのもの。
 * 実在武将にも同じ物差しを当てられる。
 */
export function reachLabel(rankId: string, renown: number): string {
  if (renown >= 900) return '本紀に名を刻む';
  if (renown >= 600) return '列伝に立つ';
  if (renown >= 350) return '史書に名が残る';
  if (renown >= 150) return '一軍を率いる';
  return rank(rankId).name;
}
