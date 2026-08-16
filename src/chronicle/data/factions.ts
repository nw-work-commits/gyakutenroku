/** 勢力。存続期間を持つので、年によって所属できる先が変わる。 */

import type { Faction } from '../types';

const FACTION_LIST: Faction[] = [
  { id: 'han', name: '漢', from: -206, to: 220, color: '#c9a227' },
  { id: 'yellowturban', name: '黄巾', from: 184, to: 205, color: '#d0b24f' },
  { id: 'dongzhuo', name: '董卓軍', from: 189, to: 192, color: '#7a4a4a' },
  { id: 'lvbu', name: '呂布軍', from: 192, to: 199, color: '#a83a3a' },
  { id: 'yuanshao', name: '袁紹軍', from: 190, to: 207, color: '#3a5aa8' },
  { id: 'yuanshu', name: '袁術軍', from: 190, to: 199, color: '#6a4aa8' },
  { id: 'caocao', name: '曹操軍', from: 189, to: 220, color: '#2f4f8f' },
  { id: 'wei', name: '魏', from: 220, to: 265, color: '#2f4f8f' },
  { id: 'liubei', name: '劉備軍', from: 184, to: 221, color: '#2f7a4a' },
  { id: 'shu', name: '蜀漢', from: 221, to: 263, color: '#2f7a4a' },
  { id: 'sunjian', name: '孫堅軍', from: 184, to: 191, color: '#a8622f' },
  { id: 'sunce', name: '孫策軍', from: 194, to: 200, color: '#a8622f' },
  { id: 'wu', name: '呉', from: 200, to: 280, color: '#a8622f' },
  { id: 'liubiao', name: '劉表軍', from: 190, to: 208, color: '#4a7a7a' },
  { id: 'liuzhang', name: '劉璋軍', from: 194, to: 214, color: '#6a7a4a' },
  { id: 'gongsunzan', name: '公孫瓚軍', from: 188, to: 199, color: '#8f8f8f' },
  { id: 'matengs', name: '馬騰・韓遂', from: 190, to: 213, color: '#a8823a' },
  { id: 'nanman', name: '南蛮', from: 184, to: 280, color: '#7a6a3a' },
  { id: 'jin', name: '晋', from: 265, to: 316, color: '#5a4a7a' },
  { id: 'ronin', name: '無所属', from: -206, to: 316, color: '#6b6b6b' },
];

export const FACTIONS: Record<string, Faction> = Object.fromEntries(
  FACTION_LIST.map((f) => [f.id, f]),
);

/** 史書にある勢力。自前の旗を仕舞うときの目印にする。 */
const BUILTIN = new Set(FACTION_LIST.map((f) => f.id));

/**
 * 史書に無い旗を、名簿に足す。
 *
 * FACTIONS は画面の彩色から所属判定まで、あちこちから素引きされている。
 * 自前の勢力だけ別扱いにすると読む側が全部二段構えになるので、
 * ここに混ぜてしまい、**世界状態のほうを唯一の出どころ**にしておく
 * （読み込みのたびに systems/world が呼び直す）。
 */
export function raiseBanner(f: Faction): void {
  FACTIONS[f.id] = f;
  if (!FACTION_LIST.some((x) => x.id === f.id)) FACTION_LIST.push(f);
}

/** 前の一生で立てた旗を仕舞う。新しく始めるときに呼ぶ。 */
export function lowerBanners(): void {
  for (const id of Object.keys(FACTIONS)) {
    if (!BUILTIN.has(id)) delete FACTIONS[id];
  }
  for (let i = FACTION_LIST.length - 1; i >= 0; i--) {
    if (!BUILTIN.has(FACTION_LIST[i]!.id)) FACTION_LIST.splice(i, 1);
  }
}

export function faction(id: string): Faction {
  const found = FACTIONS[id];
  if (!found) throw new Error(`未定義の勢力: ${id}`);
  return found;
}

/** その年に存在している勢力。 */
export function factionsAt(year: number): Faction[] {
  return FACTION_LIST.filter((f) => year >= f.from && (f.to === undefined || year <= f.to));
}
