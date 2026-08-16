/**
 * 賊徒の砦。
 *
 * 布衣で世に出た者が、最初に手をつけられる仕事。
 * 討てば金と名声が入り、降った兵はそのまま自分の手勢になる。
 * 曹操の青州兵も、劉備の最初の一隊も、もとを辿ればこれである。
 *
 * どこに湧くかは表で持たない。**州の荒れ具合**から実行時に出す。
 * 旗の立たない州は荒れ、小勢力は隅々まで見きれず、黄巾の頃は天下が荒れている。
 * つまり、世界のうつろい（systems/world.ts）がそのまま賊の分布になる。
 *
 * 砦のIDには年代を織り込んである。八年も経てば別の一党が同じ山に入るので、
 * 「討った」という記録（flags）を消して回らなくても、賊はひとりでに湧き直す。
 */

import { clamp, seededUnit } from '../../engine/rng';
import {
  OVERWORLD_TILES,
  PROVINCES,
  PROVINCE_BY_ID,
  cityAt,
  provinceAt,
} from '../data/world/overworld';
import { worldTile } from '../data/world/terrain';
import type { Chronicle, WorldState } from '../types';
import { citiesOf, ensureWorld, provinceHolders } from './world';

/** 賊が一党を入れ替える周期。 */
const ERA = 8;

/**
 * 手強さごとの頭数。
 *
 * 一段目を支度金ひと山（およそ60の兵）で挑める大きさにしてある。
 * ここを重くすると、布衣で始めた者は最初の一歩が踏み出せない。
 */
const TROOPS_BY_STRENGTH = [0, 40, 90, 170, 280, 430];

/** 年表の始まり。年代の区切りをここから数える。 */
const ERA_ORIGIN = 184;

export interface BanditCamp {
  id: string;
  name: string;
  provinceId: string;
  x: number;
  y: number;
  /** 1〜5。手強さと、討ったときの実入り。 */
  strength: number;
  /** 何者か。編成と呼び名に使う。 */
  kind: 'bandit' | 'yellowturban';
}

/**
 * もとから治めにくい土地。
 * 山がちで、都から遠く、異民族と境を接している州は、誰が治めても荒れる。
 */
const FRONTIER: Record<string, number> = {
  liang: 1,
  bing: 1,
  you: 1,
  yi: 1,
  jiao: 2,
};

/**
 * 黄巾の三十六方が置かれた州。
 *
 * 乱の直後をひと括りに「天下が荒れている」で済ませると、
 * どの州にも同じ強さの賊が湧いて、布衣で始めた者の行き場が無くなる。
 * 荒れ方に濃淡をつけると、そのまま「まず司隷や徐州から手をつける」になる。
 */
const YELLOW_TURBAN_LANDS = new Set(['ji', 'qing', 'you', 'yan', 'yu', 'jing']);

function eraOf(year: number): number {
  return Math.floor((year - ERA_ORIGIN) / ERA);
}

/**
 * その州の荒れ具合 0〜5。
 *
 * 年ごとに揺れると砦が毎年ちらつくので、年代の頭の年で一度だけ量る。
 * 「八年のあいだ、この州はこれくらい荒れている」という粗さで扱う。
 */
function unrestOf(w: WorldState, provinceId: string, era: number): number {
  const year = ERA_ORIGIN + era * ERA;
  let unrest = FRONTIER[provinceId] ?? 0;

  const holder = provinceHolders(w, year)[provinceId];
  if (!holder) {
    unrest += 3; // 旗の立たぬ州は、誰も賊を追わない
  } else {
    const reach = citiesOf(w, holder, year).length;
    if (reach <= 2) unrest += 2; // 小勢力は隅々まで手が回らない
    else if (reach <= 6) unrest += 1;
  }

  if (year <= 192) {
    unrest += YELLOW_TURBAN_LANDS.has(provinceId) ? 2 : 1; // 乱の只中。ただし濃淡はある
  } else if (year <= 205 && YELLOW_TURBAN_LANDS.has(provinceId)) {
    unrest += 1; // 残党がまだ野にある
  }
  if (year >= 229) unrest -= 1; // 三国が固まれば、いくらか治まる

  return clamp(unrest, 0, 5);
}

