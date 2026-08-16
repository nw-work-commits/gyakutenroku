/**
 * 城市の主の変遷。
 *
 * 「その年、この城は誰のものか」を年表として持つ。
 * homes.ts が「勢力の本拠はどこか」の一対一表だったのに対し、
 * こちらは一つの城が主を変えていく履歴を持てる（洛陽は漢→董卓→漢→曹操→魏→晋）。
 *
 * これが世界の骨になる。勢力の版図も、州の色も、滅亡の判定も、すべてここから出す。
 * プレイヤーが史実を変えたぶんは systems/world.ts が上に重ねるので、
 * ここに書くのは**あくまで史実**でよい。
 *
 * 年は「その勢力が入った年」。次の記述の年の前年までがその勢力のもの。
 * 細かい係争（長安の李傕・郭汜、天水の北伐など）は、旗がどちらに立っていたかで丸めている。
 */

import { CITIES } from './overworld';

export interface Tenure {
  from: number;
  factionId: string;
}

/** 城市ID → 主の変遷（古い順）。 */
export const CITY_CONTROL: Record<string, Tenure[]> = {
  // ---- 北（幽州・并州・冀州・青州）
  ji_city: [
    { from: -206, factionId: 'han' },
    { from: 193, factionId: 'gongsunzan' },
    { from: 199, factionId: 'yuanshao' },
    { from: 207, factionId: 'caocao' },
    { from: 220, factionId: 'wei' },
    { from: 265, factionId: 'jin' },
  ],
  zhuo: [
    { from: -206, factionId: 'han' },
    { from: 193, factionId: 'gongsunzan' },
    { from: 199, factionId: 'yuanshao' },
    { from: 207, factionId: 'caocao' },
    { from: 220, factionId: 'wei' },
    { from: 265, factionId: 'jin' },
  ],
  jinyang: [
    { from: -206, factionId: 'han' },
    { from: 189, factionId: 'dongzhuo' },
    { from: 192, factionId: 'yuanshao' },
    { from: 205, factionId: 'caocao' },
    { from: 220, factionId: 'wei' },
    { from: 265, factionId: 'jin' },
  ],
  ye: [
    { from: -206, factionId: 'han' },
    { from: 184, factionId: 'yellowturban' },
    { from: 185, factionId: 'han' },
    { from: 191, factionId: 'yuanshao' },
    { from: 204, factionId: 'caocao' },
    { from: 220, factionId: 'wei' },
    { from: 265, factionId: 'jin' },
  ],
  beihai: [
    { from: -206, factionId: 'han' },
    { from: 184, factionId: 'yellowturban' },
    { from: 192, factionId: 'han' },
    { from: 196, factionId: 'caocao' },
    { from: 220, factionId: 'wei' },
    { from: 265, factionId: 'jin' },
  ],

  // ---- 西（涼州・司隷）
  tianshui: [
    { from: -206, factionId: 'han' },
    { from: 190, factionId: 'matengs' },
    { from: 213, factionId: 'caocao' },
    { from: 220, factionId: 'wei' },
    { from: 265, factionId: 'jin' },
  ],
  changan: [
    { from: -206, factionId: 'han' },
    { from: 190, factionId: 'dongzhuo' },
    { from: 192, factionId: 'han' },
    { from: 196, factionId: 'caocao' },
    { from: 220, factionId: 'wei' },
    { from: 265, factionId: 'jin' },
  ],
  luoyang: [
    { from: -206, factionId: 'han' },
    { from: 189, factionId: 'dongzhuo' },
    { from: 190, factionId: 'han' },
    { from: 196, factionId: 'caocao' },
    { from: 220, factionId: 'wei' },
    { from: 265, factionId: 'jin' },
  ],
  hulao: [
    { from: -206, factionId: 'han' },
    { from: 189, factionId: 'dongzhuo' },
    { from: 192, factionId: 'caocao' },
    { from: 220, factionId: 'wei' },
    { from: 265, factionId: 'jin' },
  ],

  // ---- 中原（兗州・徐州・豫州）
  puyang: [
    { from: -206, factionId: 'han' },
    { from: 190, factionId: 'caocao' },
    { from: 194, factionId: 'lvbu' },
    { from: 195, factionId: 'caocao' },
    { from: 220, factionId: 'wei' },
    { from: 265, factionId: 'jin' },
  ],
  xiapi: [
    { from: -206, factionId: 'han' },
    { from: 194, factionId: 'liubei' },
    { from: 196, factionId: 'lvbu' },
    { from: 199, factionId: 'caocao' },
    { from: 220, factionId: 'wei' },
    { from: 265, factionId: 'jin' },
  ],
  xuchang: [
    { from: -206, factionId: 'han' },
    { from: 196, factionId: 'caocao' },
    { from: 220, factionId: 'wei' },
    { from: 265, factionId: 'jin' },
  ],

  // ---- 益州
  chengdu: [
    { from: -206, factionId: 'han' },
    { from: 194, factionId: 'liuzhang' },
    { from: 214, factionId: 'liubei' },
    { from: 221, factionId: 'shu' },
    { from: 263, factionId: 'wei' },
    { from: 265, factionId: 'jin' },
  ],
  jiange: [
    { from: -206, factionId: 'han' },
    { from: 194, factionId: 'liuzhang' },
    { from: 214, factionId: 'liubei' },
    { from: 221, factionId: 'shu' },
    { from: 263, factionId: 'wei' },
    { from: 265, factionId: 'jin' },
  ],

  // ---- 荊州
  xiangyang: [
    { from: -206, factionId: 'han' },
    { from: 190, factionId: 'liubiao' },
    { from: 208, factionId: 'caocao' },
    { from: 220, factionId: 'wei' },
    { from: 265, factionId: 'jin' },
  ],
  jiangling: [
    { from: -206, factionId: 'han' },
    { from: 190, factionId: 'liubiao' },
    { from: 209, factionId: 'liubei' },
    { from: 219, factionId: 'wu' },
    { from: 280, factionId: 'jin' },
  ],

  // ---- 揚州
  shouchun: [
    { from: -206, factionId: 'han' },
    { from: 190, factionId: 'yuanshu' },
    { from: 199, factionId: 'caocao' },
    { from: 220, factionId: 'wei' },
    { from: 265, factionId: 'jin' },
  ],
  jianye: [
    { from: -206, factionId: 'han' },
    { from: 190, factionId: 'sunjian' },
    { from: 191, factionId: 'yuanshu' },
    { from: 194, factionId: 'sunce' },
    { from: 200, factionId: 'wu' },
    { from: 280, factionId: 'jin' },
  ],
  chaisang: [
    { from: -206, factionId: 'han' },
    { from: 190, factionId: 'liubiao' },
    { from: 194, factionId: 'sunce' },
    { from: 200, factionId: 'wu' },
    { from: 280, factionId: 'jin' },
  ],
};

/** その年、その城市を持っていた勢力（史実）。記述の無い城市は null。 */
export function historicalRuler(cityId: string, year: number): string | null {
  const list = CITY_CONTROL[cityId];
  if (!list) return null;
  let current: string | null = null;
  for (const tenure of list) {
    if (tenure.from <= year) current = tenure.factionId;
  }
  return current;
}

/** 開発時の点検。地図に無い城市が書かれていないか。 */
export function validateControl(): string[] {
  const problems: string[] = [];
  const known = new Set(CITIES.map((c) => c.id));
  for (const [cityId, list] of Object.entries(CITY_CONTROL)) {
    if (!known.has(cityId)) problems.push(`支配表: 地図に無い城市 ${cityId}`);
    for (let i = 1; i < list.length; i++) {
      if (list[i]!.from < list[i - 1]!.from) {
        problems.push(`支配表 ${cityId}: ${list[i]!.from}年の記述が順序を乱している`);
      }
    }
  }
  for (const city of CITIES) {
    if (!CITY_CONTROL[city.id]) problems.push(`支配表: ${city.name}(${city.id}) の主が未記述`);
  }
  return problems;
}
