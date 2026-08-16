/**
 * 兵糧。
 *
 * これまでこの遊びには、四つの死んだ仕掛けがあった。
 *
 *   ・市は「米も塩も鉄も並んでいる」と書いてあるのに、選べるのは「立ち去る」だけ
 *   ・金の出口は徴兵ひとつきり。維持費も俸禄も無く、資源ではなく門番だった
 *   ・仕官しても旗の色が変わるだけで、主君は何もくれない
 *   ・時を使っても何も減らないので、戦の前は必ず満兵まで休むのが常に正しかった
 *
 * 兵糧はこの四つを一本に繋ぐ。兵は食う。食わせるには米がいる。
 * 米は市で買うか、主君から給わるか、自分の城から取るしかない。
 * だから**時が資源になり、市に用ができ、仕官に意味が出て、金が要る**。
 *
 * 三國志の戦は、たいてい糧道で決まった。官渡の烏巣も、五丈原の木牛流馬も、
 * 街亭の水も、突き詰めれば「食えるか」の話である。
 */

import { CITIES } from '../data/world/overworld';
import { RANKS } from '../data/ranks';
import { seededUnit } from '../../engine/rng';
import type { Chronicle } from '../types';
import { citiesOf, ensureWorld, factionExists, rulerNow } from './world';

/**
 * ひと月に食う米。九十人でおよそ一石という勘定。
 *
 * この数は「位に見合った軍なら主君の給付でほぼ賄え、
 * 人を集めて軍を膨らませたぶんは自腹になる」ように決めてある。
 * 人を得れば強くなるが、養う口も増える——そこを判断にしたい。
 */
export function foodPerMonth(troops: number): number {
  return Math.ceil(Math.max(0, troops) / 90);
}

/**
 * 主君から給わる兵糧。
 *
 * 仕官の見返りはこれである。位が高いほど多く給わるが、
 * 位に見合わぬ大軍を抱えれば足りなくなる——そこが判断になる。
 */
export function stipendOf(c: Chronicle): number {
  const world = ensureWorld(c);
  const own = world.founded;

  // 自前の旗を立てた者に、給わる先はない。持ち城の実りがすべて
  if (own && c.factionId === own.id) {
    return citiesOf(world, own.id, c.year).length * 22;
  }
  if (c.factionId === 'ronin' || !factionExists(c.factionId, c.year)) return 0;

  const tier = RANKS[c.rankId]?.tier ?? 0;
  const base = 6 + tier * 7;
  // 主家が大きいほど蔵も厚い
  const reach = citiesOf(world, c.factionId, c.year).length;
  return Math.round(base * (0.7 + Math.min(reach, 12) * 0.05));
}

/** 主君から給わる俸禄（金）。米とは別に、身の回りのぶん。 */
export function salaryOf(c: Chronicle): number {
  const world = ensureWorld(c);
  const own = world.founded;
  if (own && c.factionId === own.id) return citiesOf(world, own.id, c.year).length * 14;
  if (c.factionId === 'ronin' || !factionExists(c.factionId, c.year)) return 0;
  const tier = RANKS[c.rankId]?.tier ?? 0;
  return 4 + tier * 5;
}

/**
 * 米の相場。
 *
 * 表で持たず、州と年から出す。荒れた土地は高く、実りの地は安い。
 * 乱世の穀価は実際とんでもなく振れたが、遊びとして扱える幅に収めてある。
 */
export function grainPrice(provinceId: string | null, year: number): number {
  const base = 6;
  if (!provinceId) return base;
  // 州ごとの実り。益州と揚州は米どころ、涼州と幽州は痩せている
  const fertility: Record<string, number> = {
    yi: -1.5,
    yang: -1.2,
    jing: -0.8,
    yu: -0.4,
    xu: -0.2,
    ji: 0,
    yan: 0,
    qing: 0.3,
    si: 0.6,
    bing: 1.2,
    you: 1.4,
    liang: 1.8,
    jiao: 0.8,
  };
  // 年ごとの上下。同じ年・同じ州なら必ず同じ値になる
  const swing = (seededUnit(`grain:${provinceId}:${year}`) - 0.5) * 3;
  // 乱の只中は高い
  const era = year <= 195 ? 2.2 : year <= 215 ? 1.2 : year <= 235 ? 0.4 : 0;
  return Math.max(3, Math.round((base + (fertility[provinceId] ?? 0) + swing + era) * 10) / 10);
}

/** その州にある、自分の旗の城の数。実りの取り分に効く。 */
export function citiesHeldIn(c: Chronicle, provinceId: string): number {
  const world = ensureWorld(c);
  return CITIES.filter(
    (city) => city.provinceId === provinceId && rulerNow(world, city.id, c.year) === c.factionId,
  ).length;
}

export interface Upkeep {
  /** 食った米。 */
  ate: number;
  /** 給わった米。 */
  granted: number;
  /** 受け取った俸禄。 */
  paid: number;
  /** 米が尽きて逃げた兵。 */
  starved: number;
  /** 何ヶ月ぶんを勘定したか。 */
  months: number;
}

/**
 * 日を送ったぶんの糧と俸禄を勘定する。
 *
 * 兵糧が尽きれば兵は逃げる。斬られるのではなく、去るのである——
 * 食えない陣に留まる者はいない。
 */
export function settleUpkeep(c: Chronicle, days: number): Upkeep {
  const months = days / 30;
  if (months <= 0) return { ate: 0, granted: 0, paid: 0, starved: 0, months: 0 };

  const granted = Math.round(stipendOf(c) * months);
  const paid = Math.round(salaryOf(c) * months);
  const ate = Math.round(foodPerMonth(c.troops) * months);

  c.food = (c.food ?? 0) + granted;
  c.gold += paid;

  let starved = 0;
  if (c.food >= ate) {
    c.food -= ate;
  } else {
    // 足りないぶんだけ、兵が去る
    const shortfall = ate - c.food;
    c.food = 0;
    const ratio = ate > 0 ? shortfall / ate : 0;
    starved = Math.min(c.troops, Math.round(c.troops * 0.35 * ratio));
    c.troops -= starved;
  }

  return { ate, granted, paid, starved, months };
}

/** 兵糧があと何ヶ月もつか。画面に出して、動く前に分からせる。 */
export function monthsOfFood(c: Chronicle): number {
  const per = foodPerMonth(c.troops);
  const net = per - stipendOf(c);
  if (net <= 0) return Infinity;
  return (c.food ?? 0) / net;
}

/** 兵糧の見立てを一言で。 */
export function foodNote(c: Chronicle): string {
  const left = monthsOfFood(c);
  if (!Number.isFinite(left)) return '糧は足りている';
  if (left < 1) return '糧が尽きかけている';
  if (left < 3) return `糧はあと ${Math.floor(left)}ヶ月`;
  if (left < 12) return `糧はあと ${Math.floor(left)}ヶ月ぶん`;
  return '糧は当分もつ';
}

/** 兵糧を含めた身上を、市や兵舎で出すための行。 */
export function upkeepLine(c: Chronicle, provinceId: string | null): string {
  const per = foodPerMonth(c.troops);
  const grant = stipendOf(c);
  const price = grainPrice(provinceId, c.year);
  const net = per - grant;
  const flow = net > 0 ? `月に ${net}石の不足（${Math.round(net * price)}金ぶん）` : '月の実りで足りる';
  return `兵 ${c.troops}　糧 ${Math.round(c.food ?? 0)}石　月々 ${per}石を食い、${grant}石を得る。${flow}`;
}
