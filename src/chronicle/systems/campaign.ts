/**
 * 世界の側の戦。
 *
 * これまで、城が動くのはプレイヤーが攻めたときだけだった。
 * 勢力同士は史実どおりにしか争わないので、官渡で袁紹を勝たせても、
 * 天下は結局のところ晋のものになる。「違う道を進んだらどうなるか」が、
 * 自分の周り一間ぶんしか広がらなかった。
 *
 * ここが引き受けるのは、その先である。
 *
 * ただし気をつけたのは、**史実を勝手に壊さないこと**。
 * 誰も何もしていない盤面では、この仕掛けは一度も動かない。
 * 版図が史実と食い違ったときにだけ目を覚まし、そこから先は
 * 「持っている城」と「生きている将」で勝負を決める。
 *
 *   ・盤面が史実どおり        → 何もしない。史書がそのまま進む
 *   ・どこかが食い違っている  → その周りで勢力同士が城を取り合う
 *
 * 滅ぶはずの年に城を保っている勢力は、滅ばない。呂布軍が下邳を持ったまま
 * 199年を越えたなら、その版図はそこで差分に焼き付けられ、以後は史書ではなく
 * この仕掛けが面倒を見る。
 */

import { seededUnit } from '../../engine/rng';
import { FACTIONS } from '../data/factions';
import { CITIES } from '../data/world/overworld';
import type { CityDef } from '../data/world/overworld';
import { PROVINCE_BY_ID, provinceAt } from '../data/world/overworld';
import { historicalRuler } from '../data/world/control';
import { abilitiesAt } from '../abilities';
import { ALL_OFFICERS } from '../lookup';
import { factionAt } from '../registry';
import type { Chronicle, WorldNews, WorldState } from '../types';

/**
 * 攻め込める間合い。
 *
 * 地図は横五十三・縦四十五なので、九は「隣の州まで」ほど。
 * ここを広く取ると、袁紹が河北から一年で柴桑を取ることになる。
 * 三國志の戦線が動かなかったのは、そもそも遠かったからである。
 */
const REACH = 9;

/** 一年に一つの勢力が取れる城は、ひとつまで。地図が毎年ひっくり返らないように。 */
const SEIZURES_PER_FACTION = 1;

/**
 * 取ったばかりの城には手を出せない年数。
 *
 * これが無いと襄陽が毎年持ち主を替える。城を取れば地固めに数年はかかる、
 * というより、そう見えないと読んでいて何が起きているのか分からない。
 */
const SETTLING_YEARS = 4;

/** その勢力が、いま実際に持っている城。 */
function heldBy(
  factionId: string,
  year: number,
  rulerAt: (cityId: string, year: number) => string | null,
): CityDef[] {
  return CITIES.filter((city) => rulerAt(city.id, year) === factionId);
}

/**
 * 盤面が史実と食い違っているか。
 *
 * 見るのは「実際にいまその城の主は誰か」と「史書では誰か」の食い違いであって、
 * 差分に記録があるかどうかではない。事件は正史どおりの推移も差分に書き込むので、
 * 記録の有無で判じると、何もしていない盤面まで食い違い扱いになってしまう。
 *
 * 食い違っていなければ、この仕掛けは一度も動かない。
 */
export function mapHasDiverged(
  year: number,
  rulerAt: (cityId: string, year: number) => string | null,
): boolean {
  for (const city of CITIES) {
    if (rulerAt(city.id, year) !== historicalRuler(city.id, year)) return true;
  }
  return false;
}

/**
 * その勢力の勢い。
 *
 * 持ち城の数と、その旗の下に生きている将の質から出す。表は持たない。
 * 名のある将が残っているうちは、城が減っても粘る——という程度の勘定である。
 */
function strengthOf(
  factionId: string,
  year: number,
  alive: (id: string) => boolean,
  rulerAt: (cityId: string, year: number) => string | null,
): number {
  const cities = heldBy(factionId, year, rulerAt).length;
  if (cities === 0) return 0;

  let best = 0;
  let count = 0;
  for (const who of ALL_OFFICERS) {
    if (!alive(who.id)) continue;
    if (factionAt(who, year) !== factionId) continue;
    const ab = abilitiesAt(who, year, 0);
    const score = ab.lead * 0.6 + ab.war * 0.4;
    if (score > best) best = score;
    count++;
  }
  // 城が地力、将が伸び代。人のいない大国は、人のいる小国に食われる
  return cities * 12 + best * 0.5 + Math.min(count, 12) * 2;
}

