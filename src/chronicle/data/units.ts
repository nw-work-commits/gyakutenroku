/**
 * 兵科。持ち兵をこれらに振り分けて戦う。
 *
 *        騎馬
 *       ↗    ↘        騎馬は弓陣を蹴散らし
 *    歩兵  ←  弓       弓は歩兵を寄せつけず
 *                      歩兵は槍衾で騎馬を止める
 *
 * 藤甲兵は刀も矢も通さないが、火に触れれば終わる。
 *
 * 暗殺はここに置かない。刺客は兵科ではなく策略である（systems/war の暗殺）。
 * 千の刺客を養う者はおらず、放つのは常にひとりかふたりだった。
 */

import type { UnitType } from '../types';

const UNIT_LIST: UnitType[] = [
  {
    id: 'infantry',
    name: '歩兵',
    desc: '槍衾を組んで騎馬を止める。安く、多く、崩れにくい。',
    glyph: '🛡️',
    attack: 1.0,
    defense: 1.0,
    speed: 1.0,
    cost: 1,
    strongAgainst: ['cavalry'],
    orders: ['charge', 'guard', 'stratagem', 'duel', 'retreat'],
  },
  {
    id: 'cavalry',
    name: '騎馬',
    desc: '弓陣を一息に蹴散らす。速いが、槍衾に飛び込めば脆い。',
    glyph: '🐎',
    attack: 1.4,
    defense: 0.85,
    speed: 1.6,
    cost: 3,
    strongAgainst: ['archer'],
    orders: ['charge', 'guard', 'stratagem', 'duel', 'retreat'],
  },
  {
    id: 'archer',
    name: '弓',
    desc: '間合いの外から削る。斉射には反撃が返らないが、寄られると弱い。',
    glyph: '🏹',
    attack: 1.15,
    defense: 0.7,
    speed: 1.1,
    cost: 2,
    strongAgainst: ['infantry'],
    orders: ['volley', 'charge', 'guard', 'stratagem', 'retreat'],
    // 矢は矢で防ぎにくい
    resist: { arrow: 1.2 },
  },
  {
    id: 'rattan',
    name: '藤甲兵',
    desc: '油に浸した藤で編んだ鎧。刀も矢も通さない。ただし——',
    glyph: '🎋',
    attack: 1.1,
    defense: 1.7,
    speed: 0.8,
    cost: 4,
    strongAgainst: ['infantry', 'archer'],
    orders: ['charge', 'guard', 'retreat'],
    // 白兵と矢はほとんど通らない。だが油を吸った藤は、火がつけば一息で燃える
    resist: { melee: 0.35, arrow: 0.2, fire: 4.5 },
    recruitableAt: ['nanman'],
  },
];

export const UNITS: Record<string, UnitType> = Object.fromEntries(
  UNIT_LIST.map((u) => [u.id, u]),
);

export const UNIT_IDS = UNIT_LIST.map((u) => u.id);

export function unitType(id: string): UnitType {
  const found = UNITS[id];
  if (!found) throw new Error(`未定義の兵科: ${id}`);
  return found;
}

/** 三すくみの倍率。有利なら1.5倍、不利なら0.7倍。 */
export function matchupMultiplier(attacker: string, defender: string): number {
  const a = UNITS[attacker];
  const d = UNITS[defender];
  if (!a || !d) return 1;
  if (a.strongAgainst.includes(defender)) return 1.5;
  if (d.strongAgainst.includes(attacker)) return 0.7;
  return 1;
}

/** その勢力で徴募できる兵科。 */
export function recruitableIn(factionId: string): UnitType[] {
  return UNIT_LIST.filter((u) => !u.recruitableAt || u.recruitableAt.includes(factionId));
}