/** その州に賊が構える場所。険しい土地ほど選ばれる。 */
function siteFor(provinceId: string, campId: string): { x: number; y: number } | null {
  const province = PROVINCE_BY_ID[provinceId];
  if (!province) return null;

  const candidates: { x: number; y: number }[] = [];
  for (const rect of province.area) {
    for (let y = rect.y; y < rect.y + rect.h; y++) {
      for (let x = rect.x; x < rect.x + rect.w; x++) {
        // 州の枠は重なっているところがある。どちらの州かは地図の判定に従う
        // （そうしないと、司隷の賊が益州に立っていることになる）
        if (provinceAt(x, y)?.id !== provinceId) continue;
        if (cityAt(x, y)) continue; // 城市の真上には構えない
        const tile = worldTile(OVERWORLD_TILES[y]?.[x] ?? ' ');
        if (!tile.walkable) continue;
        // 街道の上には出ない。森・丘・草原のような隠れられる土地を選ぶ
        if ((tile.danger ?? 0) < 1) continue;
        candidates.push({ x, y });
      }
    }
  }
  if (candidates.length === 0) return null;
  return candidates[Math.floor(seededUnit(campId) * candidates.length) % candidates.length]!;
}

function nameFor(kind: BanditCamp['kind'], x: number, y: number): string {
  if (kind === 'yellowturban') return '黄巾の残党';
  switch (OVERWORLD_TILES[y]?.[x]) {
    case 'T':
      return '林の賊徒';
    case 'v':
      return '山賊の砦';
    case ':':
      return '流賊の塞';
    default:
      return '野盗の陣';
  }
}

/** その年、天下に構えている賊。討ち終えたものは含まない。 */
export function campsAt(c: Chronicle): BanditCamp[] {
  const w = ensureWorld(c);
  const era = eraOf(c.year);
  const camps: BanditCamp[] = [];

  for (const province of PROVINCES) {
    const unrest = unrestOf(w, province.id, era);
    const count = unrest >= 4 ? 2 : unrest >= 1 ? 1 : 0;

    for (let i = 0; i < count; i++) {
      const id = `camp:${province.id}:${era}:${i}`;
      if (c.flags[`cleared:${id}`]) continue;
      const site = siteFor(province.id, id);
      if (!site) continue;
      // 同じ州の二つ目が一つ目と重なったら、そこは諦める（無理に散らすと不自然な場所に出る）
      if (camps.some((other) => other.x === site.x && other.y === site.y)) continue;

      const strength = clamp(unrest - i, 1, 5);
      const kind: BanditCamp['kind'] =
        ERA_ORIGIN + era * ERA <= 205 && strength >= 3 ? 'yellowturban' : 'bandit';
      camps.push({
        id,
        name: nameFor(kind, site.x, site.y),
        provinceId: province.id,
        x: site.x,
        y: site.y,
        strength,
        kind,
      });
    }
  }
  return camps;
}

/** そのマスに賊が構えているか。 */
export function campAt(c: Chronicle, x: number, y: number): BanditCamp | null {
  return campsAt(c).find((camp) => camp.x === x && camp.y === y) ?? null;
}

export function markCleared(c: Chronicle, camp: BanditCamp): void {
  c.flags[`cleared:${camp.id}`] = true;
}

/**
 * 開発時の点検。
 * 州の中に賊が構えられる土地が一つも無いと、その州だけ静かに賊が湧かなくなる。
 */
export function validateBandits(): string[] {
  const problems: string[] = [];
  for (const province of PROVINCES) {
    if (!siteFor(province.id, `camp:${province.id}:0:0`)) {
      problems.push(`賊: ${province.name} に砦を構えられる土地が無い（険しい地形が足りない）`);
    }
  }
  return problems;
}

/**
 * 賊の頭数と顔ぶれ。
 * 名のある者が混じるのは大きな一党だけで、小さな山賊は誰も名を持たない。
 */
export function foesOf(camp: BanditCamp): { enemies: string[]; troops: number } {
  const troops = TROOPS_BY_STRENGTH[camp.strength] ?? 120;
  if (camp.kind === 'yellowturban') {
    const enemies =
      camp.strength >= 5
        ? ['yellowturban_leader', 'yellowturban_captain', 'yellowturban_mob']
        : camp.strength >= 3
          ? ['yellowturban_captain', 'yellowturban_mob']
          : ['yellowturban_mob'];
    return { enemies, troops };
  }
  const enemies =
    camp.strength >= 5
      ? ['officer', 'bandit', 'bandit']
      : camp.strength >= 3
        ? ['bandit', 'bandit']
        : ['bandit'];
  return { enemies, troops };
}