/** 二つの城のあいだの隔たり。地図の座標から出す。 */
function distance(a: CityDef, b: CityDef): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

export interface CampaignResult {
  news: WorldNews[];
  /** この年に世界の戦で主が変わった城。報せの重複を避けるため呼び出し側に渡す。 */
  taken: Set<string>;
}

/**
 * その年、勢力同士が城を取り合う。
 *
 * @param existing その年に存在している勢力を判じる関数（暦と版図の両方を見る）
 * @param alive    その年に生きている武将を判じる関数
 */
export function resolveCampaigns(
  c: Chronicle,
  w: WorldState,
  year: number,
  existing: (factionId: string) => boolean,
  alive: (officerId: string) => boolean,
  rulerAt: (cityId: string, year: number) => string | null,
): CampaignResult {
  const news: WorldNews[] = [];
  const taken = new Set<string>();

  // 史実どおりの盤面なら、史書に任せる
  if (!mapHasDiverged(year, rulerAt)) return { news, taken };

  const contenders = Object.values(FACTIONS)
    .filter((f) => f.id !== 'ronin' && f.id !== 'nanman')
    .filter((f) => existing(f.id))
    .map((f) => ({ id: f.id, name: f.name, power: strengthOf(f.id, year, alive, rulerAt) }))
    .filter((f) => f.power > 0)
    // 強い順に手番を回す。大国から動くほうが、盤面が落ち着く
    .sort((a, b) => b.power - a.power);

  if (contenders.length < 2) return { news, taken };

  const powerOf = new Map(contenders.map((f) => [f.id, f.power]));

  for (const attacker of contenders) {
    let got = 0;
    const mine = heldBy(attacker.id, year, rulerAt);
    if (mine.length === 0) continue;

    // 攻める先の候補。自分の城から手の届く、よその城
    const targets: { city: CityDef; holder: string }[] = [];
    for (const city of CITIES) {
      if (taken.has(city.id)) continue;
      // 取ったばかりの城は、まだ落ち着いていない
      const held = w.seized[city.id];
      if (held && year - held.year < SETTLING_YEARS) continue;
      const holder = rulerAt(city.id, year);
      if (!holder || holder === attacker.id) continue;
      if (holder === 'nanman') continue;
      /**
       * 自分の旗の城も狙われる。ただし**居る州は除く**。
       *
       * 絶対に取られないなら、天下統一はただの作業になる。
       * かといって、遠くで起きた戦で城を失って何もできないのでは理不尽である。
       * 「そこに居れば守れる」——それだけの線を引いておく。
       */
      if (holder === c.factionId) {
        const here = provinceAt(c.x, c.y)?.id;
        if (here && city.provinceId === here) continue;
      }
      if (!mine.some((own) => distance(own, city) <= REACH)) continue;
      targets.push({ city, holder });
    }
    if (targets.length === 0) continue;

    // 弱いところから当たる
    targets.sort((a, b) => (powerOf.get(a.holder) ?? 0) - (powerOf.get(b.holder) ?? 0));

    for (const { city, holder } of targets) {
      if (got >= SEIZURES_PER_FACTION) break;
      const defence = powerOf.get(holder) ?? 0;
      // 守るほうには城の利がある。攻めるほうがよほど勝っていないと落ちない
      const odds = attacker.power / (attacker.power + defence * 2.4);
      // 同じ年・同じ城なら、いつ解いても同じ結果になる
      const roll = seededUnit(`war:${year}:${attacker.id}:${city.id}`);
      if (roll >= odds) continue;

      w.seized[city.id] = { factionId: attacker.id, year };
      taken.add(city.id);
      got++;

      const province = PROVINCE_BY_ID[city.provinceId]?.name ?? '';
      const from = FACTIONS[holder]?.name ?? holder;
      news.push({
        year,
        kind: 'seize',
        text: `${province}${city.name}、${from}より${attacker.name}の手に落つ`,
      });
    }
  }

  return { news, taken };
}


